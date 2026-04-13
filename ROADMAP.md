# LEXICON DEEP — Ranked Roadmap

This roadmap complements [NEXT-SPRINT-PLAN.md](/Users/vonwao/dev/micro-projects/game-13/NEXT-SPRINT-PLAN.md).

The sprint plan is about immediate execution.
This roadmap is about priority order across:

- code architecture
- game design
- product direction

The current conclusion is:

- the project is converging, not wandering
- Word Hunt is the flagship
- clarity and observability are improving in the right way
- the main risk is technical muddle slowing down design momentum

---

## Current Thesis

Lexicon Deep is working because it has a strong ratio of:

- system depth
- theme
- legibility
- instrumented feedback

The best recent changes have not been feature sprawl. They have been:

- clearer help
- clearer score math
- better debug views
- better word history
- stronger terminology

That is a healthy sign. It means the game already has a center.

The next moves should preserve that clarity-first mentality.

---

## Top 10 Next Moves

## 1. Lock Down Source Of Truth

Category:

- code

Priority:

- immediate

Why:

- The biggest preventable risk is source drift between `modules/` and `lexicon-deep.html`.
- Design momentum will slow down if the team ever has to ask “which version is real?”

What to do:

- Treat `modules/` as canonical source.
- Treat `lexicon-deep.html` as generated output only.
- Add a loud generated-file banner via `assemble.sh`.
- Add a stale-build verification habit or check.

Success looks like:

- nobody edits the built HTML directly
- the assembly workflow is explicit and trusted

---

## 2. Unify Gameplay Input

Category:

- code

Priority:

- immediate

Why:

- Desktop pointer play is currently second-class.
- The architecture still treats touch more like a mode than an input device.

What to do:

- move gameplay input to unified pointer events
- support mouse, touch, and pen from one adapter
- keep keyboard as a parallel first-class path

Success looks like:

- desktop mouse pathing feels native
- touch still works
- the mental model is simpler

---

## 3. Add A Shared Gameplay Action Layer

Category:

- code

Priority:

- immediate, right after or alongside pointer cleanup

Why:

- cross-module underscore calls are a real maintainability smell
- raw event adapters should express intent, not reach into private helpers

What to do:

- define shared gameplay actions
- route keyboard and pointer adapters through those actions
- stop calling private-ish input helpers across modules

Success looks like:

- cleaner module boundaries
- easier refactors
- less hidden coupling

---

## 4. Keep Word Hunt As The Flagship

Category:

- product

Priority:

- immediate and ongoing

Why:

- Word Hunt currently has the clearest promise
- recent clarity/debug/history work is concentrated there
- it is where the game is becoming distinctive

What to do:

- keep polishing Word Hunt first
- use Siege as a secondary lab, not the main focus
- avoid splitting energy across too many major directions

Success looks like:

- one mode becomes excellent before the project broadens further

---

## 5. Continue The Clarity Pass

Category:

- design
- UX

Priority:

- immediate and ongoing

Why:

- this game benefits disproportionately from legibility
- the scoring/path/challenge systems are rich enough that explanation quality matters

What to do:

- keep improving help
- keep improving labels and terminology
- keep improving score explanation and history
- keep strengthening debug/tuning visibility

Success looks like:

- a player can tell why a word scored well
- a developer can tell why the system behaved the way it did

---

## 6. Treat Debug And History As First-Class Tuning Tools

Category:

- code
- design support

Priority:

- near-term

Why:

- this is now a tunable system, not a toy
- good instrumentation makes balancing faster and less subjective

What to do:

- improve debug history detail
- explicitly show hidden-word discovery in history/debug
- show whether special tiles affected scoring
- preserve score-reason text as a serious balancing tool

Possible later additions:

- path-shape categories
- special-tile usage flags
- debug-only “missed better route” views

Success looks like:

- tuning is driven by evidence, not just feel

---

## 7. Redesign Special Tiles Around Decisions, Not Just Math

Category:

- design

Priority:

- soon after architecture cleanup

Why:

- current special tiles are clearer now, but still mostly score modifiers
- lasting game depth usually comes from decisions, not arithmetic alone

What to do:

- keep special tiles off by default until they are more compelling
- redesign them so they change route choice, timing, tradeoffs, or board consequences

Examples of better direction:

- a tile that preserves combo through a scroll
- a tile that permits one bend without corner penalty
- a tile that creates future opportunity at a cost
- a tile that is powerful only in hidden-word discovery contexts

Success looks like:

- players route through special tiles because they create choices, not just extra points

---

## 8. Tighten Progression Without Expanding Scope Too Fast

Category:

- design
- product

Priority:

- near-term

Why:

- rounds/objectives/discovery already create a strong loop
- too much expansion too early would weaken the core

What to do:

- keep objective lists short and meaningful
- avoid “laundry list” progression
- add variety carefully and only when it increases decision quality

Good progression traits:

- distinct objective shapes
- visible discovery arc
- clearer round identity
- stronger feeling of going deeper into the archive

Success looks like:

- progression feels curated rather than noisy

---

## 9. Move Text-Heavy UI To DOM/CSS Later

Category:

- code
- UX

Priority:

- later, after input/action cleanup

Why:

- canvas is great for board rendering
- canvas is inefficient for menus, tabs, long-form help, and debug panels

What to do:

- keep board and core game rendering in canvas
- later move help, debug, and settings to DOM/CSS overlays
- keep objective/history panels in canvas until the overlay pattern is proven

Success looks like:

- cleaner UI
- better polish
- faster iteration on non-board surfaces

---

## 10. Revisit Tooling Only When The UI Pressure Justifies It

Category:

- code
- workflow

Priority:

- later

Why:

- the current workflow is still efficient for gameplay work
- Vite is likely the right future step, but not worth forcing too early
- Bun is optional, not urgent

What to do:

- keep the current workflow while input and gameplay cleanup are underway
- revisit Vite when DOM/CSS overlay work begins
- keep a simple assembled HTML artifact even after a future Vite migration

Success looks like:

- tooling changes happen because they solve a real constraint
- not because they are fashionable

---

## Ranked By Track

## Code priorities

1. lock down source of truth
2. unify gameplay input
3. add shared actions
4. tighten state boundaries
5. later migrate text-heavy UI to DOM/CSS
6. later evaluate Vite

## Design priorities

1. continue clarity pass
2. improve tuning/debug observability
3. redesign special tiles around decisions
4. keep progression curated and concise

## Product priorities

1. keep Word Hunt as the flagship
2. polish one mode deeply before expanding
3. later explore daily/seeded challenge potential
4. later consider leaderboard and challenge-pack structure

---

## What Not To Do

Avoid these traps:

- adding many new mechanics before input cleanup
- splitting focus evenly between Word Hunt and Siege
- turning special tiles into a pile of scoring exceptions
- moving to a new toolchain before there is a clear workflow payoff
- letting debug/build/input architecture stay muddy while design gets sharper

---

## Practical Sequencing

### Right now

- source-of-truth hardening
- pointer-input cleanup
- shared action layer

### Immediately after

- desktop/touch polish
- state cleanup
- improved debug/history instrumentation

### After that

- special tile redesign
- progression refinement
- UI overlay migration planning becoming implementation

### Later

- Vite migration if UI workflow pressure warrants it
- Bun only if it solves a concrete workflow problem

---

## Bottom Line

The project is not suffering from lack of ideas.

It is benefiting from:

- stronger clarity
- stronger observability
- stronger iteration discipline

The right move is not to widen the game rapidly.
The right move is to stabilize the code/input/build story so the design can keep improving without friction.
