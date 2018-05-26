const Task = require("./task-model");
const ReadPreference = require("mongodb").ReadPreference;

require("./mongo").connect();

function get(userId) {
  return Task.find({ user: userId })
    .read(ReadPreference.NEAREST)
    .exec();
}

function create(userId, taskTitle, taskOrder, taskStarred) {
  return new Task({
    user: userId,
    title: taskTitle,
    order: taskOrder,
    starred: taskStarred
  }).save();
}

function update(taskId, taskTitle, taskOrder, taskStarred) {
  return Task.findOne({ _id: taskId }).then(task => {
    if (typeof taskTitle !== "undefined") {
      task.title = taskTitle;
    }
    if (typeof taskOrder !== "undefined") {
      task.order = taskOrder;
    }
    if (typeof taskStarred !== "undefined") {
      task.starred = taskStarred;
    }
    return task.save();
  });
}

function remove(taskId) {
  return Task.findOneAndRemove({ _id: taskId });
}

module.exports = {
  get,
  create,
  update,
  remove
};
