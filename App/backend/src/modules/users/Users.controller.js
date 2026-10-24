const usersService = require("./Users.service");
const HttpException = require("../../exception/index");
const { encryptData } = require("../../utils/encryption");
const getUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page, pageSize, queryStr, sort, starred, ai } = req.query;
    let sortQuery;
    if (sort === "Most Forked") {
      sortQuery = { forks: -1, createdAt: -1 };
    } else if (sort === "Newest") {
      sortQuery = { createdAt: -1 };
    } else {
      sortQuery = { starsCount: -1, createdAt: -1 };
    }
    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 5;
    const user = await usersService.getUser(
      userId,
      sortQuery,
      pageNum,
      pageSizeNum,
      queryStr,
      starred,
      ai,
      req.user._id,
    );

    res.status(200).json({ statusCode: 200, user });
  } catch (e) {
    next(e);
  }
};

const editUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loggedUserId = req.user._id;
    const { body } = req;
    const editedUser = await usersService.editUser(userId, loggedUserId, body);

    res.status(200).json({
      statusCode: 200,
      message: "User info updated",
      user: editedUser,
    });
  } catch (e) {
    next(e);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loggedUserId = req.user._id;

    const deletedUser = await usersService.deleteUser(userId, loggedUserId);

    res.status(200).json({
      statusCode: 200,
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (e) {
    next(e);
  }
};
const uploadAvatar = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loggedUserId = req.user._id;

    if (!req.file) {
      throw new HttpException("No image file provided or upload error", 400);
    }

    const imageUrl = req.file.path;
    const updatedUser = await usersService.uploadAvatar(
      userId,
      loggedUserId,
      imageUrl,
    );

    res.status(200).json({
      statusCode: 200,
      message: "Avatar uploaded successfully",
      user: updatedUser,
    });
  } catch (e) {
    next(e);
  }
};

const updateGeminiKey = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { gemini_key } = req.body;

    if (!gemini_key) {
      throw new HttpException("No Gemini API Key provided", 400);
    }
    const encryptedKey = encryptData(gemini_key);
    const user = await usersService.updateGeminiKey(userId, encryptedKey);

    res
      .status(200)
      .json({ statusCode: 200, message: "Gemini API Key updated.", user });
  } catch (e) {
    next(e);
  }
};

const deleteGeminiKey = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await usersService.deleteGeminiKey(userId);

    res
      .status(200)
      .json({ statusCode: 200, message: "Gemini API Key removed.", user });
  } catch (e) {
    next(e);
  }
};
module.exports = {
  uploadAvatar,
  getUser,
  editUser,
  deleteUser,
  updateGeminiKey,
  deleteGeminiKey,
};
