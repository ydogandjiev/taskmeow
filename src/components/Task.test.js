import React from "react";
import ReactDOM from "react-dom";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import Task from "./Task";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

beforeEach(() => {
  jest.resetModules();
});

it("renders starred task", () => {
  const task = {
    title: "mockTitle",
    order: 100,
    starred: true
  };

  const div = document.createElement("div");
  ReactDOM.render(
    <DragDropContext>
      <Droppable droppableId="mockDroppableId" type="mockType">
        {(provided, snapshot) => (
          <div ref={provided.innerRef}>
            <Task task={task} />
          </div>
        )}
      </Droppable>
    </DragDropContext>,
    div
  );

  const title = div.getElementsByClassName("Task-title")[0];
  expect(title.innerHTML).toEqual(task.title);

  const starredIcon = div.getElementsByClassName("Task-starred-icon")[0];
  const unstarredIcon = div.getElementsByClassName("Task-unstarred-icon")[0];
  expect(starredIcon).toBeDefined();
  expect(unstarredIcon).toBeUndefined();

  expect(true);
});

it("renders unstarred task", () => {
  const task = {
    title: "mockTitle",
    order: 100,
    starred: false
  };

  const div = document.createElement("div");
  ReactDOM.render(
    <DragDropContext>
      <Droppable droppableId="mockDroppableId" type="mockType">
        {(provided, snapshot) => (
          <div ref={provided.innerRef}>
            <Task task={task} />
          </div>
        )}
      </Droppable>
    </DragDropContext>,
    div
  );

  const title = div.getElementsByClassName("Task-title")[0];
  expect(title.innerHTML).toEqual(task.title);

  const starredIcon = div.getElementsByClassName("Task-starred-icon")[0];
  const unstarredIcon = div.getElementsByClassName("Task-unstarred-icon")[0];
  expect(starredIcon).toBeUndefined();
  expect(unstarredIcon).toBeDefined();
});
