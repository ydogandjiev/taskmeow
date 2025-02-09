import Task from "./task-model.js";
import { ReadPreference } from "mongodb";
import { v4 as uuidv4 } from "uuid";
import * as utils from "./utils.js";

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
  if (!task.shareTag) {
    const shareTag = uuidv4();
    task.shareTag = shareTag;
    return task
      .save()
      .then(() => utils.buildShareUrl(task._id.toString(), task.shareTag));
  }
  return Promise.resolve(
    utils.buildShareUrl(task._id.toString(), task.shareTag)
  );
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

export default {
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
