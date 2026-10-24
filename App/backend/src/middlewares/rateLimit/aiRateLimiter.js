const rateLimit = require("express-rate-limit");

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user._id.toString(),
  message: {
    statusCode: 429,
    message: "Too many AI requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = aiRateLimiter;
