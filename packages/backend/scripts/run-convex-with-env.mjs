import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(currentDir, "..");
const envPath = resolve(backendDir, ".env.local");
const convexBinary =
  process.platform === "win32"
    ? resolve(backendDir, "node_modules", ".bin", "convex.cmd")
    : resolve(backendDir, "node_modules", ".bin", "convex");

loadEnv({ path: envPath });

const [, , ...args] = process.argv;

const child = spawn(convexBinary, args, {
  cwd: backendDir,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("[backend] Failed to start Convex CLI", error);
  process.exit(1);
});
