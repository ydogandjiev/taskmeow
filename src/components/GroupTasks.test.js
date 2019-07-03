import React from "react";
import ReactDOM from "react-dom";
import GroupTasks from "./GroupTasks";

import authService from "../services/auth.service";
import tasksService from "../services/tasks.service";
import userService from "../services/user.service";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

jest.mock("../services/auth.service");
jest.mock("../services/tasks.service");
jest.mock("../services/user.service");

it("renders tasks", () => {
  const user = {
    name: "mockName",
    given_name: "mockGivenName",
    family_name: "mockFamilyName"
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const tasks = [];
  tasksService.get.mockResolvedValue(tasks);

  const div = document.createElement("div");
  ReactDOM.render(<GroupTasks />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Group Tasks");
});
