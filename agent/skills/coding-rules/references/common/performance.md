# Common: Performance Optimization

## Model Selection Strategy

**Fast, low-cost model:**

- Lightweight agents with frequent invocation
- Pair programming and code generation
- Worker agents in multi-agent systems

**Balanced coding model:**

- Main development work
- Orchestrating multi-agent workflows
- Complex coding tasks

**High-reasoning model:**

- Complex architectural decisions
- Maximum reasoning requirements
- Research and analysis tasks

## Context Window Management

Avoid last 20% of context window for:

- Large-scale refactoring
- Feature implementation spanning multiple files
- Debugging complex interactions

Lower context sensitivity tasks:

- Single-file edits
- Independent utility creation
- Documentation updates
- Simple bug fixes

## Extended Thinking + Plan Mode

In Pi, control thinking with `/thinking`, Shift+Tab, or `defaultThinkingLevel` in `~/.pi/agent/settings.json`. Use the active host's planning workflow when one is available; Pi core has no built-in plan mode.

For complex tasks requiring deep reasoning:

1. Ensure extended thinking is enabled
2. Use an available planning workflow for a structured approach
3. Use multiple critique rounds for thorough analysis
4. Use split-role sub-agents when the active host supports them

## Build Troubleshooting

If build fails:

1. Use the **build-error-resolver** agent or closest available diagnostic skill
2. Analyze error messages
3. Fix incrementally
4. Verify after each fix
