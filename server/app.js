import express from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
const { static: serveStatic } = express;
import { fileURLToPath } from "url";
import cors from "cors";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bearerToken from "express-bearer-token";
import session from "express-session";

import authService from "./auth-service.js";
import bot from "./routes/bot.js";
import rest from "./routes/rest.js";
import graph from "./routes/graph.js";
import slack from "./routes/slack.js";
import mcpServer from "./mcp-server.js";

// Connect to MongoDB
import mongo from "./mongo.js";
mongo.connect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createMcpExpressApp({
  host: "0.0.0.0",
  allowedHosts: [
    "localhost",
    "127.0.0.1",
    process.env.APPSETTING_HOSTNAME || "taskmeow.azurewebsites.net",
  ],
});
// const app = express();

app.use(cors());

// MCP server endpoints

app.use(logger("dev"));
app.use(slack);
app.use("/mcp", mcpServer);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bearerToken());
app.use(serveStatic(path.join(__dirname, "build")));
app.use(session({ secret: process.env.APPSETTING_SessionSecret }));

authService.initialize(app);

// Server-rendered views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Copilot plugin manifest and OpenAPI spec
app.get("/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "ai-plugin.json"));
});

app.get("/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "copilot-openapi.json"));
});

// Bot endpoints
app.use(bot);

// GraphQL endpoint
app.use("/graphql", authService.authenticateUser, graph);

// Rest endpoints
app.use("/api", authService.ensureAuthenticated(), rest);

// Auth routes
app.get("/bot/start", (req, res) => {
  res.render("bot-start");
});

app.get("/bot/end", (req, res) => {
  res.render("bot-end");
});

app.get("/tab/silent-start", (req, res) => {
  res.render("start", { clientId: process.env.APPSETTING_AAD_ApplicationId });
});

app.get("/tab/silent-end", (req, res) => {
  res.render("end", { clientId: process.env.APPSETTING_AAD_ApplicationId });
});

app.get("/tab/v2/silent-start", (req, res) => {
  res.render("start-v2", {
    clientId: process.env.APPSETTING_AAD_ApplicationId,
  });
});

app.get("/tab/v2/silent-end", (req, res) => {
  res.render("end-v2", { clientId: process.env.APPSETTING_AAD_ApplicationId });
});

// Static routes
app.get("/privacypolicy", (req, res) => {
  res.render("privacypolicy");
});

app.get("/termsofuse", (req, res) => {
  res.render("termsofuse");
});

// Embed widget route
app.get("/embed/tasks", (req, res) => {
  res.sendFile("build/embed.html", { root: path.resolve() });
});

// React routes
app.use((req, res) => {
  res.sendFile("build/index.html", { root: path.resolve() });
});

export default app;
