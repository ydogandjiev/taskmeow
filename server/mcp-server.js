import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { Router } from "express";
import passport from "passport";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import taskService from "./task-service.js";
import userService from "./user-service.js";

const router = Router();

// Widget HTML loader
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, "build");

async function readWidgetHtml() {
  const htmlPath = path.join(ASSETS_DIR, "embed.html");
  return await fs.readFile(htmlPath, "utf-8");
}

// Resource URIs
const TASKS_WIDGET_URI = "ui://taskmeow/tasks-widget.html";

function authenticateMCP(req, res, next) {
  const authHeader = req.headers["authorization"];
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i);
  const bearerValue = bearerMatch?.[1];
  const apiKeyHeader = req.headers["x-api-key"];

  if (apiKeyHeader && apiKeyHeader === process.env.CHATGPT_APP_API_KEY) {
    req.mcpAuthType = "apiKey";
    return next();
  }

  if (bearerValue && bearerValue === process.env.CHATGPT_APP_API_KEY) {
    req.mcpAuthType = "apiKey";
    return next();
  }

  if (!bearerValue) {
    return res.status(401).json({
      error:
        "Unauthorized. Provide X-API-Key or Authorization: Bearer <Microsoft Entra access token>.",
    });
  }

  return passport.authenticate(
    "oauth-bearer",
    { session: false },
    (err, user, info) => {
      if (err) {
        return res.status(401).json({ error: "Invalid bearer token." });
      }

      if (!user) {
        return res.status(401).json({ error: "Unauthorized bearer token." });
      }

      req.user = user;
      req.authInfo = info;
      req.mcpAuthType = "bearer";
      req.mcpAuthenticatedEmail =
        user.email || info?.preferred_username || info?.upn || null;

      return next();
    }
  )(req, res, next);
}

async function getUserByEmail(userEmail) {
  const user = await userService.getByEmail(userEmail);
  if (!user) throw new Error(`User not found: ${userEmail}`);
  return user;
}

