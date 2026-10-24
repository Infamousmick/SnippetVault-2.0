const CommentNotFoundException = require("../../exception/comments/CommentNotFoundException");
const HttpException = require("../../exception/index");
const snippetsSchema = require("../snippets/Snippets.schema");

const commentsSchema = require("./Comments.schema");

const findCorrespondence = async (commentId, userId) => {
  const comment = await commentsSchema.findById(commentId);

  if (!comment) {
    throw new CommentNotFoundException("Comment not found", 404);
  }

  if (comment.user_id.toString() !== userId.toString()) {
    throw new HttpException(
      "You are not authorized to operate this comment",
      403,
    );
  }
  return comment;
};

const getAllComments = async (snippetId) => {
  return await commentsSchema
    .find({ snippet_id: snippetId })
    .populate("user_id", "username avatar_url");
};

const createComment = async (body) => {
  const savedComment = await new commentsSchema(body).save();

  await snippetsSchema.findByIdAndUpdate(body.snippet_id, {
    $push: { comments: savedComment._id },
  });

  return savedComment;
};

const editComment = async ({ userId, commentId, body }) => {
  await findCorrespondence(commentId, userId);
  return await commentsSchema.findByIdAndUpdate(commentId, body, { new: true });
};

const deleteComment = async (commentId, userId) => {
  const commentToDelete = await findCorrespondence(commentId, userId);
  await snippetsSchema.findByIdAndUpdate(commentToDelete.snippet_id, {
    $pull: { comments: commentId },
  });

  return await commentsSchema.findByIdAndDelete(commentId);
};
module.exports = { getAllComments, createComment, editComment, deleteComment };
