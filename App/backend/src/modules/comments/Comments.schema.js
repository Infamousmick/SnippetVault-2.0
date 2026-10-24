const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    snippet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snippets",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true, strict: true },
);

module.exports = mongoose.model("Comments", CommentSchema);
