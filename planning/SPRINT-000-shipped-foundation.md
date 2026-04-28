# Sprint 000 — Shipped Foundation

Status: Completed

This is a lightweight historical baseline, not a live plan.

## What shipped

1. The React/Vite shell became the canonical runtime around the legacy canvas core.
2. The shell/core bridge was hardened and now has automated verification via `scripts/verify-bridge.mjs`.
3. The skin system landed with Page, Terminal, and Full Bleed themes.
4. The in-play shell was redesigned around a canonical HUD, action bar, right rail, and phone objectives bottom sheet.
5. Settings and Help were rebuilt as shell-native surfaces instead of legacy side panels.
6. Word Hunt input/path feedback was simplified:
   - typed prefixes highlight viable cells
   - worn/spent tile behavior is clearer
   - per-word shared-tile cap was removed while tile exhaustion stayed
7. Navigation was redesigned around a pause-card menu with shared Pause / Round Complete / Run Complete overlays.
8. A real paused phase was added so timers and gameplay input stop while the pause surface is open.
9. Combo was removed from the active product path, and wildcard scoring was wired as `×0.5`.
10. Siege was deprecated as a public mode and hidden behind `?legacyModes=1`, documented in [LEGACY-MODES.md](../LEGACY-MODES.md).

## Why this matters

The project is no longer blocked by architecture confusion.

The main product now has:

- one canonical shell
- one public mode
- one coherent navigation system
- one verified shell/core bridge

## What remains intentionally unfinished

- the home/start surface still reads as scaffolding rather than a designed front door
- the new flow-state overlays are structurally correct but can be richer
- settings still contains disabled placeholder controls
- legacy Siege code is preserved but not yet better contained internally
