const jwt = require("jsonwebtoken");
const InvalidOrMissingTokenException = require("../../exception/auth/invalidOrMissingToken");
const BadRequestException = require("../../exception/BadRequestException");

const EXCLUDED_ROUTES = [
  { method: "POST", path: "/auth/login" },
  { method: "POST", path: "/auth/register" },
  { method: "GET", path: "/oauth/github" },
  { method: "GET", path: "/oauth/github/callback" },
  { method: "GET", path: "/oauth/google" },
  { method: "GET", path: "/oauth/google/callback" },
];

const verifyToken = async (req, res, next) => {
  try {
    const isExcludedRoute = EXCLUDED_ROUTES.some(
      (route) => route.method === req.method && route.path === req.path,
    );

    if (isExcludedRoute) return next();

    const authHeader = req.header("Authorization");

    if (!authHeader) {
      throw new BadRequestException("Authorization header missing!");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(
        new InvalidOrMissingTokenException("Invalid or missing Token!"),
      );
    }

    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      ...decodedPayload,
      _id: decodedPayload.id || decodedPayload._id,
    };

    next();
  } catch (e) {
    next(new InvalidOrMissingTokenException("Invalid or expired Token!"));
  }
};

module.exports = verifyToken;
