import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import taskService from "./task-service.js";

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

function getStageViewParams(taskContext = {}) {
  const appId = process.env.APPSETTING_AAD_ApplicationId;
  if (!appId) {
    throw new Error(
      "APPSETTING_AAD_ApplicationId is required to create a Stageview link"
    );
  }

  const baseUrl = getBaseUrl();
  const contentPath = taskContext.group ? "/group" : "/";
  const stageContext = {
    appId,
    entityId: taskContext.group ? "groupTasks" : "myTasks",
    contentUrl: `${baseUrl}${contentPath}?inTeamsSSO=true`,
    websiteUrl: `${baseUrl}${contentPath}`,
    name: taskContext.group ? "Our Tasks" : "My Tasks",
    openMode: "popoutWithChat",
  };

  return stageContext;
}

function getStageViewUrl(taskContext = {}) {
  const stageContext = getStageViewParams(taskContext);
  const context = encodeURIComponent(JSON.stringify(stageContext));

  return `https://teams.microsoft.com/l/stage/${encodeURIComponent(
    stageContext.appId
  )}/0?context=${context}`;
}

export async function readTaskWidgetHtml() {
  return fs.readFile(path.join(ASSETS_DIR, "embed.html"), "utf-8");
}

async function readTeamsTaskWidgetHtml(taskContext) {
  const baseUrl = getBaseUrl();
  const widgetTitle = taskContext.isChannel ? "Our Tasks" : "My Tasks";
  const html = await fs.readFile(
    path.join(ASSETS_DIR, "teams-widget", "embed.html"),
    "utf-8"
  );
  const stageViewUrl = getStageViewUrl(taskContext)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");

  const renderedHtml = html
    .replaceAll('src="/teams-widget/', `src="${baseUrl}/teams-widget/`)
    .replace("          My Tasks", `          ${widgetTitle}`)
    .replace("<body>", `<body data-stage-view-url="${stageViewUrl}">`)
    .replace(
      'class="stage-view-footer" id="stage-view-footer"',
      'class="stage-view-footer" id="stage-view-footer" style="display: block"'
    );

  return renderedHtml;
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

function getTasks(taskContext) {
  return taskContext.group
    ? taskService.getForGroup(taskContext.group._id)
    : taskService.getForUser(taskContext.user._id);
}

function createTask(taskContext, title) {
  return taskContext.group
    ? taskService.createForGroup(taskContext.group._id, title)
    : taskService.createForUser(taskContext.user._id, title);
}

function updateTask(taskContext, taskId, title, order, starred) {
  return taskContext.group
    ? taskService.updateForGroup(
        taskContext.group._id,
        taskId,
        title,
        order,
        starred,
        undefined
      )
    : taskService.updateForUser(
        taskContext.user._id,
        taskId,
        title,
        order,
        starred,
        undefined
      );
}

function deleteTask(taskContext, taskId) {
  return taskContext.group
    ? taskService.removeForGroup(taskContext.group._id, taskId)
    : taskService.removeForUser(taskContext.user._id, taskId);
}

export async function createTaskToolResult(
  taskContext,
  { title, starred = false }
) {
  if (typeof title !== "string" || title.trim().length === 0) {
    throw new Error("Task title is required and must be a non-empty string");
  }

  const task = await createTask(taskContext, title.trim());
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
  taskContext,
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

  const task = await updateTask(taskContext, taskId, title, order, starred);

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

export async function deleteTaskToolResult(taskContext, { taskId }) {
  if (typeof taskId !== "string" || taskId.length === 0) {
    throw new Error("Task ID is required");
  }

  const task = await deleteTask(taskContext, taskId);
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

export async function handleTaskWidgetToolCall(taskContext, request) {
  const args = request?.arguments || {};

  switch (request?.name) {
    case "get_tasks":
    case "show_tasks_widget":
      return getTasksToolResult(taskContext.user, await getTasks(taskContext));
    case "create_task":
      return createTaskToolResult(taskContext, args);
    case "update_task":
      return updateTaskToolResult(taskContext, args);
    case "delete_task":
      return deleteTaskToolResult(taskContext, args);
    default:
      throw new Error(`Unknown task widget tool: ${request?.name || "none"}`);
  }
}

export async function buildTeamsTaskWidgetMessage(taskContext, tasks) {
  const baseUrl = getBaseUrl();
  const widgetTitle = taskContext.isChannel ? "Our Tasks" : "My Tasks";
  const html = await readTeamsTaskWidgetHtml(taskContext);
  const toolOutput = getTasksToolResult(taskContext.user, tasks);
  toolOutput.structuredContent.stageViewUrl = getStageViewUrl(taskContext);
  const payload = {
    type: "widget/mcp-ui",
    name: widgetTitle,
    description: `View and manage ${widgetTitle.toLowerCase()}.`,
    html,
    domain: "https://teams.cloud.microsoft.com",
    securityPolicy: {
      connectDomains: [
        "https://teams.microsoft.com",
        "https://teams.cloud.microsoft.com",
      ],
      resourceDomains: ["'self'", "data:", baseUrl],
      frameDomains: [],
      baseUriDomains: [],
    },
    toolInput: {},
    toolOutput,
    permissions: {},
  };

  const message = {
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

  return message;
}
