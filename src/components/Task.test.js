import React from "react";
import { render } from "@testing-library/react";
import { wrapWithBackend } from "react-dnd-test-utils";
import Task from "./Task";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react";
initializeIcons(
  "https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/"
);

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

  const TestTask = wrapWithBackend(Task);
  const { container, getByText } = render(
    <TestTask
      task={mockTask}
      onCheckedChange={handleTaskCheckedChange}
      onStarredChange={handleTaskStarredChange}
    />
  );

  expect(getByText(mockTask.title)).toBeInTheDocument();
  expect(container.firstChild).toMatchSnapshot();

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
});

it("renders unstarred task snapshot", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: false,
  };

  const handleTaskCheckedChange = jest.fn();
  const handleTaskStarredChange = jest.fn();

  const TestTask = wrapWithBackend(Task);
  const { container, getByText } = render(
    <TestTask
      task={mockTask}
      onCheckedChange={handleTaskCheckedChange}
      onStarredChange={handleTaskStarredChange}
    />
  );

  expect(getByText(mockTask.title)).toBeInTheDocument();
  expect(container.firstChild).toMatchSnapshot();

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
});

it("matches starred task with conversation closed snapshot in Teams", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: true,
    conversationOpen: false,
  };

  const handleOpenConversation = jest.fn();

  const TestTask = wrapWithBackend(Task);
  const { container, getByText } = render(
    <TestTask
      task={mockTask}
      inTeams={true}
      supportsConversation={true}
      conversationOpen={false}
      openConversation={handleOpenConversation}
    />
  );

  expect(getByText(mockTask.title)).toBeInTheDocument();
  expect(container.firstChild).toMatchSnapshot();

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
});

it("matches unstarred task snapshot with conversation open in Teams", () => {
  const mockTask = {
    title: "mockTitle",
    order: 100,
    starred: true,
    conversationOpen: true,
  };

  const handleCloseConversation = jest.fn();

  const TestTask = wrapWithBackend(Task);
  const { container, getByText } = render(
    <TestTask
      task={mockTask}
      inTeams={true}
      supportsConversation={true}
      conversationOpen={true}
      closeConversation={handleCloseConversation}
    />
  );

  expect(getByText(mockTask.title)).toBeInTheDocument();
  expect(container.firstChild).toMatchSnapshot();

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
});
