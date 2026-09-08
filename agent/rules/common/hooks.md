# Common: Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **Stop**: When session ends (final verification)

Use Pi extensions or the active host's hook system to implement equivalent behavior.

## Auto-Accept Permissions

Use with caution:

- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use a dangerous skip-permissions flag
- Configure explicit allowed tools in the active host

## Task Tracking Best Practices

When a task-tracking tool is available, use it to:

- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

A task list reveals:

- Out-of-order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements
