---
name: commit-split
description: Splits the current diff into one Conventional Commits commit per concern, then pushes. Skips secrets and large binaries. Use when committing and pushing a mixed working tree.
---

# commit-split

Turn a messy working tree into a clean linear history, then push.

## Preconditions

1. Inside a git repository:
   ```bash
   git rev-parse --is-inside-work-tree
   ```
2. Upstream branch exists, or the current branch tracks one. If not, this skill will set `-u origin <branch>` on first push.
3. `gh auth status` succeeds (only needed if the repo has no remote yet — in that case redirect the user to the `init-repo` skill instead).

## Flow

### 1. Capture the working tree state

```bash
git status --short
git diff --stat
git diff --cached --stat
git log -5 --oneline
```

Notes:
- `??` lines = untracked files. Treat them like additions.
- If the tree is clean, stop with "nothing to commit".
- Note the current branch: `git rev-parse --abbrev-ref HEAD`.

### 2. Safety scan

Before doing anything, scan changed paths for sensitive patterns:

```bash
git status --short | awk '{print $NF}' | grep -Ei '(^|/)(\.env(\.|$)|secrets?\.|credentials\.|.*\.pem$|.*\.key$|id_rsa)'
```

Also scan diff content for obvious secrets:

```bash
git diff HEAD | grep -Ei '(api[_-]?key|secret|token|password|bearer)\s*[:=]\s*[a-z0-9/_-]{16,}' || true
```

If any match: **stop**, list the offenders, and ask the user how to proceed (typically: add to `.gitignore`, `git rm --cached`, then continue). Never commit a flagged file silently.

### 3. Group changes by concern

Read the full diff:

```bash
git diff HEAD --no-color
```

Cluster file paths into **concerns**. Heuristics, in priority order:

1. **Path prefix** — files under the same top-level dir or feature folder cluster together (`src/auth/**`, `migrations/**`, `docs/**`).
2. **File type** — formatting-only or pure-rename changes form their own concern.
3. **Diff semantics** — a renamed file plus its callsite updates is one concern. A new dependency in `package.json` + the code that uses it is one concern.
4. **Commit type** — splits along Conventional Commits boundaries:
   - `feat:` — new behavior, new files implementing a feature
   - `fix:` — bug fix isolated to a small region
   - `refactor:` — moves/renames, no behavior change
   - `docs:` — only `*.md`, `*.mdx`, comments
   - `test:` — only `*test*`, `*spec*` files
   - `chore:` — deps, configs, lockfiles, tooling
   - `style:` — whitespace, formatting
   - `perf:` — optimization

If everything in the diff is one logical change, that's fine — output one commit. Don't manufacture splits to look thorough.

Output the proposed plan to the user as a numbered list:

```
1. feat(auth): add OAuth callback handler
   - src/auth/oauth.ts (new)
   - src/auth/index.ts
2. chore: bump @types/node
   - package.json
   - pnpm-lock.yaml
3. docs: document OAuth env vars
   - README.md
```

Do **not** ask for approval — proceed unless the user objects. (This skill is intentionally low-friction; the user invoked it knowing it will commit and push.)

### 4. Commit each concern

For each group, in order:

```bash
git reset                                  # unstage everything
git add -- <files for this concern>
git diff --cached --stat                   # sanity check
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject under 72 chars>

<optional body — only when the "why" isn't obvious from the subject>
EOF
)"
```

Rules for the message:
- Subject in imperative mood: `add`, `fix`, `rename`, not `added` / `fixes`.
- Subject ≤ 72 chars. No trailing period.
- Scope is optional; use it when the change is localized to a clear module.
- Body only when the diff doesn't speak for itself. No filler.
- **Never** include `Co-Authored-By: Claude` or any tool attribution (this user has attribution disabled globally per their CLAUDE.md).

If staging a group fails because a file shows up unstaged after a partial-stage hunk split, fall back to whole-file commits — don't attempt `git add -p` interactively.

### 5. Handle untracked binaries / huge files

Before staging, check sizes:

```bash
git status --short | awk '$1=="??"{print $2}' | xargs -I{} wc -c {} 2>/dev/null
```

If any untracked file is `> 5 MB` or has a binary extension (`.zip`, `.tar.gz`, `.mp4`, `.psd`, `.sqlite`, model weights, etc.): **stop**, list them, ask the user before committing. Suggest `.gitignore` or git-lfs.

### 6. Push

Once all concerns are committed:

```bash
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

if git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" >/dev/null 2>&1; then
  git pull --rebase --autostash
  git push
else
  git push -u origin "$BRANCH"
fi
```

If the rebase hits a conflict: **stop**, surface the conflicting files, and let the user resolve. Never `git rebase --abort` automatically.

### 7. Report

Print the final state:

```bash
git log --oneline -n <commits-created>
git rev-parse --abbrev-ref @{upstream}
```

One line per new commit + upstream branch + remote URL (`git remote get-url origin`).

## Hard rules

- **Never** `git push --force` or `--force-with-lease`. If a rebase fails, hand it back to the user.
- **Never** `git reset --hard`, `git clean -fd`, or `git checkout -- .` to "clean up" before splitting. Stash if needed:
  ```bash
  git stash push -u -m "commit-split safety stash"
  ```
- **Never** rewrite history (`git rebase -i`, `commit --amend`) on commits that already exist before this invocation.
- **Never** commit secrets, even if the user insists — make them confirm twice and document why.
- If on `main` / `master` / `trunk` and the remote has branch-protection-style behavior (push rejected), surface the error verbatim and stop.

## Helpers

- [scripts/plan.sh](scripts/plan.sh) — print the working-tree state and a rough concern-grouping suggestion. Run early to seed step 3.
- [scripts/push.sh](scripts/push.sh) — the safe push wrapper used in step 6 (rebase-then-push with upstream auto-set).
