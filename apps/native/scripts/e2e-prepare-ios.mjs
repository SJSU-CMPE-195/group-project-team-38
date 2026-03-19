#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";

const APP_ID = "com.meditag.native";
const PROJECT_ROOT = new URL("..", import.meta.url).pathname;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function capture(command, args) {
  return execFileSync(command, args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  }).trim();
}

function getPreferredSimulator() {
  const raw = capture("xcrun", ["simctl", "list", "devices", "available", "--json"]);
  const simulators = Object.values(JSON.parse(raw).devices)
    .flat()
    .filter((device) => device.name.startsWith("iPhone"));

  const booted = simulators.find((device) => device.state === "Booted");
  if (booted) {
    return booted;
  }

  const fallback = simulators[0];
  if (!fallback) {
    throw new Error("No available iPhone simulators found. Install one in Xcode first.");
  }

  return fallback;
}

function ensureSimulatorBooted(device) {
  spawnSync("open", ["-a", "Simulator"], { stdio: "ignore" });

  if (device.state !== "Booted") {
    run("xcrun", ["simctl", "boot", device.udid]);
  }

  run("xcrun", ["simctl", "bootstatus", device.udid, "-b"]);
}

function logStep(message) {
  console.log(`\n==> ${message}`);
}

const simulator = getPreferredSimulator();

logStep(`Preparing iOS simulator ${simulator.name} (${simulator.udid})`);
ensureSimulatorBooted(simulator);

logStep(`Building and installing ${APP_ID}`);
run("bunx", [
  "expo",
  "run:ios",
  "--device",
  simulator.udid,
  "--configuration",
  "Release",
  "--no-bundler",
]);

logStep(`Verifying ${APP_ID} is installed`);
const appContainer = capture("xcrun", ["simctl", "get_app_container", simulator.udid, APP_ID]);
console.log(appContainer);

logStep(`Terminating ${APP_ID} before Maestro launch`);
spawnSync("xcrun", ["simctl", "terminate", simulator.udid, APP_ID], { stdio: "ignore" });
