// Models Post (sửa: thay content bằng encryptedContent và thêm iv cho mã hóa content)
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    encryptedContent: { type: String, required: true }, // Thay content bằng encryptedContent
    iv: { type: String, required: true }, // Thêm iv để lưu initialization vector
    status: { type: Boolean, required: false, default: true },
  },
  {
    timestamps: true,
    collection: process.env.COLLECTION_DB_NAME,
  }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
