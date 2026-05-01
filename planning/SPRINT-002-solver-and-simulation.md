# Sprint 002 — Solver And Simulation

Status: Active

## Goal

Turn Lexicon Deep into a denser, more authored, more legible Word Hunt by:

1. building a real board solver
2. measuring board quality with simulations instead of intuition
3. replacing word-count planting with coverage-driven authoring
4. simplifying scoring around length-first ranking

## Locked decisions

These are intentionally fixed before implementation starts:

1. Word Hunt remains the only public mode.
2. Clue is button-only, not a letter shortcut.
3. The flagship experience is the small board.
4. The board should become mostly authored, not mostly random.
5. A visible `Solutions` surface is part of the product, not just debug UI.
6. Solutions stay visible when blocked; blocked entries grey out instead of disappearing.
7. Default Solutions view should prioritize ranked playable words of length `5+`.
8. Raw `% coverage` is a tuning parameter for now, not a player-facing setting.

## Why this sprint exists

The current game still has three structural problems:

1. board generation is guided by word count, not by authored density or solver yield
2. scoring mixes too many ideas at once and is harder to reason about than it should be
3. there is no board-wide solver, so design decisions about “organic” words or authored coverage are still guesswork

This sprint is about building the measurement tools first, then using them to choose the next gameplay defaults.

## Primary deliverables

1. `solveBoard(...)`
- Enumerates valid words on a board.
- Returns path, score, planted/organic status, and playability under current wear state.

2. Simulation scripts
- `simulate-board-yield`
- `simulate-run-agents`
- `compare-scoring-models`

3. Coverage-first generator plan
- Replace planted word count as the main target.
- Define coverage, overlap, and solver-yield targets.

4. Scoring redesign decision
- Move toward length-first scoring with smaller secondary modifiers.

## Initial findings

These are early baseline measurements from the current generator, before the
coverage-first refactor lands.

### Small board, no special tiles, solver min length `5`

Two-run averages:

1. `easy`
- planted coverage: `35.31%`
- total solutions: `5363`
- organic solutions: `5343`
- planted solutions: `20`

2. `medium`
- planted coverage: `28.13%`
- total solutions: `5156`
- organic solutions: `5141`
- planted solutions: `15`

3. `hard`
- planted coverage: `19.54%`
- total solutions: `4436`
- organic solutions: `4426`
- planted solutions: `10`

### What this means

1. The current board is already far more organic than intuition suggests.
2. Lower planted coverage reduces solution yield, but not by nearly as much as
   expected.
3. The real driver is not just planted-word count. It is the coherent letter
   network created by planted words, fragments, and overlap.
4. This validates the need to tune against solver metrics instead of guessing.

## First recommended sweep

Until the generator is refactored around native coverage targets, use runtime
config overrides as the tuning surface.

### Small board target bands

1. Landscape `20x16`
- floor: `20-24%`
- likely sweet spot: `24-28%`
- avoid `>30%`

2. Portrait `13x18`
- floor: `18-22%`
- likely sweet spot: `22-26%`
- avoid `>28%`

### First six configs

Hold diagonal / reverse rates fixed and use `plantedWordMinLen=5`,
`plantedWordMaxLen=7`.

1. Landscape: `10 words + 4 fragments`
2. Landscape: `11 words + 6 fragments`
3. Landscape: `12 words + 8 fragments`
4. Portrait: `8 words + 4 fragments`
5. Portrait: `9 words + 6 fragments`
6. Portrait: `10 words + 8 fragments`

### Tooling note

`scripts/capture-board-snapshot.mjs`, `scripts/simulate-board-yield.mjs`, and
`scripts/sweep-wordhunt-space.mjs` now support repeated:

- `--config-override plantedWordCount=10`
- `--config-override fragmentCount=4`

This lets us test coverage proxies without editing `modules/constants.js`.

## Decision pass 001

The first decision pass used `scripts/simulate-board-yield.mjs` and
`scripts/compare-scoring-models.mjs` against live Playwright captures.

### Small-board authoring defaults

These defaults are now wired into `modules/constants.js` for the small board
profile. Non-small boards keep the existing global difficulty defaults.

1. Landscape `20x16`
- `easy`: `14` planted words, `12` fragments, planted length `5-7`
- `medium`: `15` planted words, `12` fragments, planted length `5-7`
- `hard`: `11` planted words, `6` fragments, planted length `6-8`

2. Portrait `13x18`
- `easy`: `10` planted words, `6` fragments, planted length `5-7`
- `medium`: `10` planted words, `6` fragments, planted length `5-7`
- `hard`: `9` planted words, `6` fragments, planted length `6-8`

### Verified default yield after wiring

Three-run averages, no special tiles, solver min length `5`:

1. Landscape
- `easy`: `26.88%` coverage, `5264.33` organic solutions
- `medium`: `28.23%` coverage, `4904.67` organic solutions
- `hard`: `21.36%` coverage, `5209` organic solutions

2. Portrait
- `easy`: `25.35%` coverage, `3244.67` organic solutions
- `medium`: `25.21%` coverage, `3423.67` organic solutions
- `hard`: `24.22%` coverage, `3823.67` organic solutions

This replaces the old default shape where portrait/easy could land near `49%`
planted coverage.

### Length-first scoring table

Runtime scoring, solver ranking, score preview, path auto-selection, Help copy,
history text, and bridge verification now use the shared `length-first-v1`
table in `modules/scoring.js`.

Base score by length:

- `5`: `55`
- `6`: `85`
- `7`: `120`
- `8+`: `160`

