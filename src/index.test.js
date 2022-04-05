import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import authService from "./services/auth.service";
jest.mock("./services/auth.service");

beforeEach(() => {
  jest.resetModules();
});

it("renders logged out view", done => {
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

  setTimeout(() => {
    expect(div.getElementsByClassName("App-login").length).toEqual(1);
    done();
  });
});