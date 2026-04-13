# LEXICON DEEP — Next Sprint Plan

## Purpose

This sprint is about making the codebase more trustworthy and the game feel more tactile on desktop and touch, without overhauling the full stack.

This document is the current execution plan.
If [ROADMAP.md](/Users/vonwao/dev/micro-projects/game-13/ROADMAP.md) and this file ever feel out of sync, the roadmap sets overall priority and this file should be updated to match it.
The next major UI/platform step after this sprint is documented in [RESPONSIVE-SHELL-MIGRATION.md](/Users/vonwao/dev/micro-projects/game-13/RESPONSIVE-SHELL-MIGRATION.md).

The immediate focus is:

1. establish one canonical source of truth
2. add one honest gameplay action layer
3. unify gameplay input around pointer events
4. prepare, but do not yet execute, a later move of text-heavy UI from canvas into DOM/CSS overlays

This is an execution plan, not a speculative design memo.

---

## Current Read

The game is in a good prototype state:

- gameplay structure is real
- Word Hunt has genuine shape now
- scoring/history/challenges are already richer than a toy prototype
- the modular split is decent

The main technical liabilities are:

- `modules/` and `lexicon-deep.html` need to be treated explicitly as source vs generated output
- gameplay input is split awkwardly across keyboard, touch, settings-click, and hover systems
- `modules/touch.js` currently calls underscore-prefixed helpers in `modules/input.js`
- touch capability is treated as a gameplay mode gate in `modules/game.js`
- text-heavy UI in canvas is getting harder to polish cleanly

---

## Sprint Goals

### Primary goals

- Make desktop pointer play first-class.
- Make input architecture simpler and more intentional.
- Reduce hidden coupling between modules.
- Preserve current game feel while improving maintainability.

### Secondary goals

- Add explicit generated-file discipline to the assembly flow.
- Clarify the later path for DOM/CSS overlays.

### Non-goals for this sprint

- Full Vite migration
- Bun evaluation/adoption
- Full DOM/CSS UI rewrite
- Major scoring redesign
- New game modes or major content expansion

---

## Architectural Decisions

### 1. Canonical source

The canonical source is:

- `modules/*.js`
- `assemble.sh`

Generated output is:

- `lexicon-deep.html`

Rules:

- Never hand-edit `lexicon-deep.html`.
- Add a clear generated banner via `assemble.sh`.
- Treat the assembled HTML as a build artifact and test artifact, not an editable source file.

### 2. Input model

Gameplay input should be modeled as:

- keyboard input
- pointer input
- touch input

not as:

- keyboard mode
- touch mode

Touch and mouse are both pointer-capable devices. The gameplay layer should unify them.

### 3. Action layer

Raw events should not call semi-private logic across modules.

We will introduce a dedicated shared action module that sits between:

- raw events
- gameplay logic

The action layer will own player intents such as:

- start path
- extend path
- trim path
- restart path
- clear current word
- submit current word
- use clue
- scroll board

Chosen location:

- `modules/actions.js`

Recommended ownership split:

- action module owns gameplay intents
- `modules/input.js` becomes the keyboard adapter plus validation/scoring helpers
- pointer/touch adapter becomes the pointer event adapter

The important point is that keyboard wiring and action semantics should not stay conceptually fused.

### 4. UI rendering split

Short-term:

- keep all existing UI working in canvas

Long-term:

- keep board/tile/path/particle rendering in canvas
- move help/debug/settings and other text-heavy panels to DOM/CSS overlays

This UI migration is intentionally decoupled from the input cleanup sprint.

---

## Target State After This Sprint

By the end of the sprint:

- `modules/` is clearly the only source of truth
- one dedicated action module exists
- desktop mouse can play the board through pointer input
- touch still works
- keyboard still works
- pointer and keyboard both use shared gameplay actions
- `touch.js` no longer reaches into underscore helpers in `input.js`
- the game no longer relies on `STATE.touch.enabled` as the main gameplay-input switch
- we have a written and validated staged plan for later DOM/CSS overlays

---

## Work Breakdown

## Phase 1 — Source Of Truth Hardening

### Deliverables

- `assemble.sh` writes a generated-file banner into `lexicon-deep.html`
- project convention documented in comments and this plan

### Concrete changes

- update [assemble.sh](/Users/vonwao/dev/micro-projects/game-13/assemble.sh)
- prepend a visible banner comment near the top of generated HTML

### Acceptance criteria

- opening `lexicon-deep.html` clearly indicates it is generated
- no manual edits are required in the assembled file

---

## Phase 2 — Shared Action Layer

### Goal

Stop cross-module underscore calls and replace them with explicit shared actions.

### Why this comes before pointer work

The pointer adapter should land against a stable action contract.
If pointer work happens first, there is a high risk of re-creating the current coupling in a new form.

### Why this matters

Right now calls like these leak private implementation details across modules:

- `LD.Input._refreshInputState()`
- `LD.Input._submitWord()`
- `LD.Input._rejectWord()`
- `LD.Input._useClue()`

This creates:

