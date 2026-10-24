const jwt = require("jsonwebtoken");

const manageOauthCallback = async (req, res, next) => {
  try {
    const user = req.user;

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const redirectUrl = `${process.env.FRONTEND_URL}/oauth/success?token=${token}`;
    res.redirect(redirectUrl);
  } catch (e) {
    console.error("OAuth Callback Error:", e);
    next(e);
  }
};
module.exports = { manageOauthCallback };