Modifiers:

- tile bonus: `min(30, tilePoints * 2)`
- horizontal / vertical: `+12`
- diagonal: `+6`
- cornered path: `-4` per corner, capped at `6` corners
- crystal: `+12` each
- ember: `+10` each
- wildcard: `-10` each
- planted / organic bonus: `0`

This keeps normal word scores in the same broad UI range as the previous model
while making length the primary ranking signal.

## Product surface checkpoint

The first always-visible `Solutions` surface is live:

1. shell snapshots expose `solutions` built from the board solver
2. the default list uses `5+` words and keeps the first top-ranked solution
   window pinned for the board
3. playable pinned entries remain prioritized, while blocked pinned entries stay
   visible and grey out instead of disappearing
4. desktop right rail and phone bottom sheet both render the same solver-backed
   list
5. bridge verification now checks that solutions are present in runtime state and
   visible in the phone sheet
6. desktop right rail and phone bottom sheet include first-pass filters:
   `Playable`, `All`, and `Blocked`
7. the visible Solutions window now favors planted/common words instead of raw
   dictionary oddities; the full dictionary remains valid for typed submissions
8. the HUD now states the active goal, and score previews/solution rows expose
   the score formula instead of only the total

## Parameter inventory

These are the knobs we should treat as tunable during Sprint 002.

### A. Generator parameters

These shape what gets authored into the board.

1. `boardSize`
- public setting already exists

2. `targetCoveragePct`
- core generator target
- replaces planted word count as the main authored-density control

3. `coverageTolerancePct`
- acceptable band around the target coverage

4. `targetOverlapRate`
- how much authored material should intersect or share cells

5. `minWordLen`
6. `maxWordLen`

7. `candidateRankLimit`
- how deep into the ranked common-word pool we search

8. `authoredWordVsFragmentMix`
- ratio of full words to fragments / partial sequences

9. `fragmentCatalog`
- which fragments are allowed
- examples: `ING`, `TION`, `TH`, `ER`, `RE`, `STA`

10. `fragmentWeighting`
- whether short/common fragments are cheap or expensive to place

11. `pathShapePolicy`
- straight-only
- straight+diagonal
- arbitrary self-avoiding path

12. `diagonalAllowancePct`
13. `reverseAllowancePct`

14. `maxPlacementAttempts`
- generator search budget per board / per candidate

15. `fillerStrategy`
- how leftover cells are filled after authored placement
- random weighted letters
- fragment-biased letters
- solver-aware filler

### B. Solver / solutions parameters

These shape what the player sees and what simulations measure.

1. `solutionMinLengthDefault`
- initial product default should be `5`

2. `solutionSortMode`
- default should be `score desc`

3. `solutionMaxVisibleDefault`
- likely top `50`

4. `solutionFilters`
- `Playable`
- `All`
- `Blocked`
- `Found`
- maybe later `4+` / `5+`

5. `playabilityRule`
- whether a solution is currently playable under wear state

6. `organicDefinition`
- any valid word not explicitly authored as a planted word

### C. Scoring parameters

These should become much simpler than the current system.

1. `lengthScoreTable`
- primary score basis

2. `cornerPenalty`
- flat penalty or percentage penalty per corner

3. `wildcardPenalty`
- likely keep `×0.5` unless simulation says otherwise

4. `organicBonus`
- if used, keep it small and flat

5. `minOrganicBonusLength`
- likely `5` or `6` if organic bonus exists

6. `plantedBonus`
- likely `0` in the new model

7. `wornTilePenalty`
- not locked in; only add if simulation shows it helps

### D. Board-quality metrics

These are not user settings. They are how we decide whether a board is good.

1. `totalSolutions`
2. `playableSolutions`
3. `organicSolutions`
4. `organicToAuthoredRatio`
5. `coverageAchievedPct`
6. `intersectionCount`
7. `avgCornersTopN`
8. `top10ScoreSpread`
9. `playable5PlusCount`
10. `cellsUsedByAnySolutionPct`
11. `boardLongevityTurns`
- how long interesting options survive under a simulated run

## Parameter policy

We are clear on the tunable surface, but not all of these should be public settings.

For now:

1. public settings
- board size
- difficulty
- special tiles on/off

2. internal tuning knobs
- coverage
- overlap
- fragment mix
- filler strategy
- scoring table
- Solutions defaults

3. possible future public setting
- `Board Density`
- semantic labels like `Sparse`, `Balanced`, `Dense`
- not raw `% coverage`

## Phases

### Phase 1 — Solver

Build a board-wide solver that can enumerate valid words and rank them under a pluggable scoring model.

### Phase 2 — Simulation harness

Add scripts that generate many boards, solve them, and emit metrics for comparison.

### Phase 3 — Decision pass

Use simulation output to choose:

1. coverage target bands
2. overlap target
3. scoring table
4. organic-bonus policy
5. fragment policy

### Phase 4 — Generator refactor

Move the live board builder from word-count targets to coverage-first authoring.

### Phase 5 — Product surfaces

Add the always-visible `Solutions` surface and rewrite Help only after rules stabilize.

## Success criteria

This sprint is successful when:

1. we can solve a board and enumerate ranked playable words
2. we can compare multiple generator/scoring configurations with scripts
3. we stop guessing about the relationship between authored coverage and organic yield
4. we can choose the next gameplay defaults based on data, not only taste

## Immediate next step

Make solution rows actionable: selecting a solution should preview or load its
path so the surface can move from reference list to playable tool.
