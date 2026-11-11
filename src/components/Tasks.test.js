import React from "react";
import ReactDOM from "react-dom";
import Tasks from "./Tasks";
import { render, waitFor } from "@testing-library/react";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react";
initializeIcons(
  "https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/"
);

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

import tasksService from "../services/tasks.service";
jest.mock("../services/tasks.service");

import userService from "../services/user.service";
jest.mock("../services/user.service");

it("renders tasks", () => {
  jsdom.reconfigure({ url: "https://taskmeow.com?useTest=true" });

  const user = {
    name: "mockName",
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const tasks = [];
  tasksService.get.mockResolvedValue(tasks);

  const div = document.createElement("div");
  ReactDOM.render(<Tasks />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("My Tasks");
});

it("opens the group list from a copied link outside Teams", async () => {
  authService.getUser.mockResolvedValue({ name: "mockName" });
  userService.getImage.mockResolvedValue("mockImage");
  tasksService.get.mockClear();
  tasksService.get.mockResolvedValue([]);
  const { unmount } = render(<Tasks isGroup={true} threadId="team-id" />);
  await waitFor(() => {
    expect(tasksService.get).toHaveBeenCalledWith("team-id");
  });
  unmount();
});
