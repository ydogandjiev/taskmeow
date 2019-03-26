import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import authService from "./services/auth.service";
jest.mock("./services/auth.service");

import tasksService from "./services/tasks.service";
jest.mock("./services/tasks.service");

import userService from "./services/user.service";
jest.mock("./services/user.service");

beforeEach(() => {
  jest.resetModules();
});

it("renders logged out view", done => {
  authService.getToken.mockResolvedValue(null);

  const div = document.createElement("div");
  ReactDOM.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    div
  );

  setTimeout(() => {
    expect(div.getElementsByClassName("App-login").length).toEqual(1);
    done();
  });
});

it("renders logged in view", done => {
  const user = {
    name: "mockName",
    given_name: "mockGivenName",
    oid: "mockOid"
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

  setTimeout(() => {
    expect(div.getElementsByClassName("App-content").length).toEqual(1);
    done();
  });
});

