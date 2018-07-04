const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bearerToken = require("express-bearer-token");

const authService = require("./auth-service");
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

// Graph endpoint
app.use("/graphql", authService.authenticateUser, graph);

// Rest endpoints
app.use("/api", authService.ensureAuthenticated(), rest);

// Auth routes
app.get("/tab/silent-start", (req, res) => {
  res.render("start");
});

app.get("/tab/silent-end", (req, res) => {
  res.render("end");
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

// Error handling
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handler
app.use(function(err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
