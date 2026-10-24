const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpException = require("../../exception/index");
const sanitizeUser = require("../../utils/sanitizeUser");

const UsersSchema = require("../users/Users.schema");

const registerUser = async (body) => {
  const { username, email, password } = body;

  const user = await UsersSchema.findOne({
    $or: [{ email: email }, { username: username }],
  });

  if (user) {
    throw new HttpException("User already registered", 400);
  }
  const newUser = new UsersSchema({
    username,
    email,
    password_hash: password,
  });
  await newUser.save();
  return sanitizeUser(newUser);
};

const login = async (body) => {
  const { identifier, password } = body;
  const user = await UsersSchema.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    throw new HttpException("Wrong email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpException("Wrong email or password", 401);
  }

  const token = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { token, user: sanitizeUser(user) };
};

const getMe = async (userId) => {
  const user = await UsersSchema.findById(userId).lean();

  if (!user) {
    throw new HttpException("User not found", 404);
  }

  return sanitizeUser(user);
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await UsersSchema.findById(userId);

  if (!user) {
    throw new HttpException("User not found", 404);
  }

  if (user.google_id || user.github_id) {
    throw new HttpException("OAuth users cannot change their password", 400);
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new HttpException("Invalid old password", 401);
  }
  user.password_hash = newPassword;
  await user.save();

  return true;
};
module.exports = { registerUser, login, getMe, changePassword };
