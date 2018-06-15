import React from "react";
import ReactDOM from "react-dom";
import Profile from "./Profile";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

it("renders profile", () => {
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
  ReactDOM.render(<Profile />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Profile");
});
