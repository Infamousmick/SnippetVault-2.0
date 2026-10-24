const { body, validationResult } = require("express-validator");
const BadRequestException = require("../../exception/BadRequestException");

const registerValidationRules = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("The username is mandatory")
    .isLength({ min: 6 })
    .withMessage("The username must have at least 6 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("The email is mandatory")
    .isEmail()
    .withMessage("If provided, must be a valid email address"),
  body("password")
    .notEmpty()
    .withMessage("The password is mandatory")
    .isLength({ min: 8 })
    .withMessage("The password must have at least 8 characters"),
];

const loginValidationRules = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Username or email is mandatory"),
  body("password").notEmpty().withMessage("The password is mandatory"),
];

const changePasswordValidationRules = [
  body("oldPassword").notEmpty().withMessage("The old password is mandatory"),
  body("newPassword")
    .notEmpty()
    .withMessage("The new password is mandatory")
    .isLength({ min: 8 })
    .withMessage("The new password must have at least 8 characters"),
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
    new BadRequestException("Authentication validation error", extractedErrors),
  );
};

module.exports = {
  registerValidationRules,
  loginValidationRules,
  changePasswordValidationRules,
  validate,
};
