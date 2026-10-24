const HttpException = require("../index");

class UserNotFoundException extends HttpException {
  constructor(
    message = "User not found",
    statusCode = 404,
    error = "The requested resource is not found",
  ) {
    super(message, statusCode, error);
  }
}

module.exports = UserNotFoundException;
