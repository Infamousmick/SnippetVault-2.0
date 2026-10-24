const express = require("express");
const comments = express.Router({ mergeParams: true });
const commentsController = require("./Comments.controller");
const {validationRules, validate} = require("../../middlewares/validation/CommentsValidation")

comments.get("/", commentsController.getAllComments);
comments.post("/",validationRules, validate, commentsController.createComment);
comments.patch("/:commentId", validationRules, validate, commentsController.editComment);
comments.delete("/:commentId", commentsController.deleteComment);
module.exports = comments;
