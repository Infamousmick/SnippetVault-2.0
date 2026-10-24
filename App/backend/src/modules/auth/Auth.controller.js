const authService = require("./Auth.service");

const registerUser = async (req, res, next) => {
  try {
    const { body } = req;
    const user = await authService.registerUser(body);

    res.status(201).json({ statusCode: 201, message: "User registerd!", user });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { body } = req;
    const { token, user } = await authService.login(body);

    res
      .header("authorization", token)
      .status(200)
      .json({ statusCode: 200, message: "Login successfully", token, user });
  } catch (e) {
    next(e);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ statusCode: 200, user });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const user = await authService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );
    res.status(200).json({ message: "Password changed successfully!" });
  } catch (e) {
    next(e);
  }
};

module.exports = { registerUser, login, getMe, changePassword };
