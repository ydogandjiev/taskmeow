const express = require("express");
const router = express.Router();

const taskService = require("../task-service");

router.get("/tasks", (req, res, next) => taskService.get(req, res));

router.post("/tasks", (req, res, next) => taskService.create(req, res));

router.put("/tasks/:id", (req, res, next) => taskService.update(req, res));

router.delete("/tasks/:id", (req, res, next) => taskService.remove(req, res));

module.exports = router;
