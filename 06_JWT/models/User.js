const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // ! fields
    name: { type: String, required: true },
    age: { type: Number, required: true, min: 18, max: 80, default: 18 },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: {
      type: String, // Loại dữ liệu của role phải là String
      enum: {
        values: ["admin", "user"],
        message: "Role must be either 'admin' or 'user'",
      },
      default: "user", // Giá trị mặc định phải nằm ngoài đối tượng 'enum'
    },
  },
  {
    collection: process.env.COLLECTION_NAME || "users",
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
