const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  threadId: { type: String, required: true, unique: true },
  serviceUrl: { type: String, required: true },
});

const Group = mongoose.model("Group", groupSchema);
module.exports = Group;
