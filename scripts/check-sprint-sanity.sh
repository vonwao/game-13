#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/5] Syntax check"
node --check modules/game.js
node --check modules/input.js
node --check modules/actions.js
node --check modules/touch.js
node --check modules/renderer.js

echo "[2/5] Assemble"
bash assemble.sh >/dev/null

echo "[3/5] Generated banner"
rg -n "GENERATED FILE - DO NOT EDIT|Source of truth: modules/\\*\\.js \\+ assemble\\.sh" lexicon-deep.html >/dev/null

echo "[4/5] No cross-module underscore input calls"
if rg -n "LD\\.Input\\._(submitWord|rejectWord|useClue|refreshInputState)" modules >/dev/null; then
  echo "Found legacy underscore input calls in modules/" >&2
  exit 1
fi

echo "[5/5] Pointer events wired"
rg -n "pointerdown|pointermove|pointerup|pointercancel" modules/touch.js >/dev/null

echo "Sanity checks passed."
