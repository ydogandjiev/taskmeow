import authService from "./auth.service";
jest.mock("./auth.service");

import RestTasksService from "./rest.tasks.service";

afterEach(() => {
  jest.resetAllMocks();
});

it("can get tasks", done => {
  const mockResponse = new Response(
    JSON.stringify([
      { _id: "fakeId", title: "fakeTitle", order: 100, starred: true }
    ])
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new RestTasksService();
  tasksService.get().then(tasks => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/api/tasks", {
      method: "GET"
    });
    expect(tasks.length).toEqual(1);
    expect(tasks[0]._id).toEqual("fakeId");
    expect(tasks[0].title).toEqual("fakeTitle");
    expect(tasks[0].order).toEqual(100);
    expect(tasks[0].starred).toEqual(true);
    done();
  });
});

it("can create task", done => {
  const mockTask = {
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const mockResponse = new Response(
    JSON.stringify({
      _id: "fakeId",
      ...mockTask
    })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new RestTasksService();
  tasksService.create(mockTask).then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/api/tasks", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mockTask)
    });
    expect(task._id).toEqual("fakeId");
    expect(task.title).toEqual("fakeTitle");
    expect(task.order).toEqual(100);
    expect(task.starred).toEqual(false);
    done();
  });
});

it("can update task", done => {
  const mockTask = {
    _id: "fakeId",
    title: "fakeTitle",
    order: 100,
    starred: false
  };

  const mockResponse = new Response(JSON.stringify(mockTask));
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new RestTasksService();
  tasksService.update(mockTask).then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/api/tasks/fakeId", {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mockTask)
    });
    expect(task._id).toEqual("fakeId");
    expect(task.title).toEqual("fakeTitle");
    expect(task.order).toEqual(100);
    expect(task.starred).toEqual(false);
    done();
  });
});

it("can delete task", done => {
  const mockResponse = new Response(
    JSON.stringify({
      _id: "fakeId",
      title: "fakeTitle",
      order: 100,
      starred: true
    })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new RestTasksService();
  tasksService.destroy("fakeId").then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/api/tasks/fakeId", {
      method: "DELETE"
    });
    expect(task._id).toEqual("fakeId");
    expect(task.title).toEqual("fakeTitle");
    expect(task.order).toEqual(100);
    expect(task.starred).toEqual(true);
    done();
  });
});
