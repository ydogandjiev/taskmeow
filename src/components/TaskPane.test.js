import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TaskPane from "./TaskPane";
import tasksService from "../services/tasks.service";
import * as microsoftTeams from "@microsoft/teams-js";
import { initializeIcons } from "office-ui-fabric-react";

initializeIcons();

jest.mock("../services/tasks.service");
jest.mock("@microsoft/teams-js", () => ({
  sharing: { shareWebContent: jest.fn() },
  pages: { backStack: { registerBackButtonHandler: jest.fn() } },
}));
jest.mock("./UserTile", () => () => null);

const task = { _id: "task-id", title: "Plan the release", user: "owner-id" };
const shareUrl = "https://taskmeow.com/?task=task-id&shareTag=share-token";

beforeEach(() => {
  jsdom.reconfigure({ url: "https://taskmeow.com/" });
  jest.clearAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
  tasksService.getShareUrl.mockResolvedValue(shareUrl);
});

afterEach(() => {
  jsdom.reconfigure({ url: "https://taskmeow.com/" });
});

function renderPane(props = {}) {
  return render(<TaskPane taskId={task._id} taskList={[task]} {...props} />);
}

it("copies a personal share link and confirms success", async () => {
  renderPane();
  fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
  await waitFor(() => {
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareUrl);
  });
  expect(tasksService.getShareUrl).toHaveBeenCalledWith(task._id);
  expect(await screen.findByRole("status")).toHaveTextContent("Link copied.");
});

it.each(["taskmeow.ngrok.io", "taskmeow.com"])(
  "copies a group link with its channel context on %s",
  async (hostname) => {
    jsdom.reconfigure({ url: `https://${hostname}/` });
    renderPane({ isGroupRoute: true, threadId: "19:team@thread" });
    fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `https://${hostname}/group?task=task-id&threadId=19%3Ateam%40thread`
      );
    });
    expect(tasksService.getShareUrl).not.toHaveBeenCalled();
  }
);

it.each(["taskmeow.ngrok.io", "taskmeow.com"])(
  "reuses the share tag when copying an existing shared task on %s",
  async (hostname) => {
    jsdom.reconfigure({ url: `https://${hostname}/` });
    tasksService.get.mockResolvedValue(task);
    renderPane({ taskList: [], shareTag: "share-token" });
    fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `https://${hostname}/?task=task-id&shareTag=share-token`
      );
    });
    expect(tasksService.getShareUrl).not.toHaveBeenCalled();
  }
);

it("reports clipboard failures instead of claiming success", async () => {
  navigator.clipboard.writeText.mockRejectedValue(new Error("Copy denied"));
  renderPane();
  fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
  expect(await screen.findByText("Copy denied")).toBeInTheDocument();
  expect(screen.queryByText("Link copied.")).not.toBeInTheDocument();
});

it("reports share-link failures without writing to the clipboard", async () => {
  tasksService.getShareUrl.mockRejectedValue(new Error("Permission denied"));
  renderPane();
  fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
  expect(await screen.findByText("Permission denied")).toBeInTheDocument();
  expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
});

it("reports unsupported clipboard access without creating a share token", async () => {
  Object.defineProperty(navigator, "clipboard", { value: undefined });
  renderPane();
  fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
  expect(
    await screen.findByText("Copying links is not supported in this browser.")
  ).toBeInTheDocument();
  expect(tasksService.getShareUrl).not.toHaveBeenCalled();
});

it("uses the same group link for Share in Teams", async () => {
  microsoftTeams.sharing.shareWebContent.mockResolvedValue(undefined);
  renderPane({ isGroupRoute: true, threadId: "team-id", inTeams: true });
  fireEvent.click(
    await screen.findByRole("button", { name: "Share in Teams" })
  );
  await waitFor(() => {
    expect(microsoftTeams.sharing.shareWebContent).toHaveBeenCalledWith({
      content: [
        {
          type: "URL",
          url: "https://taskmeow.com/group?task=task-id&threadId=team-id",
          preview: true,
        },
      ],
    });
  });
});

it.each(["taskmeow.ngrok.io", "taskmeow.com"])(
  "copies links using the running app's domain on %s",
  async (hostname) => {
    jsdom.reconfigure({ url: `https://${hostname}/` });
    const otherHostname =
      hostname === "taskmeow.com" ? "taskmeow.ngrok.io" : "taskmeow.com";
    tasksService.getShareUrl.mockResolvedValue(
      `https://${otherHostname}/?task=task-id&shareTag=share-token`
    );
    renderPane();
    fireEvent.click(await screen.findByRole("button", { name: "Copy link" }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `https://${hostname}/?task=task-id&shareTag=share-token`
      );
    });
  }
);
