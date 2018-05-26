const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const taskSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  starred: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
