#!/usr/bin/env bash
# Push clean local history to a fresh GitHub repo (no orphaned cursoragent commits).
set -euo pipefail

REPO_URL="${1:-https://github.com/jmarcos3-max/lark-v2.git}"
REMOTE_NAME="${2:-lark-v2}"

cd "$(dirname "$0")/.."

if ! git remote get-url "$REMOTE_NAME" &>/dev/null; then
  git remote add "$REMOTE_NAME" "$REPO_URL"
fi

echo "Checking $REPO_URL exists..."
if ! git ls-remote "$REMOTE_NAME" &>/dev/null; then
  echo ""
  echo "Create an empty public repo first (no README/license):"
  echo "  https://github.com/new?name=lark-v2"
  echo ""
  echo "Then run: npm run publish:lark-v2"
  exit 1
fi

echo "Pushing main..."
git push -u "$REMOTE_NAME" main

if git show-ref --verify --quiet refs/heads/johns-branch; then
  echo "Pushing johns-branch..."
  git push -u "$REMOTE_NAME" johns-branch
fi

echo ""
echo "Done. Next steps on the new repo:"
echo "  1. Settings → Secrets → add VITE_AUDIOTOOL_CLIENT_ID (and optional VITE_ELEVENLABS_API_KEY)"
echo "  2. Settings → Pages → source: GitHub Actions (workflow runs on push)"
echo "  3. Audiotool portal → add redirect: https://jmarcos3-max.github.io/lark-v2/"
echo "  4. Live site: https://jmarcos3-max.github.io/lark-v2/"
