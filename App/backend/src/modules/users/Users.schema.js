const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
    },
    github_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar_url: {
      type: String,
      default: "https://placehold.co/150",
    },
    gemini_key: {
      type: String,
    },
  },
  { timestamps: true, strict: true },
);

UserSchema.pre("save", async function () {
  const instance = this;

  if (!instance.isModified("password_hash")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
});

UserSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (update.password_hash) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(update.password_hash, salt);

    this.setUpdate({
      ...update,
      password_hash: hashed,
    });
  }
});
module.exports = mongoose.model("Users", UserSchema);
