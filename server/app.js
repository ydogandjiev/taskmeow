const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bearerToken = require("express-bearer-token");

const authService = require("./auth-service");
const bot = require("./routes/bot");
const rest = require("./routes/rest");
const graph = require("./routes/graph");

const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bearerToken());
app.use(express.static(path.join(__dirname, "build")));

authService.initialize(app);

// Server-rendered views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

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

app.get("/tab/silent-start", (req, res) => {
  res.render("start", { clientId: process.env.APPSETTING_AAD_ApplicationId });
});

app.get("/tab/silent-end", (req, res) => {
  res.render("end", { clientId: process.env.APPSETTING_AAD_ApplicationId });
});

// Static routes
app.get("/privacypolicy", (req, res) => {
  res.render("privacypolicy");
});

app.get("/termsofuse", (req, res) => {
  res.render("termsofuse");
});

// React routes
app.get("*", (req, res) => {
  res.sendFile("build/index.html", { root: __dirname });
});

module.exports = app;
