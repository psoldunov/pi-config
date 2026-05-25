#!/usr/bin/env bash
# init-repo helper: create a GitHub repo and push the current directory.
#
# Usage:
#   init.sh --owner <user-or-org> --visibility <private|public> [--name <repo>] [--desc <text>] [--message <commit>]
#
# This script does the mechanical work *after* the SKILL.md flow has gathered
# owner/visibility from the user via AskUserQuestion. It refuses to run if the
# current directory already has an `origin` remote.

set -euo pipefail

OWNER=""
VISIBILITY=""
NAME=""
DESC=""
MESSAGE="feat: initial commit"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)      OWNER="$2"; shift 2 ;;
    --visibility) VISIBILITY="$2"; shift 2 ;;
    --name)       NAME="$2"; shift 2 ;;
    --desc)       DESC="$2"; shift 2 ;;
    --message)    MESSAGE="$2"; shift 2 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

[[ -z "$OWNER" ]]      && { echo "missing --owner" >&2; exit 2; }
[[ -z "$VISIBILITY" ]] && { echo "missing --visibility" >&2; exit 2; }

case "$VISIBILITY" in
  private|public) ;;
  *) echo "visibility must be 'private' or 'public'" >&2; exit 2 ;;
esac

command -v gh >/dev/null || { echo "gh CLI not installed" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "gh not authenticated — run 'gh auth login'" >&2; exit 1; }

# Default name = current dir basename, kebab-cased.
if [[ -z "$NAME" ]]; then
  NAME="$(basename "$PWD" | tr '[:upper:] _' '[:lower:]--' | sed 's/[^a-z0-9-]//g')"
fi
[[ -z "$NAME" ]] && { echo "could not derive repo name from PWD" >&2; exit 1; }

if gh repo view "$OWNER/$NAME" >/dev/null 2>&1; then
  echo "repo $OWNER/$NAME already exists on GitHub" >&2
  exit 1
fi

# Initialize git if needed.
if [[ ! -d .git ]]; then
  git init -b main >/dev/null
fi

# Refuse to clobber an existing origin.
if git remote get-url origin >/dev/null 2>&1; then
  echo "remote 'origin' already configured — refusing to overwrite" >&2
  exit 1
fi

# Stage and commit if there's anything to commit.
git add -A
if ! git diff --cached --quiet; then
  git commit -m "$MESSAGE" >/dev/null
fi

# Create remote + push.
CREATE_ARGS=( "$OWNER/$NAME" "--$VISIBILITY" --source . --remote origin --push )
[[ -n "$DESC" ]] && CREATE_ARGS+=( --description "$DESC" )

gh repo create "${CREATE_ARGS[@]}"

echo "---"
gh repo view "$OWNER/$NAME" --json url,visibility,defaultBranchRef \
  --jq '{url: .url, visibility: .visibility, branch: .defaultBranchRef.name}'
echo "commit: $(git rev-parse --short HEAD)"
