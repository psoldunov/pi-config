#!/usr/bin/env bash
# commit-split helper: emit current working-tree state plus a rough grouping
# of changed paths by top-level directory and Conventional Commits type.
#
# This is a *suggestion*, not authoritative — the SKILL.md flow re-clusters
# using diff semantics before committing.

set -euo pipefail

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "not inside a git repository" >&2
  exit 1
}

echo "## branch"
git rev-parse --abbrev-ref HEAD
echo

echo "## status"
git status --short
echo

echo "## diff stat (working tree vs HEAD)"
git diff HEAD --stat || true
echo

echo "## proposed groups"

# Collect all changed paths (tracked + untracked).
paths=$(
  {
    git diff HEAD --name-only
    git ls-files --others --exclude-standard
  } | sort -u
)

if [[ -z "$paths" ]]; then
  echo "(clean tree)"
  exit 0
fi

classify() {
  local p="$1"
  case "$p" in
    *.md|*.mdx|docs/*|README*|CHANGELOG*) echo "docs" ;;
    *test*|*spec*|tests/*|__tests__/*)    echo "test" ;;
    package.json|pnpm-lock.yaml|yarn.lock|package-lock.json|Cargo.lock|go.sum|poetry.lock|requirements*.txt|uv.lock)
                                          echo "chore(deps)" ;;
    *.config.*|tsconfig*.json|.eslintrc*|.prettierrc*|biome.json|vite.config.*|next.config.*)
                                          echo "chore(config)" ;;
    .github/*|.gitlab/*|.circleci/*|*.yml|*.yaml)
                                          echo "ci" ;;
    *) echo "feat" ;;
  esac
}

# Bucket: "<type>\t<top-dir>" → newline-joined paths.
declare -A buckets

while IFS= read -r p; do
  [[ -z "$p" ]] && continue
  type=$(classify "$p")
  top="${p%%/*}"
  [[ "$top" == "$p" ]] && top="(root)"
  key="${type}|${top}"
  buckets[$key]+="${p}"$'\n'
done <<< "$paths"

i=1
for key in "${!buckets[@]}"; do
  type="${key%%|*}"
  top="${key#*|}"
  echo
  echo "### group $i — $type, dir: $top"
  printf '%s' "${buckets[$key]}" | sed '/^$/d' | sed 's/^/  - /'
  i=$((i+1))
done
