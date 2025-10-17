const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  lat: Number,
  long: Number,
});

module.exports = locationSchema;
