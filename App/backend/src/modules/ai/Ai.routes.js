const express = require("express");
const ai = express.Router();
const {
  askAboutSnippetValidationRules,
  generateSnippetValidationRules,
  validate,
} = require("../../middlewares/validation/AiValidation");
const aiController = require("./Ai.controller");
const aiRateLimiter = require("../../middlewares/rateLimit/aiRateLimiter")

ai.post(
  "/:snippetId/ask",
  aiRateLimiter,
  askAboutSnippetValidationRules,
  validate,
  aiController.askAboutSnippet,
);
ai.post(
  "/generate",
  aiRateLimiter,
  generateSnippetValidationRules,
  validate,
  aiController.generateSnippetFromPrompt,
);
module.exports = ai;
