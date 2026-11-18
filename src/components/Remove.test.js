import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as microsoftTeams from "@microsoft/teams-js";
import { initializeIcons } from "office-ui-fabric-react";
import Remove from "./Remove";
import authService from "../services/auth.service";
import userService from "../services/user.service";

jest.mock("@microsoft/teams-js", () => ({
  app: {
    initialize: jest.fn(),
    getContext: jest.fn(),
    registerOnThemeChangeHandler: jest.fn(),
  },
  pages: {
    config: {
      registerOnRemoveHandler: jest.fn(),
      registerOnSaveHandler: jest.fn(),
      setConfig: jest.fn(),
      setValidityState: jest.fn(),
    },
  },
}));
jest.mock("../services/auth.service");
jest.mock("../services/user.service");

initializeIcons(
  "https://res.cdn.office.net/files/fabric-cdn-prod_20240129.001/assets/icons/"
);

const user = { name: "Avery Lee" };
const { config } = microsoftTeams.pages;

beforeEach(() => {
  jest.resetAllMocks();
  jsdom.reconfigure({ url: "https://taskmeow.com/remove/?inTeamsSSO=true" });
  microsoftTeams.app.initialize.mockResolvedValue();
  microsoftTeams.app.getContext.mockResolvedValue({
    app: { theme: "default" },
  });
  authService.tryInitializeMSAL.mockResolvedValue();
  authService.isCallback.mockResolvedValue(false);
  authService.getUser.mockResolvedValue(user);
  authService.login.mockResolvedValue(user);
  userService.getImage.mockResolvedValue("data:image/png;base64,photo");
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("enables removal after sign-in without a Validate button or waiting for the photo", async () => {
  let finishSignIn;
  authService.getUser.mockReturnValue(
    new Promise((resolve) => {
      finishSignIn = resolve;
    })
  );
  userService.getImage.mockReturnValue(new Promise(() => {}));
  render(<Remove />);

  expect(
    screen.getByRole("heading", { name: "Signing you in..." })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Validate" })
  ).not.toBeInTheDocument();
  await waitFor(() => expect(authService.getUser).toHaveBeenCalledTimes(1));
  expect(config.setValidityState).toHaveBeenLastCalledWith(false);
  expect(config.registerOnSaveHandler).not.toHaveBeenCalled();

  const remove = config.registerOnRemoveHandler.mock.calls[0][0];
  const earlyEvent = { notifySuccess: jest.fn(), notifyFailure: jest.fn() };
  remove(earlyEvent);
  expect(earlyEvent.notifyFailure).toHaveBeenCalled();
  expect(earlyEvent.notifySuccess).not.toHaveBeenCalled();

  await act(async () => finishSignIn(user));
  expect(
    screen.getByRole("heading", { name: "Meow for now, Avery Lee" })
  ).toBeInTheDocument();
  expect(screen.getByText("AL")).toBeInTheDocument();
  expect(screen.getByText(/Your tasks are staying put/)).toBeInTheDocument();
  expect(config.setValidityState).toHaveBeenLastCalledWith(true);

  const event = { notifySuccess: jest.fn(), notifyFailure: jest.fn() };
  remove(event);
  expect(event.notifySuccess).toHaveBeenCalledTimes(1);
  expect(event.notifyFailure).not.toHaveBeenCalled();
  expect(config.setConfig).not.toHaveBeenCalled();
});

it("keeps removal disabled after failed sign-in and lets the user retry", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  authService.getUser.mockRejectedValue(new Error("Interaction required"));
  authService.login.mockRejectedValueOnce(new Error("Sign-in cancelled"));
  render(<Remove />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn't sign you in."
  );
  expect(config.setValidityState).not.toHaveBeenCalledWith(true);
  expect(warning).toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("heading", { name: "Meow for now, Avery Lee" })
  ).toBeInTheDocument();
  expect(config.setValidityState).toHaveBeenLastCalledWith(true);
});
