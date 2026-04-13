# LEXICON DEEP — Responsive Shell Migration Plan

This document defines the next major architectural move for Lexicon Deep:

- keep the board and core gameplay rendering in canvas
- move menus and text-heavy UI into a responsive React/Vite shell
- make mobile a first-class layout, not a squeezed desktop view

This is a concrete execution plan.
It is intentionally incremental.

If this file, [ROADMAP.md](/Users/vonwao/dev/micro-projects/game-13/ROADMAP.md), and [NEXT-SPRINT-PLAN.md](/Users/vonwao/dev/micro-projects/game-13/NEXT-SPRINT-PLAN.md) ever disagree:

- `ROADMAP.md` sets overall priority
- `NEXT-SPRINT-PLAN.md` covers the current low-level architecture sprint
- this file defines the next major UI/platform migration once that sprint is stable

---

## Why This Migration Exists

The current canvas-only app is hitting the point where:

- the board is strong
- the text-heavy UI is getting janky
- mobile is exposing a layout-model problem, not just isolated resize bugs

The key issue is this:

- canvas is good at board rendering, highlights, particles, and game feel
- canvas is bad at tabs, menus, help, debug panels, responsive layout, and text-heavy chrome

The game should not have two separate codebases for desktop and mobile.
It should have:

- one board/game system
- one set of UI components
- one responsive shell that places those components differently by screen shape

This plan has been tightened around five constraints:

- the bridge contract must be explicit before coding
- shell migration and board-fit work are separate tracks
- board-profile work should not be tuned against temporary shell chrome
- canvas vs shell ownership must be strict
- the shell must not become a second gameplay brain

---

## Product Principles

### 1. Same game, different information architecture

Mobile should not be a different ruleset.
It should be the same game with a different layout.

That means:

- same scoring
- same hidden-word logic
- same board interaction model
- different placement of objectives, history, help, debug, and menus

### 2. The board should occupy most of the screen

This is a core requirement.
The letter grid should take up most of the available play area on every device.

That means the shell must be designed around the board, not the other way around.

### 3. No-scroll mobile by default

On phones, free board scrolling is not the primary experience.
It is a fallback only.

Default phone play should be:

- no scrolling
- board fully visible
- one-finger pathing only

If a chosen board cannot fit legibly, the game should:

- change the board profile for that aspect ratio
- or downgrade the size tier on that device class

Scrolling should not be the first answer.

### 4. Responsive does not mean duplicate

We do not want:

- separate desktop settings screen
- separate mobile settings screen
- separate desktop help component
- separate mobile help component

We want:

- the same components
- placed into different layout slots
- styled through CSS breakpoints and responsive wrappers

---

## Target Architecture

## Keep In Canvas

These remain canvas-owned:

- board rendering
- tile art and special tile rendering
- path highlighting
- hover/selection effects on the board
- particles
- floating score texts
- board-space animations
- gameplay geometry and hit testing

Strict rule:

Canvas owns only UI and visuals that are:

- spatially tied to board coordinates
- animation-heavy
- timing-sensitive
- visually anchored to tiles, paths, or board geometry

Everything else should move to the shell.

In practice, [modules/renderer.js](/Users/vonwao/dev/micro-projects/game-13/modules/renderer.js) should eventually shrink toward:

- board rendering
- board-local FX
- minimal in-board overlays only

## Move To React/Vite Shell

These move out of canvas:

- title screen
- settings screen
- help UI
- debug UI
- objectives panel
- word history panel
- discoveries panel
- game-over / victory copy and controls
- shell-level HUD layout
- mobile sheets / drawers / tabs

The shell becomes the place for:

- responsive layout
- readable text
- tabs
- buttons
- menus
- secondary panels

---

## React/Vite Recommendation

Recommended stack:

- `Vite`
- `React`
- plain JavaScript first
- regular CSS with variables, flexbox, grid, and media queries

Not recommended for this step:

- Bun migration
- TypeScript-first rewrite
- React rewrite of the board renderer
- full state-management framework

Why this stack:

- Vite solves the dev/build ergonomics problem
- React is justified for the shell because the UI surface is now real, not tiny
- plain JS keeps migration cost down
- CSS handles layout cleanly without inventing more systems

The board remains canvas-based and imperative.
React is for the shell, not the game core.

