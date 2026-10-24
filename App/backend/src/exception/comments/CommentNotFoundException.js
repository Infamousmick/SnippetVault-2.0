const HttpException = require("../index");

class CommentNotFoundException extends HttpException {
  constructor(
    message = "Comment not found",
    statusCode = 404,
    error = "The requested resource is not found",
  ) {
    super(message, statusCode, error);
  }
}

module.exports = CommentNotFoundException;
