afterEach(() => {
  jest.resetModules();
});

it("uses rest service by default", () => {
  const RestTasksService = require("./rest.tasks.service").default;
  const tasksService = require("./tasks.service").default;
  jest.mock("./rest.tasks.service");

  expect(RestTasksService).toHaveBeenCalledTimes(1);

  const restTasksServiceInstance = RestTasksService.mock.instances[0];

  tasksService.get();
  expect(restTasksServiceInstance.get).toHaveBeenCalledTimes(1);

  const mockCreateTask = { title: "mockTitle", starred: true, order: 100 };
  tasksService.create(mockCreateTask);
  expect(restTasksServiceInstance.create).toHaveBeenCalledTimes(1);
  expect(restTasksServiceInstance.create).toHaveBeenCalledWith(mockCreateTask);

  const mockUpdateTask = { _id: "mockId", ...mockCreateTask };
  tasksService.update(mockUpdateTask);
  expect(restTasksServiceInstance.update).toHaveBeenCalledTimes(1);
  expect(restTasksServiceInstance.update).toHaveBeenCalledWith(mockUpdateTask);

  const mockTaskId = "mockId";
  tasksService.destroy(mockTaskId);
  expect(restTasksServiceInstance.destroy).toHaveBeenCalledTimes(1);
  expect(restTasksServiceInstance.destroy).toHaveBeenCalledWith(mockTaskId);
});

it("uses graph service when useGraph QSP is set to true", () => {
  jsdom.reconfigure({ url: "https://taskmeow.com?useGraph=true" });

  const GraphTasksService = require("./graph.tasks.service").default;
  const tasksService = require("./tasks.service").default;
  jest.mock("./graph.tasks.service");

  expect(GraphTasksService).toHaveBeenCalledTimes(1);

  const graphTasksServiceInstance = GraphTasksService.mock.instances[0];

  tasksService.get();
  expect(graphTasksServiceInstance.get).toHaveBeenCalledTimes(1);

  const mockCreateTask = { title: "mockTitle", starred: true, order: 100 };
  tasksService.create(mockCreateTask);
  expect(graphTasksServiceInstance.create).toHaveBeenCalledTimes(1);
  expect(graphTasksServiceInstance.create).toHaveBeenCalledWith(mockCreateTask);

  const mockUpdateTask = { _id: "mockId", ...mockCreateTask };
  tasksService.update(mockUpdateTask);
  expect(graphTasksServiceInstance.update).toHaveBeenCalledTimes(1);
  expect(graphTasksServiceInstance.update).toHaveBeenCalledWith(mockUpdateTask);

  const mockTaskId = "mockId";
  tasksService.destroy(mockTaskId);
  expect(graphTasksServiceInstance.destroy).toHaveBeenCalledTimes(1);
  expect(graphTasksServiceInstance.destroy).toHaveBeenCalledWith(mockTaskId);
});
