import { loadConfig, type PintaConfig } from "./core/config.js";
import type { CursorEvent } from "./core/types.js";
import { handlePreToolUse, writeResponse } from "./handlers/pre-tool-use.js";

export function parsePayload(raw: string): CursorEvent | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as CursorEvent;
  } catch {
    return null;
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function dispatch(event: CursorEvent, config: PintaConfig): Promise<number> {
  if (event.hook_event_name !== "preToolUse") {
    writeResponse({ permission: "allow" });
    return 0;
  }
  return handlePreToolUse(event, config);
}

export async function runHook(): Promise<number> {
  try {
    const event = parsePayload(await readStdin());
    if (!event) {
      writeResponse({ permission: "allow" });
      return 0;
    }
    return await dispatch(event, loadConfig());
  } catch (err) {
    process.stderr.write(`[pinta-cursor-cli] hook failed open: ${err}\n`);
    writeResponse({ permission: "allow" });
    return 0;
  }
}
