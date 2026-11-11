/* eslint-disable jest/expect-expect */
import test from "node:test";
import assert from "node:assert/strict";

const environmentKeys = [
  "APPSETTING_AAD_BaseUri",
  "APPSETTING_HOSTNAME",
  "REACT_APP_RUN_MODE",
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
    });
    assert.equal(baseUrl, `https://${hostname}`);
    assert.equal(
      utils.buildShareUrl("task-id", "share-token"),
      `https://${hostname}/?task=task-id&shareTag=share-token`
    );
  });

  test(`share links use the configured hostname on ${hostname}`, async (t) => {
    const { baseUrl } = await loadUtils(t, {
      APPSETTING_HOSTNAME: hostname,
      REACT_APP_RUN_MODE: runMode,
    });
    assert.equal(baseUrl, `https://${hostname}`);
  });
}
