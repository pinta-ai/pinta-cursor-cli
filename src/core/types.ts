export interface CursorEvent {
  hook_event_name: string;
  conversation_id?: string;
  generation_id?: string;
  model?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_use_id?: string;
  cursor_version?: string;
  workspace_roots?: string[];
  user_email?: string;
  cwd?: string;
  [key: string]: unknown;
}

export interface CursorHookResponse {
  permission: "allow" | "deny";
  userMessage?: string;
  agentMessage?: string;
}
