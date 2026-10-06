/* eslint-disable jest/expect-expect */
import test from "node:test";
import assert from "node:assert/strict";

import { findTaskByTitle } from "./task-matching.js";

const tasks = [
  { _id: "first", title: "Review channel tasks" },
  { _id: "second", title: "Prepare   Release Notes" },
];

test("prefers an exact task title match", () => {
  assert.equal(findTaskByTitle(tasks, "Review channel tasks")?._id, "first");
});

test("matches task titles without case sensitivity", () => {
  assert.equal(findTaskByTitle(tasks, "review CHANNEL TASKS")?._id, "first");
});

test("ignores surrounding and repeated whitespace", () => {
  assert.equal(
    findTaskByTitle(tasks, "  prepare release   notes  ")?._id,
    "second"
  );
});

test("does not match a different task title", () => {
  assert.equal(findTaskByTitle(tasks, "Review personal tasks"), undefined);
});
