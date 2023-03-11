const Task = require("./task-model");
const ReadPreference = require("mongodb").ReadPreference;
const baseUrl = "https://taskmeow.com";

function get(taskId) {
  return Task.findOne({ _id: taskId });
}

function getForUser(userId) {
  return Task.find({ user: userId }).read(ReadPreference.NEAREST).exec();
}

function getForGroup(groupId) {
  return Task.find({ group: groupId }).read(ReadPreference.NEAREST).exec();
}

function getShareUrl(task) {
  // TODO: this is just a mocked url until we implement the shareTag
  return Promise.resolve(`${baseUrl}?task=${task._id.toString()}`);
}

function createForUser(userId, title) {
  return new Task({ title, user: userId }).save();
}

function createForGroup(groupId, title) {
  return new Task({ title, group: groupId }).save();
}

function updateForUser(userId, taskId, title, order, starred, conversationId) {
  return Task.findOne({ _id: taskId, user: userId }).then((task) => {
    if (task) {
      if (typeof title !== "undefined") {
        task.title = title;
      }
      if (typeof order !== "undefined") {
        task.order = order;
      }
      if (typeof starred !== "undefined") {
        task.starred = starred;
      }
      if (typeof conversationId !== "undefined") {
        task.conversationId = conversationId;
      }
      return task.save();
    } else {
      return Promise.reject("Cannot find task for user.");
    }
  });
}

function updateForGroup(groupId, id, title, order, starred, conversationId) {
  return Task.findOne({ _id: id, group: groupId }).then((task) => {
    if (task) {
      if (typeof title !== "undefined") {
        task.title = title;
      }
      if (typeof order !== "undefined") {
        task.order = order;
      }
      if (typeof starred !== "undefined") {
        task.starred = starred;
      }
      if (typeof conversationId !== "undefined") {
        task.conversationId = conversationId;
      }
      return task.save();
    } else {
      return Promise.reject("Cannot find task for group.");
    }
  });
}

function removeForUser(userId, taskId) {
  return Task.findOneAndRemove({ _id: taskId, user: userId });
}

function removeForGroup(groupId, taskId) {
  return Task.findOneAndRemove({ _id: taskId, group: groupId });
}

module.exports = {
  get,
  getForUser,
  getForGroup,
  getShareUrl,
  createForUser,
  createForGroup,
  updateForUser,
  updateForGroup,
  removeForUser,
  removeForGroup,
};
