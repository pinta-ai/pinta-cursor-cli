import { DiskTransport } from "@pinta-ai/core";
import type { PintaConfig } from "./config.js";

export class Transport extends DiskTransport {
  constructor(config: PintaConfig) {
    super({ pluginData: config.pluginData, logPrefix: "pinta-cursor" });
  }
}
