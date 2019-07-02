const Task = require("./task-model");
const ReadPreference = require("mongodb").ReadPreference;

require("./mongo").connect();

function getForUser(userId) {
  return Task.find({ user: userId })
    .read(ReadPreference.NEAREST)
    .exec();
}

function getForGroup(channelId) {
  return Task.find({ channelId })
    .read(ReadPreference.NEAREST)
    .exec();
}

function createForUser(userId, title) {
  return new Task({ title, user: userId }).save();
}

function createForGroup(channelId, title) {
  return new Task({ title, channelId }).save();
}

function updateForUser(userId, taskId, title, order, starred, conversationId) {
  return Task.findOne({ _id: taskId, user: userId }).then(task => {
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
  });
}

function updateForGroup(channelId, id, title, order, starred, conversationId) {
  return Task.findOne({ _id: id, channelId }).then(task => {
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
  });
}

function removeForUser(userId, taskId) {
  return Task.findOneAndRemove({ _id: taskId, user: userId });
}

function removeForGroup(channelId, taskId) {
  return Task.findOneAndRemove({ _id: taskId, channelId });
}

module.exports = {
  getForUser,
  getForGroup,
  createForUser,
  createForGroup,
  updateForUser,
  updateForGroup,
  removeForUser,
  removeForGroup
};
