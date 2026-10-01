import type { OtlpPayload } from "@pinta-ai/core";
import type { PintaConfig } from "../core/config.js";
import {
  attachGuardDecision,
  evaluateGuard,
  type GuardResult,
} from "../core/guard.js";
import type { CursorEvent, CursorHookResponse } from "../core/types.js";
import {
  buildEventPayload,
  deferBestEffort,
  sendBestEffort,
} from "./shared.js";

export const DENY_SETTLE_MS = 75;

export interface HandlerDependencies {
  evaluate: (payload: OtlpPayload) => Promise<GuardResult | null>;
  send: (payload: OtlpPayload, config: PintaConfig) => Promise<void>;
  defer: (payload: OtlpPayload, config: PintaConfig) => void;
  write: (response: CursorHookResponse) => void;
  settle: (milliseconds: number) => Promise<void>;
}

const defaults: HandlerDependencies = {
  evaluate: evaluateGuard,
  send: sendBestEffort,
  defer: deferBestEffort,
  write: writeResponse,
  settle: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

export function writeResponse(response: CursorHookResponse): void {
  process.stdout.write(`${JSON.stringify(response)}\n`);
}

function denyResponse(result: GuardResult): CursorHookResponse {
  const message = result.userMessage || result.reason || "Blocked by Pinta AI";
  return {
    permission: "deny",
    userMessage: message,
    agentMessage: message,
  };
}

export async function handlePreToolUse(
  event: CursorEvent,
  config: PintaConfig,
  dependencies: Partial<HandlerDependencies> = {},
): Promise<number> {
  const deps = { ...defaults, ...dependencies };
  const payload = buildEventPayload(event, config);
  const result = await deps.evaluate(payload);
  attachGuardDecision(payload, result);

  if (result?.decision === "DENY") {
    deps.write(denyResponse(result));
    deps.defer(payload, config);
    await deps.settle(DENY_SETTLE_MS);
    return 2;
  }

  deps.write({ permission: "allow" });
  await deps.send(payload, config);
  return 0;
}
