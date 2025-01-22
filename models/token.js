const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  token: { type: String, required: true },
});

module.exports = mongoose.model("Token", tokenSchema);
