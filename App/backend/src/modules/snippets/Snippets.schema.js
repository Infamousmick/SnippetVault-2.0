const mongoose = require("mongoose");

const SnippetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    is_ai_generated: {
      type: Boolean,
      default: false,
    },
    code_content: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments",
        default: [],
      },
    ],
    stars: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        default: [],
      },
    ],
    starsCount: {
      type: Number,
      default: 0,
    },
    forked_from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Snippets",
      default: null,
    },
    forks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    forksCount: { type: Number, default: 0 },
  },
  { timestamps: true, strict: true },
);

module.exports = mongoose.model("Snippets", SnippetSchema);
