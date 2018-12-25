class MockTasksService {
  constructor() {
    const tasks = localStorage.getItem("mock.tasks");
    this.tasks = tasks ? JSON.parse(tasks) : [];

    const taskIndex = localStorage.getItem("mock.taskIndex");
    this.taskIndex = taskIndex ? Number(taskIndex) : 0;
  }

  get = () => {
    const tasks = JSON.parse(JSON.stringify(this.tasks));
    return Promise.resolve(tasks);
  };

  create = task => {
    const newTask = {
      _id: `task-${this.taskIndex++}`,
      ...task
    };
    this.tasks.push(newTask);
    localStorage.setItem("mock.tasks", JSON.stringify(this.tasks));
    localStorage.setItem("mock.taskIndex", this.taskIndex);
    return Promise.resolve(newTask);
  };

  update = task => {
    let taskIndex = this.tasks.findIndex(t => t._id === task._id);
    if (taskIndex !== -1) {
      this.tasks.splice(taskIndex, 1, task);
      localStorage.setItem("mock.tasks", JSON.stringify(this.tasks));
      return Promise.resolve(task);
    } else {
      return Promise.reject("Task doesn't exist");
    }
  };

  destroy = id => {
    let taskIndex = this.tasks.findIndex(t => t._id === id);
    if (taskIndex !== -1) {
      const oldTask = this.tasks.splice(taskIndex, 1)[0];
      localStorage.setItem("mock.tasks", JSON.stringify(this.tasks));
      return Promise.resolve(oldTask);
    } else {
      return Promise.reject("Task doesn't exist");
    }
  };
}

export default MockTasksService;
