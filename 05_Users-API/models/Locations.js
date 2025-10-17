const mongoose = require("mongoose");

const locationsSchema = new mongoose.Schema({
  city: String,
  country: String,
  state: String,
  street: String,
  zip: String,
});

module.exports = locationsSchema;