## Bridge Contract v1

Before implementation, the bridge contract should be treated as a real public boundary.

### Bridge goals

- React reads normalized summary state only
- React dispatches commands and UI/settings updates only
- React does not read gameplay internals directly
- gameplay modules do not import React

### Read API

Required first-pass API:

- `getShellState()`
- `subscribeShell(listener)`

Semantics:

- `getShellState()` returns a stable, normalized snapshot intended for rendering
- it should contain presentation-ready summary data, not deep mutable internals
- `subscribeShell(listener)` should fire on meaningful state changes, not every animation frame
- time-based values like countdowns may be published on a throttled cadence suitable for UI, not at render-loop frequency

### Write API

Required first-pass API:

- `setUIState(patch)`
- `setSettings(patch)`
- `startGame()`
- `advanceRound()`

Semantics:

- `setUIState(patch)` is a shallow merge into shell-owned UI state only
- `setSettings(patch)` is a shallow merge into settings only
- these functions must reject or ignore fields outside their ownership boundary in development

### Command API

Shell-dispatched gameplay commands should be explicit:

- `LD.Actions.clearCurrentWord()`
- `LD.Actions.undoTileSelection()`
- `LD.Actions.submitCurrentWord()`
- `LD.Actions.useClue()`
- `LD.Actions.appendLetter(letter)`
- `LD.Actions.backspaceLetter()`

Only keep:

- `LD.Actions.scrollBoard(dx, dy)`

if scrolling survives as a fallback after board-fit work.

### Ownership boundary

- `LD.Game` owns phase transitions, round lifecycle, and high-level game orchestration
- `LD.Actions` owns player intents during gameplay
- the bridge owns normalization, subscription, and shell-safe mutation surfaces
- the shell owns layout and presentation only

### Development guardrails

Even if the shell remains plain JS at first, the bridge should have:

- JSDoc typedefs for shell state
- explicit comments documenting public vs internal bridge methods
- development-time assertions for invalid patches or illegal reads

TypeScript can be revisited later, but the bridge should not stay loosely specified.

---

## Responsive Layout Model

## Layout regions

The shell should be structured around these regions:

- `TopBar`
- `MainArea`
- `BoardPane`
- `SideRail`
- `BottomBar`
- `OverlayLayer`
- `MobileSheetLayer`

The layout changes by device shape, but the component set does not.

### Desktop landscape

Use:

- top bar
- board pane on the left/center
- side rail on the right
- bottom action/input bar

Typical side rail content:

- objectives
- discoveries
- recent words
- debug launcher

### Phone portrait

Use:

- compact top bar
- board pane taking most of the viewport
- compact bottom action/input bar
- no permanent side rail
- bottom sheet or modal access to:
  - objectives
  - history
  - help
  - debug

### Phone landscape

Use:

- compact top bar
- board pane still primary
- narrow side rail only if it does not materially shrink tile size
- otherwise use the same sheet-based model as portrait

### Tablet

Tablet can choose between:

- wide rail layout
- compact rail + sheet hybrid

The rule is not “tablet always gets a rail.”
The rule is:

- choose the layout that preserves the best board size

---

## Board Sizing And Aspect-Ratio Model

This is the part that canvas still needs to own.
CSS alone cannot solve it.

The board must stop assuming one fixed geometry per size tier.

Current model:

- `small = 20x16`
- `medium = 30x25`
- `large = 40x40`

That works for desktop.
It is not a good universal model for phones.

## New model: size tier + aspect profile

The game should choose board dimensions from:

- requested size tier
- screen orientation / device profile

Example:

```js
BOARD_PROFILES = {
  landscape: {
    small:  { width: 20, height: 16 },
    medium: { width: 30, height: 25 },
    large:  { width: 40, height: 40 },
  },
  portrait: {
    small:  { width: 13, height: 18 },
    medium: { width: 16, height: 22 },
    large:  null,
  },
}
```

These exact numbers are starting values, not sacred values.
The important principle is:

- portrait boards should be taller relative to width
- landscape boards can stay wider
- mobile should not try to fit desktop-shaped boards by shrinking letters into unreadability

## Initial implementation rule

To keep the first version disciplined:

- `portrait` and `landscape` are the only required profiles
- `small` must work well in both
- `medium` only needs to be good in landscape and large screens at first
- `large` can be disabled or degraded on phones initially

