import authService from "./auth.service";

class RestTasksService {
  get(threadId, options) {
    let route;
    if (options) {
      route = `/api/tasks/${options.taskId}?shareTag=${options.shareTag}`;
    } else {
      route = threadId ? `/api/groups/${threadId}/tasks` : "/api/tasks";
    }

    return authService
      .fetch(route, { method: "GET" })
      .then((result) => result.json());
  }

  getShareUrl(taskId) {
    const route = `/api/tasks/${taskId}/share`;
    return authService
      .fetch(route, { method: "GET" })
      .then((result) => result.json());
  }

  create(task, threadId) {
    const route = threadId ? `/api/groups/${threadId}/tasks` : "/api/tasks";

    return authService
      .fetch(route, {
        method: "POST",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((result) => result.json());
  }

  update(task, threadId) {
    const route = threadId
      ? `/api/groups/${threadId}/tasks/${task._id}`
      : `/api/tasks/${task._id}`;

    return authService
      .fetch(route, {
        method: "PUT",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then((result) => result.json());
  }

  destroy(taskId, threadId) {
    const route = threadId
      ? `/api/groups/${threadId}/tasks/${taskId}`
      : `/api/tasks/${taskId}`;

    return authService
      .fetch(route, {
        method: "DELETE",
      })
      .then((result) => result.json());
  }
}

export default RestTasksService;
