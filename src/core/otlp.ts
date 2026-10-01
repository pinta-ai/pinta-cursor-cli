import os from "node:os";
import {
  attrsFromRecord,
  buildPayload,
  snakeCase,
  type AttrPolicy,
  type OtlpAttribute,
  type OtlpPayload,
} from "@pinta-ai/core";
import type { CursorEvent } from "./types.js";
import { ADAPTER_VERSION } from "./version.js";

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

function eventCwd(event: CursorEvent): string {
  const inputCwd = stringValue(event.tool_input?.cwd);
  return stringValue(event.cwd) ?? inputCwd ?? process.cwd();
}

export function buildOtlpPayload(event: CursorEvent, traceId: string): OtlpPayload {
  const hookName = stringValue(event.hook_event_name) ?? "preToolUse";
  const toolName = stringValue(event.tool_name);
  const policy: AttrPolicy = {
    skipRedactKeys: new Set([
      "cursor.hook",
      "cursor.cwd",
      "cursor.conversation_id",
      "cursor.generation_id",
      "cursor.tool_name",
      "cursor.tool_use_id",
      "cursor.cursor_version",
    ]),
    bashContextKeys: new Set(["cursor.tool_input"]),
  };
  const attributes: OtlpAttribute[] = [
    { key: "ingest.type", value: { stringValue: "cursor" } },
    { key: "cursor.hook", value: { stringValue: hookName } },
    ...attrsFromRecord(
      {
        cwd: eventCwd(event),
        conversation_id: stringValue(event.conversation_id),
        generation_id: stringValue(event.generation_id),
        model: stringValue(event.model),
        tool_name: toolName,
        tool_input: event.tool_input ?? {},
        tool_use_id: stringValue(event.tool_use_id),
        cursor_version: stringValue(event.cursor_version),
        workspace_roots: event.workspace_roots ?? [],
      },
      "cursor",
      policy,
    ),
  ];
  if (toolName) {
    attributes.push({ key: "gen_ai.tool.name", value: { stringValue: toolName } });
  }
  if (event.tool_use_id) {
    attributes.push({
      key: "gen_ai.tool.call.id",
      value: { stringValue: event.tool_use_id },
    });
  }
  if (event.conversation_id) {
    attributes.push({
      key: "gen_ai.conversation.id",
      value: { stringValue: event.conversation_id },
    });
  }
  if (event.model) {
    attributes.push({
      key: "gen_ai.request.model",
      value: { stringValue: event.model },
    });
  }
  attributes.push({
    key: "gen_ai.operation.name",
    value: { stringValue: "execute_tool" },
  });

  const resource: OtlpAttribute[] = [
    { key: "service.name", value: { stringValue: "cursor" } },
    {
      key: "service.version",
      value: { stringValue: stringValue(event.cursor_version) ?? "unknown" },
    },
    { key: "telemetry.sdk.name", value: { stringValue: "pinta-cursor" } },
    { key: "telemetry.sdk.language", value: { stringValue: "nodejs" } },
    { key: "telemetry.sdk.version", value: { stringValue: ADAPTER_VERSION } },
    { key: "pinta.adapter.name", value: { stringValue: "pinta-cursor" } },
    { key: "pinta.adapter.version", value: { stringValue: ADAPTER_VERSION } },
    { key: "gen_ai.agent.name", value: { stringValue: "cursor" } },
    { key: "os.type", value: { stringValue: os.platform() } },
    { key: "os.version", value: { stringValue: os.release() } },
    { key: "host.arch", value: { stringValue: os.arch() } },
  ];

  return buildPayload({
    traceId,
    spanName: `cursor.${snakeCase(hookName)}${toolName ? `.${snakeCase(toolName)}` : ""}`,
    attributes,
    resource,
    scope: { name: "pinta-cursor", version: ADAPTER_VERSION },
  });
}
