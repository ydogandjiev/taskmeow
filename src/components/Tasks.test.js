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

it("renders tasks", () => {
  const user = {
    name: "mockName",
    given_name: "mockGivenName",
    family_name: "mockFamilyName"
  };
  authService.getUser.mockResolvedValue(user);

  const result = {
    status: 200,
    blob: jest.fn(() => "mockBlob")
  };
  authService.fetch.mockResolvedValue(result);

  const tasks = [];
  tasksService.get.mockResolvedValue(tasks);

  const mockFileReaderInstance = {
    result: "mockResult",
    readAsDataURL: blob => {
      expect(blob).toEqual("mockBlob");
      expect(mockFileReaderInstance.onload).toBeDefined();
      mockFileReaderInstance.onload();
    }
  };
  window.FileReader = jest.fn(() => mockFileReaderInstance);

  const div = document.createElement("div");
  ReactDOM.render(<Tasks />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Tasks");
});
