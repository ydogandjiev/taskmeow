const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  firstname: { type: String, required: false },
  lastname: { type: String, required: false },
  accounts: [{ uid: String, provider: String }],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
