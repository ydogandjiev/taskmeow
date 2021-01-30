import React from "react";
import TestRenderer from "react-test-renderer";
import { wrapInTestContext } from "react-dnd-test-utils";
import Task from "./Task";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

beforeEach(() => {
  jest.resetModules();
});

it("renders starred task snapshot", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: true,
  };

  const handleTaskCheckedChange = jest.fn();
  const handleTaskStarredChange = jest.fn();

  const TestTask = wrapInTestContext(Task);
  const task = TestRenderer.create(
    <TestTask
      task={mockTask}
      onCheckedChange={handleTaskCheckedChange}
      onStarredChange={handleTaskStarredChange}
    />
  );

  /*
  const taskTitle = (
    <span className="Task-title">
      <div>{mockTask.title}</div>
    </span>
  );

  expect(task).toContainReact(taskTitle);

  expect(task).toContainMatchingElement("li.Task-listitem");
  expect(task).toContainMatchingElement(".Task-checkbox > input");
  expect(task).toContainMatchingElement("button.Task-star-link");
  expect(task).toContainMatchingElement("i.Task-starred-icon");
  expect(task).not.toContainMatchingElement("i.Task-unstarred-icon");
  expect(task).not.toContainMatchingElement("button.Task-conversation-link");

  task.find(".Task-checkbox > input").simulate("change");
  expect(handleTaskCheckedChange).toHaveBeenCalledWith(mockTask, true);

  task.find("i.Task-starred-icon").simulate("click");
  expect(handleTaskStarredChange).toHaveBeenCalledWith(mockTask, false);
  */

  expect(task).toMatchSnapshot();
});

it("renders unstarred task snapshot", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: false,
  };

  const handleTaskCheckedChange = jest.fn();
  const handleTaskStarredChange = jest.fn();

  const TestTask = wrapInTestContext(Task);
  const task = TestRenderer.create(
    <TestTask
      task={mockTask}
      onCheckedChange={handleTaskCheckedChange}
      onStarredChange={handleTaskStarredChange}
    />
  );

  /*
  const taskTitle = (
    <span className="Task-title">
      <div>{mockTask.title}</div>
    </span>
  );
  expect(task).toContainReact(taskTitle);

  expect(task).toContainMatchingElement("li.Task-listitem");
  expect(task).toContainMatchingElement(".Task-checkbox > input");
  expect(task).toContainMatchingElement("button.Task-star-link");
  expect(task).toContainMatchingElement("i.Task-unstarred-icon");
  expect(task).not.toContainMatchingElement("i.Task-starred-icon");
  expect(task).not.toContainMatchingElement("button.Task-conversation-link");

  task.find(".Task-checkbox > input").simulate("change");
  expect(handleTaskCheckedChange).toHaveBeenCalledWith(mockTask, true);

  task.find("i.Task-unstarred-icon").simulate("click");
  expect(handleTaskStarredChange).toHaveBeenCalledWith(mockTask, true);
  */

  expect(task).toMatchSnapshot();
});

it("matches starred task with conversation closed snapshot in Teams", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: true,
    conversationOpen: false,
  };

  const handleOpenConversation = jest.fn();

  const TestTask = wrapInTestContext(Task);
  const task = TestRenderer.create(
    <TestTask
      task={mockTask}
      inTeams={true}
      supportsConversation={true}
      conversationOpen={false}
      openConversation={handleOpenConversation}
    />
  );

  /*
  const taskTitle = (
    <span className="Task-title">
      <div>{mockTask.title}</div>
    </span>
  );
  expect(task).toContainReact(taskTitle);

  expect(task).toContainMatchingElement("li.Task-listitem");
  expect(task).toContainMatchingElement(".Task-checkbox > input");
  expect(task).toContainMatchingElement("button.Task-star-link");
  expect(task).toContainMatchingElement("i.Task-starred-icon");
  expect(task).toContainMatchingElement("button.Task-conversation-link");
  expect(task).toContainMatchingElement("i.Task-conversation-closed-icon");
  expect(task).not.toContainMatchingElement("i.Task-conversation-open-icon");

  task.find("i.Task-conversation-closed-icon").simulate("click");
  expect(handleOpenConversation).toHaveBeenCalledWith(mockTask);
  */

  expect(task).toMatchSnapshot();
});

it("matches unstarred task snapshot with conversation open in Teams", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: true,
    conversationOpen: true,
  };

  const handleCloseConversation = jest.fn();

  const TestTask = wrapInTestContext(Task);
  const task = TestRenderer.create(
    <TestTask
      task={mockTask}
      inTeams={true}
      supportsConversation={true}
      conversationOpen={true}
      closeConversation={handleCloseConversation}
    />
  );

  /*
  const taskTitle = (
    <span className="Task-title">
      <div>{mockTask.title}</div>
    </span>
  );
  expect(task).toContainReact(taskTitle);

  expect(task).toContainMatchingElement("li.Task-listitem");
  expect(task).toContainMatchingElement(".Task-checkbox > input");
  expect(task).toContainMatchingElement("button.Task-star-link");
  expect(task).toContainMatchingElement("i.Task-starred-icon");
  expect(task).toContainMatchingElement("button.Task-conversation-link");
  expect(task).toContainMatchingElement("i.Task-conversation-open-icon");
  expect(task).not.toContainMatchingElement("i.Task-conversation-closed-icon");

  task.find("i.Task-conversation-open-icon").simulate("click");
  expect(handleCloseConversation).toHaveBeenCalledWith(mockTask);
  */

  expect(task).toMatchSnapshot();
});
