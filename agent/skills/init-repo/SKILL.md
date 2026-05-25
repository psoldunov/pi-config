---
name: init-repo
description: Creates a GitHub repository via `gh`, makes an initial commit, and pushes the current directory. Prompts for owner (org or personal) and visibility (public/private). Use when publishing a new project to GitHub.
---

# init-repo

Bootstrap a GitHub repository from the current working directory.

## Preconditions

1. `gh` CLI installed and authenticated. Verify:
   ```bash
   gh auth status
   ```
   If unauthenticated, stop and tell the user to run `gh auth login`.

2. Working directory exists and contains code to publish.

3. If the directory is already a git repo with a remote `origin`, **stop** — this skill is for new repos. Suggest the user run the `commit-split` skill or a manual push instead.

## Flow

### 1. Inspect the codebase

Before asking the user anything, get oriented:

```bash
pwd
ls -la
git rev-parse --is-inside-work-tree 2>/dev/null || echo "not-a-repo"
git remote -v 2>/dev/null
```

Read top-level files that signal project intent (limit ~5 reads): `README.md`, `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `*.csproj`, etc. Use these to:

- Infer a sensible repo **name** (kebab-case, derived from `name` field or directory basename).
- Draft a one-line repo **description** (from package description, README first paragraph, or "Initial commit").
- Decide whether the project looks like a library, CLI, web app, etc. — this informs commit message.

If a `.gitignore` is missing and the project type is obvious (Node, Python, Rust, Go), generate a reasonable one before staging.

### 2. List candidate orgs

```bash
gh api user --jq '.login'
gh api user/orgs --jq '.[].login'
```

### 3. Ask the user

Use `AskUserQuestion` with **two questions in one batch**:

1. **Owner** — options: each org returned above + the personal account. Header: "Owner".
2. **Visibility** — options: "Private (Recommended)", "Public". Header: "Visibility".

Do not ask about the name unless the inferred name collides with an existing repo. To check:

```bash
gh repo view "<owner>/<name>" >/dev/null 2>&1 && echo "exists" || echo "free"
```

If it exists, ask the user for an alternative name.

### 4. Initialize git + craft commit

If not already a git repo:

```bash
git init -b main
```

Stage everything respecting `.gitignore`:

```bash
git add -A
git status --short
```

Review staged files — if anything that looks like a secret (`.env`, `*.pem`, `id_rsa`, credentials, `*.sqlite` with data) is staged, **stop**, warn the user, and ask them to confirm before proceeding. Prefer adding such paths to `.gitignore` and unstaging.

Compose a commit message using Conventional Commits:

- Subject: `feat: initial commit` or more specific if the project type is clear (e.g., `feat: scaffold next.js app`, `feat: add pi cli skill`).
- Body: one short paragraph summarizing what the codebase does, derived from the README / package manifest. Skip the body if the project is trivial.

Commit:

```bash
git commit -m "$(cat <<'EOF'
feat: <subject>

<optional body>
EOF
)"
```

### 5. Create the remote and push

```bash
gh repo create "<owner>/<name>" \
  --<private|public> \
  --description "<one-line description>" \
  --source . \
  --remote origin \
  --push
```

`--source . --push` handles both adding the remote and pushing `main` with `-u`. If it fails because the remote already exists locally, drop `--source/--remote/--push`, run `gh repo create` standalone, then:

```bash
git remote add origin "git@github.com:<owner>/<name>.git"
git push -u origin main
```

### 6. Confirm

Print:

- Repo URL (`gh repo view --json url -q .url`).
- Commit SHA.
- Default branch.

## Rules

- Never use `git add -A` if `git status` shows untracked files outside the user's intent (e.g., `node_modules/` slipping past a missing `.gitignore`). Fix the ignore file first.
- Never force-push.
- Never run `gh repo delete`.
- If the user declines the visibility choice or doesn't answer, **default to private**.
- Don't generate a README if one is missing — that's the user's job, not this skill's.
- Don't add license files unless the user asks.

## Helper

For the full flow as a single non-interactive script (still asks the two questions via `AskUserQuestion` before running), see [scripts/init.sh](scripts/init.sh).
