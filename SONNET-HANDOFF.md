# Sonnet Handoff

Use this file as the short execution brief. The full specification lives in [PLAN-explorer-mode.md](/Users/vonwao/dev/micro-projects/game-13/PLAN-explorer-mode.md).

## Mission

Implement a new primary mode, `Word Hunt`, while preserving the current corruption/seal mode under the new name `Siege`.

The finished game must still assemble into a single output file:

- `lexicon-deep.html`

The current implementation is already split into modules under:

- `modules/`

## Source Of Truth

Read these first, in order:

1. `PLAN-explorer-mode.md`
2. `SONNET-HANDOFF.md`
3. `modules/game.js`
4. `modules/board.js`
5. `modules/input.js`
6. `modules/renderer.js`

If this handoff and the plan ever differ, prefer `PLAN-explorer-mode.md`.

## Key Priorities

1. `Word Hunt` is the default and primary mode.
2. `Siege` must keep working.
3. Player-facing settings stay simple:
   - mode
   - difficulty
   - board size
   - goal
   - sound
   - particles
   - special tiles
4. Internal tuning must move into `modules/constants.js`.
5. Touch support is automatic on touch devices. Do not add a separate touch checkbox in v1.
6. No planted-word hints before discovery.
7. Keep the single-file assembly flow intact.

## Implementation Order

Follow Part 8 of `PLAN-explorer-mode.md` exactly. Commit after each step.

High-level sequence:

1. Add `modules/constants.js` and `modules/settings.js`, wire settings phase.
2. Add `Word Hunt` board generation and route generation by `state.gameMode`.
3. Add `Word Hunt` scoring, planted-word detection, and non-refreshing tiles.
4. Add `modules/challenges.js` and sidebar UI.
5. Add `modules/touch.js` with tap-to-spell and touch action bar.
6. Polish, reassemble, and verify both modes.

## Acceptance Checklist

Before finishing, verify all of these:

- Settings screen defaults to `Word Hunt`
- Settings screen adapts by selected mode
- Difficulty and board size are shared across both modes
- `Word Hunt` has no corruption or seal mechanics
- `Word Hunt` tiles stay on the board after use
- Hidden planted words come from the dictionary, not a hardcoded theme list
- Common fragments come from constants, not user settings
- `Siege` still has corruption, seals, and current win/loss logic
- `lexicon-deep.html` assembles successfully
- Desktop keyboard input still works
- Touch input works in device emulation or on a real touch device

## Commands

Use these for the main verification loop:

```bash
bash assemble.sh
open lexicon-deep.html
git status --short
```

## Suggested Prompt

Use this as the working prompt for the smaller model:

```text
Read PLAN-explorer-mode.md and SONNET-HANDOFF.md first. Implement the Word Hunt / Siege mode split exactly as specified, following the implementation order in Part 8 of PLAN-explorer-mode.md. Commit after each step. Do not break Siege mode. Keep player-facing settings simple and move gameplay numbers into modules/constants.js. Preserve the single-file assembly flow to lexicon-deep.html via bash assemble.sh.
```
