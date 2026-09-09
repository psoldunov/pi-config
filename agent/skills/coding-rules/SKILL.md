---
name: coding-rules
description: Personal coding standards for source changes/review; security audits; authorized commit/push/PR work; implementation research, architecture, data-access/API design; lifecycle hooks, permissions, task tracking; specialist roles/delegation; model/context choices; performance/build diagnosis. Applies to standalone actions/questions too; skip only unrelated prose/questions. Load only current-action cards; host authorization limits apply.
---

# Coding Rules

Host, repository, and task instructions take precedence. Use available skills/tools for specialist roles; these rules never authorize delegation, Git actions, or external access on their own.

## Core — enough for ordinary work

- Research before new implementation: consult documentation, search for reusable code and proven approaches. Plan complex work with dependencies, risks, and phases; create planning documents when scope warrants them.
- Never mutate existing objects; return updated copies. Organize small, cohesive modules by feature/domain. Aim for 200–400 lines/file, never exceed 800; functions <50 lines, nesting ≤4 levels. Use clear names and constants/config instead of hardcoded values.
- Handle errors explicitly at every level; never swallow them. Give users clear messages and servers detailed diagnostic context without leaking sensitive data.
- Validate untrusted input (including API responses and files) at system boundaries before processing; prefer schemas and fail fast. Never hardcode secrets: use environment variables or a secret manager, check required secrets at startup.
- Features/fixes: mandatory TDD — write a test, run it failing, implement minimally, run it passing, refactor. Maintain ≥80% coverage; unit, integration, and critical-flow E2E tests are all required. For failures check isolation/mocks; fix implementation unless the test is wrong. Use available TDD guidance.
- Review after coding using the host-permitted workflow. Resolve CRITICAL/HIGH issues; fix MEDIUM when possible. Verify naming, size, nesting, errors, constants, immutability, tests, and coverage before declaring done. Report checks not run; never claim unverified success.

## Load only for the action now

Core is complete without references. Read a card only BEFORE its trigger action, not because a later phase might need it. Most tasks need zero or one card at a time; this is not a cap when several risks apply. Reuse cards already in context. Never bulk-read this directory or follow a reference chain. If a required card is unavailable, report it.

Paths are relative to this skill directory. Cards are independent; none requires another.

| About to do | Read |
| --- | --- |
| Edit/review JS/TS source (including tests) | `references/typescript.md` |
| Change/audit auth, endpoints, SQL, HTML, or secret handling; respond to a security issue | `references/security.md` |
| Commit, push, or prepare a PR (when authorized) | `references/git.md` |
| Research a new implementation, choose architecture, data-access or API contracts | `references/design.md` |
| Implement lifecycle hooks, permission gates, or task tracking (NOT React hooks) | `references/hooks.md` |
| Choose specialist roles or delegate work (when permitted) | `references/agents.md` |
| Choose model/context strategy, diagnose performance or build failures | `references/performance.md` |
