require("dotenv").config();
const express = require("express");
const server = express();
const PORT = process.env.PORT || 3001;
const initDatabaseConnection = require("./src/config/db");
const AuthRoute = require("./src/modules/auth/Auth.routes");
const SnippetsRoute = require("./src/modules/snippets/Snippets.routes");
const CommentsRoute = require("./src/modules/comments/Comments.routes");
const UsersRoute = require("./src/modules/users/Users.routes");
const githubOauthRoute = require("./src/modules/oauth/oauth.route");
const AiRoute = require("./src/modules/ai/Ai.routes")
const verifyToken = require("./src/middlewares/auth/auth.middlewares");
const cors = require("cors");
const errorHandler = require("./src/middlewares/errors/errorHandler");
const { requestLogger } = require("./src/middlewares/logger/logger");
const pc = require("picocolors");

server.use(cors({ origin: process.env.FRONTEND_URL }));
server.use(express.json());
server.use(requestLogger);
server.use("/auth", AuthRoute);
server.use("/oauth", githubOauthRoute);
server.use(verifyToken);
server.use("/snippets", SnippetsRoute);
server.use("/snippets/:snippetId/comments", CommentsRoute);
server.use("/ai", AiRoute)
server.use("/users", UsersRoute);

const initServer = async () => {
  await initDatabaseConnection();
  server.listen(PORT, () => {
    console.log(
      pc.green("Server running and listening on port: ") + pc.yellow(PORT),
    );
  });
};
server.use(errorHandler);
initServer();