function createMcpServer({ authenticatedEmail, authType }) {
  console.log(
    "Creating MCP server with authType:",
    authType,
    "authenticatedEmail:",
    authenticatedEmail
  );
  if (authType === "bearer" && !authenticatedEmail) {
    throw new Error(
      "Authenticated email is required for bearer token authentication"
    );
  }

  const server = new McpServer({
    name: "taskmeow-mcp-server",
    version: "1.0.0",
  });

  // ══════════════════════════════════════════════════════════════════════
  //  APP RESOURCES — Widget HTML (mimeType: text/html;profile=mcp-app)
  // ══════════════════════════════════════════════════════════════════════
  registerAppResource(
    server,
    "Tasks Widget",
    TASKS_WIDGET_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Interactive task management widget",
      _meta: {
        ui: {
          csp: {
            baseUriDomains: [process.env.APPSETTING_AAD_BaseUri],
            connectDomains: [process.env.APPSETTING_AAD_BaseUri],
            frameDomains: [process.env.APPSETTING_AAD_BaseUri],
            resourceDomains: [process.env.APPSETTING_AAD_BaseUri],
          },
        },
      },
    },
    async () => {
      console.log("Loading widget HTML resource for:", authenticatedEmail);
      const html = await readWidgetHtml();
      return {
        contents: [
          {
            uri: TASKS_WIDGET_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  baseUriDomains: [process.env.APPSETTING_AAD_BaseUri],
                  connectDomains: [process.env.APPSETTING_AAD_BaseUri],
                  frameDomains: [process.env.APPSETTING_AAD_BaseUri],
                  resourceDomains: [process.env.APPSETTING_AAD_BaseUri],
                },
              },
            },
          },
        ],
      };
    }
  );

  // ══════════════════════════════════════════════════════════════════════
  //  APP TOOLS — Widget tools (tool + UI resource linked via _meta)
  // ══════════════════════════════════════════════════════════════════════
  registerAppTool(
    server,
    "get_tasks",
    {
      title: "Get Tasks",
      description:
        "Get all tasks for the authenticated user. Returns a list of tasks with their details.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: { ui: { resourceUri: TASKS_WIDGET_URI } },
    },
    async () => {
      console.log(`Getting tasks for user: ${authenticatedEmail}`);
      const user = await getUserByEmail(authenticatedEmail);
      const tasks = await taskService.getForUser(user._id);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              tasks: tasks.map((t) => ({
                id: t._id.toString(),
                title: t.title,
                starred: t.starred,
                order: t.order,
                date: t.date,
              })),
              count: tasks.length,
              message: `Found ${tasks.length} task${
                tasks.length !== 1 ? "s" : ""
              }`,
            }),
          },
        ],
      };
    }
  );

  registerAppTool(
    server,
    "create_task",
    {
      title: "Create Task",
      description: "Create a new task for the authenticated user.",
      inputSchema: {
        title: z.string().describe("Title or description of the task"),
        starred: z
          .boolean()
          .optional()
          .describe("Whether to star/favorite this task"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: { ui: { resourceUri: TASKS_WIDGET_URI } },
    },
    async ({ title, starred = false }) => {
      if (!title || title.trim().length === 0) {
        throw new Error(
          "Task title is required and must be a non-empty string"
        );
      }
      const user = await getUserByEmail(authenticatedEmail);
      const task = await taskService.createForUser(user._id, title.trim());
      if (starred) {
        task.starred = starred;
        await task.save();
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              task: {
                id: task._id.toString(),
                title: task.title,
                starred: task.starred,
                order: task.order,
                date: task.date,
              },
              message: `Created task: "${task.title}"`,
            }),
          },
        ],
      };
    }
  );

  registerAppTool(
    server,
    "update_task",
    {
      title: "Update Task",
      description:
        "Update an existing task (title, starred status, or order) for the authenticated user.",
      inputSchema: {
        taskId: z.string().describe("ID of the task to update"),
        title: z.string().optional().describe("New title for the task"),
        starred: z.boolean().optional().describe("New starred status"),
        order: z.number().optional().describe("New order position"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: { ui: { resourceUri: TASKS_WIDGET_URI } },
    },
    async ({ taskId, title, starred, order }) => {
      if (title === undefined && starred === undefined && order === undefined) {
        throw new Error(
          "At least one field (title, starred, order) must be provided"
        );
      }
      const user = await getUserByEmail(authenticatedEmail);
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
              task: {
                id: task._id.toString(),
                title: task.title,
                starred: task.starred,
                order: task.order,
                date: task.date,
              },
              message: `Updated task: "${task.title}"`,
            }),
          },
        ],
      };
    }
  );

  registerAppTool(
    server,
    "delete_task",
    {
      title: "Delete Task",
      description: "Delete a task permanently for the authenticated user.",
      inputSchema: {
        taskId: z.string().describe("ID of the task to delete"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
      _meta: { ui: { resourceUri: TASKS_WIDGET_URI } },
    },
    async ({ taskId }) => {
      const user = await getUserByEmail(authenticatedEmail);
      const task = await taskService.removeForUser(user._id, taskId);
      if (!task) throw new Error(`Task not found: ${taskId}`);
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
  );

  // ── Show Tasks Widget ─────────────────────────────────────────────────
  registerAppTool(
    server,
    "show_tasks_widget",
    {
      title: "Show Tasks Widget",
      description:
        "Display an interactive widget showing all tasks for the authenticated user. The widget allows users to view, add, edit, and manage their tasks.",
      inputSchema: {},
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
      _meta: { ui: { resourceUri: TASKS_WIDGET_URI } },
    },
    async () => {
      const user = await getUserByEmail(authenticatedEmail);
      const tasks = await taskService.getForUser(user._id);

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
          tasks: tasks.map((t) => ({
            id: t._id.toString(),
            title: t.title,
            starred: t.starred,
            order: t.order,
            date: t.date,
          })),
          count: tasks.length,
        },
      };
    }
  );

  console.log(
    "MCP server created with tools:",
    Object.keys(server._registeredTools),
    "and resources:",
    Object.keys(server._registeredResources)
  );
  return server;
}

async function handleMcpRequest(req, res) {
  const server = createMcpServer({
    authenticatedEmail: req.mcpAuthenticatedEmail || "yudogan@microsoft.com",
    authType: req.mcpAuthType,
  });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    server.close();
    transport.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    console.log("MCP request handled successfully");
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

// Streamable HTTP transport — handles both GET (SSE) and POST (JSON-RPC)
router.post("/", authenticateMCP, handleMcpRequest);
router.get("/", authenticateMCP, handleMcpRequest);
router.delete("/", authenticateMCP, (req, res) => res.status(200).send());

// Health check (no auth required)
router.get("/health", (req, res) => {
  res.json({ status: "ok", server: "taskmeow-mcp-server", version: "1.0.0" });
});

export default router;
