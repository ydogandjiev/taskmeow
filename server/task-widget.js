import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import taskService from "./task-service.js";
import { getTeamsTaskWidgetHtml } from "./teams-task-widget-html.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, "build");

export const TASKS_WIDGET_URI = "ui://taskmeow/tasks-widget.html";
export const CALL_TOOL_INVOKE_NAME = "htmlwidget/calltool";
export const CALL_TOOL_RESPONSE_TYPE = "htmlwidget/calltoolresult";

function getBaseUrl() {
  if (process.env.APPSETTING_AAD_BaseUri) {
    return process.env.APPSETTING_AAD_BaseUri.replace(/\/$/, "");
  }

  if (process.env.APPSETTING_HOSTNAME) {
    return `https://${process.env.APPSETTING_HOSTNAME}`;
  }

  return process.env.REACT_APP_RUN_MODE === "int"
    ? "https://taskmeow.ngrok.io"
    : "https://taskmeow.com";
}

function getStageViewUrl() {
  const appId = process.env.APPSETTING_AAD_ApplicationId;
  if (!appId) {
    throw new Error(
      "APPSETTING_AAD_ApplicationId is required to create a Stageview link"
    );
  }

  const baseUrl = getBaseUrl();
  const context = encodeURIComponent(
    JSON.stringify({
      appId,
      entityId: "myTasks",
      contentUrl: `${baseUrl}/?inTeamsSSO=true`,
      websiteUrl: baseUrl,
      name: "My Tasks",
      openMode: "popoutWithChat",
    })
  );

  return `https://teams.microsoft.com/l/stage/${encodeURIComponent(
    appId
  )}/0?context=${context}`;
}

export async function readTaskWidgetHtml() {
  return fs.readFile(path.join(ASSETS_DIR, "embed.html"), "utf-8");
}

function mapTask(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    starred: task.starred,
    order: task.order,
    date: task.date,
  };
}

export function getTasksToolResult(user, tasks) {
  return {
    content: [
      {
        type: "text",
        text: `Found ${tasks.length} task${
          tasks.length !== 1 ? "s" : ""
        }. Interactive widget is ready to display and manage your tasks.`,
      },
    ],
    structuredContent: {
      user: {
        id: user._id.toString(),
        email: user.email,
      },
      tasks: tasks.map(mapTask),
      count: tasks.length,
    },
  };
}

export async function createTaskToolResult(user, { title, starred = false }) {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new Error("Task title is required and must be a non-empty string");
  }

  const task = await taskService.createForUser(user._id, title.trim());
  if (starred) {
    task.starred = true;
    await task.save();
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          task: mapTask(task),
          message: `Created task: "${task.title}"`,
        }),
      },
    ],
  };
}

export async function updateTaskToolResult(
  user,
  { taskId, title, starred, order }
) {
  if (typeof taskId !== "string" || taskId.length === 0) {
    throw new Error("Task ID is required");
  }
  if (title === undefined && starred === undefined && order === undefined) {
    throw new Error(
      "At least one field (title, starred, order) must be provided"
    );
  }

  const task = await taskService.updateForUser(
    user._id,
    taskId,
    title,
    order,
    starred,
    undefined
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          task: mapTask(task),
          message: `Updated task: "${task.title}"`,
        }),
      },
    ],
  };
}

export async function deleteTaskToolResult(user, { taskId }) {
  if (typeof taskId !== "string" || taskId.length === 0) {
    throw new Error("Task ID is required");
  }

  const task = await taskService.removeForUser(user._id, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          task: { id: task._id.toString(), title: task.title },
          message: `Deleted task: "${task.title}"`,
        }),
      },
    ],
  };
}

export function parseCallToolRequest(value) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? value : null;
}

export async function handleTaskWidgetToolCall(user, request) {
  const args = request?.arguments || {};

  switch (request?.name) {
    case "get_tasks":
    case "show_tasks_widget":
      return getTasksToolResult(user, await taskService.getForUser(user._id));
    case "create_task":
      return createTaskToolResult(user, args);
    case "update_task":
      return updateTaskToolResult(user, args);
    case "delete_task":
      return deleteTaskToolResult(user, args);
    default:
      throw new Error(`Unknown task widget tool: ${request?.name || "none"}`);
  }
}

export async function buildTeamsTaskWidgetMessage(user, tasks) {
  const html = getTeamsTaskWidgetHtml(getStageViewUrl());
  const payload = {
    type: "widget/mcp-ui",
    name: "Task Meow",
    description: "View and manage your Taskmeow tasks.",
    html,
    domain: "https://teams.cloud.microsoft.com",
    securityPolicy: {
      connectDomains: [
        "https://teams.microsoft.com",
        "https://teams.cloud.microsoft.com",
      ],
      resourceDomains: ["'self'", "data:"],
      frameDomains: [],
      baseUriDomains: [],
    },
    toolInput: {},
    toolOutput: getTasksToolResult(user, tasks),
    permissions: {},
  };

  return {
    type: "message",
    textFormat: "extendedmarkdown",
    text: [
      "Here are your tasks:",
      "",
      "```html-widget",
      JSON.stringify(payload),
      "```",
    ].join("\n"),
  };
}
