import os from "node:os";
import path from "node:path";
import { loadEnvFile as coreLoadEnvFile, parseEnvFile } from "@pinta-ai/core";

export { parseEnvFile };

export const ENV_FILE_NAME = "pinta-cursor-cli.env";

export function cursorConfigDir(): string {
  return path.join(os.homedir(), ".cursor");
}

export function envFilePath(): string {
  return path.join(cursorConfigDir(), ENV_FILE_NAME);
}

/** Fills only unset keys; silently no-ops when the manager env file is absent. */
export function loadEnvFile(filePath: string = envFilePath()): void {
  coreLoadEnvFile(filePath);
}
