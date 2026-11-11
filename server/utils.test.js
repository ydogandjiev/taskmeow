/* eslint-disable jest/expect-expect */
import test from "node:test";
import assert from "node:assert/strict";

const environmentKeys = [
  "APPSETTING_AAD_BaseUri",
  "APPSETTING_HOSTNAME",
  "REACT_APP_RUN_MODE",
  "APPSETTING_AAD_ApplicationId",
];
let importIndex = 0;

async function loadUtils(t, environment) {
  const original = Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]])
  );
  const applyEnvironment = (values) => {
    for (const key of environmentKeys) {
      if (values[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = values[key];
      }
    }
  };
  t.after(() => applyEnvironment(original));
  applyEnvironment(environment);
  return import(`./utils.js?origin-test=${++importIndex}`);
}

for (const [hostname, runMode] of [
  ["taskmeow.ngrok.io", "prod"],
  ["taskmeow.com", "int"],
]) {
  test(`share links use the configured public URL on ${hostname}`, async (t) => {
    const { default: utils, baseUrl } = await loadUtils(t, {
      APPSETTING_AAD_BaseUri: `https://${hostname}/`,
      REACT_APP_RUN_MODE: runMode,
      APPSETTING_AAD_ApplicationId: "test-app-id",
    });
    assert.equal(baseUrl, `https://${hostname}`);
    assert.equal(
      utils.buildShareUrl("task-id", "share-token"),
      `https://${hostname}/?task=task-id&shareTag=share-token`
    );
    const card = utils.getTaskCardWithPreview(
      { _id: "task-id", title: "Test task" },
      utils.buildShareUrl("task-id", "share-token")
    );
    const stageLink = new URL(card.content.actions[0].url);
    const stageContext = JSON.parse(stageLink.searchParams.get("context"));
    assert.equal(stageContext.appId, "test-app-id");
    const contentUrl = new URL(stageContext.contentUrl);
    assert.equal(contentUrl.origin, `https://${hostname}`);
    assert.equal(contentUrl.searchParams.get("task"), "task-id");
    assert.equal(contentUrl.searchParams.get("shareTag"), "share-token");
    assert.equal(contentUrl.searchParams.get("inTeamsSSO"), "true");
  });

  test(`share links use the configured hostname on ${hostname}`, async (t) => {
    const { baseUrl } = await loadUtils(t, {
      APPSETTING_HOSTNAME: hostname,
      REACT_APP_RUN_MODE: runMode,
    });
    assert.equal(baseUrl, `https://${hostname}`);
  });
}
