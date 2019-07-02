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

  create = (...args) => this.tasksService.create(...args);

  update = (...args) => this.tasksService.update(...args);

  destroy = (...args) => this.tasksService.destroy(...args);
}

export default new TasksService();
