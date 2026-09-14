import { Router } from "express";
import botService from "../bot-service.js";
import taskService from "../task-service.js";
import userService from "../user-service.js";
import groupService from "../group-service.js";
import widgetAuth from "../widget-auth-middleware.js";
import taskEvents from "../task-events.js";

const router = Router();

// Apply widget auth to all routes (will fall through if no widget token)
router.use(widgetAuth);

// How often to send an SSE keep-alive comment, to stop idle proxies/load
// balancers from closing the connection.
const SSE_HEARTBEAT_MS = 20000;

// Starts an SSE response and returns a function that stops its heartbeat.
function openTaskEventStream(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write("retry: 2000\n\n");

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, SSE_HEARTBEAT_MS);

  return () => clearInterval(heartbeat);
}

function sendTaskEvent(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

router.get("/user/image", (req, res) => {
  userService.getImage(req, res);
});

// Pushes task changes for the current user as they happen, so clients don't
// need to poll for updates made by other clients.
router.get("/tasks/stream", (req, res) => {
  const stopHeartbeat = openTaskEventStream(res);
  const unsubscribe = taskEvents.subscribeUser(req.user._id, (event) =>
    sendTaskEvent(res, event)
  );

  req.on("close", () => {
    stopHeartbeat();
    unsubscribe();
  });
});

router.get("/tasks/:taskId/share", (req, res) => {
  taskService
    .get(req.params.taskId)
    .then((task) => {
      if (task.user._id.toString() === req.user.id) {
        taskService
          .getShareUrl(task)
          .then((url) => {
            res.json(url);
          })
          .catch((err) => {
            res.status(500).send(err.message);
          });
      } else {
        res.status(403).send("Permission denied");
      }
    })
    .catch(() => {
      res.status(404).send("Not found");
    });
});

router.get("/tasks/:taskId", (req, res) => {
  taskService
    .get(req.params.taskId)
    .then((task) => {
      if (task.user._id.toString() === req.user.id) {
        res.json(task);
      } else if (task.shareTag === req.query.shareTag) {
        res.json(task);
      } else {
        res.status(403).send("Permission denied");
      }
    })
    .catch(() => {
      res.status(404).send("Not found");
    });
});

router.get("/tasks", (req, res) => {
  taskService
    .getForUser(req.user._id)
    .then((tasks) => {
      res.json(tasks);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post("/tasks", (req, res) => {
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

router.put("/tasks/:taskId", (req, res) => {
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

router.delete("/tasks/:taskId", (req, res) => {
  taskService
    .removeForUser(req.user._id, req.params.taskId)
    .then((task) => {
      res.status(202).json(task);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.get("/groups/:threadId/tasks", (req, res) => {
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
            res.status(401).send("User is not a member of this group!");
          }
        });
      } else {
        res
          .status(404)
          .send(`Couldn't find group with id: ${req.params.threadId}`);
      }
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

// Pushes task changes for this group as they happen, so clients don't need
// to poll for updates made by other members' clients.
router.get("/groups/:threadId/tasks/stream", (req, res) => {
  const threadId = req.params.threadId;
  groupService
    .get(threadId)
    .then((group) => {
      if (!group) {
        res.status(404).send(`Couldn't find group with id: ${threadId}`);
        return;
      }

      const oid = req.user.accounts[0].uid;
      return botService
        .getMembers(group.serviceUrl, threadId)
        .then((members) => {
          if (!members || !members.some((member) => member.objectId === oid)) {
            res.status(401).send("User is not a member of this group!");
            return;
          }

          const stopHeartbeat = openTaskEventStream(res);
          const unsubscribe = taskEvents.subscribeGroup(group._id, (event) =>
            sendTaskEvent(res, event)
          );

          req.on("close", () => {
            stopHeartbeat();
            unsubscribe();
          });
        });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

router.post("/groups/:threadId/tasks", (req, res) => {
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

router.put("/groups/:threadId/tasks/:taskId", (req, res) => {
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

router.delete("/groups/:threadId/tasks/:taskId", (req, res) => {
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

export default router;