## Fit rule

At round setup:

1. shell measures the available board rectangle
2. shell passes available bounds and orientation to the core
3. core resolves the requested tier against the current board profile
4. renderer computes tile size from that resolved profile
5. if tile size falls below the minimum readable threshold:
   - try a lower density profile
   - or downgrade requested size tier on phone-class devices

This is better than enabling scroll by default.

### Layout authority

This split should be explicit:

- the shell owns layout measurement and responsive placement
- the core owns board/profile resolution given available bounds and requested tier

The shell should not decide the final tile math.
The core should not decide shell placement rules.

## Readability targets

Starting targets:

- phone portrait minimum tile size: `18-20`
- phone landscape minimum tile size: `16-18`
- desktop minimum tile size: `14-16`

These are tuning values, but they should be explicit.

---

## Shell-State Boundary

The React shell should not read the raw board state directly.
It should read a summary view and dispatch commands.

Recommended shell-facing state:

```js
shellState = {
  phase,
  gameMode,
  settings,
  ui,
  run,
  huntSummary,
  inputSummary,
  wordHistory,
}
```

Where:

- `phase` = `title | settings | playing | victory | gameover`
- `settings` = difficulty, boardSize, soundEnabled, particlesEnabled, specialTiles, endCondition
- `ui` = showHelp, helpTab, debug.enabled, debug.tab
- `run` = score, wordsSpelled, longestWord, turns, seedsDestroyed, totalSeeds
- `huntSummary` = round, maxRounds, roundTitle, timeRemaining, turnsRemaining, cluesRemaining, combo, bestCombo, completedCount, advanceAvailable
- `inputSummary` = typed, valid, hasPath, scorePreview
- `wordHistory` = normalized entries for display

The shell may write:

- `settings.*`
- `ui.showHelp`
- `ui.helpTab`
- `ui.debug.enabled`
- `ui.debug.tab`

Everything else should change through commands.

Recommended shell command surface:

- `LD.Game.startGame()`
- `LD.Game.advanceRound()`
- `LD.Actions.clearCurrentWord()`
- `LD.Actions.undoTileSelection()`
- `LD.Actions.submitCurrentWord()`
- `LD.Actions.useClue()`
- `LD.Actions.appendLetter(letter)`
- `LD.Actions.backspaceLetter()`

Only keep:

- `LD.Actions.scrollBoard(dx, dy)`

if scrolling survives as a fallback.

The shell should not touch:

- `board.tiles`
- `viewport`
- `touch.selectedTiles`
- `hunt.plantedWords` internals
- animation arrays
- particle state

The shell must also not become a second gameplay state machine.

Explicitly disallowed in shell code:

- deriving gameplay legality from raw board state
- recomputing score logic or preview math
- interpreting planted-word internals
- doing board-fit resolution beyond measuring available shell bounds
- maintaining alternate gameplay truth in React component state

---

## Proposed File Structure

This is the recommended early structure.
It is intentionally simpler than a long-term idealized component tree.

```text
index.html
src/
  main.jsx
  App.jsx
  styles/
    reset.css
    tokens.css
    app.css
  shell/
    GameShell.jsx
    useGameShellState.js
    gameBridge.js
    layout/
      ShellLayout.jsx
      MobileSheetLayer.jsx
    panels/
      TitleScreen.jsx
      SettingsScreen.jsx
      HelpPanel.jsx
      DebugPanel.jsx
      ObjectivesPanel.jsx
      HistoryPanel.jsx
      DiscoveriesPanel.jsx
      VictoryPanel.jsx
      GameOverPanel.jsx
    controls/
      TopBar.jsx
      BottomBar.jsx
      ActionButtons.jsx
  canvas/
    GameCanvas.jsx
    useCanvasGame.js
modules/
scripts/
```

Notes:

- `modules/` remain the gameplay core during migration
- React talks to the core through `gameBridge.js`
- the canvas component mounts the existing game core into a DOM container

---

## Migration Strategy

This migration is split into two tracks.

- `Track A` = shell migration
- `Track B` = board-fit / profile system

They are related, but they should not be implemented as one blended refactor.

Track B should begin only after enough shell chrome is real that the board rectangle is trustworthy.

## Track A — Shell Migration

