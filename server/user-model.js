const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  accounts: [{ uid: String, provider: String }]
});

const User = mongoose.model("User", userSchema);
module.exports = User;
