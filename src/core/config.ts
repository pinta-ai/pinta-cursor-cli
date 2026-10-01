import os from "node:os";
import path from "node:path";

export interface PintaConfig {
  pluginData: string;
  tracePath: string;
}

export function pluginDataDir(): string {
  return (
    process.env.PINTA_CURSOR_DATA ||
    process.env.PINTA_PLUGIN_DATA ||
    path.join(os.homedir(), ".pinta", "adaptors", "pinta-cursor")
  );
}

export function loadConfig(): PintaConfig {
  const pluginData = pluginDataDir();
  return {
    pluginData,
    tracePath: path.join(pluginData, "trace.json"),
  };
}
