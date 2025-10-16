const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    price: { type: Number, required: true, min: 10, max: 1000, default: 10 },
    rating: { type: Number, required: true, min: 1, max: 5, default: 1 },
    company: {
      type: String,
      required: true,
      enum: {
        values: ["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Realme"],
        message: "{VALUE} is not supported",
      },
    },
  },
  {
    collection: process.env.COLLECTION_STORE,
    timestamps: true,
  }
);

const Store = mongoose.model("Store", StoreSchema);

module.exports = Store;
