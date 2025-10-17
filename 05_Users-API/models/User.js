const mongoose = require("mongoose");

// Import the sub-schemas
const locationSchema = require("./Location");
const locationsSchema = require("./Locations");
const salarySchema = require("./Salary");

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  address: String,
  email: String,
  password: String,
  role: [String],
  // Embed the schemas as subdocuments
  location: locationSchema,
  locations: locationsSchema,
  salary: salarySchema,
  like: [String],
  dislike: [String],
});

module.exports = mongoose.model("User", userSchema);
