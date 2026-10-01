import { loadEnvFile } from "./env-file.js";

loadEnvFile();

async function main(): Promise<void> {
  const { runHook } = await import("./hook.js");
  process.exitCode = await runHook();
}

void main();
