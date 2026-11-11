/* eslint-disable jest/expect-expect */
import test from "node:test";
import assert from "node:assert/strict";

import { handleTaskLinkQuery } from "./task-links.js";
import utils, { baseUrl } from "./utils.js";

const taskId = "507f1f77bcf86cd799439011";
const task = {
  _id: taskId,
  user: "owner-id",
  title: "Plan the release",
  starred: true,
  shareTag: "share-token",
};

function activityFor(path) {
  return {
    from: { aadObjectId: "aad-id" },
    value: { url: `${baseUrl}${path}` },
  };
}

function services(overrides = {}) {
  return {
    getTask: async () => task,
    getUser: async () => ({ _id: "owner-id" }),
    getGroup: async () => ({ _id: "group-id", serviceUrl: "service-url" }),
    getMembers: async () => [{ objectId: "aad-id" }],
    ...overrides,
  };
}

test("builds a shared-task Adaptive Card with a thumbnail and working link", async () => {
  const url = utils.buildShareUrl(taskId, task.shareTag);
  const result = await handleTaskLinkQuery(
    { ...activityFor("/"), value: { url } },
    services({
      getUser: async () => {
        throw new Error("A valid share link does not require ownership");
      },
    })
  );
  const [attachment] = result.composeExtension.attachments;
  assert.equal(
    attachment.contentType,
    "application/vnd.microsoft.card.adaptive"
  );
  assert.equal(attachment.content.body[0].text, task.title);
  assert.equal(attachment.content.body[1].text, "Important task");
  assert.equal(attachment.preview.content.title, task.title);
  assert.deepEqual(attachment.content.actions, [
    { type: "Action.OpenUrl", title: "Open task", url },
  ]);
});

test("only the owner can preview a private task without a valid share tag", async () => {
  for (const suffix of ["", "&shareTag=wrong-token"]) {
    const activity = activityFor(`/?task=${taskId}${suffix}`);
    const denied = await handleTaskLinkQuery(
      activity,
      services({ getUser: async () => ({ _id: "another-user" }) })
    );
    assert.deepEqual(denied.composeExtension.attachments, []);
    const allowed = await handleTaskLinkQuery(activity, services());
    assert.equal(allowed.composeExtension.attachments.length, 1);
    assert.equal(
      allowed.composeExtension.attachments[0].content.actions[0].url,
      `${baseUrl}/?task=${taskId}`
    );
  }
});

test("group links retain thread context and require membership", async () => {
  const activity = {
    ...activityFor(`/group?task=${taskId}&threadId=team-id`),
    channelData: { team: { id: "team-id" } },
  };
  const groupServices = services({
    getTask: async () => ({ ...task, user: undefined, group: "group-id" }),
    getMembers: async (serviceUrl, threadId) => {
      assert.equal(serviceUrl, "service-url");
      assert.equal(threadId, "team-id");
      return [{ objectId: "aad-id" }];
    },
  });
  const result = await handleTaskLinkQuery(activity, groupServices);
  assert.equal(
    result.composeExtension.attachments[0].content.actions[0].url,
    activity.value.url
  );
  const denied = await handleTaskLinkQuery(activity, {
    ...groupServices,
    getMembers: async () => [{ objectId: "someone-else" }],
  });
  assert.deepEqual(denied.composeExtension.attachments, []);
});

test("a group share tag cannot bypass membership or mismatched group checks", async () => {
  const activity = {
    ...activityFor(
      `/group?task=${taskId}&threadId=other-team&shareTag=${task.shareTag}`
    ),
    channelData: { team: { id: "other-team" } },
  };
  const result = await handleTaskLinkQuery(
    activity,
    services({
      getTask: async () => ({ ...task, group: "different-group" }),
      getMembers: async () => {
        throw new Error("Do not look up members of an unrelated group");
      },
    })
  );
  assert.deepEqual(result.composeExtension.attachments, []);
});

test("group tasks cannot be unfurled outside their channel or chat", async () => {
  for (const context of [
    {},
    { channelData: { team: { id: "different-team" } } },
  ]) {
    const result = await handleTaskLinkQuery(
      {
        ...activityFor(`/group?task=${taskId}&threadId=team-id`),
        ...context,
      },
      services({
        getTask: async () => ({ ...task, group: "group-id" }),
        getGroup: async () => {
          throw new Error("Do not look up groups outside this conversation");
        },
      })
    );
    assert.deepEqual(result.composeExtension.attachments, []);
  }
});

test("legacy group links use the invoking Teams conversation", async () => {
  const activity = {
    ...activityFor(`/group?task=${taskId}`),
    channelData: { team: { id: "team-id" } },
  };
  const result = await handleTaskLinkQuery(
    activity,
    services({ getTask: async () => ({ ...task, group: "group-id" }) })
  );
  assert.equal(
    result.composeExtension.attachments[0].content.actions[0].url,
    `${baseUrl}/group?task=${taskId}&threadId=team-id`
  );
});

test("unsupported and malformed links never query task data", async () => {
  for (const url of [
    "not a url",
    `https://example.com/?task=${taskId}`,
    `${baseUrl}/profile?task=${taskId}`,
    `${baseUrl}/?task=invalid`,
    `${baseUrl}/`,
  ]) {
    const result = await handleTaskLinkQuery(
      { ...activityFor("/"), value: { url } },
      services({
        getTask: async () => {
          throw new Error("Unsupported links must not query tasks");
        },
      })
    );
    assert.deepEqual(result.composeExtension.attachments, []);
  }
});

test("missing tasks and unidentified senders produce no preview", async () => {
  const activity = activityFor(`/?task=${taskId}`);
  const missing = await handleTaskLinkQuery(
    activity,
    services({ getTask: async () => null })
  );
  assert.deepEqual(missing.composeExtension.attachments, []);
  const anonymous = await handleTaskLinkQuery(
    { ...activity, from: {} },
    services()
  );
  assert.deepEqual(anonymous.composeExtension.attachments, []);
});

test("service failures propagate to the bot error handler", async () => {
  await assert.rejects(
    handleTaskLinkQuery(
      activityFor(`/?task=${taskId}`),
      services({
        getTask: async () => {
          throw new Error("Database unavailable");
        },
      })
    ),
    /Database unavailable/
  );
});
