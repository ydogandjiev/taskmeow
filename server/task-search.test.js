/* eslint-disable jest/expect-expect */
import test, { before, after } from "node:test";
import assert from "node:assert/strict";

import { handleTaskSearchQuery } from "./task-search.js";
import { baseUrl } from "./utils.js";

const originalAppId = process.env.APPSETTING_AAD_ApplicationId;
before(() => {
  process.env.APPSETTING_AAD_ApplicationId =
    "36b1586d-b1da-45d2-9b32-899c3757b6f8";
});
after(() => {
  if (originalAppId === undefined) {
    delete process.env.APPSETTING_AAD_ApplicationId;
  } else {
    process.env.APPSETTING_AAD_ApplicationId = originalAppId;
  }
});

const tasks = [
  { _id: "507f1f77bcf86cd799439011", title: "Plan the release", starred: true },
  { _id: "507f1f77bcf86cd799439012", title: "Write documentation" },
];

function activityFor(conversationType = "personal", value = {}) {
  return {
    from: { aadObjectId: "aad-id" },
    conversation: { id: "conversation-id", conversationType },
    ...(conversationType === "channel"
      ? { channelData: { team: { id: "team-id" } } }
      : {}),
    value: { commandId: "searchQuery", ...value },
  };
}

function services(overrides = {}) {
  return {
    getUser: async (id) => {
      assert.equal(id, "aad-id");
      return { _id: "user-id" };
    },
    getGroup: async () => {
      throw new Error("Personal searches must not load a group");
    },
    getMembers: async () => [{ objectId: "aad-id" }],
    getForUser: async (id) => {
      assert.equal(id, "user-id");
      return tasks;
    },
    getForGroup: async () => {
      throw new Error("Personal searches must not load shared tasks");
    },
    ...overrides,
  };
}

test("initial run loads personal tasks without treating its flag as search text", async () => {
  for (const parameters of [
    [],
    [{ name: "initialRun", value: "true" }],
    [{ name: "searchQuery", value: "" }],
  ]) {
    const result = await handleTaskSearchQuery(
      activityFor("personal", { parameters }),
      services()
    );
    assert.equal(result.composeExtension.type, "result");
    assert.deepEqual(
      result.composeExtension.attachments.map(
        (card) => card.preview.content.title
      ),
      ["\u2b50 Plan the release", "Write documentation"]
    );
  }
});

for (const conversationType of ["channel", "groupChat"]) {
  test(`loads ${conversationType} tasks after checking membership without falling back to personal tasks`, async () => {
    const threadId =
      conversationType === "channel" ? "team-id" : "conversation-id";
    const result = await handleTaskSearchQuery(
      activityFor(conversationType),
      services({
        getUser: async () => {
          throw new Error("Shared tasks do not require a personal task list");
        },
        getGroup: async (id) => {
          assert.equal(id, threadId);
          return { _id: "group-id", serviceUrl: "service-url" };
        },
        getMembers: async (serviceUrl, id) => {
          assert.equal(serviceUrl, "service-url");
          assert.equal(id, threadId);
          return [{ objectId: "aad-id" }];
        },
        getForUser: async () => {
          throw new Error("Shared searches must not load personal tasks");
        },
        getForGroup: async (id) => {
          assert.equal(id, "group-id");
          return tasks;
        },
      })
    );
    assert.equal(result.composeExtension.attachments.length, 2);
    const card = result.composeExtension.attachments[0];
    const stage = new URL(card.content.actions[0].url);
    const context = JSON.parse(stage.searchParams.get("context"));
    const link = new URL(context.websiteUrl);
    assert.equal(link.origin, new URL(baseUrl).origin);
    assert.equal(link.pathname, "/group");
    assert.equal(link.searchParams.get("threadId"), threadId);
    assert.equal(link.searchParams.get("task"), tasks[0]._id);
  });

  test(`requests installation in ${conversationType} when the bot is not in the roster`, async () => {
    const result = await handleTaskSearchQuery(
      activityFor(conversationType),
      services({
        getGroup: async () => ({ _id: "group-id", serviceUrl: "service-url" }),
        getMembers: async () => {
          const error = new Error(
            "The bot is not part of the conversation roster."
          );
          error.code = "BotNotInConversationRoster";
          error.statusCode = 403;
          throw error;
        },
      })
    );
    assert.equal(result.composeExtension.type, "message");
    assert.match(result.composeExtension.text, /install Task Meow/i);
    assert.match(result.composeExtension.text, /channel or group chat/);
    assert.equal(result.composeExtension.attachments, undefined);
  });
}

