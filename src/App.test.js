import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./components/Config", () => {
  return function MockConfig() {
    return <h1>Tab setup</h1>;
  };
});

jest.mock("./components/Remove", () => {
  return function MockRemove() {
    return <h1>Tab removal</h1>;
  };
});

import authService from "./services/auth.service";
jest.mock("./services/auth.service");

import tasksService from "./services/tasks.service";
jest.mock("./services/tasks.service");

import userService from "./services/user.service";
jest.mock("./services/user.service");

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  jsdom.reconfigure({ url: "https://taskmeow.com/" });
});

it.each([
  ["config", "Tab setup"],
  ["remove", "Tab removal"],
])("shows %s without waiting for the main app sign-in flow", (path, title) => {
  jsdom.reconfigure({
    url: `https://taskmeow.com/${path}/?inTeamsSSO=true`,
  });
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  expect(authService.tryInitializeMSAL).not.toHaveBeenCalled();
  expect(authService.getUser).not.toHaveBeenCalled();
});

it("renders logged out view", async () => {
  authService.isCallback.mockResolvedValue(false);

  authService.getUser.mockResolvedValue(null);

  authService.getToken.mockResolvedValue(null);

  const div = document.createElement("div");
  ReactDOM.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    div
  );

  await new Promise(process.nextTick);

  expect(div.getElementsByClassName("App-login").length).toEqual(1);
});

it("renders logged in view", async () => {
  authService.isCallback.mockResolvedValue(false);

  const user = {
    name: "mockName",
    oid: "mockOid",
  };
  authService.getUser.mockResolvedValue(user);

  const token = "mockToken";
  authService.getToken.mockResolvedValue(token);

  const tasks = [];
  tasksService.get.mockResolvedValue(tasks);

  userService.getImage.mockResolvedValue("mockImage");

  const div = document.createElement("div");
  ReactDOM.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    div
  );

  await new Promise(process.nextTick);

  expect(div.getElementsByClassName("App-content").length).toEqual(1);
});
