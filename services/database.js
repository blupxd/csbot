const mongoose = require("mongoose");
const Token = require("../models/token");

mongoose.connect(process.env.MONGO_URI);

async function saveToken(machineAuth) {
  const token = machineAuth.toString("base64");
  await Token.updateOne({ id: 1 }, { token }, { upsert: true });
  console.log("Token uspešno sačuvan u MongoDB!");
}

async function loadToken() {
  const entry = await Token.findOne({ id: 1 });
  if (!entry) {
    console.log("Token nije pronađen.");
    return null;
  }
  console.log("Token učitan iz MongoDB:", entry.token);
  return entry.token;
}


module.exports = { saveToken, loadToken };
