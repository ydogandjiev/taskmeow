import React from "react";
import ReactDOM from "react-dom";
import Config from "./Config";

jest.mock("@microsoft/teams-js", () => ({
  app: {
    initialize: jest.fn(),
  },
  pages: {
    config: {
      registerOnSaveHandler: jest.fn(),
      setConfig: jest.fn(),
      setValidityState: jest.fn(),
    },
  },
}));

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react";
initializeIcons(
  "https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/"
);

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

import userService from "../services/user.service";
jest.mock("../services/user.service");

it("renders config", () => {
  const user = {
    name: "mockName",
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(<Config />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Config");
});
