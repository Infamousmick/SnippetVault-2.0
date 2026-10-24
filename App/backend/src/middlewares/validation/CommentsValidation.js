const { body, validationResult } = require("express-validator");
const BadRequestException = require("../../exception/BadRequestException");

const validationRules = [
  body("body")
    .trim()
    .notEmpty()
    .withMessage("Body is mandatory")
    .isLength({ min: 5, max: 100 })
    .withMessage("The body must be between 5 and 100 characters long."),
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

  next(
    new BadRequestException("Comment data validation error", extractedErrors),
  );
};

module.exports = { validationRules, validate };
