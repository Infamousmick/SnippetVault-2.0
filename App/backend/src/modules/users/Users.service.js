const UserNotFoundException = require("../../exception/users/UserNotFoundException");
const HttpException = require("../../exception/index");
const usersSchema = require("./Users.schema");
const snippetsSchema = require("../snippets/Snippets.schema");
const cloudinary = require("cloudinary").v2;
const sanitizeUser = require("../../utils/sanitizeUser");

const extractPublicIdFromUrl = (url) => {
  if (!url) return null;

  const splitUrl = url.split("/upload/");
  if (splitUrl.length !== 2) return null;

  const path = splitUrl[1];

  const pathWithoutVersion = path.replace(/^v\d+\//, "");

  const lastDotIndex = pathWithoutVersion.lastIndexOf(".");

  if (lastDotIndex === -1) return pathWithoutVersion;

  return pathWithoutVersion.substring(0, lastDotIndex);
};

const getUser = async (
  userId,
  sortQuery,
  pageNum,
  pageSizeNum,
  queryStr,
  starred,
  ai,
  loggedUserId,
) => {
  const safeQueryStr = queryStr ? queryStr.replaceAll("#", "").trim() : "";
  const query = safeQueryStr
    ? {
        $or: [
          { title: { $regex: safeQueryStr, $options: "i" } },
          { description: { $regex: safeQueryStr, $options: "i" } },
          { language: { $regex: safeQueryStr, $options: "i" } },
          { tags: { $elemMatch: { $regex: safeQueryStr, $options: "i" } } },
        ],
      }
    : {};

  const user = await usersSchema.findById(userId).lean();

  if (!user) {
    throw new UserNotFoundException();
  }

  if (starred === "true") {
    query.stars = loggedUserId;
  }

  if (ai === "true") {
    query.is_ai_generated = true;
  }

  const totalSnippets = await snippetsSchema.countDocuments({
    user_id: userId,
    ...query,
  });
  const totalPages = Math.ceil(totalSnippets / pageSizeNum);
  const userSnippets = await snippetsSchema
    .find({ user_id: userId, ...query })
    .limit(pageSizeNum)
    .skip((pageNum - 1) * pageSizeNum)
    .sort(sortQuery)
    .populate({
      path: "forked_from",
      select: "title user_id",
      populate: { path: "user_id", select: "username avatar_url" },
    });
  return {
    ...sanitizeUser(user),
    snippets: userSnippets,
    totalSnippets,
    totalPages,
  };
};

const editUser = async (userId, loggedUserId, body) => {
  if (userId.toString() !== loggedUserId.toString()) {
    throw new HttpException("You are not allowed to edit this profile.", 403);
  }

  const user = await usersSchema.findByIdAndUpdate(userId, body, { new: true });

  if (!user) {
    throw new UserNotFoundException();
  }

  return sanitizeUser(user);
};

const deleteUser = async (userId, loggedUserId) => {
  if (userId.toString() !== loggedUserId.toString()) {
    throw new HttpException("You are not allowed to delete this profile.", 403);
  }

  const user = await usersSchema.findByIdAndDelete(userId);
  if (!user) {
    throw new UserNotFoundException();
  }

  await snippetsSchema.updateMany(
    { forks: userId },
    { 
      $pull: { forks: userId },
      $inc: { forksCount: -1 } 
    }
  );

  await snippetsSchema.updateMany(
    { stars: userId },
    { 
      $pull: { stars: userId },
      $inc: { starsCount: -1 } 
    }
  );

  await snippetsSchema.deleteMany({ user_id: userId });

  return sanitizeUser(user);
};

const uploadAvatar = async (userId, loggedUserId, imageUrl) => {
  if (userId.toString() !== loggedUserId.toString()) {
    throw new HttpException(
      "You are not allowed to change this profile photo.",
      403,
    );
  }
  const user = await usersSchema.findById(userId);

  if (!user) {
    throw new UserNotFoundException();
  }

  let publicId;

  if (user.avatar_url) {
    publicId = extractPublicIdFromUrl(user.avatar_url);
  }

  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
  user.avatar_url = imageUrl;

  await user.save();
  return sanitizeUser(user);
};

const updateGeminiKey = async (userId, payload) => {
  const user = await usersSchema.findByIdAndUpdate(
    userId,
    { gemini_key: payload },
    { new: true },
  );

  if (!user) {
    throw new UserNotFoundException();
  }

  return sanitizeUser(user);
};

const deleteGeminiKey = async (userId) => {
  const user = await usersSchema.findByIdAndUpdate(
    userId,
    { $unset: { gemini_key: "" } },
    { new: true },
  );

  if (!user) {
    throw new UserNotFoundException();
  }

  return sanitizeUser(user);
};

module.exports = {
  uploadAvatar,
  getUser,
  editUser,
  deleteUser,
  updateGeminiKey,
  deleteGeminiKey,
};
