import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GuardResult } from "../../src/core/guard.js";
import type { CursorHookResponse } from "../../src/core/types.js";
import {
  DENY_SETTLE_MS,
  handlePreToolUse,
  type HandlerDependencies,
} from "../../src/handlers/pre-tool-use.js";

const CONFIG = {
  pluginData: path.resolve(".test-runtime/cursor"),
  tracePath: path.resolve(".test-runtime/cursor/trace.json"),
};

const EVENT = {
  hook_event_name: "preToolUse",
  conversation_id: "conversation-1",
  generation_id: "generation-1",
  tool_name: "Shell",
  tool_input: { command: "pwd" },
  tool_use_id: "call-1",
  cursor_version: "3.21.16",
};

const DENY = {
  decision: "DENY" as const,
  reason: "deny_destructive",
  userMessage: "Blocked by Pinta AI",
  durationMs: 4,
};

function dependencies(result: GuardResult | null) {
  const responses: CursorHookResponse[] = [];
  const order: string[] = [];
  const deps: HandlerDependencies = {
    evaluate: vi.fn().mockResolvedValue(result),
    send: vi.fn().mockImplementation(async () => {
      order.push("send");
    }),
    defer: vi.fn().mockImplementation(() => {
      order.push("defer");
    }),
    write: vi.fn().mockImplementation((response) => {
      order.push("write");
      responses.push(response);
    }),
    settle: vi.fn().mockImplementation(async () => {
      order.push("settle");
    }),
  };
  return { deps, responses, order };
}

beforeEach(() => {
  delete process.env.PINTA_GUARD_DISABLED;
});

describe("handlePreToolUse", () => {
  it("writes DENY before queueing telemetry, waits briefly, and exits 2", async () => {
    const { deps, responses, order } = dependencies(DENY);

    const code = await handlePreToolUse(EVENT, CONFIG, deps);

    expect(code).toBe(2);
    expect(responses).toEqual([
      {
        permission: "deny",
        userMessage: "Blocked by Pinta AI",
        agentMessage: "Blocked by Pinta AI",
      },
    ]);
    expect(order).toEqual(["write", "defer", "settle"]);
    expect(deps.settle).toHaveBeenCalledWith(DENY_SETTLE_MS);
    expect(deps.send).not.toHaveBeenCalled();
  });

  it.each(["ALLOW", "REVIEW"] as const)("maps %s to Cursor allow", async (decision) => {
    const { deps, responses, order } = dependencies({
      decision,
      reason: null,
      userMessage: null,
      durationMs: 2,
    });

    expect(await handlePreToolUse(EVENT, CONFIG, deps)).toBe(0);
    expect(responses).toEqual([{ permission: "allow" }]);
    expect(order).toEqual(["write", "send"]);
  });

  it("fails open when the guard is unavailable", async () => {
    const { deps, responses } = dependencies(null);
    expect(await handlePreToolUse(EVENT, CONFIG, deps)).toBe(0);
    expect(responses).toEqual([{ permission: "allow" }]);
  });

  it("asks the guard about the same span sent to telemetry", async () => {
    const { deps } = dependencies({
      decision: "ALLOW",
      reason: null,
      userMessage: null,
      durationMs: 1,
    });

    await handlePreToolUse(EVENT, CONFIG, deps);

    expect(vi.mocked(deps.send).mock.calls[0][0]).toBe(
      vi.mocked(deps.evaluate).mock.calls[0][0],
    );
  });

  it("attaches the guard result to that span", async () => {
    const { deps } = dependencies(DENY);
    await handlePreToolUse(EVENT, CONFIG, deps);

    const payload = vi.mocked(deps.defer).mock.calls[0][0];
    const attributes = Object.fromEntries(
      payload.resourceSpans[0].scopeSpans[0].spans[0].attributes.map((attribute) => [
        attribute.key,
        Object.values(attribute.value)[0],
      ]),
    );
    expect(attributes).toMatchObject({
      "pinta.guard.decision": "deny",
      "pinta.guard.matched_rule": "deny_destructive",
    });
  });
});
