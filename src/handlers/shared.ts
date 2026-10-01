import {
  DiskRetryQueue,
  MAX_POST_BYTES,
  envOptionsResolver,
  type OtlpPayload,
} from "@pinta-ai/core";
import type { PintaConfig } from "../core/config.js";
import type { CursorEvent } from "../core/types.js";
import { buildOtlpPayload } from "../core/otlp.js";
import { TraceManager } from "../core/trace.js";
import { Transport } from "../core/transport.js";

export function buildEventPayload(event: CursorEvent, config: PintaConfig): OtlpPayload {
  return buildOtlpPayload(event, new TraceManager(config).currentTrace());
}

export async function sendBestEffort(payload: OtlpPayload, config: PintaConfig): Promise<void> {
  try {
    const transport = new Transport(config);
    await transport.flush();
    await transport.send(payload);
  } catch (err) {
    process.stderr.write(`[pinta-cursor-cli] telemetry emit failed: ${err}\n`);
  }
}

export function deferBestEffort(payload: OtlpPayload, config: PintaConfig): void {
  try {
    if (!envOptionsResolver()) return;
    if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_POST_BYTES) {
      process.stderr.write("[pinta-cursor-cli] deferred telemetry exceeds MAX_POST_BYTES; dropped\n");
      return;
    }
    new DiskRetryQueue(config.pluginData, "pinta-cursor-cli").enqueue(payload);
  } catch (err) {
    process.stderr.write(`[pinta-cursor-cli] telemetry enqueue failed: ${err}\n`);
  }
}
