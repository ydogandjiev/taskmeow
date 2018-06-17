import MockTasksService from "./mock.tasks.service";

afterEach(() => {
  jest.resetAllMocks();
});

it("can get tasks", done => {
  const tasksService = new MockTasksService();
  tasksService.get().then(tasks => {
    expect(tasks.length).toEqual(0);
    done();
  });
});

it("can create task", done => {
  const mockTask = {
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const tasksService = new MockTasksService();
  tasksService.create(mockTask).then(task => {
    expect(task._id).toBeDefined();
    expect(task.title).toEqual(mockTask.title);
    expect(task.order).toEqual(mockTask.order);
    expect(task.starred).toEqual(mockTask.starred);

    tasksService.get().then(tasks => {
      expect(tasks.length).toEqual(1);
      expect(tasks[0]).toEqual(task);
      done();
    });
  });
});

it("can update task", done => {
  const mockTask = {
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const tasksService = new MockTasksService();
  tasksService.create(mockTask).then(task => {
    const updatedMockTask = {
      ...task,
      title: "updatedFakeTitle",
      order: 200,
      starred: true
    };

    tasksService.update(updatedMockTask).then(() => {
      tasksService.get().then(tasks => {
        expect(tasks.length).toEqual(1);
        expect(tasks[0]).toEqual(updatedMockTask);
        done();
      });
    });
  });
});

it("can destroy task", done => {
  const mockTask = {
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const tasksService = new MockTasksService();
  tasksService.create(mockTask).then(task => {
    tasksService.destroy(task._id).then(() => {
      tasksService.get().then(tasks => {
        expect(tasks.length).toEqual(0);
        done();
      });
    });
  });
});
