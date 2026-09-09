# TypeScript/JavaScript: Pi Extension Checks

This section applies only to `*.ts`, `*.tsx`, `*.js`, and `*.jsx` files and extends [Common: Lifecycle Hooks](../common/hooks.md).

## After Successful Edits (`tool_result`)

In Pi, subscribe to `tool_result` and filter for successful `edit` or `write` calls whose input path has a JS/TS extension. From that handler, use `pi.exec()` to run appropriate checks:

- **Prettier**: Format the edited file.
- **TypeScript**: Run the repository's configured type-check command after `.ts` or `.tsx` edits. If a full project check is expensive, defer it to `agent_settled`.
- **`console.log` warning**: Scan the edited file and notify when debug logging remains.

`PostToolUse` is not a Pi event name; `tool_result` is the Pi equivalent for completed tool execution.

## Settled-Run Audit (`agent_settled`)

- Check all modified JS/TS files for `console.log` after Pi has finished automatic retries, compaction retries, and queued continuations.
- Run any deferred project-wide formatter or type check here.

Use `agent_settled`, not `agent_end`, for final run verification. Reserve `session_shutdown` for cleanup when the session runtime is being torn down.
