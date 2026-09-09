# Lifecycle / Permissions / Task Tracking

Consult the installed host's lifecycle API documentation before implementation. Pi uses extension events, not `PreToolUse` / `PostToolUse` / `Stop`.

- `tool_call`: validate/mutate input or block. `tool_result`: inspect/patch the result.
- `agent_settled`: final checks after retries, compaction, and queued continuations; NOT `agent_end`. `session_shutdown`: teardown cleanup, not run completion.
- JS/TS check hooks: after successful edit/write results, filter JS/TS paths; use `pi.exec()` for Prettier, configured TS checks, and `console.log` warnings. Defer expensive checks to `agent_settled`; audit all modified JS/TS files there.
- Pi core has no per-call permission popup/auto-accept/skip-permissions flag. Gate calls with `tool_call` and `ctx.ui.confirm()`/`select()`; block risky calls without `ctx.hasUI`.
- `--tools`, `--exclude-tools`, `--no-builtin-tools`, `--no-tools` control availability, not approval. `--approve`/`--no-approve` override project trust only. Review extensions before loading: they run with full user permissions.
- Pi core has no todo system. Use host/extension/repository tracking for multi-step work: ordered steps, progress, steerable checkpoints; catch missing, extra, misordered, or oversized tasks.
