const crypto = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");

initializeApp();
const db = getFirestore();

// Metti la stessa regione del tuo database Firestore:
// eur3 -> "europe-west1", Milano -> "europe-west8", ecc.
const REGION = "europe-west1";

// Stessa chiave a 64 caratteri esadecimali usata dal backend 1.0 (CRYPTO_SECRET).
// firebase functions:secrets:set CRYPTO_SECRET
const CRYPTO_SECRET = defineSecret("CRYPTO_SECRET");

const AVAILABLE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.1-pro",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];
const DEFAULT_MODEL = "gemini-2.5-flash";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RECENT_LOGIN_SECONDS = 10 * 60;

/* ------------------------------------------------------------------ */
/* Utilità                                                             */
/* ------------------------------------------------------------------ */

const requireAuth = (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  return request.auth.uid;
};

const fail = (code, message, reason) => {
  throw new HttpsError(code, message, reason ? { reason } : undefined);
};

// AES-256-GCM, stesso formato del backend 1.0: iv:authTag:ciphertext (hex)
const encryptData = (plaintext) => {
  const key = Buffer.from(CRYPTO_SECRET.value(), "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let ciphertext = cipher.update(plaintext, "utf-8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${ciphertext}`;
};

const decryptData = (payload) => {
  try {
    const key = Buffer.from(CRYPTO_SECRET.value(), "hex");
    const [iv, authTag, ciphertext] = payload.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "hex"),
    );
    decipher.setAuthTag(Buffer.from(authTag, "hex"));
    let plaintext = decipher.update(ciphertext, "hex", "utf-8");
    plaintext += decipher.final("utf-8");
    return plaintext;
  } catch {
    return null;
  }
};

// Finestra fissa di 60 secondi, 5 richieste per utente (stato in Firestore
// perché le istanze delle Functions non condividono la memoria).
const consumeRateLimit = async (uid) => {
  const ref = db.collection("rateLimits").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.exists ? snap.data() : null;

    if (!data || now - data.windowStart >= RATE_LIMIT_WINDOW_MS) {
      tx.set(ref, { windowStart: now, count: 1 });
      return;
    }
    if (data.count >= RATE_LIMIT_MAX) {
      fail(
        "resource-exhausted",
        "Too many AI requests, please try again later.",
        "RATE_LIMIT",
      );
    }
    tx.update(ref, { count: data.count + 1 });
  });
};

const getUserApiKey = async (uid) => {
  const snap = await db.collection("userPrivate").doc(uid).get();
  const encrypted = snap.exists ? snap.data().geminiKey : null;
  if (!encrypted) {
    fail("failed-precondition", "Gemini API Key not configured.", "NO_KEY");
  }
  const apiKey = decryptData(encrypted);
  if (!apiKey) {
    fail("internal", "Failed to retrieve Gemini API Key.", "KEY_DECRYPT");
  }
  return apiKey;
};

const callGemini = async (apiKey, model, prompt) => {
  const selectedModel = AVAILABLE_MODELS.includes(model) ? model : DEFAULT_MODEL;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
    });
    return response.text;
  } catch (err) {
    if (err.status === 429) {
      fail("unavailable", "Gemini API quota exceeded.", "GEMINI_QUOTA");
    }
    console.error("Gemini error:", err.message);
    fail("unavailable", "Gemini API request failed.", "GEMINI_ERROR");
  }
};

const requireString = (value, name, max) => {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) fail("invalid-argument", `${name} is mandatory`);
  if (max && v.length > max) fail("invalid-argument", `${name} is too long`);
  return v;
};

/* ------------------------------------------------------------------ */
/* Chiave Gemini                                                       */
/* ------------------------------------------------------------------ */

exports.setGeminiKey = onCall(
  { region: REGION, secrets: [CRYPTO_SECRET] },
  async (request) => {
    const uid = requireAuth(request);
    const key = requireString(request.data?.key, "Gemini API Key", 500);

    await db
      .collection("userPrivate")
      .doc(uid)
      .set({ geminiKey: encryptData(key), updatedAt: FieldValue.serverTimestamp() });
    await db.collection("users").doc(uid).update({ hasGeminiKey: true });

    return { ok: true };
  },
);

exports.deleteGeminiKey = onCall({ region: REGION }, async (request) => {
  const uid = requireAuth(request);
  await db.collection("userPrivate").doc(uid).delete();
  await db.collection("users").doc(uid).update({ hasGeminiKey: false });
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* AI                                                                  */
/* ------------------------------------------------------------------ */

exports.askAboutSnippet = onCall(
  { region: REGION, secrets: [CRYPTO_SECRET], timeoutSeconds: 120 },
  async (request) => {
    const uid = requireAuth(request);
    const snippetId = requireString(request.data?.snippetId, "snippetId");
    const question = requireString(request.data?.question, "Question", 500);
    const model = request.data?.model;

    const snippetSnap = await db.collection("snippets").doc(snippetId).get();
    if (!snippetSnap.exists) fail("not-found", "Snippet not found");
    const snippet = snippetSnap.data();

    await consumeRateLimit(uid);
    const apiKey = await getUserApiKey(uid);

    const prompt = `
You are an expert programming assistant. Analyze the following code snippet and answer the user's question clearly and concisely. Answer using the same language the user used in their question. Be precise and limit yourself to answering based on the snippet provided.

Language: ${snippet.language}
Code:
${snippet.code_content}

User's question: ${question}
`;

    const answer = await callGemini(apiKey, model, prompt);
    return { answer };
  },
);

exports.generateSnippetFromPrompt = onCall(
  { region: REGION, secrets: [CRYPTO_SECRET], timeoutSeconds: 120 },
  async (request) => {
    const uid = requireAuth(request);
    const description = requireString(request.data?.description, "Description", 500);
    const language = requireString(request.data?.language, "Language", 50);
    const model = request.data?.model;

    await consumeRateLimit(uid);
    const apiKey = await getUserApiKey(uid);

    const prompt = `
Generate a code snippet in ${language} that does the following: ${description}.
Respond with code only, without additional explanations, and without Markdown code fences.`;

    const generatedCode = await callGemini(apiKey, model, prompt);
    return { generatedCode };
  },
);

/* ------------------------------------------------------------------ */
/* Pulizia dati                                                        */
/* ------------------------------------------------------------------ */

// Firestore non cancella le sottocollection: quando uno snippet sparisce
// elimino anche i suoi commenti.
exports.onSnippetDeleted = onDocumentDeleted(
  { document: "snippets/{snippetId}", region: REGION },
  async (event) => {
    await db.recursiveDelete(event.data.ref);
  },
);

const forEachBatch = async (docs, fn) => {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((d) => fn(batch, d));
    await batch.commit();
  }
};

exports.deleteAccount = onCall(
  { region: REGION, timeoutSeconds: 300, memory: "512MiB" },
  async (request) => {
    const uid = requireAuth(request);

    // Operazione sensibile: serve un login recente
    const authTime = request.auth.token.auth_time ?? 0;
    if (Date.now() / 1000 - authTime > RECENT_LOGIN_SECONDS) {
      fail(
        "failed-precondition",
        "Please log out and log in again before deleting your account.",
        "RECENT_LOGIN_REQUIRED",
      );
    }

    // 1) stelle e fork che l'utente ha lasciato sugli snippet degli altri
    const starred = await db
      .collection("snippets")
      .where("stars", "array-contains", uid)
      .get();
    await forEachBatch(starred.docs, (batch, d) => {
      if (d.data().user_id === uid) return;
      batch.update(d.ref, {
        stars: FieldValue.arrayRemove(uid),
        starsCount: FieldValue.increment(-1),
      });
    });

    const forked = await db
      .collection("snippets")
      .where("forks", "array-contains", uid)
      .get();
    await forEachBatch(forked.docs, (batch, d) => {
      if (d.data().user_id === uid) return;
      batch.update(d.ref, {
        forks: FieldValue.arrayRemove(uid),
        forksCount: FieldValue.increment(-1),
      });
    });

    // 2) commenti dell'utente sugli snippet degli altri
    const comments = await db
      .collectionGroup("comments")
      .where("user_id", "==", uid)
      .get();
    await forEachBatch(comments.docs, (batch, d) => {
      const snippetRef = d.ref.parent.parent;
      batch.delete(d.ref);
      batch.update(snippetRef, { commentsCount: FieldValue.increment(-1) });
    });

    // 3) snippet dell'utente (con i loro commenti)
    const own = await db.collection("snippets").where("user_id", "==", uid).get();
    for (const d of own.docs) {
      await db.recursiveDelete(d.ref);
    }

    // 4) profilo, username, dati privati, avatar
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const usernameLower = userSnap.exists ? userSnap.data().usernameLower : null;

    if (usernameLower) {
      await db.collection("usernames").doc(usernameLower).delete();
    }
    await db.collection("userPrivate").doc(uid).delete();
    await db.collection("rateLimits").doc(uid).delete();
    await userRef.delete();

    try {
      await getStorage().bucket().file(`avatars/${uid}`).delete();
    } catch {
      // nessun avatar caricato
    }

    // 5) account di autenticazione
    await getAuth().deleteUser(uid);

    return { ok: true };
  },
);