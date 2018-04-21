const express = require("express");
const router = express.Router();

const taskService = require("../task-service");
const userService = require("../user-service");

router.get("/v1/user", (req, res, next) => userService.getUsingV1(req, res));

router.get("/v2/user", (req, res, next) => userService.getUsingV2(req, res));

router.get("/tasks", (req, res, next) => taskService.get(req, res));

router.post("/tasks", (req, res, next) => taskService.create(req, res));

router.put("/tasks/:id", (req, res, next) => taskService.update(req, res));

router.delete("/tasks/:id", (req, res, next) => taskService.remove(req, res));

module.exports = router;
