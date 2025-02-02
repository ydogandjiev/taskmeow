const Task = require("./task-model");
const ReadPreference = require("mongodb").ReadPreference;
const uuid = require("uuid");
const utils = require("./utils");
const { TeamsAi } = require("teams-ai");

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
    const shareTag = uuid.v4();
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

async function handleViewTasks(context) {
  const userId = context.activity.from.aadObjectId;
  const tasks = await getForUser(userId);

  if (tasks.length === 0) {
    await context.sendActivity("You have no tasks.");
  } else {
    const taskList = tasks.map((task) => `- ${task.title}`).join("\n");
    await context.sendActivity(`Here are your tasks:\n${taskList}`);
  }
}

async function handleCreateTask(context) {
  const userId = context.activity.from.aadObjectId;
  const taskTitle = context.activity.text.replace("create task", "").trim();

  if (!taskTitle) {
    await context.sendActivity("Please provide a title for the task.");
    return;
  }

  await createForUser(userId, taskTitle);
  await context.sendActivity(`Task "${taskTitle}" created successfully.`);
}

async function handleCompleteTask(context) {
  const userId = context.activity.from.aadObjectId;
  const taskTitle = context.activity.text.replace("complete task", "").trim();

  if (!taskTitle) {
    await context.sendActivity("Please provide the title of the task to complete.");
    return;
  }

  const tasks = await getForUser(userId);
  const task = tasks.find((t) => t.title.toLowerCase() === taskTitle.toLowerCase());

  if (!task) {
    await context.sendActivity(`Task "${taskTitle}" not found.`);
    return;
  }

  await removeForUser(userId, task._id);
  await context.sendActivity(`Task "${taskTitle}" completed successfully.`);
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
  handleViewTasks,
  handleCreateTask,
  handleCompleteTask,
};
