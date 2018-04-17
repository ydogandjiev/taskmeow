const express = require("express");
const router = express.Router();

const heroService = require("../hero-service");
const taskService = require("../task-service");

router.get("/heroes", (req, res, next) => heroService.get(req, res));

router.post("/heroes", (req, res, next) => heroService.create(req, res));

router.put("/heroes/:id", (req, res, next) => heroService.update(req, res));

router.delete("/heroes/:id", (req, res, next) => heroService.remove(req, res));

router.get("/tasks", (req, res, next) => taskService.get(req, res));

router.post("/tasks", (req, res, next) => taskService.create(req, res));

router.put("/tasks/:id", (req, res, next) => taskService.update(req, res));

router.delete("/tasks/:id", (req, res, next) => taskService.remove(req, res));

module.exports = router;
