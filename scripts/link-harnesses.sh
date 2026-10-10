#!/usr/bin/env bash
# Symlink harness skill dirs to the canonical store so OpenAI/Claude/Cursor-style
# harnesses discover the same skills pi does. Canonical stores:
#   repo-level:  .agents/skills/          (this pack)
#   global:      ~/.pi/agent/skills/      (pi global skills)
# Idempotent: re-runs refresh the symlinks. Refuses to touch a real directory.
set -euo pipefail

CANONICAL_REPO=".agents/skills"
CANONICAL_GLOBAL="$HOME/.pi/agent/skills"
REPO_TARGETS=(".claude/skills" ".codex/skills" ".cursor/skills")
GLOBAL_TARGETS=("$HOME/.claude/skills" "$HOME/.codex/skills" "$HOME/.cursor/skills")

link() { # link <canonical> <target>
  local canonical="$1" target="$2"
  if [ -e "$target" ] && [ ! -L "$target" ]; then
    echo "SKIP $target (real directory exists — resolve manually, single-owner rule)"
    return 0
  fi
  mkdir -p "$(dirname "$target")"
  ln -sfn "$canonical" "$target"
  echo "LINK $target -> $canonical"
}

case "${1:-repo}" in
  repo)
    [ -d "$CANONICAL_REPO" ] || { echo "no $CANONICAL_REPO here; run from the repo root"; exit 1; }
    for t in "${REPO_TARGETS[@]}"; do link "$PWD/$CANONICAL_REPO" "$t"; done
    ;;
  global)
    [ -d "$CANONICAL_GLOBAL" ] || { echo "no $CANONICAL_GLOBAL"; exit 1; }
    for t in "${GLOBAL_TARGETS[@]}"; do link "$CANONICAL_GLOBAL" "$t"; done
    ;;
  all) "$0" repo; "$0" global ;;
  *) echo "usage: link-harnesses.sh [repo|global|all]"; exit 1 ;;
esac

echo "verify: ls -la .claude/skills .codex/skills .cursor/skills"