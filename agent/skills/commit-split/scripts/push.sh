#!/usr/bin/env bash
# commit-split helper: safe push.
#
# - If upstream is set: pull --rebase --autostash, then push.
# - If not: push -u origin <current-branch>.
# - Never force-pushes. Bails on rebase conflicts.

set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "not inside a git repository" >&2
  exit 1
}

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "detached HEAD — refusing to push" >&2
  exit 1
fi

if git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
  if ! git pull --rebase --autostash; then
    echo "rebase failed — resolve conflicts and re-run" >&2
    exit 1
  fi
  git push
else
  if ! git remote get-url origin >/dev/null 2>&1; then
    echo "no 'origin' remote configured — use the init-repo skill first" >&2
    exit 1
  fi
  git push -u origin "$BRANCH"
fi

echo "---"
echo "branch:   $BRANCH"
echo "upstream: $(git rev-parse --abbrev-ref @{upstream})"
echo "remote:   $(git remote get-url origin)"
git log --oneline -n 5