### Phase A0 — Freeze The Boundary

Goal:

- decide the shell/canvas split before moving code

Tasks:

- add this plan
- define shell summary state
- define shell command surface
- define bridge semantics explicitly

Acceptance:

- team agrees what stays in canvas and what moves out

### Phase A1 — Introduce Vite + React Shell Skeleton

Goal:

- add the shell without breaking the current playable game

Tasks:

- add Vite
- add React entrypoint
- add root layout and CSS token system
- render the existing canvas game inside a React component
- keep `modules/` as the current gameplay core

Important:

- do not rewrite gameplay logic here
- do not move the board yet

Acceptance:

- game still runs
- React shell can wrap the canvas
- desktop and mobile CSS breakpoints are live

### Phase A2 — Add A Bridge Between React And Game Core

Goal:

- make the shell read normalized state and send commands

Tasks:

- expose a stable summary API from the game core
- add subscribe/unsubscribe for shell updates
- add shell command wrappers

Recommended API:

- `getShellState()`
- `subscribeShell(listener)`
- `setUIState(patch)`
- `setSettings(patch)`
- `startGame()`
- `advanceRound()`

Acceptance:

- React shell can render live state without reading deep internals

### Phase A3 — Move Title And Settings Out Of Canvas

Goal:

- prove the responsive shell pattern on the most obvious win

Tasks:

- replace canvas-rendered title screen with React
- replace [modules/settings.js](/Users/vonwao/dev/micro-projects/game-13/modules/settings.js) UI with React
- keep game start/settings mutations going through the bridge

Why this is first:

- it is phase-isolated
- it is the jankiest current responsive surface
- it does not touch core board gameplay

Acceptance:

- title/settings are fully shell-owned
- canvas no longer needs to render those screens

### Phase A4 — Go / No-Go Checkpoint

At the end of A2 or A3, stop and evaluate:

- is the bridge clean and stable enough?
- is the shell reducing friction rather than adding it?
- is React improving responsive work materially?
- is gameplay feel still intact?

If the answer is no, pause before continuing deeper into migration.

### Phase A5 — Move Help, Debug, Objectives, History, Discoveries

Goal:

- move text-heavy in-game chrome into shared responsive components

Tasks:

- build reusable panel components
- on desktop, place them in the rail
- on mobile, expose them through sheets or drawers
- remove equivalent canvas text panels once parity exists

Important:

- use the same components in both layouts
- only their container/placement changes

Acceptance:

- no duplicated mobile/desktop panel logic
- mobile has readable sheets
- desktop has a clean side rail

### Phase A6 — Rebuild In-Play HUD And Action Bar In The Shell

Goal:

- move shell-level HUD out of canvas

Tasks:

- top bar
- score/round/combo summary
- bottom input/action bar
- clue/action buttons
- word preview text

Canvas should keep only:

- board-local visuals
- board feedback that must be spatial

Acceptance:

- the board uses most of the screen
- shell chrome becomes easy to restyle responsively

### Phase A7 — Remove Old Canvas Shell Code

Goal:

- complete the shell migration and reduce dead weight

Tasks:

- remove canvas title/settings/help/debug UI code
- simplify `modules/renderer.js`
- retire or rewrite `modules/settings.js`

Acceptance:

- renderer is substantially simpler
- shell owns all non-board UI

## Track B — Board-Fit / Profile System

Track B begins after A3 at the earliest, and preferably after A5.

The reason is simple:

- board-fit logic should be tuned against the real shell chrome, not temporary placeholders

### Phase B1 — Orientation-Aware Board Profiles

Goal:

- make the board fill available play area intelligently by screen shape

Tasks:

- add `portrait` and `landscape` board profiles
- resolve actual board dimensions at round start
- tune `small` for phones first
- restrict or downgrade `medium/large` where necessary

Acceptance:

- phone portrait `small` feels intentional
- no-scroll mobile is viable
- the board occupies most of the screen

### Phase B2 — Fit Heuristics And Readability Thresholds

Goal:

- make board-fit decisions measurable, not vague

Tasks:

- define minimum tile targets per device class
- define downgrade rules for unsupported density/aspect combinations
- tune portrait and landscape fit against real shell rectangles

Acceptance:

