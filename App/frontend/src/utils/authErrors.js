export const getAuthErrorMessage = (error) => {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Login cancelled.";
    case "auth/account-exists-with-different-credential":
      return "An account with this email already exists. Sign in with your original method (Google or email/password) and GitHub will be linked automatically.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return error?.message || "Something went wrong.";
  }
};
