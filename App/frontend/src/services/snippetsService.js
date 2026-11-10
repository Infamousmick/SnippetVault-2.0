import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

const AVATAR_PLACEHOLDER = "https://placehold.co/150";
const MAX_PREFIX = 15;
const MAX_KEYWORDS = 400;
const STARRED_FETCH_LIMIT = 200;
const MAX_TAGS = 10;

/* ------------------------------------------------------------------ */
/* Errori                                                              */
/* ------------------------------------------------------------------ */

export const getFirestoreErrorMessage = (error, fallback) => {
  switch (error?.code) {
    case "permission-denied":
      return "You are not authorized to perform this action.";
    case "unavailable":
      return "Network error. Please try again.";
    case "failed-precondition":
      return "This query needs a database index. Check the browser console for the link to create it.";
    default:
      return error?.message || fallback;
  }
};

/* ------------------------------------------------------------------ */
/* Ricerca: parole chiave con prefissi                                 */
/* ------------------------------------------------------------------ */

const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const tokenize = (s = "") =>
  normalize(s)
    .split(/[^a-z0-9+#.]+/)
    .map((w) => w.replace(/^[#.]+|\.+$/g, ""))
    .filter(Boolean);

export const buildSearchKeywords = ({
  title = "",
  description = "",
  language = "",
  tags = [],
}) => {
  const set = new Set();
  const words = tokenize([title, language, ...tags, description].join(" "));

  for (const word of words) {
    if (word.length === 1) set.add(word);
    for (let i = 2; i <= Math.min(word.length, MAX_PREFIX); i++) {
      set.add(word.slice(0, i));
    }
    if (set.size >= MAX_KEYWORDS) break;
  }
  return [...set].slice(0, MAX_KEYWORDS);
};

const matchesTokens = (keywords = [], tokens = []) =>
  tokens.every((t) => keywords.includes(t.slice(0, MAX_PREFIX)));

/* ------------------------------------------------------------------ */
/* Conversioni documento -> oggetto "stile Mongo"                      */
/* ------------------------------------------------------------------ */

const toISO = (v) => (v?.toDate ? v.toDate().toISOString() : (v ?? null));

// Snippet "grezzo": user_id e forked_from restano id (come dopo un findByIdAndUpdate)
const toRaw = (id, data) => {
  const { searchKeywords, ...rest } = data;
  return {
    _id: id,
    ...rest,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
};

/* ------------------------------------------------------------------ */
/* Profili autore (sostituiscono populate)                             */
/* ------------------------------------------------------------------ */

const profileCache = new Map();

const toProfile = (id, data) => ({
  _id: id,
  username: data?.username ?? "deleted-user",
  avatar_url: data?.avatar ?? AVATAR_PLACEHOLDER,
});

export const invalidateProfile = (uid) => profileCache.delete(uid);

const fetchProfiles = async (uids) => {
  const missing = [...new Set(uids)].filter(
    (id) => id && !profileCache.has(id),
  );

  for (let i = 0; i < missing.length; i += 30) {
    const chunk = missing.slice(i, i + 30);
    const snap = await getDocs(
      query(collection(db, "users"), where(documentId(), "in", chunk)),
    );
    const found = new Set();
    snap.forEach((d) => {
      profileCache.set(d.id, toProfile(d.id, d.data()));
      found.add(d.id);
    });
    chunk
      .filter((id) => !found.has(id))
      .forEach((id) => profileCache.set(id, toProfile(id, null)));
  }
};

const hydrate = async (docs) => {
  const raws = docs.map((d) => toRaw(d.id, d.data()));

  const originalIds = [
    ...new Set(raws.map((r) => r.forked_from).filter(Boolean)),
  ];
  const originals = new Map();
  await Promise.all(
    originalIds.map(async (id) => {
      const snap = await getDoc(doc(db, "snippets", id));
      if (snap.exists()) {
        originals.set(id, {
          _id: id,
          title: snap.data().title,
          user_id: snap.data().user_id,
        });
      }
    }),
  );

  await fetchProfiles([
    ...raws.map((r) => r.user_id),
    ...[...originals.values()].map((o) => o.user_id),
  ]);

  return raws.map((r) => {
    const original = r.forked_from ? originals.get(r.forked_from) : null;
    return {
      ...r,
      user_id: profileCache.get(r.user_id),
      forked_from: original
        ? { ...original, user_id: profileCache.get(original.user_id) }
        : null,
    };
  });
};

/* ------------------------------------------------------------------ */
/* Lista snippet (feed)                                                */
/* ------------------------------------------------------------------ */

const SORTS = {
  Trending: [orderBy("starsCount", "desc"), orderBy("createdAt", "desc")],
  "Most Forked": [orderBy("forksCount", "desc"), orderBy("createdAt", "desc")],
  Newest: [orderBy("createdAt", "desc")],
};
const getOrder = (sort) => SORTS[sort] ?? SORTS.Trending;

const snippetsCol = () => collection(db, "snippets");

// Con il filtro "starred" si scarica il set (piccolo) di snippet con stella
// e ricerca/filtro AI/paginazione si fanno sul client.
const listStarred = async ({
  sort,
  page,
  pageSize,
  tokens,
  ai,
  uid,
  authorId,
}) => {
  const snap = await getDocs(
    query(
      snippetsCol(),
      where("stars", "array-contains", uid),
      ...getOrder(sort),
      limit(STARRED_FETCH_LIMIT),
    ),
  );

  let docs = snap.docs;
  if (authorId) docs = docs.filter((d) => d.data().user_id === authorId);
  if (ai) docs = docs.filter((d) => d.data().is_ai_generated === true);
  if (tokens.length) {
    docs = docs.filter((d) => matchesTokens(d.data().searchKeywords, tokens));
  }

  const totalSnippets = docs.length;
  const totalPages = Math.max(1, Math.ceil(totalSnippets / pageSize));
  const pageDocs = docs.slice((page - 1) * pageSize, page * pageSize);

  return {
    allSnippets: await hydrate(pageDocs),
    totalSnippets,
    totalPages,
  };
};

/**
 * cursorStore: oggetto { key, cursors } mantenuto dal chiamante (useRef)
 * per ricordare l'ultimo documento di ogni pagina già visitata.
 */
export const listSnippets = async (
  { sort, page = 1, pageSize = 5, queryStr = "", starred, ai, uid, authorId },
  cursorStore,
) => {
  const tokens = tokenize((queryStr || "").replaceAll("#", ""));

  if (starred) {
    return listStarred({ sort, page, pageSize, tokens, ai, uid, authorId });
  }

  // Termine usato lato server: il più lungo (più selettivo).
  // Gli altri termini si filtrano sul client.
  const serverTerm = tokens.length
    ? tokens
        .reduce((a, b) => (b.length > a.length ? b : a))
        .slice(0, MAX_PREFIX)
    : null;
  const extraTokens = tokens.filter(
    (t) => t.slice(0, MAX_PREFIX) !== serverTerm,
  );

  const filters = [];
  if (authorId) filters.push(where("user_id", "==", authorId));
  if (ai) filters.push(where("is_ai_generated", "==", true));
  if (serverTerm) {
    filters.push(where("searchKeywords", "array-contains", serverTerm));
  }

  const countSnap = await getCountFromServer(query(snippetsCol(), ...filters));
  const totalSnippets = countSnap.data().count;
  const totalPages = Math.max(1, Math.ceil(totalSnippets / pageSize));

  if (page > totalPages) {
    return { allSnippets: [], totalSnippets, totalPages };
  }

  const key = JSON.stringify([
    sort,
    ai,
    serverTerm,
    pageSize,
    authorId ?? null,
  ]);
  if (cursorStore.key !== key) {
    cursorStore.key = key;
    cursorStore.cursors = [];
  }

  const base = [...filters, ...getOrder(sort)];

  let startDoc = null;
  if (page > 1) {
    startDoc = cursorStore.cursors[page - 2];
    if (!startDoc) {
      // Salto a una pagina mai visitata: scarico le pagine precedenti una volta
      // e memorizzo l'ultimo documento di ciascuna.
      const skipSnap = await getDocs(
        query(snippetsCol(), ...base, limit((page - 1) * pageSize)),
      );
      skipSnap.docs.forEach((d, i) => {
        if ((i + 1) % pageSize === 0) {
          cursorStore.cursors[(i + 1) / pageSize - 1] = d;
        }
      });
      startDoc = cursorStore.cursors[page - 2];
      if (!startDoc) return { allSnippets: [], totalSnippets, totalPages };
    }
  }

  const snap = await getDocs(
    query(
      snippetsCol(),
      ...base,
      ...(startDoc ? [startAfter(startDoc)] : []),
      limit(pageSize),
    ),
  );

  if (snap.docs.length === pageSize) {
    cursorStore.cursors[page - 1] = snap.docs[pageSize - 1];
  }

  const docs = extraTokens.length
    ? snap.docs.filter((d) =>
        matchesTokens(d.data().searchKeywords, extraTokens),
      )
    : snap.docs;

  return { allSnippets: await hydrate(docs), totalSnippets, totalPages };
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("User not found");
  const data = snap.data();
  return {
    ...toProfile(uid, data),
    createdAt: toISO(data.createdAt),
  };
};

export const getSnippet = async (snippetId) => {
  const snap = await getDoc(doc(db, "snippets", snippetId));
  if (!snap.exists()) throw new Error("Snippet not found");
  const [snippet] = await hydrate([snap]);
  return snippet;
};

/* ------------------------------------------------------------------ */
/* Scrittura snippet                                                   */
/* ------------------------------------------------------------------ */

const cleanTags = (tags) => {
  if (tags === undefined) return undefined;
  if (!Array.isArray(tags)) throw new Error("Tags must be an array");
  const cleaned = [
    ...new Set(tags.map((t) => String(t).trim()).filter(Boolean)),
  ];
  if (cleaned.length > MAX_TAGS) {
    throw new Error(`You can add up to ${MAX_TAGS} tags`);
  }
  return cleaned;
};

const requireText = (value, message) => {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) throw new Error(message);
  return v;
};

export const createSnippet = async (input, uid) => {
  const title = requireText(input.title, "The title is mandatory");
  const code_content = requireText(
    input.code_content,
    "Snippet content is mandatory",
  );
  const language = requireText(input.language, "Snippet language is mandatory");
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const tags = cleanTags(input.tags) ?? [];

  const data = {
    title,
    ...(description ? { description } : {}),
    is_ai_generated: Boolean(input.is_ai_generated),
    code_content,
    language,
    tags,
    user_id: uid,
    stars: [],
    starsCount: 0,
    forked_from: null,
    forks: [],
    forksCount: 0,
    commentsCount: 0,
    searchKeywords: buildSearchKeywords({ title, description, language, tags }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(snippetsCol(), data);
  return ref.id;
};

const EDITABLE_FIELDS = [
  "title",
  "description",
  "is_ai_generated",
  "code_content",
  "language",
  "tags",
];

// Restituisce lo snippet "grezzo" (user_id come id), così mergeSnippetUpdate
// continua a funzionare come con la risposta di Mongo.
export const editSnippet = async (snippetId, input) => {
  const ref = doc(db, "snippets", snippetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Snippet not found");
  const current = snap.data();

  const patch = {};
  for (const key of EDITABLE_FIELDS) {
    if (input[key] !== undefined) patch[key] = input[key];
  }

  if ("title" in patch) {
    patch.title = requireText(
      patch.title,
      "If provided, the title cannot be empty",
    );
  }
  if ("code_content" in patch) {
    patch.code_content = requireText(
      patch.code_content,
      "If provided, the content cannot be empty",
    );
  }
  if ("language" in patch) {
    patch.language = requireText(
      patch.language,
      "If provided, the language cannot be empty",
    );
  }
  if ("is_ai_generated" in patch) {
    patch.is_ai_generated = Boolean(patch.is_ai_generated);
  }
  if ("tags" in patch) patch.tags = cleanTags(patch.tags);

  const merged = { ...current, ...patch };
  if ("description" in patch) {
    const d =
      typeof patch.description === "string" ? patch.description.trim() : "";
    if (d) {
      patch.description = d;
      merged.description = d;
    } else {
      patch.description = deleteField();
      merged.description = "";
    }
  }

  patch.searchKeywords = buildSearchKeywords(merged);
  patch.updatedAt = serverTimestamp();

  await updateDoc(ref, patch);

  const fresh = await getDoc(ref);
  return toRaw(fresh.id, fresh.data());
};

export const deleteSnippet = async (snippetId, uid) => {
  const ref = doc(db, "snippets", snippetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Snippet not found");

  const batch = writeBatch(db);
  batch.delete(ref);

  const originalId = snap.data().forked_from;
  if (originalId) {
    const originalRef = doc(db, "snippets", originalId);
    const originalSnap = await getDoc(originalRef);
    if (originalSnap.exists() && originalSnap.data().forks?.includes(uid)) {
      batch.update(originalRef, {
        forks: arrayRemove(uid),
        forksCount: increment(-1),
      });
    }
  }

  // I commenti della sottocollection vengono ripuliti da una Cloud Function.
  await batch.commit();
};

/* ------------------------------------------------------------------ */
/* Stelle e fork                                                       */
/* ------------------------------------------------------------------ */

export const toggleStar = (snippetId, uid) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "snippets", snippetId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Snippet not found");

    const stars = snap.data().stars ?? [];
    const isStarred = !stars.includes(uid);
    const nextStars = isStarred
      ? [...stars, uid]
      : stars.filter((id) => id !== uid);

    tx.update(ref, { stars: nextStars, starsCount: nextStars.length });
    return { isStarred, starsCount: nextStars.length };
  });

export const forkSnippet = async (snippetId, uid) => {
  const originalRef = doc(db, "snippets", snippetId);
  const originalSnap = await getDoc(originalRef);
  if (!originalSnap.exists()) throw new Error("Snippet not found");
  const original = originalSnap.data();

  if (original.user_id === uid) {
    throw new Error("You cannot fork your own snippet");
  }

  const forkRef = doc(db, "snippets", `${snippetId}_${uid}`);
  const existing = await getDoc(forkRef);
  if (existing.exists()) {
    throw new Error("You have already forked this snippet");
  }

  const description = original.description ?? "";
  const forkData = {
    title: original.title,
    ...(description ? { description } : {}),
    is_ai_generated: Boolean(original.is_ai_generated),
    code_content: original.code_content,
    language: original.language,
    tags: original.tags ?? [],
    user_id: uid,
    stars: [],
    starsCount: 0,
    forked_from: snippetId,
    forks: [],
    forksCount: 0,
    commentsCount: 0,
    searchKeywords: buildSearchKeywords({
      title: original.title,
      description,
      language: original.language,
      tags: original.tags ?? [],
    }),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  batch.set(forkRef, forkData);
  batch.update(originalRef, {
    forks: arrayUnion(uid),
    forksCount: increment(1),
  });
  await batch.commit();

  const fresh = await getDoc(forkRef);
  return toRaw(fresh.id, fresh.data());
};

/* ------------------------------------------------------------------ */
/* Commenti                                                            */
/* ------------------------------------------------------------------ */

const commentsCol = (snippetId) =>
  collection(db, "snippets", snippetId, "comments");

const cleanComment = (body) => {
  const b = typeof body === "string" ? body.trim() : "";
  if (!b) throw new Error("Body is mandatory");
  if (b.length < 5 || b.length > 100) {
    throw new Error("The body must be between 5 and 100 characters long.");
  }
  return b;
};

const toComment = (snippetId, id, data, profile) => ({
  _id: id,
  body: data.body,
  snippet_id: snippetId,
  user_id: profile ?? data.user_id,
  createdAt: toISO(data.createdAt),
  updatedAt: toISO(data.updatedAt),
});

export const listComments = async (snippetId) => {
  const snap = await getDocs(
    query(commentsCol(snippetId), orderBy("createdAt", "asc")),
  );
  await fetchProfiles(snap.docs.map((d) => d.data().user_id));
  return snap.docs.map((d) =>
    toComment(snippetId, d.id, d.data(), profileCache.get(d.data().user_id)),
  );
};

export const createComment = async (snippetId, body, uid) => {
  const clean = cleanComment(body);
  const ref = doc(commentsCol(snippetId));

  const batch = writeBatch(db);
  batch.set(ref, {
    body: clean,
    user_id: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "snippets", snippetId), {
    commentsCount: increment(1),
  });
  await batch.commit();

  const fresh = await getDoc(ref);
  return toComment(snippetId, fresh.id, fresh.data());
};

export const editComment = async (snippetId, commentId, body) => {
  const ref = doc(db, "snippets", snippetId, "comments", commentId);
  await updateDoc(ref, {
    body: cleanComment(body),
    updatedAt: serverTimestamp(),
  });
  const fresh = await getDoc(ref);
  return toComment(snippetId, fresh.id, fresh.data());
};

export const deleteComment = async (snippetId, commentId) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, "snippets", snippetId, "comments", commentId));
  batch.update(doc(db, "snippets", snippetId), {
    commentsCount: increment(-1),
  });
  await batch.commit();
};
