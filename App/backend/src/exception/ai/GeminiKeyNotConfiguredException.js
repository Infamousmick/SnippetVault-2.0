const HttpException = require("../index");

class GeminiKeyNotConfiguredException extends HttpException {
  constructor(
    message = "No Gemini API Key configured for this user",
    statusCode = 403,
    error = "Gemini API Key not configured",
  ) {
    super(message, statusCode, error);
  }
}

module.exports = GeminiKeyNotConfiguredException;
