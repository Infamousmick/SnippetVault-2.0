const crypto = require("crypto");
const SECRET_KEY = process.env.CRYPTO_SECRET;
const ALGORITHM = "aes-256-gcm";

if (!SECRET_KEY || SECRET_KEY.length !== 64) {
  throw new Error(
    "Critic Error: Missing CRYPTO_SECRET in environment variables",
  );
}

const KEY_BUFFER = Buffer.from(SECRET_KEY, "hex");

const encryptData = (plaintext) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
  let ciphertext = cipher.update(plaintext, "utf-8", "hex");
  ciphertext += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${ciphertext}`;
};

const decryptData = (payload) => {
  const [iv, authTagHex, ciphertext] = payload.split(":");

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      KEY_BUFFER,
      Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let plaintext = decipher.update(ciphertext, "hex", "utf-8");
    plaintext += decipher.final("utf-8");
    return plaintext;
  } catch (error) {
    console.error(
      "Decryption failed: Data has been tampered with or key is invalid.",
    );
    return null;
  }
};
module.exports = { encryptData, decryptData };
