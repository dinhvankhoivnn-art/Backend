// Models Post (sửa: mã hóa tất cả các trường name, title, content, status bằng encryptedField và iv cho từng trường)
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    encryptedName: { type: String, required: true }, // Mã hóa name
    ivName: { type: String, required: true }, // IV cho name
    encryptedTitle: { type: String, required: true }, // Mã hóa title
    ivTitle: { type: String, required: true }, // IV cho title
    encryptedContent: { type: String, required: true }, // Mã hóa content
    ivContent: { type: String, required: true }, // IV cho content
    encryptedStatus: { type: String, required: true }, // Mã hóa status (lưu dưới dạng string "true"/"false")
    ivStatus: { type: String, required: true }, // IV cho status
  },
  {
    timestamps: true,
    collection: process.env.COLLECTION_DB_NAME,
  }
);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
