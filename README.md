# @pinta-ai/pinta-cursor-cli

Pinta AI's native hook adapter for Cursor IDE and Cursor CLI.

The adapter receives Cursor `preToolUse` events on stdin, asks the local Pinta
manager to evaluate the exact OTLP span that will be recorded, and returns
Cursor's native `allow` or `deny` response. A denied action also exits with code
2, as required by Cursor's blocking hook contract.

## Coverage

- Native Cursor tools such as Shell, Read, Write, Delete, Grep, and Task are
  evaluated before execution.
- `MCP:*` tools are intentionally excluded from the native hook matcher because
  Pinta's existing `mcp-logger` wrapper already evaluates those calls.
- Guard or network failures fail open so an unavailable Pinta service does not
  stop local development.
- Cursor cloud agents are not covered by the user-level
  `~/.cursor/hooks.json`; cloud coverage requires a project, team, or enterprise
  hook policy.

## Installation

`pinta-manager` installs the package and merges the managed hook entry into
`~/.cursor/hooks.json`. The manager preserves user-owned hooks and writes runtime
configuration to `~/.cursor/pinta-cursor-cli.env`.

The package's hook template is at `hooks/hooks.template.json`.

## Stage candidates

`0.1.2-pta1010.1` bundles Core `0.11.1-pta1010.1` to distinguish proved Fetch
credential modes and non-password CLI options from secrets, and to avoid
recognizing long `risk-...` URL paths as OpenAI keys. Actual passwords and
unknown consumers remain protected. The bundled parser's MIT notice is included.

Prerelease tags publish immutable GitHub release tarballs, matching Cursor's
existing catalog distribution; they do not publish to npm `latest`. Installation
requires explicit compatible Stage approval in `pinta-catalog`. Stable npm
publishing is unchanged. This does not add a Cursor post-tool hook: MCP calls
continue to use the separately versioned MCP Logger.
