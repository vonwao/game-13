# Session Summary

Date: 2026-04-20

## Current State

The repo is clean on `main`. In practical terms, the project is now in a hybrid state:

- the game core is still plain JS/canvas in `modules/`
- a new React/Vite shell now exists and is partially integrated
- `assemble.sh` and `lexicon-deep.html` still exist as the legacy standalone path
- the long-term direction is now clear: Vite + React for shell/UI, canvas for board/gameplay

## What We Built In This Conversation

### 1. Word Hunt became a real mode

We took the original game and built out a much stronger Word Hunt layer:

- settings flow and phase structure
- Word Hunt board generation
- Word Hunt scoring with:
  - letter points
  - length multiplier
  - shape multiplier
  - combo multiplier
  - crystal / ember effects
- timed / turns / objectives end conditions
- challenges/objectives
- touch/tap-to-spell support
- later, unified pointer input for mouse/touch/pen
- tile reuse rules and word-color striping
- min 4-letter requirement in Word Hunt
- stronger corner penalty
- best-path selection by score when a word appears in multiple places

Relevant checkpoints:

- `78ddd6b` through `18d91f6`
- `a6075d4`, `e82b7d1`, `d2040f7`, `d41c17e`, `096f67e`

### 2. We improved score clarity and observability

A big part of this conversation was making the game legible:

- live score breakdown while typing
- word history with scores and reasons
- best-scoring path auto-selection
- debug overlay
- help screen became tabbed
- “turns” for path shape was renamed to “corners”
- defaults changed to `easy / small / no special tiles`

Relevant commits:

- `d41c17e`
- `8b0e6c0`
- `ff341e5`

### 3. We fixed planted-word quality and progression

We agreed the raw dictionary was producing bad planted words, so we changed direction:

- added a curated/common-word direction for planted words
- overhauled Word Hunt progression
- reduced challenge sprawl into a more focused objective system
- added clues and a stronger discovery loop
- made planted words and hidden-word flow more intentional

Relevant commit:

- `8b0e6c0`

### 4. We did a serious input architecture cleanup

We identified the key technical problems correctly:

- source-of-truth ambiguity between `modules/` and assembled HTML
- touch-only gameplay input
- cross-module underscore/private helper leakage

Then we executed the cleanup:

- generated-file discipline for `lexicon-deep.html`
- added a gameplay action layer
- unified gameplay input around pointer events
- removed old private cross-module input coupling
- added sprint sanity checks

Relevant commits:

- `7adbd01`
- `559bc17`
- `ea03363`
- `032e749`

### 5. We wrote and refined the planning docs

We spent real time aligning architecture and execution plans, not just coding blindly.

Created and tightened:

- [NEXT-SPRINT-PLAN.md](/Users/vonwao/dev/micro-projects/game-13/NEXT-SPRINT-PLAN.md)
- [ROADMAP.md](/Users/vonwao/dev/micro-projects/game-13/ROADMAP.md)
- [RESPONSIVE-SHELL-MIGRATION.md](/Users/vonwao/dev/micro-projects/game-13/RESPONSIVE-SHELL-MIGRATION.md)

And refined them based on feedback:

- shared action layer before pointer refactor
- explicit bridge contract
- split shell migration vs board-profile work
- stricter shell/core boundary
- React shell must not become a second gameplay brain

Relevant commits:

- `892aa2b`
- `961a896`
- `2095129`
- `f42c042`
- `fede988`

### 6. We changed course on mobile and UI architecture

This was a major shift.

We realized:

- canvas-only responsive UI was breaking down
- mobile should be board-first and no-scroll by default
- menus/help/debug/history/objectives belong in DOM/CSS, not canvas
- React/Vite makes sense for the shell, but not for the board renderer

That led to the current architecture decision:

- canvas keeps:
  - board rendering
  - tile/path visuals
  - gameplay-space effects
- React shell owns:
  - title
  - settings
  - help
  - objectives
  - discoveries
  - history
  - shell-level status/inspector

### 7. We started the actual React/Vite migration

This is the biggest current implementation area.

What landed:

- Vite + React scaffold
- shell bridge from the legacy core
- shell mounts the legacy canvas core
- shell now owns setup controls
- shell now owns run/reference panels
- shell layout is responsive and stage-first
- legacy canvas-side duplicate help/history/sidebar panels are suppressed in shell mode

Key commits:

- `b0c2eca` scaffold
- `9bfeb58` shell bridge from core
- `c7b2192` mount legacy core inside shell
- `1d57698` setup controls into shell
- `249c8dc` expose shell data and suppress duplicated canvas panels
- `def3605` / `4d9e5ce` move help/history/objectives/discoveries/status into shell

### 8. We started board-profile / responsive board work

We also began the second track: making board dimensions orientation-aware.

What exists now:

- portrait/landscape board profiles
- shell layout hook into the core
- shell measures the real stage area
- core can pick board dimensions from shell layout on new runs/rounds
- renderer now respects profile tile targets

Relevant commits:

- `11fcb71` profile helpers
- `58b8cbd` shell layout hook
- `814487a` shell layout feeds profile selection
- `09d5bd0` renderer uses tile targets

## Where We Are Right Now

The architecture is now:

- `modules/` = canonical gameplay/core source
- React/Vite shell is real and partially integrated
- `assemble.sh` still exists, but it is now clearly the legacy standalone path
- the intended future is:
  - Vite shell as primary app
  - legacy assembled HTML retired or kept only temporarily/export-only

## Most Important Implemented Pieces Right Now

- Word Hunt is much more mature
- pointer input is unified
- debug/help/history/objectives are much better
- shell/core boundary exists
- React shell is no longer hypothetical
- responsive board-profile system has started to affect runtime

## Main Unresolved Issue

The Vite app was showing a blank page when opened. We changed the startup model in:

- `33efb64` `fix: render shell before legacy core finishes loading`

That means the shell now renders immediately and the legacy core loads in the background, which is the correct architecture anyway. But this needs a real browser retest to confirm the blank-page symptom is gone.

So the main immediate next step is:

- retest the Vite app
- if it still blanks, fix the remaining runtime error
- once the Vite shell is reliably visible, continue board-fit/mobile tuning there, not in the legacy assembled path

## Short Version

We did three big things in this conversation:

1. Made the game itself much better
   - Word Hunt, scoring, history, debug, help, progression, planted words
2. Made the codebase more trustworthy
   - source-of-truth discipline
   - pointer input
   - shared actions
   - cleaner shell/core boundary
3. Changed the product architecture
   - from “canvas app with awkward overlays”
   - to “canvas gameplay core inside a React/Vite responsive shell”

That is the real state of the project now.
