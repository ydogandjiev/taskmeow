const mongoose = require("mongoose");

const heroSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: String,
  saying: String
});

const Hero = mongoose.model("Hero", heroSchema);
module.exports = Hero;
