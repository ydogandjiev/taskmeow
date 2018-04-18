import { adalApiFetch } from "./adalConfig";

const tasksApi = {
  get() {
    return adalApiFetch(fetch, "/api/tasks", { method: "GET" }).then(result =>
      result.json()
    );
  },
  create(task) {
    return adalApiFetch(fetch, "/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  update(task) {
    return adalApiFetch(fetch, `/api/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify(task),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    }).then(result => result.json());
  },
  destroy(id) {
    return adalApiFetch(fetch, `/api/tasks/${id}`, {
      method: "DELETE"
    });
  }
};

export default tasksApi;
