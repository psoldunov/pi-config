---
name: coding-rules
description: On-demand rules for coding, tests, reviews, security, Git, hooks, APIs, and delegation.
---

# Coding Rules

Apply host, repository, and task-specific instructions before these generic rules. Treat Claude-specific tools, agents, hooks, settings, shortcuts, and modes as intent-level guidance; use the closest Pi or host capability.

## Progressive loading

Never read every reference by default. Read only rows matching current work:

| Work | References |
| --- | --- |
| Any source-code implementation, debugging, review, or refactor | `references/common/coding-style.md` |
| New feature or bug fix | `references/common/testing.md`, `references/common/development-workflow.md` |
| Tests only | `references/common/testing.md` |
| Commit, push, or pull request | `references/common/git-workflow.md`, `references/common/security.md` |
| Security-sensitive boundary, auth, secrets, input, API, or database work | `references/common/security.md` |
| Performance work or model/context strategy | `references/common/performance.md` |
| New architecture, repository abstraction, or API response shape | `references/common/patterns.md` |
| Hooks, permissions, or task-tracking integration | `references/common/hooks.md` |
| Delegation or specialist-agent workflow | `references/common/agents.md` |

For TypeScript or JavaScript work, also load only matching language references:

| Work | References |
| --- | --- |
| Any TS/JS implementation, debugging, review, or refactor | `references/typescript/coding-style.md` |
| TS/JS tests | `references/typescript/testing.md` |
| TS/JS design or implementation patterns | `references/typescript/patterns.md` |
| React hooks | `references/typescript/hooks.md` |
| TS/JS input, auth, API, secret, or DOM security | `references/typescript/security.md` |

Follow links from a loaded reference only when current task needs linked topic. If a required reference cannot be read, report it instead of silently skipping it.
