const HttpException = require("../../exception/index");
const mongoose = require("mongoose");
const pc = require("picocolors");

const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpException) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors || null,
    });
  }
  if (err.name === "CastError") {
    return res.status(400).json({
      statusCode: 400,
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }
  console.error(pc.red("🔴 SERVER CRITIC ERROR: " + pc.yellow(err.message)));
  return res
    .status(500)
    .json({ statusCode: 500, message: "Internal server error" });
};

module.exports = errorHandler;
