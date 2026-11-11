"use strict";

/**
 * Migra SnippetVault 1.0 (MongoDB) -> 2.0 (Firebase Auth + Firestore).
 *
 *   node migrate.js --dry-run            # legge Mongo e mostra cosa farebbe, senza scrivere
 *   node migrate.js                      # migra davvero
 *   node migrate.js --keep-gemini-keys   # copia anche le chiavi Gemini cifrate
 *   node migrate.js --force              # procede anche se Firebase non è vuoto
 *
 * Variabili d'ambiente:
 *   MONGODB_URI                       URI del database MongoDB del 1.0 (solo lettura)
 *   MONGODB_DB                        (facoltativa) nome del database, se non è nell'URI
 *   GOOGLE_APPLICATION_CREDENTIALS    percorso del JSON dell'account di servizio Firebase
 *   FIREBASE_PROJECT_ID               (facoltativa) default: snippetvault-2
 *
 * Gli id di MongoDB diventano gli uid di Firebase e gli id dei documenti,
 * quindi stelle, fork e commenti restano collegati. I fork prendono l'id
 * "<idOriginale>_<uidAutore>" richiesto dalle Security Rules.
 */

const fs = require("node:fs");
const path = require("node:path");

const MAX_PREFIX = 15;
const MAX_KEYWORDS = 400;
const PLACEHOLDER_AVATAR = "https://placehold.co/150";

/* ------------------------------------------------------------------ */
/* Funzioni di supporto (testabili senza database)                     */
/* ------------------------------------------------------------------ */

