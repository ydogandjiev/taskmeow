/* eslint-disable jest/expect-expect */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const registry = "https://packagefeedproxy.microsoft.io/npm/";
const lockfile = [
  "package@^1.0.0:",
  '  version "1.0.0"',
  '  resolved "https://registry.yarnpkg.com/package/-/package-1.0.0.tgz#hash"',
  "  integrity sha512-integrity",
  "scoped@^1.0.0:",
  '  version "1.0.0"',
  '  resolved "https://registry.npmjs.org/@scope/package/-/package-1.0.0.tgz"',
  "git@^1.0.0:",
  '  resolved "https://github.com/example/package.git#commit"',
  "",
].join("\n");

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "taskmeow-msit-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "server"));
  for (const folder of ["", "server"]) {
    fs.writeFileSync(path.join(directory, folder, "yarn.lock"), lockfile);
  }
  fs.writeFileSync(
    path.join(directory, "fake-yarn.js"),
    `
const fs = require("node:fs");
const path = require("node:path");
const lock = fs.readFileSync("yarn.lock", "utf8");
if (/https:\\/\\/registry\\.(npmjs\\.org|yarnpkg\\.com)\\//.test(lock)) {
  throw new Error("Install attempted to bypass the Microsoft proxy");
}
if (!lock.includes("${registry}")) throw new Error("Proxy URL is missing");
const args = process.argv.slice(2);
const folder = path.relative(__dirname, process.cwd()) || "root";
fs.appendFileSync(path.join(__dirname, "calls.jsonl"), JSON.stringify({
  folder,
  args,
  registry: process.env.YARN_REGISTRY,
  npmRegistry: process.env.npm_config_registry,
  gitUrlPreserved: lock.includes("https://github.com/example/package.git#commit")
}) + "\\n");
if (args.includes("--fail-" + folder)) process.exit(7);
if (args.includes("--interrupt")) {
  process.kill(process.ppid, "SIGTERM");
  setTimeout(() => process.exit(0), 10000);
}
`
  );
  const installer = path.join(__dirname, "install-msit.js");
  const harness = path.join(directory, "run.js");
  fs.writeFileSync(
    harness,
    `
const path = require("node:path");
const { installMsit } = require(${JSON.stringify(installer)});
installMsit({
  rootDirectory: __dirname,
  yarnPath: path.join(__dirname, "fake-yarn.js"),
  args: process.argv.slice(2),
}).catch(error => {
  console.error(error.message);
  process.exitCode = error.exitCode || 1;
});
`
  );
  return { directory, harness };
}

for (const [args, expectedExit, expectedFolders] of [
  [["--ignore-scripts"], 0, ["root", "server"]],
  [["--fail-root"], 7, ["root"]],
  [["--fail-server"], 7, ["root", "server"]],
  [["--interrupt"], 143, ["root"]],
]) {
  test(`proxy installation restores lockfiles after ${args[0]}`, (t) => {
    const { directory, harness } = fixture(t);
    const result = spawnSync(process.execPath, [harness, ...args], {
      encoding: "utf8",
      timeout: 10000,
    });
    assert.equal(result.status, expectedExit, result.stderr);
    for (const folder of ["", "server"]) {
      assert.equal(
        fs.readFileSync(path.join(directory, folder, "yarn.lock"), "utf8"),
        lockfile
      );
    }
    assert.equal(fs.existsSync(path.join(directory, ".yarnrc")), false);
    const calls = fs
      .readFileSync(path.join(directory, "calls.jsonl"), "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.deepEqual(
      calls.map((call) => call.folder),
      expectedFolders
    );
    for (const call of calls) {
      assert.deepEqual(call.args, [
        "install",
        ...args,
        "--frozen-lockfile",
        "--registry",
        registry,
      ]);
      assert.equal(call.registry, registry);
      assert.equal(call.npmRegistry, registry);
      assert.equal(call.gitUrlPreserved, true);
    }
  });
}
