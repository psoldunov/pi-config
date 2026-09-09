# Common: Lifecycle Hooks

Use the active host's native lifecycle API. Pi calls these **extension events**; names such as `PreToolUse`, `PostToolUse`, and `Stop` belong to other hosts and are not Pi event names.

## Pi Event Mapping

- **Before a tool runs — `tool_call`**: Validate or mutate `event.input`, or return `{ block: true, reason }` to prevent execution.
- **After a tool runs — `tool_result`**: Inspect the completed result or return a partial patch for its `content`, `details`, `isError`, or `usage`.
- **After an agent run fully settles — `agent_settled`**: Run end-of-run checks only after automatic retries, compaction retries, and queued continuations are finished.
- **Before session runtime teardown — `session_shutdown`**: Clean up resources on quit, reload, new session, resume, or fork. This is not an end-of-agent-run event.

Do not use `agent_end` as a settled-run hook: it fires after a low-level run, while Pi may still retry, compact, or process queued follow-ups.

## Permissions and Tool Access

Pi has no built-in per-tool permission popup, auto-accept mode, or skip-permissions flag.

- Implement confirmation gates with a `tool_call` extension handler and `ctx.ui.confirm()` or `ctx.ui.select()`.
- Block risky calls by default when `ctx.hasUI` is false.
- Restrict available tools with `--tools`, `--exclude-tools`, `--no-builtin-tools`, or `--no-tools`; these control tool availability, not per-call approval.
- Treat `--approve` and `--no-approve` as project-trust overrides only. They do not approve or deny individual tool calls.
- Review third-party extensions before loading them; Pi extensions execute with the user's full system permissions.

## Task Tracking Best Practices

Pi has no built-in task or todo system. When an extension, custom tool, or repository task file provides one, use it for multi-step work to:

- Track progress and ordering
- Verify understanding of instructions
- Expose checkpoints the user can steer
- Show implementation steps at useful granularity

A task list can reveal missing, extra, out-of-order, overly broad, or misinterpreted work.