const normalize = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const tokenize = (s = "") =>
  normalize(s)
    .split(/[^a-z0-9+#.]+/)
    .map((w) => w.replace(/^[#.]+|\.+$/g, ""))
    .filter(Boolean);

// Identica a quella del frontend (snippetsService.js)
const buildSearchKeywords = ({
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

// Le Rules accettano solo [a-zA-Z0-9_.-], da 3 a 20 caratteri
const sanitizeUsername = (raw = "") => {
  let name = String(raw)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 20);
  if (name.length < 3) name = `${name}user`.slice(0, 20);
  return name;
};

const uniqueUsername = (base, taken) => {
  let candidate = base;
  let counter = 1;
  while (taken.has(candidate.toLowerCase())) {
    const suffix = String(++counter);
    candidate = `${base.slice(0, 20 - suffix.length)}${suffix}`;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
};

const toDate = (value, fallback = new Date()) => {
  const d = value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : d;
};

const removeUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

/* ------------------------------------------------------------------ */
/* Trasformazione dei dati                                             */
/* ------------------------------------------------------------------ */

const transform = ({ users, snippets, comments, keepGeminiKeys }) => {
  const warnings = [];
  const taken = new Set();
  const userInfo = new Map();
  const authRecords = [];

  // I più vecchi scelgono per primi lo username
  const orderedUsers = [...users].sort(
    (a, b) => toDate(a.createdAt) - toDate(b.createdAt),
  );

  for (const u of orderedUsers) {
    const uid = String(u._id);
    const username = uniqueUsername(sanitizeUsername(u.username), taken);
    if (username !== u.username) {
      warnings.push(`username "${u.username}" -> "${username}" (${uid})`);
    }

    const email = (u.email || "").trim().toLowerCase();
    const realEmail = email && !email.endsWith("@github.local") ? email : undefined;
    const createdAt = toDate(u.createdAt);
    const avatar =
      u.avatar_url && u.avatar_url !== PLACEHOLDER_AVATAR ? u.avatar_url : null;

    userInfo.set(uid, {
      uid,
      username,
      usernameLower: username.toLowerCase(),
      avatar,
      createdAt,
      geminiKey: keepGeminiKeys ? u.gemini_key || null : null,
    });

    const providerData = [];
    if (u.google_id) {
      providerData.push(
        removeUndefined({
          uid: String(u.google_id),
          providerId: "google.com",
          email: realEmail,
          displayName: username,
        }),
      );
    }
    if (u.github_id) {
      providerData.push({
        uid: String(u.github_id),
        providerId: "github.com",
        displayName: username,
      });
    }

    authRecords.push(
      removeUndefined({
        uid,
        email: realEmail,
        emailVerified: Boolean(u.google_id && realEmail),
        displayName: username,
        passwordHash: u.password_hash ? Buffer.from(u.password_hash) : undefined,
        providerData: providerData.length ? providerData : undefined,
        metadata: { creationTime: createdAt.toUTCString() },
      }),
    );
  }

  // --- snippet -------------------------------------------------------
  const snippetById = new Map(snippets.map((s) => [String(s._id), s]));
  const migratable = (s) => s && userInfo.has(String(s.user_id));

  const idMemo = new Map();
  const newSnippetId = (s) => {
    const id = String(s._id);
    if (idMemo.has(id)) return idMemo.get(id);
    let result = id;
    const parent = s.forked_from ? snippetById.get(String(s.forked_from)) : null;
    if (migratable(parent) && migratable(s)) {
      result = `${newSnippetId(parent)}_${String(s.user_id)}`;
    }
    idMemo.set(id, result);
    return result;
  };

  const commentCounts = new Map();
  const commentDocs = [];
  const skipped = { snippets: 0, comments: 0 };

  const snippetDocs = new Map();
  for (const s of snippets) {
    if (!migratable(s)) {
      skipped.snippets++;
      warnings.push(`snippet ${s._id} saltato: l'autore ${s.user_id} non esiste più`);
      continue;
    }
    const id = newSnippetId(s);
    if (snippetDocs.has(id)) {
      warnings.push(`id duplicato ${id}: l'ultimo snippet sovrascrive il precedente`);
    }

    const parent = s.forked_from ? snippetById.get(String(s.forked_from)) : null;
    const forkedFrom = migratable(parent) ? newSnippetId(parent) : null;

    const keepExisting = (ids = []) => [
      ...new Set(ids.map(String).filter((uid) => userInfo.has(uid))),
    ];
    const stars = keepExisting(s.stars);
    const forks = keepExisting(s.forks);

    let tags = Array.isArray(s.tags) ? s.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    if (tags.length > 10) {
      warnings.push(`snippet ${id}: tag ridotti a 10`);
      tags = tags.slice(0, 10);
    }
    let title = String(s.title || "").trim();
    if (title.length > 150) {
      warnings.push(`snippet ${id}: titolo accorciato a 150 caratteri`);
      title = title.slice(0, 150);
    }
    const description = typeof s.description === "string" ? s.description.trim() : "";
    if (description.length > 1000) {
      warnings.push(`snippet ${id}: descrizione oltre 1000 caratteri (modificabile solo accorciandola)`);
    }
    if ((s.code_content || "").length > 50000) {
      warnings.push(`snippet ${id}: codice oltre 50000 caratteri (modificabile solo accorciandolo)`);
    }

    snippetDocs.set(id, {
      title,
      ...(description ? { description } : {}),
      is_ai_generated: Boolean(s.is_ai_generated),
      code_content: s.code_content || "",
      language: s.language || "text",
      tags,
      user_id: String(s.user_id),
      stars,
      starsCount: stars.length,
      forked_from: forkedFrom,
      forks,
      forksCount: forks.length,
      commentsCount: 0,
      searchKeywords: buildSearchKeywords({
        title,
        description,
        language: s.language || "",
        tags,
      }),
      createdAt: toDate(s.createdAt),
      updatedAt: toDate(s.updatedAt, toDate(s.createdAt)),
    });
  }

  for (const c of comments) {
    const parent = snippetById.get(String(c.snippet_id));
    if (!migratable(parent) || !userInfo.has(String(c.user_id))) {
      skipped.comments++;
      const reason = !parent
        ? `lo snippet ${c.snippet_id} non esiste più`
        : !migratable(parent)
          ? `l'autore dello snippet ${c.snippet_id} non esiste più`
          : `l'autore del commento ${c.user_id} non esiste più`;
      warnings.push(`commento ${c._id} saltato: ${reason}`);
      continue;
    }
    const snippetId = newSnippetId(parent);
    commentCounts.set(snippetId, (commentCounts.get(snippetId) || 0) + 1);
    commentDocs.push({
      snippetId,
      id: String(c._id),
      data: {
        body: c.body,
        user_id: String(c.user_id),
        createdAt: toDate(c.createdAt),
        updatedAt: toDate(c.updatedAt, toDate(c.createdAt)),
      },
    });
  }

  for (const [id, count] of commentCounts) {
    snippetDocs.get(id).commentsCount = count;
  }

  return { userInfo, authRecords, snippetDocs, commentDocs, warnings, skipped };
};

/* ------------------------------------------------------------------ */
/* Esecuzione                                                          */
/* ------------------------------------------------------------------ */

const main = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const keepGeminiKeys = args.includes("--keep-gemini-keys");
  const force = args.includes("--force");

  const { MongoClient } = require("mongodb");
  const { initializeApp, applicationDefault } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const { getFirestore, Timestamp } = require("firebase-admin/firestore");

  if (!process.env.MONGODB_URI) {
    throw new Error("Imposta MONGODB_URI (URI del database MongoDB del 1.0).");
  }
  if (!dryRun && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "Imposta GOOGLE_APPLICATION_CREDENTIALS con il percorso del JSON dell'account di servizio.",
    );
  }

  // 1) Lettura da MongoDB (solo lettura)
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const mdb = process.env.MONGODB_DB ? client.db(process.env.MONGODB_DB) : client.db();
  const [users, snippets, comments] = await Promise.all([
    mdb.collection("users").find().toArray(),
    mdb.collection("snippets").find().toArray(),
    mdb.collection("comments").find().toArray(),
  ]);
  await client.close();

  console.log(`Letti da MongoDB: ${users.length} utenti, ${snippets.length} snippet, ${comments.length} commenti`);
  if (users.length === 0) {
    throw new Error("Nessun utente trovato: controlla MONGODB_URI / MONGODB_DB.");
  }

  // 2) Trasformazione
  const result = transform({ users, snippets, comments, keepGeminiKeys });
  const { userInfo, authRecords, snippetDocs, commentDocs, warnings, skipped } = result;

  console.log(
    `Da scrivere: ${authRecords.length} utenti, ${snippetDocs.size} snippet, ${commentDocs.length} commenti ` +
      `(saltati: ${skipped.snippets} snippet e ${skipped.comments} commenti senza autore/snippet)`,
  );
  warnings.forEach((w) => console.warn("  ! " + w));

  const report = {
    generatedAt: new Date().toISOString(),
    dryRun,
    counts: {
      users: authRecords.length,
      snippets: snippetDocs.size,
      comments: commentDocs.length,
    },
    skipped,
    warnings,
  };
  fs.writeFileSync(
    path.join(__dirname, "migration-report.json"),
    JSON.stringify(report, null, 2),
  );

  if (dryRun) {
    console.log("\nDry run: nessuna scrittura effettuata. Report in migration-report.json");
    return;
  }

  // 3) Scrittura su Firebase
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || "snippetvault-2",
  });
  const auth = getAuth();
  const db = getFirestore();

  const existingSnippets = await db.collection("snippets").limit(1).get();
  const existingUsers = await auth.listUsers(1);
  if ((!existingSnippets.empty || existingUsers.users.length) && !force) {
    throw new Error(
      "Firebase contiene già utenti o snippet (dati di prova?). Cancellali dalla Console " +
        "oppure rilancia con --force.",
    );
  }

  console.log("\nImporto gli utenti in Firebase Auth...");
  let authFailures = 0;
  for (const part of chunk(authRecords, 500)) {
    const res = await auth.importUsers(part, { hash: { algorithm: "BCRYPT" } });
    authFailures += res.failureCount;
    res.errors.forEach((e) =>
      console.warn(`  ! utente ${part[e.index].uid}: ${e.error.message}`),
    );
  }
  console.log(`  utenti importati: ${authRecords.length - authFailures}, errori: ${authFailures}`);

  console.log("Scrivo profili, username, snippet e commenti in Firestore...");
  const writer = db.bulkWriter();
  writer.onWriteError((err) => {
    console.warn(`  ! scrittura fallita su ${err.documentRef.path}: ${err.message}`);
    return false;
  });

  for (const u of userInfo.values()) {
    writer.set(db.collection("users").doc(u.uid), {
      username: u.username,
      usernameLower: u.usernameLower,
      avatar: u.avatar,
      createdAt: Timestamp.fromDate(u.createdAt),
      ...(u.geminiKey ? { hasGeminiKey: true } : {}),
    });
    writer.set(db.collection("usernames").doc(u.usernameLower), { uid: u.uid });
    if (u.geminiKey) {
      writer.set(db.collection("userPrivate").doc(u.uid), { geminiKey: u.geminiKey });
    }
  }

  for (const [id, data] of snippetDocs) {
    writer.set(db.collection("snippets").doc(id), {
      ...data,
      createdAt: Timestamp.fromDate(data.createdAt),
      updatedAt: Timestamp.fromDate(data.updatedAt),
    });
  }

  for (const c of commentDocs) {
    writer.set(
      db.collection("snippets").doc(c.snippetId).collection("comments").doc(c.id),
      {
        ...c.data,
        createdAt: Timestamp.fromDate(c.data.createdAt),
        updatedAt: Timestamp.fromDate(c.data.updatedAt),
      },
    );
  }

  await writer.close();
  console.log("\nMigrazione completata. Report in migration-report.json");
};

module.exports = {
  sanitizeUsername,
  uniqueUsername,
  buildSearchKeywords,
  transform,
};

if (require.main === module) {
  main().catch((err) => {
    console.error("\nERRORE:", err.message);
    process.exit(1);
  });
}