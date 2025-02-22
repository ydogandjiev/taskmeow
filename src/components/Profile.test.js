import React from "react";
import ReactDOM from "react-dom";
import Profile from "./Profile";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "office-ui-fabric-react";
initializeIcons(
  "https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/"
);

import authService from "../services/auth.service";
jest.mock("../services/auth.service");

import userService from "../services/user.service";
jest.mock("../services/user.service");

it("renders profile", () => {
  const user = {
    name: "mockName",
    upn: "mockName@mockCompany.com",
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(<Profile />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Profile");
});
