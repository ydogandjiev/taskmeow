const Task = require("./task-model");
const ReadPreference = require("mongodb").ReadPreference;
const uuid = require("uuid");

function get(taskId) {
  return Task.findOne({ _id: taskId });
}

function getForUser(userId) {
  return Task.find({ user: userId }).read(ReadPreference.NEAREST).exec();
}

function getShareUrl(task) {
  const isInt = process.env.REACT_APP_RUN_MODE === "int";
  const baseUrl = isInt ? "https://taskmeow.ngrok.io" : "https://taskmeow.com";
  if (!task.shareTag) {
    const shareTag = uuid.v4();
    task.shareTag = shareTag;
    return task
      .save()
      .then(
        () =>
          `${baseUrl}/group/?task=${task?._id.toString()}&inTeamsSSO=true&shareTag=${shareTag}`
      );
  }
  return Promise.resolve(
    `${baseUrl}/group/?task=${task._id.toString()}&inTeamsSSO=true&shareTag=${
      task.shareTag
    }`
  );
}

function getForGroup(groupId) {
  return Task.find({ group: groupId }).read(ReadPreference.NEAREST).exec();
}

function createForUser(userId, title) {
  return new Task({ title, user: userId }).save();
}

function createForGroup(groupId, title) {
  return new Task({ title, group: groupId }).save();
}

function updateForUser(userId, taskId, title, order, starred, conversationId) {
  return Task.findOne({ _id: taskId, user: userId }).then((task) => {
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

function updateForGroup(groupId, id, title, order, starred, conversationId) {
  return Task.findOne({ _id: id, group: groupId }).then((task) => {
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
