const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  title: { type: String, required: true },
  order: { type: Number, default: 0 },
  starred: { type: Boolean, default: false },
  conversationId: { type: String },
  date: { type: Date, default: Date.now },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
