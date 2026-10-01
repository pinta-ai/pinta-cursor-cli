import {
  attachGuard,
  evaluateGuard as coreEvaluateGuard,
  type GuardPayload,
  type GuardResult,
  type OtlpPayload,
} from "@pinta-ai/core";
import { ADAPTER_VERSION } from "./version.js";

const DEFAULT_TIMEOUT_MS = 10_000;

function timeoutMs(): number {
  const parsed = Number(process.env.PINTA_GUARD_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export type { GuardPayload, GuardResult } from "@pinta-ai/core";

export function evaluateGuard(payload: GuardPayload): Promise<GuardResult | null> {
  return coreEvaluateGuard(payload, process.env.PINTA_GUARD_ENDPOINT, {
    timeoutMs: timeoutMs(),
    token: process.env.PINTA_RELAY_TOKEN ?? "",
    disabled: process.env.PINTA_GUARD_DISABLED === "1",
    userAgent: `pinta-cursor/${ADAPTER_VERSION}`,
    agentType: "cursor",
  });
}

export function attachGuardDecision(payload: OtlpPayload, result: GuardResult | null): void {
  attachGuard(payload, result);
}
