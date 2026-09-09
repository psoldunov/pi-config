# Git / Delivery

Only act with user/host authorization; a coding request alone is not permission to commit, push, or open a PR.

- Before every commit, check the diff for secrets, input validation, parameterized SQL, sanitized HTML, CSRF protection, authentication/authorization, endpoint rate limits, and sensitive error leakage. Check each against the affected surfaces; no security gap is waived by skipping a separate card.
- Conventional Commits: `<type>: <description>`, optional detailed body. Types: feat, fix, refactor, docs, test, chore, perf, ci.
- PRs: inspect full branch history and `git diff <base-branch>...HEAD`, not just the last commit. Include a comprehensive summary and test plan with outstanding TODOs; use `git push -u` for a new branch.