- misleading API boundaries
- brittle refactors
- event-layer coupling to internal implementation details

### Preferred design

Introduce a real action API in `modules/actions.js` rather than burying it under `LD.Input`.

Candidate actions:

- `startPath(tile)`
- `extendPath(tile)`
- `trimPathTo(tile)`
- `restartPath(tile)`
- `clearCurrentWord()`
- `submitCurrentWord()`
- `rejectCurrentWord()`
- `useClue()`
- `scrollBoard(dx, dy)`

### Compatibility transition

The lowest-risk transition is:

1. add stable public gameplay actions
2. migrate keyboard input to those actions
3. migrate pointer/touch input to those actions
4. remove underscore-based cross-module usage
5. internalize any leftovers that are still private

### Important boundary

Raw event modules should express intent only.

Examples:

- keyboard adapter says "submit current word"
- pointer adapter says "extend path to this tile"
- settings/menu says "change mode"

They should not reach directly into internal scoring or validation helpers.

### Acceptance criteria

- one dedicated action module exists
- keyboard uses the shared actions where appropriate
- no new work depends on underscore-prefixed input helpers
- the pointer layer can be built against the action contract

---

## Phase 3 — Pointer Input Refactor

### Goal

Replace touch-only gameplay pathing with unified pointer-based gameplay input.

### Current state

- gameplay touch input lives in [modules/touch.js](/Users/vonwao/dev/micro-projects/game-13/modules/touch.js)
- settings click/tap input lives in [modules/settings.js](/Users/vonwao/dev/micro-projects/game-13/modules/settings.js)
- hover tracking lives in [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)
- keyboard gameplay lives in [modules/input.js](/Users/vonwao/dev/micro-projects/game-13/modules/input.js)

### Desired state

- gameplay pointer input uses:
  - `pointerdown`
  - `pointermove`
  - `pointerup`
  - `pointercancel`
- one gameplay adapter handles:
  - mouse
  - touch
  - pen

### Recommended implementation

- Rename or replace `modules/touch.js` with a unified gameplay pointer adapter.
- Keep the on-screen action bar there initially if that is lower-risk.
- Separate three concerns inside that file:
  - raw pointer event handling
  - tile/path interaction logic
  - action-bar interaction

### Desktop pointer UX rules

- click tile to start a path
- drag across adjacent tiles to extend
- click current tile to undo last step
- click an earlier tile in the path to trim back to it
- click a non-adjacent tile to restart from that tile
- submit via button or Enter
- optional double-click/double-tap submit only if it remains reliable

### Acceptance criteria

- desktop mouse can start, extend, trim, restart, clear, and submit words
- touch still supports pathing and action-bar play
- keyboard entry remains intact
- no regression in score preview/history/challenges

---

## Phase 4 — State Boundary Cleanup

### Goal

Make state easier to reason about without a giant rewrite.

### Current useful buckets

- game state
- board state
- input state
- UI state
- settings state

### Scope limit

This phase is intentionally narrow.
It should not become:

- a full state schema redesign
- a nested-store rewrite
- a broad rename/move-everything refactor

### Concrete near-term cleanup only

- treat `showHelp`, `helpTab`, `debug`, hover state, and related flags as UI-facing state
- reduce the use of `STATE.touch.enabled` as a gameplay branch
- document ownership of each major state slice in code comments

### Acceptance criteria

- state responsibilities are clearer in `modules/game.js`
- new input code no longer depends on "touch-enabled device" as the primary gameplay switch

---

## Phase 5 — Desktop/Touch Polish Pass

### Goal

Make the new unified input feel intentional, not just technically functional.

### Work items

- tune drag thresholds so pointer pathing feels stable
- ensure action-bar buttons do not conflict with board dragging
- make scroll mode behavior predictable
- verify clue use, undo, clear, and submit all feel coherent on desktop and touch

### Acceptance criteria

- pointer play feels natural on desktop
- touch play still feels deliberate on mobile
- there are no obvious accidental submits or accidental restarts

---

## Phase 6 — UI Migration Planning Only

### Goal

Write down the staged path for moving text-heavy UI to DOM/CSS later, without implementing it yet.

### Current canvas-rendered non-board UI

- settings screen in [modules/settings.js](/Users/vonwao/dev/micro-projects/game-13/modules/settings.js)
- help overlay in [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)
- debug overlay and debug history panels in [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)
- objectives sidebar in [modules/challenges.js](/Users/vonwao/dev/micro-projects/game-13/modules/challenges.js)
- discovery and recent-word panels in [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)

### Staged DOM/CSS migration path

1. Introduce one overlay root above the canvas.
2. Move help first.
3. Move debug second.
4. Move settings/main menu third.
5. Reassess objectives/discovery/history after the overlay pattern is proven.

### Why this order

- help/debug/settings are text-heavy and low-risk
- the board rendering can remain stable in canvas
- objective/discovery/history panels are closer to in-play HUD, so they should move only if it is clearly beneficial

### Important constraint

The DOM layer should read from shared state and dispatch shared actions. It should not become a second game-logic owner.

