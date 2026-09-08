# Common: Agent Orchestration

## Specialist Roles

Claude source agents live under `~/.claude/agents/`. In Pi, use a matching skill or brief an available sub-agent with the same role when supported.

| Agent | Purpose | When to Use |
| --- | --- | --- |
| planner | Implementation planning | Complex features, refactoring |
| architect | System design | Architectural decisions |
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| build-error-resolver | Fix build errors | When build fails |
| e2e-runner | E2E testing | Critical user flows |
| refactor-cleaner | Dead code cleanup | Code maintenance |
| doc-updater | Documentation | Updating docs |

## Immediate Specialist Usage

No user prompt needed when a matching facility exists:

1. Complex feature requests - Use **planner** role
2. Code just written/modified - Use **code-reviewer** role
3. Bug fix or new feature - Use **tdd-guide** role
4. Architectural decision - Use **architect** role

## Parallel Task Execution

Use parallel execution for independent operations when the active host permits delegation:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```

## Multi-Perspective Analysis

For complex problems, use split-role sub-agents when available:

- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker
