const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const registry = "https://packagefeedproxy.microsoft.io/npm/";

async function installMsit({
  rootDirectory = path.resolve(__dirname, ".."),
  yarnPath = process.env.npm_execpath,
  args = [],
} = {}) {
  if (!yarnPath) {
    throw new Error("Run this installer using yarn install-msit.");
  }

  const directories = [rootDirectory, path.join(rootDirectory, "server")];
  const lockfiles = directories.map((directory) => {
    const file = path.join(directory, "yarn.lock");
    return { file, original: fs.readFileSync(file, "utf8") };
  });
  let child;
  let interrupted;
  const stop = (signal) => {
    interrupted = signal;
    child?.kill(signal);
  };
  const onInterrupt = () => stop("SIGINT");
  const onTerminate = () => stop("SIGTERM");
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);

  try {
    // Yarn Classic uses absolute lockfile URLs even with --registry.
    for (const { file, original } of lockfiles) {
      fs.writeFileSync(
        file,
        original.replace(
          /https:\/\/registry\.(?:npmjs\.org|yarnpkg\.com)\//g,
          registry
        )
      );
    }

    for (const cwd of directories) {
      await new Promise((resolve, reject) => {
        child = spawn(
          process.execPath,
          [
            yarnPath,
            "install",
            ...args,
            "--frozen-lockfile",
            "--registry",
            registry,
          ],
          {
            cwd,
            stdio: "inherit",
            env: {
              ...process.env,
              YARN_REGISTRY: registry,
              npm_config_registry: registry,
            },
          }
        );
        child.once("error", reject);
        child.once("close", (code, signal) => {
          child = undefined;
          if (code === 0 && !interrupted) {
            resolve();
          } else {
            const exitCode =
              (interrupted || signal) === "SIGINT"
                ? 130
                : interrupted || signal
                ? 143
                : code || 1;
            reject(
              Object.assign(new Error(`Yarn install failed in ${cwd}.`), {
                exitCode,
              })
            );
          }
        });
      });
    }
  } finally {
    for (const { file, original } of lockfiles) {
      fs.writeFileSync(file, original);
    }
    process.removeListener("SIGINT", onInterrupt);
    process.removeListener("SIGTERM", onTerminate);
  }
}

if (require.main === module) {
  installMsit({ args: process.argv.slice(2) }).catch((error) => {
    console.error(error.message);
    process.exitCode = error.exitCode || 1;
  });
}

module.exports = { installMsit };
