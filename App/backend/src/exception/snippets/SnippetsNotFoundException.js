const HttpException = require("../index");

class SnippetsNotFoundException extends HttpException {
  constructor(
    message = "Snippet Post not found",
    statusCode = 404,
    error = "The requested resource is not found",
  ) {
    super(message, statusCode, error);
  }
}

module.exports = SnippetsNotFoundException;