- `small` on reference phones hits readable tile targets
- `medium` and `large` are either valid or intentionally downgraded
- no default phone layout depends on visible scrolling

### Phase B3 — Scroll Fallback Review

Goal:

- decide whether any scrolling survives as a fallback

Tasks:

- test two-finger panning only on oversized boards
- evaluate whether the fallback helps more than it harms
- remove scroll fallback entirely if it remains confusing

Acceptance:

- scrolling is either clearly justified or deleted

## Phase C — Final Cleanup

Goal:

- finish integration after both tracks are stable

Tasks:

- delete superseded temporary bridge helpers
- remove dead shell/canvas transitional code
- update docs to match the new steady state

Acceptance:

- no temporary migration hacks remain in core paths
- the architecture is easier to explain than before

---

## First Vertical Slice To Build

The first slice should be:

- Vite + React shell skeleton
- bridge API
- title screen
- settings screen

Why this slice:

- biggest visible quality improvement
- lowest gameplay risk
- proves responsive component strategy early
- avoids touching board feel

Do not start with:

- moving the board itself
- rewriting input
- rewriting the full HUD first
- redesigning board profiles before the shell footprint is real

---

## Parallelizable Work Lanes

These can be split across workers with minimal overlap.

### Worker A — Vite/React scaffold

Owns:

- Vite setup
- React root
- CSS token system
- shell layout skeleton

Write scope:

- `package.json`
- `vite.config.*`
- `index.html`
- `src/main.*`
- `src/App.*`
- `src/styles/*`

### Worker B — Game bridge

Owns:

- shell summary state API
- subscriptions
- shell command surface

Write scope:

- `src/shell/gameBridge.*`
- `src/shell/useGameShellState.*`
- small additions to `modules/game.js`
- small additions to `modules/actions.js`

### Worker C — Title/settings migration

Owns:

- React title screen
- React settings screen
- responsive form controls

Write scope:

- `src/shell/panels/TitleScreen.*`
- `src/shell/panels/SettingsScreen.*`
- limited bridge usage only

### Worker D — Board profile system

Owns:

- orientation-aware board profiles
- fit heuristics
- minimum readable tile thresholds

Write scope:

- `modules/constants.js`
- `modules/game.js`
- `modules/renderer.js`

### Worker E — Secondary panels

Owns:

- help
- debug
- objectives
- history
- discoveries

Write scope:

- `src/shell/panels/*`

Dependencies:

- Worker A and B should land first
- Worker C and E depend on the bridge
- Worker D should wait until shell chrome dimensions are mostly real

---

## Acceptance Criteria For The Migration

We should consider the migration successful when:

- mobile no longer looks like a shrunken desktop canvas
- the board occupies most of the screen on both portrait and landscape
- title/settings/help/debug/history/objectives are responsive DOM/CSS components
- the same panel components are reused across desktop and mobile
- React shell reads normalized summary state instead of deep gameplay internals
- canvas owns only board/local visuals
- mobile default play does not rely on visible scroll mode

Concrete mobile checks:

- on reference portrait phones, `small` hits the minimum tile-size target
- the shell never permanently overlaps the board
- primary play actions are reachable with one thumb in portrait
- help, objectives, and history are reachable within one tap from the main play screen
- the board pane remains the dominant visual region of the screen

---

## Risks

### 1. Doing too much at once

Avoid:

- Vite migration
- React shell
- board geometry rewrite
- state rewrite
- input rewrite

all in one commit series.

Keep the migration sliced.

### 2. Letting React own gameplay geometry

Do not let the shell start reasoning about:

- tile adjacency
- viewport math
- path geometry

That should remain core/game-side.

### 3. Overbuilding the shell

Do not add:

- router
- global state library
- design system abstraction layer

unless a real problem appears.

Simple React + CSS is enough.

---

## Recommended Immediate Sequence

This is the sequence I would start next:

1. add Vite + React shell skeleton
2. add game bridge and shell summary state
3. move title screen to React
4. move settings screen to React
5. stop for the A2/A3 checkpoint and verify the bridge is clean
6. move help/debug/objectives/history/discoveries to shell
7. rebuild in-play HUD/action bar in shell
8. add orientation-aware board profiles for portrait vs landscape
9. tune fit heuristics against the real shell footprint
10. delete the old canvas shell UI

That is the lowest-regret path.
