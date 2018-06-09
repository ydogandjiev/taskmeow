import authService from "./auth.service";

class RestTasksService {
  get() {
    return authService
      .fetch("/api/tasks", { method: "GET" })
      .then(result => result.json());
  }

  create(task) {
    return authService
      .fetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      })
      .then(result => result.json());
  }

  update(task) {
    return authService
      .fetch(`/api/tasks/${task._id}`, {
        method: "PUT",
        body: JSON.stringify(task),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      })
      .then(result => result.json());
  }

  destroy(id) {
    return authService
      .fetch(`/api/tasks/${id}`, {
        method: "DELETE"
      })
      .then(result => result.json());
  }
}

export default RestTasksService;
