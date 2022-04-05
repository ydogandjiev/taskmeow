import React from "react";
import ReactDOM from "react-dom";
import Profile from "./Profile";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

import userService from "../services/user.service";
jest.mock("../services/user.service");

it("renders profile", () => {
  const user = {
    name: "mockName"
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(<Profile />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Profile");
});
