const { body, validationResult } = require("express-validator");
const BadRequestException = require("../../exception/BadRequestException");

const editUserValidationRules = [
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, username cannot be empty")
    .isLength({ min: 6 })
    .withMessage("Username must be at least 6 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("If provided, must be a valid email address"),
];

const updateGeminiKeyValidationRules = [
  body("gemini_key")
    .trim()
    .notEmpty()
    .withMessage("Gemini API Key is required and cannot be empty")
    .isString()
    .withMessage("Gemini API Key must be a valid string"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  next(new BadRequestException("User data validation error", extractedErrors));
};

module.exports = {
  editUserValidationRules,
  updateGeminiKeyValidationRules,
  validate,
};
