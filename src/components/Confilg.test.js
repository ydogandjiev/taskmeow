import React from "react";
import ReactDOM from "react-dom";
import Config from "./Config";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

import userService from "../services/user.service";
jest.mock("../services/user.service");

it("renders config", () => {
  const user = {
    name: "mockName",
    given_name: "mockGivenName",
    family_name: "mockFamilyName"
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(<Config />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Config");
});
