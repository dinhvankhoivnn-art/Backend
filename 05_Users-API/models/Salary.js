const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  amount: Number,
  currency: String,
});

module.exports = salarySchema;
