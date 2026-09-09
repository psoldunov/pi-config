# Common: Development Workflow

The Feature Implementation Workflow describes the development pipeline: research, planning, TDD, code review, and then committing to git.

## Feature Implementation Workflow

0. **Research & Reuse** _(mandatory before any new implementation)_
   - **GitHub code search first:** Run `gh search repos` and `gh search code` to find existing implementations, templates, and patterns before writing anything new.
   - **Web research:** Use available web-search tooling during planning for broader research, data ingestion, and discovering prior art.
   - **Check package registries:** Search npm, PyPI, crates.io, and other registries before writing utility code. Prefer battle-tested libraries over hand-rolled solutions.
   - **Search for adaptable implementations:** Look for open-source projects that solve 80%+ of the problem and can be forked, ported, or wrapped.
   - Prefer adopting or porting a proven approach over writing net-new code when it meets the requirement.

1. **Plan First**
   - Use a **planner** agent or closest available planning skill for complex work
   - Generate planning docs before coding when scope warrants them: PRD, architecture, system design, technical document, task list
   - Identify dependencies and risks
   - Break down into phases

2. **TDD Approach**
   - Use a **tdd-guide** agent or closest available TDD skill
   - Write tests first (RED)
   - Implement to pass tests (GREEN)
   - Refactor (IMPROVE)
   - Verify 80%+ coverage

3. **Code Review**
   - Use a **code-reviewer** agent or closest available review workflow immediately after writing code
   - Address CRITICAL and HIGH issues
   - Fix MEDIUM issues when possible

4. **Commit & Push**
   - Detailed commit messages
   - Follow Conventional Commits format
   - Follow [Git Workflow](./git-workflow.md) for commit messages and PR process
