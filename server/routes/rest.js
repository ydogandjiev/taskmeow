const express = require("express");
const router = express.Router();

const taskService = require("../task-service");
const userService = require("../user-service");

router.get("/user/image", (req, res, next) => {
  userService.getImage(req, res);
});

router.get("/tasks", (req, res, next) => {
  taskService
    .get(req.user._id)
    .then(tasks => {
      res.json(tasks);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.post("/tasks", (req, res, next) => {
  taskService
    .create(req.user._id, req.body.title, req.body.order, req.body.starred)
    .then(task => {
      res.json(task);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.put("/tasks/:id", (req, res, next) => {
  taskService
    .update(req.params.id, req.body.title, req.body.order, req.body.starred)
    .then(task => {
      res.json(task);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.delete("/tasks/:id", (req, res, next) => {
  taskService
    .remove(req.params.id)
    .then(task => {
      res.status(202).json(task);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

module.exports = router;
