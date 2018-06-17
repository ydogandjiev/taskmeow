import MockTasksService from "./mock.tasks.service";

afterEach(() => {
  jest.resetAllMocks();
});

it("can be constructed with pre-existing data", done => {
  const mockTasks = [
    {
      _id: "task-0",
      title: "fakeTitle",
      order: 100,
      starred: false
    }
  ];
  localStorage.setItem("mock.tasks", JSON.stringify(mockTasks));
  localStorage.setItem("mock.taskIndex", 1);

  const tasksService = new MockTasksService();
  tasksService.get().then(tasks => {
    expect(tasks).toEqual(mockTasks);
    done();
  });
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

it("returns error on attempt to update non-existent task", done => {
  const mockTask = {
    _id: "fakeId",
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const tasksService = new MockTasksService();
  tasksService
    .update(mockTask)
    .then(() => {
      done.fail();
    })
    .catch(error => {
      expect(error).toEqual("Task doesn't exist");
      done();
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

it("returns error on attempt to destroy non-existent task", done => {
  const tasksService = new MockTasksService();
  tasksService
    .destroy("fakeId")
    .then(() => {
      done.fail();
    })
    .catch(error => {
      expect(error).toEqual("Task doesn't exist");
      done();
    });
});
