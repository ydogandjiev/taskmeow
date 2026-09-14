import MockTasksService from "./mock.tasks.service";
import RestTasksService from "./rest.tasks.service";
import GraphTasksService from "./graph.tasks.service";

class TasksService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    if (params.get("useTest")) {
      this.tasksService = new MockTasksService();
    } else if (params.get("useGraph")) {
      this.tasksService = new GraphTasksService();
    } else {
      this.tasksService = new RestTasksService();
    }
  }

  get = (...args) => this.tasksService.get(...args);

  getShareUrl = (...args) => this.tasksService.getShareUrl(...args);

  create = (...args) => this.tasksService.create(...args);

  update = (...args) => this.tasksService.update(...args);

  destroy = (...args) => this.tasksService.destroy(...args);

  // Delegates to the underlying strategy's push-update subscription if it
  // has one (currently only RestTasksService). Returns an unsubscribe
  // function, or null if the strategy doesn't support push updates.
  subscribe = (...args) => {
    if (typeof this.tasksService.subscribe === "function") {
      return this.tasksService.subscribe(...args);
    }
    return null;
  };
}

export default new TasksService();
