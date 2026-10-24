const commentsService = require("./Comments.service");

const getAllComments = async (req, res, next) => {
  try {
    const { snippetId } = req.params;
    const allComments = await commentsService.getAllComments(snippetId);
    res.status(200).json({ statusCode: 200, allComments });
  } catch (e) {
    next(e);
  }
};

const createComment = async (req, res, next) => {
  try {
    const { body } = req;
    const { snippetId } = req.params;

    const commentData = {
      ...body,
      snippet_id: snippetId,
      user_id: req.user._id,
    };
    const newComment = await commentsService.createComment(commentData);
    res
      .status(201)
      .json({ statusCode: 201, message: "New Comment posted!", newComment });
  } catch (e) {
    next(e);
  }
};

const editComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { body } = req;
    const userId = req.user._id;
    const editedComment = await commentsService.editComment({
      userId,
      commentId,
      body,
    });

    res.status(200).json({
      statusCode: 200,
      message: "Comment edited successfully",
      editedComment,
    });
  } catch (e) {
    next(e);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const deletedComment = await commentsService.deleteComment(
      commentId,
      userId,
    );
    res.status(200).json({
      statusCode: 200,
      message: "Comment deleted successfully",
      deletedComment,
    });
  } catch (e) {
    next(e);
  }
};
module.exports = { getAllComments, createComment, editComment, deleteComment };
