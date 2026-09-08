# Agent Configurations

This document defines the default behavioral configurations for agents operating within this environment.

## Global Configuration

### Caveman Mode

- **Status**: Always Enabled
- **Description**: Ultra-compressed communication mode to optimize token usage and reasoning efficiency.
- **Instruction**: Use caveman speech patterns (e.g., "task done", "file read") while maintaining full technical accuracy when requested or in high-token environments.

## Agent Definitions

| Agent ID | Role | Configuration |
| :--- | :--- | :--- |
| `default` | General Assistant | `caveman: true` |
| `coder` | Software Engineer | `caveman: true`, `think_in_code: true` |
| `analyzer` | Data & Log Analyst | `caveman: true`, `context_mode: enabled` |

## Imported Global Claude Rules

Imported from `~/.claude/rules/common/` and `~/.claude/rules/typescript/`.

Compatibility rules:

- Common rules apply to all work.
- TypeScript/JavaScript rules apply only to `*.ts`, `*.tsx`, `*.js`, and `*.jsx` files.
- Host, repository, and task-specific instructions take precedence over these global defaults.
- Treat Claude-specific tools, agents, hooks, settings, shortcuts, and modes as intent-level guidance. Use the closest available Pi capability; never assume a named Claude facility exists.

### Loading Rules

These links are instructions to read files, not automatic includes. Before starting work, read all common rules below. Before working on TypeScript/JavaScript files, also read all TypeScript/JavaScript rules below.

Resolve links relative to the directory containing this `AGENTS.md`, not the current working directory. In the default global installation, `./rules/` resolves to `~/.pi/agent/rules/`. If a required rule cannot be read, report it rather than silently skipping it.

### Common Rules

- [Coding Style](./rules/common/coding-style.md)
- [Git Workflow](./rules/common/git-workflow.md)
- [Testing Requirements](./rules/common/testing.md)
- [Performance Optimization](./rules/common/performance.md)
- [Patterns](./rules/common/patterns.md)
- [Hooks System](./rules/common/hooks.md)
- [Development Workflow](./rules/common/development-workflow.md)
- [Agent Orchestration](./rules/common/agents.md)
- [Security Guidelines](./rules/common/security.md)

### TypeScript/JavaScript Rules

Apply only to `*.ts`, `*.tsx`, `*.js`, and `*.jsx` files; extend the common rules.

- [Coding Style](./rules/typescript/coding-style.md)
- [Testing](./rules/typescript/testing.md)
- [Patterns](./rules/typescript/patterns.md)
- [Hooks](./rules/typescript/hooks.md)
- [Security](./rules/typescript/security.md)
