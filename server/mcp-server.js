import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { Router } from "express";
import passport from "passport";
import taskService from "./task-service.js";
import userService from "./user-service.js";

const router = Router();

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
  if (authType === "bearer" && !authenticatedEmail) {
    throw new Error(
      "Authenticated email is required for bearer token authentication"
    );
  }

  const server = new McpServer({
    name: "taskmeow-mcp-server",
    version: "1.0.0",
  });

  server.tool(
    "get_tasks",
    "Get all tasks for the authenticated user. Returns a list of tasks with their details.",
    {},
    async () => {
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

  server.tool(
    "create_task",
    "Create a new task for the authenticated user.",
    {
      title: z.string().describe("Title or description of the task"),
      starred: z
        .boolean()
        .optional()
        .describe("Whether to star/favorite this task"),
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

  server.tool(
    "update_task",
    "Update an existing task (title, starred status, or order) for the authenticated user.",
    {
      taskId: z.string().describe("ID of the task to update"),
      title: z.string().optional().describe("New title for the task"),
      starred: z.boolean().optional().describe("New starred status"),
      order: z.number().optional().describe("New order position"),
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

  server.tool(
    "delete_task",
    "Delete a task permanently for the authenticated user.",
    {
      taskId: z.string().describe("ID of the task to delete"),
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

  server.tool(
    "get_task_widget",
    "Get an embeddable HTML widget showing all tasks for the authenticated user.",
    {},
    async () => {
      const user = await getUserByEmail(authenticatedEmail);
      const widgetToken = Buffer.from(
        JSON.stringify({
          userId: user._id.toString(),
          email: user.email,
          exp: Date.now() + 3600000,
        })
      ).toString("base64");
      const baseUrl =
        process.env.APPSETTING_AAD_BaseUri || "https://taskmeow.com";
      const widgetUrl = `${baseUrl}/embed/tasks?token=${widgetToken}`;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              url: widgetUrl,
              message: "Interactive task widget ready to display",
            }),
          },
        ],
      };
    }
  );

  return server;
}

async function handleMcpRequest(req, res) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createMcpServer({
    authenticatedEmail: req.mcpAuthenticatedEmail,
    authType: req.mcpAuthType,
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("finish", () => transport.close());
  } catch (error) {
    console.error("MCP error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
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
