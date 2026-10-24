const express = require("express");
const users = express.Router();
const usersController = require("./Users.controller");
const {
  editUserValidationRules,
  updateGeminiKeyValidationRules,
  validate,
} = require("../../middlewares/validation/UsersValidation");
const cloudUpload = require("../../middlewares/upload/cloudUpload");
const verifyOwnership = require("../../middlewares/auth/verifyOwnership");

users.get("/:userId", usersController.getUser);
users.patch(
  "/:userId",
  editUserValidationRules,
  validate,
  usersController.editUser,
);
users.patch(
  "/:userId/gemini-key",
  verifyOwnership,
  updateGeminiKeyValidationRules,
  validate,
  usersController.updateGeminiKey,
);
users.post(
  "/:userId/avatar",
  verifyOwnership,
  cloudUpload.single("avatar"),
  usersController.uploadAvatar,
);
users.delete("/:userId", usersController.deleteUser);
users.delete("/:userId/gemini-key", verifyOwnership, usersController.deleteGeminiKey)

module.exports = users;