---

## File-Level Execution Plan

## Core files likely to change in this sprint

- [assemble.sh](/Users/vonwao/dev/micro-projects/game-13/assemble.sh)
- [modules/game.js](/Users/vonwao/dev/micro-projects/game-13/modules/game.js)
- [modules/input.js](/Users/vonwao/dev/micro-projects/game-13/modules/input.js)
- [modules/touch.js](/Users/vonwao/dev/micro-projects/game-13/modules/touch.js) or replacement pointer-input module
- [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)

## Files likely not to change much in this sprint

- `modules/board.js`
- `modules/pathfinder.js`
- `modules/challenges.js`
- dictionary/common-word generation files

---

## Parallelization Plan

The sprint can be parallelized, but only if ownership boundaries stay clean.

## Recommended worker split

### Worker A — Action Layer + Input API

Ownership:

- [modules/input.js](/Users/vonwao/dev/micro-projects/game-13/modules/input.js)
- small plumbing in [modules/game.js](/Users/vonwao/dev/micro-projects/game-13/modules/game.js)

Responsibilities:

- define the shared gameplay action contract
- expose honest public entry points
- remove underscore-private leakage
- migrate keyboard behavior onto the action contract

Why it parallelizes cleanly:

- mostly isolated to gameplay action semantics

### Worker B — Pointer Gameplay Adapter

Ownership:

- [modules/touch.js](/Users/vonwao/dev/micro-projects/game-13/modules/touch.js) or replacement file

Responsibilities:

- convert touch-only gameplay input to pointer events
- implement desktop mouse pathing
- keep action-bar behavior coherent
- call Worker A’s action contract, not input internals

Why it parallelizes cleanly:

- it should depend on the action contract, not on input internals

### Worker C — Settings/Input Surface Cleanup

Ownership:

- [modules/settings.js](/Users/vonwao/dev/micro-projects/game-13/modules/settings.js)
- small coordination touches in [modules/game.js](/Users/vonwao/dev/micro-projects/game-13/modules/game.js)

Responsibilities:

- keep settings-screen input isolated
- prepare clearer separation between settings interaction and gameplay pointer interaction

Why it parallelizes cleanly:

- settings screen is already fairly isolated

### Worker D — Renderer Hover/UI Glue

Ownership:

- [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js)

Responsibilities:

- keep hover/tooltips coherent with the new pointer model
- make any minimal HUD/input-bar adjustments needed after pointer cleanup
- avoid changing board logic

Why it parallelizes cleanly:

- hover state and render-side glue are mostly isolated from core game logic

### Worker E — UI Migration Design Doc

Ownership:

- docs only

Responsibilities:

- produce the DOM/CSS overlay migration plan
- inventory current canvas UI surfaces
- define staged migration order

Why it parallelizes cleanly:

- no code overlap

## Parallelization caveats

- Worker B should not define the public action API. Worker A owns that.
- Worker D should not change gameplay behavior, only renderer-side integration.
- Worker C should stay out of pointer gameplay code except for clearly shared input initialization.
- If Worker B and Worker D both touch `modules/renderer.js`, split responsibility before starting.

---

## Suggested Commit Sequence

1. `chore: mark assembled html as generated output`
2. `refactor: add shared gameplay action API`
3. `refactor: migrate keyboard input to shared actions`
4. `feat: unify board input with pointer events`
5. `refactor: remove touch-mode gameplay gating`
6. `polish: tune pointer interaction and renderer glue`
7. `docs: add DOM overlay migration plan`

This sequence keeps the riskiest behavioral changes separated from the structural cleanup.

---

## Verification Checklist

### Functional verification

- `bash assemble.sh` succeeds
- assembled output still opens and runs
- keyboard typing and submit still work
- desktop mouse can path through tiles
- touch still works in device emulation
- score preview still updates correctly
- word history/debug/help still function
- no regressions in Word Hunt round flow
- Siege still launches and plays

### Architectural verification

- no cross-module underscore calls remain for gameplay actions
- `modules/` remains the sole source of truth
- pointer gameplay no longer depends on device detection as the core switch

### Minimal sanity checks

These do not need to be elaborate, but they should be explicit:

- assembled file contains the generated banner
- no gameplay module still reaches into underscore-prefixed input helpers
- gameplay pointer module registers the expected pointer events
- build and verification steps are documented and repeatable

---

## Decision Point After This Sprint

After the input/action cleanup is stable, reassess whether to:

- stay on the current assembly workflow a bit longer
- or start a Vite migration specifically to support better UI overlay work

At that point, revisit:

- Vite as the primary dev path
- keeping single-file HTML as a packaging/export artifact
- whether Bun adds enough value to justify a tooling change

Do not decide Bun first. Decide based on the UI/tooling pressure after the sprint.

---

## Bottom Line

This sprint should not try to do everything.

It should do the highest-value structural cleanup:

- one source of truth
- one unified gameplay input path
- one honest action layer

That gives the project a much stronger foundation for the next phase of polish.
