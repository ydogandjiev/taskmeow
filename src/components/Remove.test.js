import React from "react";
import ReactDOM from "react-dom";
import Remove from "./Remove";
import authService from "../services/auth.service";
import userService from "../services/user.service";

// Initialize Office Fabric icons for use throughout app
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

jest.mock("../services/auth.service");
jest.mock("../services/user.service");

it("renders remove", () => {
  authService.isCallback.mockResolvedValue(false);

  const user = {
    name: "mockName"
  };
  authService.getUser.mockResolvedValue(user);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(<Remove />, div);

  const title = div.getElementsByClassName("App-header-title")[0];
  expect(title.innerHTML).toEqual("Remove");
});
