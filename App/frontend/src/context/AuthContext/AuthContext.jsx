import { createContext, useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  linkWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

export const AuthContext = createContext();

const sanitizeUsername = (raw = "") =>
  raw.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 20);

const buildUser = (fbUser, profile) => ({
  ...profile,
  _id: fbUser.uid,
  email: fbUser.email,
  avatar: profile?.avatar ?? fbUser.photoURL ?? null,
  providers: fbUser.providerData.map((p) => p.providerId),
});

const createProfile = async (fbUser, desiredUsername) => {
  let base = sanitizeUsername(
    desiredUsername || fbUser.displayName || fbUser.email?.split("@")[0],
  );
  if (base.length < 3) base = `${base}user`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const username =
      attempt === 0
        ? base
        : `${base.slice(0, 16)}${Math.floor(100 + Math.random() * 900)}`;
    const usernameLower = username.toLowerCase();
    const avatar = fbUser.photoURL ?? null;

    const batch = writeBatch(db);
    batch.set(doc(db, "usernames", usernameLower), { uid: fbUser.uid });
    batch.set(doc(db, "users", fbUser.uid), {
      username,
      usernameLower,
      avatar,
      createdAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      return { username, usernameLower, avatar };
    } catch (error) {
      if (error.code !== "permission-denied") throw error;
    }
  }
  throw new Error("Unable to create user profile.");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const pendingUsername = useRef(null);
  const pendingLink = useRef(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsCheckingAuth(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        let profile = snap.exists() ? snap.data() : null;

        if (!profile) {
          profile = await createProfile(fbUser, pendingUsername.current);
          pendingUsername.current = null;
        }
        setUser(buildUser(fbUser, profile));
      } catch (error) {
        console.error(error);
        await signOut(auth);
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return unsubscribe;
  }, []);

    const linkPendingCredential = async (fbUser) => {
    const pending = pendingLink.current;
    if (!pending) return;
    pendingLink.current = null;

    if (fbUser.email?.toLowerCase() !== pending.email?.toLowerCase()) return;

    try {
      const result = await linkWithCredential(fbUser, pending.credential);
      setUser(
        (prev) =>
          prev && {
            ...prev,
            providers: result.user.providerData.map((p) => p.providerId),
          },
      );
    } catch (error) {
      console.error("Account linking failed:", error);
    }
  };

  const withLinking = async (signInFn) => {
    try {
      const result = await signInFn();
      await linkPendingCredential(result.user);
      return result;
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        pendingLink.current = {
          credential: OAuthProvider.credentialFromError(error),
          email: error.customData?.email,
        };
      }
      throw error;
    }
  };

  const loginWithEmail = (email, password) =>
    withLinking(() => signInWithEmailAndPassword(auth, email, password));
  const loginWithGoogle = () =>
    withLinking(() => signInWithPopup(auth, new GoogleAuthProvider()));
  const loginWithGithub = () =>
    withLinking(() => signInWithPopup(auth, new GithubAuthProvider()));

  const registerUser = async ({ email, username, password }) => {
    const typed = username.trim();
    const clean = sanitizeUsername(typed);
    if (clean !== typed || clean.length < 3) {
      throw new Error(
        "Username must be 3-20 characters: letters, numbers, . _ - only.",
      );
    }
    const taken = await getDoc(doc(db, "usernames", clean.toLowerCase()));
    if (taken.exists()) throw new Error("Username already taken.");

    pendingUsername.current = clean;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      pendingUsername.current = null;
      throw error;
    }
  };

  const logoutUser = () => signOut(auth);

  const updateUser = (userData) =>
    setUser((prev) => ({ ...prev, ...userData }));

  const isOauth = Boolean(
    user?.providers?.some((p) => p === "google.com" || p === "github.com"),
  );

  const value = {
    user,
    isLoggedIn: !!user,
    isCheckingAuth,
    isOauth,
    loginWithEmail,
    loginWithGoogle,
    loginWithGithub,
    registerUser,
    logoutUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};