test("denies shared task searches when the user is not in the roster", async () => {
  for (const members of [[{ objectId: "someone-else" }], [], undefined]) {
    const result = await handleTaskSearchQuery(
      activityFor("channel"),
      services({
        getGroup: async () => ({ _id: "group-id", serviceUrl: "service-url" }),
        getMembers: async () => members,
      })
    );
    assert.equal(result.composeExtension.type, "message");
    assert.match(result.composeExtension.text, /must be a member/);
  }
});

test("unexpected roster failures propagate instead of prompting installation", async () => {
  const error = new Error("Roster service unavailable");
  error.code = "ServiceUnavailable";
  await assert.rejects(
    handleTaskSearchQuery(
      activityFor("channel"),
      services({
        getGroup: async () => ({ _id: "group-id", serviceUrl: "service-url" }),
        getMembers: async () => {
          throw error;
        },
      })
    ),
    (actual) => actual === error
  );
});

test("filters case-insensitively by the named search parameter before paging", async () => {
  const result = await handleTaskSearchQuery(
    activityFor("personal", {
      parameters: [
        { name: "initialRun", value: false },
        { name: "searchQuery", value: "  RELEASE  " },
      ],
      queryOptions: { skip: 0, count: 1 },
    }),
    services()
  );
  assert.equal(result.composeExtension.attachments.length, 1);
  const card = result.composeExtension.attachments[0];
  assert.equal(card.preview.content.title, "\u2b50 Plan the release");
  const stage = new URL(card.content.actions[0].url);
  const context = JSON.parse(stage.searchParams.get("context"));
  const link = new URL(context.websiteUrl);
  assert.equal(link.pathname, "/");
  assert.equal(link.searchParams.get("task"), tasks[0]._id);
  assert.equal(link.searchParams.has("threadId"), false);
});

test("returns the requested page and no cards for unmatched searches", async () => {
  const page = await handleTaskSearchQuery(
    activityFor("personal", { queryOptions: { skip: 1, count: 1 } }),
    services()
  );
  assert.equal(page.composeExtension.attachments.length, 1);
  assert.equal(
    page.composeExtension.attachments[0].preview.content.title,
    "Write documentation"
  );
  const unmatched = await handleTaskSearchQuery(
    activityFor("personal", {
      parameters: [{ name: "searchQuery", value: "no match" }],
    }),
    services()
  );
  assert.deepEqual(unmatched.composeExtension.attachments, []);
});

test("a conversation without a task group does not expose personal tasks", async () => {
  const result = await handleTaskSearchQuery(
    activityFor("groupChat"),
    services({
      getGroup: async () => null,
      getForUser: async () => {
        throw new Error("Must not fall back to personal tasks");
      },
    })
  );
  assert.deepEqual(result.composeExtension.attachments, []);
});

test("search parameters cannot select a different conversation's tasks", async () => {
  const result = await handleTaskSearchQuery(
    activityFor("channel", {
      threadId: "another-team-id",
      parameters: [{ name: "threadId", value: "another-team-id" }],
    }),
    services({
      getGroup: async (id) => {
        assert.equal(id, "team-id");
        return { _id: "group-id" };
      },
      getForGroup: async (id) => {
        assert.equal(id, "group-id");
        return tasks;
      },
    })
  );
  assert.equal(result.composeExtension.attachments.length, 2);
});

test("missing identities and unregistered users receive an explicit sign-in message", async () => {
  const activity = activityFor();
  delete activity.from;
  for (const [request, dependencies] of [
    [activity, services()],
    [activityFor(), services({ getUser: async () => null })],
  ]) {
    const result = await handleTaskSearchQuery(request, dependencies);
    assert.equal(result.composeExtension.type, "message");
    assert.match(result.composeExtension.text, /Sign in/);
  }
});

test("database failures propagate instead of appearing as an empty search", async () => {
  await assert.rejects(
    handleTaskSearchQuery(
      activityFor(),
      services({
        getForUser: async () => {
          throw new Error("Database unavailable");
        },
      })
    ),
    /Database unavailable/
  );
});
