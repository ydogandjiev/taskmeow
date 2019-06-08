import GraphTasksService from "./graph.tasks.service";
import authService from "./auth.service";
jest.mock("./auth.service");

afterEach(() => {
  jest.resetAllMocks();
});

it("can get tasks", done => {
  const mockResponse = new Response(
    JSON.stringify({
      data: {
        tasks: [
          { _id: "fakeId", title: "fakeTitle", order: 100, starred: true }
        ]
      }
    })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new GraphTasksService();
  tasksService.get().then(tasks => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/graphql", {
      method: "POST",
      body:
        '{"query":"query { tasks { _id title starred order conversationId } }"}',
      headers: { "Content-Type": "application/json" }
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
      data: {
        createTask: {
          _id: "fakeId",
          ...mockTask
        }
      }
    })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new GraphTasksService();
  tasksService.create(mockTask).then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/graphql", {
      method: "POST",
      body:
        '{"query":"mutation { createTask(title: \\"fakeTitle\\", order: 100, starred: false) { _id title starred order conversationId } }"}',
      headers: { "Content-Type": "application/json" }
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

  const mockResponse = new Response(
    JSON.stringify({ data: { updateTask: mockTask } })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new GraphTasksService();
  tasksService.update(mockTask).then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/graphql", {
      method: "POST",
      body:
        '{"query":"mutation { updateTask(id: \\"fakeId\\", title: \\"fakeTitle\\", order: 100, starred: false) { _id title starred order conversationId } }"}',
      headers: { "Content-Type": "application/json" }
    });

    expect(task._id).toEqual("fakeId");
    expect(task.title).toEqual("fakeTitle");
    expect(task.order).toEqual(100);
    expect(task.starred).toEqual(false);
    done();
  });
});

it("can destroy task", done => {
  const mockResponse = new Response(
    JSON.stringify({
      data: {
        deleteTask: {
          _id: "fakeId",
          title: "fakeTitle",
          order: 100,
          starred: true
        }
      }
    })
  );
  authService.fetch.mockResolvedValue(mockResponse);

  const tasksService = new GraphTasksService();
  tasksService.destroy("fakeId").then(task => {
    expect(authService.fetch).toHaveBeenCalledTimes(1);
    expect(authService.fetch).toHaveBeenCalledWith("/graphql", {
      method: "POST",
      body:
        '{"query":"mutation { deleteTask(id: \\"fakeId\\") { _id title starred order conversationId } }"}',
      headers: { "Content-Type": "application/json" }
    });

    expect(task._id).toEqual("fakeId");
    expect(task.title).toEqual("fakeTitle");
    expect(task.order).toEqual(100);
    expect(task.starred).toEqual(true);
    done();
  });
});
