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
import Config from "./Config";
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

function deferred() {
  let resolve;
  const promise = new Promise((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.resetAllMocks();
  jsdom.reconfigure({ url: "https://taskmeow.com/config/?inTeamsSSO=true" });
  microsoftTeams.app.initialize.mockResolvedValue();
  microsoftTeams.app.getContext.mockResolvedValue({
    app: { theme: "default" },
  });
  authService.tryInitializeMSAL.mockResolvedValue();
  authService.isCallback.mockResolvedValue(false);
  authService.getUser.mockResolvedValue(user);
  authService.login.mockResolvedValue(user);
  userService.getImage.mockResolvedValue("data:image/png;base64,photo");
  config.setConfig.mockResolvedValue();
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("signs in automatically and enables Save without waiting for the profile photo", async () => {
  const signIn = deferred();
  const photo = deferred();
  authService.getUser.mockReturnValue(signIn.promise);
  userService.getImage.mockReturnValue(photo.promise);
  render(<Config />);

  expect(
    screen.getByRole("heading", { name: "Signing you in..." })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Validate" })
  ).not.toBeInTheDocument();
  await waitFor(() => expect(authService.getUser).toHaveBeenCalledTimes(1));
  expect(config.setValidityState).toHaveBeenLastCalledWith(false);

  const earlySave = { notifySuccess: jest.fn(), notifyFailure: jest.fn() };
  await act(async () => {
    await config.registerOnSaveHandler.mock.calls[0][0](earlySave);
  });
  expect(earlySave.notifyFailure).toHaveBeenCalled();
  expect(config.setConfig).not.toHaveBeenCalled();

  await act(async () => signIn.resolve(user));
  expect(
    screen.getByRole("heading", { name: "Meowcome, Avery Lee" })
  ).toBeInTheDocument();
  expect(screen.getByText("AL")).toBeInTheDocument();
  expect(config.setValidityState).toHaveBeenLastCalledWith(true);
  expect(authService.login).not.toHaveBeenCalled();

  await act(async () => photo.resolve("data:image/png;base64,photo"));
  expect(screen.getByAltText("Your profile photo")).toHaveAttribute(
    "src",
    "data:image/png;base64,photo"
  );
});

it("starts interactive sign-in automatically when no cached user is available", async () => {
  authService.getUser.mockResolvedValue(null);
  render(<Config />);

  expect(
    await screen.findByRole("heading", { name: "Meowcome, Avery Lee" })
  ).toBeInTheDocument();
  expect(authService.login).toHaveBeenCalledTimes(1);
  expect(config.setValidityState).toHaveBeenLastCalledWith(true);
});

it("keeps Save disabled after failed sign-in and lets the user retry", async () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  authService.getUser.mockRejectedValue(new Error("Interaction required"));
  authService.login.mockRejectedValueOnce(new Error("Sign-in cancelled"));
  render(<Config />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn't sign you in."
  );
  expect(config.setValidityState).not.toHaveBeenCalledWith(true);
  expect(warning).toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("heading", { name: "Meowcome, Avery Lee" })
  ).toBeInTheDocument();
  expect(config.setValidityState).toHaveBeenLastCalledWith(true);
});

it.each(["inTeams=true", "inTeamsSSO=true", "inTeamsMSAL=true"])(
  "preserves %s configuration and only reports success after Teams saves it",
  async (queryString) => {
    jsdom.reconfigure({ url: `https://taskmeow.com/config/?${queryString}` });
    const saved = deferred();
    config.setConfig.mockReturnValue(saved.promise);
    render(<Config />);
    await screen.findByRole("heading", { name: "Meowcome, Avery Lee" });

    const event = { notifySuccess: jest.fn(), notifyFailure: jest.fn() };
    let saving;
    act(() => {
      saving = config.registerOnSaveHandler.mock.calls[0][0](event);
    });
    expect(config.setConfig).toHaveBeenCalledWith({
      entityId: "meowTasks",
      suggestedDisplayName: "Meow Tasks",
      contentUrl: `https://taskmeow.com/group/?${queryString}`,
      removeUrl: `https://taskmeow.com/remove/?${queryString}`,
      websiteUrl: "https://taskmeow.com/",
    });
    expect(event.notifySuccess).not.toHaveBeenCalled();

    await act(async () => {
      saved.resolve();
      await saving;
    });
    expect(event.notifySuccess).toHaveBeenCalledTimes(1);
    expect(event.notifyFailure).not.toHaveBeenCalled();
  }
);

it("reports configuration save failures to Teams", async () => {
  const error = new Error("Save failed");
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  config.setConfig.mockRejectedValue(error);
  render(<Config />);
  await screen.findByRole("heading", { name: "Meowcome, Avery Lee" });

  const event = { notifySuccess: jest.fn(), notifyFailure: jest.fn() };
  await act(async () => {
    await config.registerOnSaveHandler.mock.calls[0][0](event);
  });
  expect(event.notifySuccess).not.toHaveBeenCalled();
  expect(event.notifyFailure).toHaveBeenCalledWith(
    "We couldn't save your tab. Even cats miss a jump - please try saving again."
  );
  expect(log).toHaveBeenCalledWith(
    "Error saving the tab configuration:",
    error
  );
});

it("does not enable Save when sign-in finishes after the page is closed", async () => {
  const signIn = deferred();
  authService.getUser.mockReturnValue(signIn.promise);
  const { unmount } = render(<Config />);
  await waitFor(() => expect(authService.getUser).toHaveBeenCalled());

  unmount();
  await act(async () => signIn.resolve(user));
  expect(config.setValidityState).not.toHaveBeenCalledWith(true);
  expect(userService.getImage).not.toHaveBeenCalled();
});

it("follows the Teams theme and subsequent theme changes", async () => {
  microsoftTeams.app.getContext.mockResolvedValue({ app: { theme: "dark" } });
  render(<Config />);
  await screen.findByRole("heading", { name: "Meowcome, Avery Lee" });
  expect(screen.getByRole("main")).toHaveAttribute("data-theme", "dark");

  act(() => {
    microsoftTeams.app.registerOnThemeChangeHandler.mock.calls[0][0](
      "contrast"
    );
  });
  expect(screen.getByRole("main")).toHaveAttribute("data-theme", "contrast");
});
