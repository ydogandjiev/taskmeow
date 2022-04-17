const express = require("express");
const router = express.Router();

const botService = require("../bot-service");
const taskService = require("../task-service");
const userService = require("../user-service");
const groupService = require("../group-service");

router.get("/user/image", (req, res, next) => {
  userService.getImage(req, res);
});

router.get("/tasks", (req, res, next) => {
  taskService
    .getForUser(req.user._id)
    .then((tasks) => {
      res.json(tasks);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post("/tasks", (req, res, next) => {
  taskService
    .createForUser(
      req.user._id,
      req.body.title,
      req.body.order,
      req.body.starred,
      req.body.conversationId
    )
    .then((task) => {
      res.json(task);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.put("/tasks/:taskId", (req, res, next) => {
  taskService
    .updateForUser(
      req.user._id,
      req.params.taskId,
      req.body.title,
      req.body.order,
      req.body.starred,
      req.body.conversationId
    )
    .then((task) => {
      res.json(task);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.delete("/tasks/:taskId", (req, res, next) => {
  taskService
    .removeForUser(req.user._id, req.params.taskId)
    .then((task) => {
      res.status(202).json(task);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get("/groups/:threadId/tasks", (req, res, next) => {
  const threadId = req.params.threadId;
  groupService
    .get(threadId)
    .then((group) => {
      if (group) {
        const oid = req.user.accounts[0].uid;
        botService.getMembers(group.serviceUrl, threadId).then((members) => {
          if (members && members.some((member) => member.objectId === oid)) {
            taskService
              .getForGroup(group._id)
              .then((tasks) => {
                res.json(tasks);
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            req.status(401).send("User is not a member of this group!");
          }
        });
      } else {
        req
          .status(404)
          .send(`Couldn't find group with id: ${req.params.threadId}`);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post("/groups/:threadId/tasks", (req, res, next) => {
  const threadId = req.params.threadId;
  groupService
    .get(threadId)
    .then((group) => {
      if (group) {
        const oid = req.user.accounts[0].uid;
        botService.getMembers(group.serviceUrl, threadId).then((members) => {
          if (members && members.some((member) => member.objectId === oid)) {
            taskService
              .createForGroup(
                group._id,
                req.body.title,
                req.body.order,
                req.body.starred,
                req.body.conversationId
              )
              .then((task) => {
                res.json(task);
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            req.status(401).send("User is not a member of this group!");
          }
        });
      } else {
        req
          .status(404)
          .send(`Couldn't find group with id: ${req.params.threadId}`);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.put("/groups/:threadId/tasks/:taskId", (req, res, next) => {
  const threadId = req.params.threadId;
  groupService
    .get(threadId)
    .then((group) => {
      if (group) {
        const oid = req.user.accounts[0].uid;
        botService.getMembers(group.serviceUrl, threadId).then((members) => {
          if (members && members.some((member) => member.objectId === oid)) {
            taskService
              .updateForGroup(
                group._id,
                req.params.taskId,
                req.body.title,
                req.body.order,
                req.body.starred,
                req.body.conversationId
              )
              .then((task) => {
                res.json(task);
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            req.status(401).send("User is not a member of this group!");
          }
        });
      } else {
        req
          .status(404)
          .send(`Couldn't find group with id: ${req.params.threadId}`);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.delete("/groups/:threadId/tasks/:taskId", (req, res, next) => {
  const threadId = req.params.threadId;
  groupService
    .get(threadId)
    .then((group) => {
      if (group) {
        const oid = req.user.accounts[0].uid;
        botService.getMembers(group.serviceUrl, threadId).then((members) => {
          if (members && members.some((member) => member.objectId === oid)) {
            taskService
              .removeForGroup(group._id, req.params.taskId)
              .then((task) => {
                res.status(202).json(task);
              })
              .catch((err) => {
                res.status(500).send(err);
              });
          } else {
            req.status(401).send("User is not a member of this group!");
          }
        });
      } else {
        req
          .status(404)
          .send(`Couldn't find group with id: ${req.params.threadId}`);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

module.exports = router;
