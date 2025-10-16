const mongoose = require("mongoose");

const TasksSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    completed: { type: Boolean, default: false, required: true },
  },
  {
    collection: process.env.COLLECTION_DB,
    timestamps: true,
  }
);

const Tasks = mongoose.model("Tasks", TasksSchema);

module.exports = Tasks;
