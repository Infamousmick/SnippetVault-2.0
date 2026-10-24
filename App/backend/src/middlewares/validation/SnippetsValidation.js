const { body, validationResult, matchedData } = require("express-validator");
const BadRequestException = require("../../exception/BadRequestException");

const postValidationRules = [
  body("title").trim().notEmpty().withMessage("The title is mandatory"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, the description cannot be empty"),
  body("is_ai_generated")
    .optional()
    .isBoolean()
    .withMessage("is_ai_generated must be a boolean"),
  body("code_content")
    .trim()
    .notEmpty()
    .withMessage("Snippet content is mandatory"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .trim()
    .notEmpty()
    .withMessage("Each tag must be a non-empty string"),
  body("language")
    .trim()
    .notEmpty()
    .withMessage("Snippet language is mandatory"),
];

const editValidationRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, the title cannot be empty"),
  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, the description cannot be empty"),
  body("is_ai_generated")
    .optional()
    .isBoolean()
    .withMessage("is_ai_generated must be a boolean"),
  body("code_content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, the content cannot be empty"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .trim()
    .notEmpty()
    .withMessage("Each tag must be a non-empty string"),
  body("language")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("If provided, the language cannot be empty"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    const safeBody = matchedData(req, { locations: ["body"] });
    req.body = safeBody;
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  next(new BadRequestException("Post data validation error", extractedErrors));
};

module.exports = { postValidationRules, editValidationRules, validate };
