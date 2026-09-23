/* eslint-disable jest/expect-expect */
import test from "node:test";
import assert from "node:assert/strict";

import { getSharedThreadId } from "./conversation-context.js";

test("uses the team ID for channel conversations", () => {
  assert.equal(
    getSharedThreadId({
      channelData: { team: { id: "team-id" } },
      conversation: { id: "channel-id", conversationType: "channel" },
    }),
    "team-id"
  );
});

test("uses the conversation ID for group chats", () => {
  assert.equal(
    getSharedThreadId({
      conversation: { id: "group-chat-id", conversationType: "groupChat" },
    }),
    "group-chat-id"
  );
});

test("does not create a shared context for personal chats", () => {
  assert.equal(
    getSharedThreadId({
      conversation: { id: "personal-id", conversationType: "personal" },
    }),
    undefined
  );
});
