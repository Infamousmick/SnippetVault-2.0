const HttpException = require("../../exception");
const verifyOwnership = (req, res, next) => {
  const { userId } = req.params;
  const loggedId = req.user._id;

  if (userId.toString() !== loggedId.toString()) {
    return next(
      new HttpException("You are not authorized to edit this profile", 403),
    );
  }

  return next();
};

module.exports = verifyOwnership;
