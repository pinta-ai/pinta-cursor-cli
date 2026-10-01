import { describe, expect, it } from "vitest";
import { buildOtlpPayload } from "../../src/core/otlp.js";

function attrs(payload: ReturnType<typeof buildOtlpPayload>): Record<string, unknown> {
  const span = payload.resourceSpans[0].scopeSpans[0].spans[0];
  return Object.fromEntries(
    span.attributes.map((attribute) => [attribute.key, Object.values(attribute.value)[0]]),
  );
}

describe("buildOtlpPayload", () => {
  it("projects Cursor identifiers and tool input with the cursor ingest type", () => {
    const payload = buildOtlpPayload(
      {
        hook_event_name: "preToolUse",
        conversation_id: "conversation-1",
        generation_id: "generation-1",
        model: "gpt-5",
        tool_name: "Shell",
        tool_input: { command: "pwd", cwd: "/workspace" },
        tool_use_id: "call-1",
        cursor_version: "3.21.16",
        workspace_roots: ["/workspace"],
      },
      "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    );

    const resource = Object.fromEntries(
      payload.resourceSpans[0].resource.attributes.map((attribute) => [
        attribute.key,
        Object.values(attribute.value)[0],
      ]),
    );
    expect(resource["pinta.adapter.name"]).toBe("pinta-cursor");
    expect(attrs(payload)).toMatchObject({
      "ingest.type": "cursor",
      "cursor.hook": "preToolUse",
      "cursor.cwd": "/workspace",
      "cursor.conversation_id": "conversation-1",
      "cursor.generation_id": "generation-1",
      "cursor.tool_name": "Shell",
      "cursor.tool_input": '{"command":"pwd","cwd":"/workspace"}',
      "cursor.tool_use_id": "call-1",
      "gen_ai.tool.name": "Shell",
      "gen_ai.tool.call.id": "call-1",
    });
  });

  it("does not record the Cursor user email", () => {
    const payload = buildOtlpPayload(
      { hook_event_name: "preToolUse", user_email: "private@example.com" },
      "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    );
    expect(JSON.stringify(payload)).not.toContain("private@example.com");
  });
});
