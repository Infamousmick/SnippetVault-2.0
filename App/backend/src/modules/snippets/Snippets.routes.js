const express = require("express");
const snippets = express.Router();
const {
  postValidationRules,
  editValidationRules,
  validate,
} = require("../../middlewares/validation/SnippetsValidation");
const snippetsController = require("./Snippets.controller");

snippets.get("/", snippetsController.getAllSnippets);
snippets.get("/mine", snippetsController.getMySnippets);

snippets.get("/:postId", snippetsController.getSingleSnippet);
snippets.post(
  "/",
  postValidationRules,
  validate,
  snippetsController.newSnippet,
);
snippets.post("/:postId/fork", snippetsController.forkSnippet);
snippets.patch(
  "/:postId",
  editValidationRules,
  validate,
  snippetsController.editSnippet,
);
snippets.delete("/:postId", snippetsController.deleteSnippet);
snippets.patch("/:postId/star", snippetsController.toggleStar);
module.exports = snippets;
