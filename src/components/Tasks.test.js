import React from "react";
import ReactDOM from "react-dom";
import Tasks from "./Tasks";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

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
  expect(title.innerHTML).toEqual("Tasks");
});
