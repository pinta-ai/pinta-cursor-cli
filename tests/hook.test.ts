import { describe, expect, it } from "vitest";
import { dispatch, parsePayload } from "../src/hook.js";
import type { CursorHookResponse } from "../src/core/types.js";

const CONFIG = {
  pluginData: "/tmp/pinta-cursor-cli-test",
  tracePath: "/tmp/pinta-cursor-cli-trace.json",
};

describe("parsePayload", () => {
  it("accepts an object payload", () => {
    expect(parsePayload('{"hook_event_name":"preToolUse","tool_name":"Shell"}')).toEqual({
      hook_event_name: "preToolUse",
      tool_name: "Shell",
    });
  });

  it("rejects malformed and non-object payloads", () => {
    expect(parsePayload("")).toBeNull();
    expect(parsePayload("not json")).toBeNull();
    expect(parsePayload("[]")).toBeNull();
    expect(parsePayload("null")).toBeNull();
  });
});

describe("dispatch", () => {
  it("fails open for events outside the installed preToolUse hook", async () => {
    const responses: CursorHookResponse[] = [];
    const stdout = process.stdout.write;
    process.stdout.write = ((chunk: string) => {
      responses.push(JSON.parse(chunk) as CursorHookResponse);
      return true;
    }) as typeof process.stdout.write;
    try {
      expect(await dispatch({ hook_event_name: "afterAgentResponse" }, CONFIG)).toBe(0);
      expect(responses).toEqual([{ permission: "allow" }]);
    } finally {
      process.stdout.write = stdout;
    }
  });
});
