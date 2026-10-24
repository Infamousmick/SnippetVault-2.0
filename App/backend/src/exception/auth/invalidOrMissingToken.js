const HttpException = require("../index");

class InvalidOrMissingToken extends HttpException {
  constructor(message = "Invalid or missing token", statusCode = 401, error) {
    super(message, statusCode, error);
  }
}

module.exports = InvalidOrMissingToken;
