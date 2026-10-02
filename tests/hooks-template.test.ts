import fs from "node:fs";
import { describe, expect, it } from "vitest";

interface HookTemplate {
  version: number;
  hooks: {
    preToolUse: Array<{
      command: string;
      matcher: string;
      timeout: number;
      failClosed: boolean;
    }>;
  };
}

describe("Cursor hook template", () => {
  it("fails closed while leaving MCP calls to mcp-logger", () => {
    const template = JSON.parse(
      fs.readFileSync(new URL("../hooks/hooks.template.json", import.meta.url), "utf8"),
    ) as HookTemplate;

    expect(template.version).toBe(1);
    expect(template.hooks.preToolUse).toEqual([
      expect.objectContaining({
        matcher: "^(?!MCP:).*$",
        timeout: 20,
        failClosed: true,
      }),
    ]);
  });
});
