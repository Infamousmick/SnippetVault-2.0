const HttpException = require("./index");

class BadRequestException extends HttpException {
  constructor(message, errors) {
    super(message || "Invalid request", 400, errors);
  }
}

module.exports = BadRequestException;
