const sanitizeUser = (user) => {
  if (!user) return user;
  const plainUser = user.toObject ? user.toObject() : user;
  const { gemini_key, password_hash, ...safeUser } = plainUser;
  return { ...safeUser, hasGeminiKey: Boolean(gemini_key) };
};

module.exports = sanitizeUser;
