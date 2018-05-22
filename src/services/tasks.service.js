import RestTasksService from "./rest.tasks.service";
import MockTasksService from "./mock.tasks.service";

class TasksService {
  constructor() {
    const url = new URL(window.location);
    const params = new URLSearchParams(url.search);
    if (params.get("useTest")) {
      this.tasksService = new MockTasksService();
    } else {
      this.tasksService = new RestTasksService();
    }
  }

  get = () => this.tasksService.get();

  create = task => this.tasksService.create(task);

  update = task => this.tasksService.update(task);

  destroy = id => this.tasksService.destroy(id);
}

export default new TasksService();
