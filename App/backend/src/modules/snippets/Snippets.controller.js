const snippetsService = require("./Snippets.service");

const getAllSnippets = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page, pageSize, queryStr, sort, starred, ai } = req.query;
    let sortQuery;
    if (sort === "Most Forked") {
      sortQuery = { forks: -1, createdAt: -1 };
    } else if (sort == "Newest") {
      sortQuery = { createdAt: -1 };
    } else {
      sortQuery = { starsCount: -1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const pageSizeNum = parseInt(pageSize, 10) || 5;
    const { allSnippets, totalSnippets, totalPages } =
      await snippetsService.getAllSnippets(
        sortQuery,
        pageNum,
        pageSizeNum,
        queryStr,
        starred,
        ai,
        userId,
      );

    res
      .status(200)
      .json({ statusCode: 200, allSnippets, totalSnippets, totalPages });
  } catch (e) {
    next(e);
  }
};

const getSingleSnippet = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const snippet = await snippetsService.getSingleSnippet(postId);
    res.status(200).json({ statusCode: 200, snippet });
  } catch (e) {
    next(e);
  }
};
const newSnippet = async (req, res, next) => {
  try {
    const { body } = req;

    const snippetData = {
      ...body,
      user_id: req.user._id,
    };

    const newSnippet = await snippetsService.newSnippet(snippetData);

    res.status(201).json({
      statusCode: 201,
      message: "New Snippet Post posted!",
      newSnippet,
    });
  } catch (e) {
    next(e);
  }
};

const getMySnippets = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const mySnippets = await snippetsService.getMySnippets(userId);

    res.status(200).json({ statusCode: 200, mySnippets });
  } catch (e) {
    next(e);
  }
};

const editSnippet = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { body } = req;
    const userId = req.user._id;

    const editedSnippet = await snippetsService.editSnippet(
      postId,
      body,
      userId,
    );

    res.status(200).json({
      statusCode: 200,
      message: "Post edited successfully",
      editedSnippet,
    });
  } catch (e) {
    next(e);
  }
};

const deleteSnippet = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const deletedSnippet = await snippetsService.deleteSnippet(postId, userId);

    res.status(200).json({
      statusCode: 200,
      message: " Post deleted successfully",
      deletedSnippet,
    });
  } catch (e) {
    next(e);
  }
};

const toggleStar = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const { isStarred, starsCount } = await snippetsService.toggleStar(
      postId,
      userId,
    );

    res.status(200).json({
      statusCode: 200,
      message: isStarred
        ? "Star added to the snippet"
        : "Star deleted from the snippet",
      isStarred: isStarred,
      starsCount,
    });
  } catch (e) {
    next(e);
  }
};

const forkSnippet = async (req, res, next) => {
  try {
    const {postId} = req.params
    const userId = req.user._id

    const forkedSnippet = await snippetsService.forkSnippet(postId, userId)

    res.status(201).json({statusCode: 201, message: "Snippet forked successfully", forkedSnippet})
  } catch (e) {
    next(e);
  }
};
module.exports = {
  newSnippet,
  getSingleSnippet,
  getMySnippets,
  getAllSnippets,
  editSnippet,
  deleteSnippet,
  toggleStar,
  forkSnippet,
};
