import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions, storage } from "../firebase";
import { invalidateProfile } from "./snippetsService";

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,20}$/;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/* Username                                                            */
/* ------------------------------------------------------------------ */

export const changeUsername = async (uid, newUsername) => {
  const username = newUsername.trim();
  if (!USERNAME_REGEX.test(username)) {
    throw new Error(
      "Username must be 3-20 characters: letters, numbers, . _ - only.",
    );
  }

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User not found");

  const oldLower = snap.data().usernameLower;
  const newLower = username.toLowerCase();

  const batch = writeBatch(db);
  if (newLower !== oldLower) {
    const taken = await getDoc(doc(db, "usernames", newLower));
    if (taken.exists()) throw new Error("Username already taken.");

    batch.set(doc(db, "usernames", newLower), { uid });
    batch.delete(doc(db, "usernames", oldLower));
  }
  batch.update(userRef, { username, usernameLower: newLower });
  await batch.commit();

  invalidateProfile(uid);
  return username;
};

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

export const changePassword = async (oldPassword, newPassword) => {
  const fbUser = auth.currentUser;
  if (!fbUser?.email) throw new Error("You must be logged in!");

  try {
    const credential = EmailAuthProvider.credential(fbUser.email, oldPassword);
    await reauthenticateWithCredential(fbUser, credential);
  } catch (error) {
    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      throw new Error("Invalid old password");
    }
    if (error.code === "auth/too-many-requests") {
      throw new Error("Too many attempts. Try again later.");
    }
    throw error;
  }

  await updatePassword(fbUser, newPassword);
};

/* ------------------------------------------------------------------ */
/* Avatar (Cloud Storage)                                              */
/* ------------------------------------------------------------------ */

export const uploadAvatar = async (uid, file) => {
  if (!file) throw new Error("No image file provided");
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG or WEBP images are allowed.");
  }
  if (file.size >= AVATAR_MAX_BYTES) {
    throw new Error("The image must be smaller than 2 MB.");
  }

  const storageRef = ref(storage, `avatars/${uid}`);
  await uploadBytes(storageRef, file, { contentType: file.type });

  // &v=... evita che il browser mostri la vecchia immagine dalla cache
  const url = `${await getDownloadURL(storageRef)}&v=${Date.now()}`;
  await updateDoc(doc(db, "users", uid), { avatar: url });

  invalidateProfile(uid);
  return url;
};

/* ------------------------------------------------------------------ */
/* Chiave Gemini e account (Cloud Functions)                           */
/* ------------------------------------------------------------------ */

const callFunction = async (name, data) => {
  try {
    const result = await httpsCallable(functions, name)(data);
    return result.data;
  } catch (error) {
    throw new Error(
      error?.code === "functions/internal" || !error?.message
        ? "Something went wrong. Please try again."
        : error.message,
    );
  }
};

export const saveGeminiKey = (key) => callFunction("setGeminiKey", { key });
export const removeGeminiKey = () => callFunction("deleteGeminiKey");
export const deleteAccount = () => callFunction("deleteAccount");
