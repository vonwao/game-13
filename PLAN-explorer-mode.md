# LEXICON DEEP — Explorer Mode Implementation Plan

## Overview

Add a new "Explorer" game mode alongside the existing "Classic" (corruption/seals) mode. Explorer mode strips away corruption mechanics and replaces them with score-maximization, pre-planted hidden words, and a scavenger hunt challenge system. Also add a well-designed Settings screen for mode selection and feature toggles.

**Guiding principle:** The existing engine (tiles, pathfinding, dictionary, rendering, particles, audio) stays shared. Mode-specific logic branches on `state.gameMode`.

---

## Architecture: Feature Flag System

### State Changes

Add to the game state object in `modules/game.js`:

```js
STATE.gameMode = 'explorer'; // 'classic' | 'explorer'
STATE.settings = {
  hardMode: false,
  specialTiles: true,    // ember, crystal, void, bomb
  soundEnabled: true,
  showTimer: true,
  // Explorer mode settings
  endCondition: 'challenges', // 'zen' | 'timed' | 'turns' | 'challenges'
  timeLimit: 300,              // seconds (for 'timed' mode)
  turnLimit: 50,               // (for 'turns' mode)
};

// Explorer mode state
STATE.explorer = {
  round: 1,
  challenges: [],       // array of challenge objects
  completedCount: 0,
  plantedWords: [],     // { word, path: [{col,row}], found: false }
  fragments: [],        // { fragment, positions: [{col,row}], usedCount: 0 }
  timeRemaining: 300,   // seconds (for timed mode)
  turnsRemaining: 50,   // (for turns mode)
  combo: 0,             // consecutive words without scrolling
  bestCombo: 0,
  wordsThisRound: [],   // history of words played
};
```

### Mode Branching Points

These are the specific places in existing modules where behavior changes based on mode:

| Module | Function | Classic behavior | Explorer behavior |
|--------|----------|-----------------|-------------------|
| `board.js` | `generate()` | Places seals, initial corruption | No seals/corruption; plants hidden words + fragments |
| `board.js` | `spreadCorruption()` | Spreads corruption | No-op (skip entirely) |
| `board.js` | `refreshTiles()` | Replaces used tiles with random letters | **No-op — tiles are fixed, reusable across words** |
| `input.js` | `submitWord()` | Cleanse, seal check, spread corruption | Score with path bonus, check challenges, check planted words |
| `input.js` | win/lose check | Seeds destroyed / 40% corruption | All challenges complete / time or turns expired |
| `renderer.js` | HUD | Corruption %, seeds | Timer/turns remaining, combo, challenge progress |
| `renderer.js` | Minimap | Corruption coloring | Planted word locations (if discovered nearby) |
| `game.js` | `startGame()` | Generate with seals | Generate with planted words + challenges |

---

## Part 1: Settings Screen

### Design

The settings screen appears BEFORE the game starts, replacing the simple "Press Enter" title screen. It should feel like a polished game menu — not a dev panel.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                       LEXICON DEEP                              │
│                     Spell to Survive                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  GAME MODE                                              │    │
│  │                                                         │    │
│  │  ┌───────────────┐    ┌───────────────┐                 │    │
│  │  │   CLASSIC     │    │  EXPLORER     │                 │    │
│  │  │               │    │               │                 │    │
│  │  │  Fight the    │    │  Find words,  │                 │    │
│  │  │  spreading    │    │  complete     │                 │    │
│  │  │  corruption   │    │  challenges   │                 │    │
│  │  │               │    │               │                 │    │
│  │  └───────────────┘    └───────────────┘                 │    │
│  │                         ▲ selected                      │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  END CONDITION (Explorer only)                          │    │
│  │  ( ) Zen — No limit, just explore                       │    │
│  │  (●) Challenges — Complete all challenges to win        │    │
│  │  ( ) Timed — 5 minutes        ( ) Turns — 50 turns     │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  OPTIONS                                                │    │
│  │  [✓] Special tiles (ember, crystal, void, bomb)         │    │
│  │  [✓] Sound effects                                      │    │
│  │  [✓] Particle effects                                   │    │
│  │  [ ] Hard mode (letters degrade near corruption)        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│              [ ► START GAME ]                                   │
│                                                                 │
│                     Press ? for help                             │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

Create a new module: `modules/settings.js` (IIFE on `window.LD.Settings`)

**Rendering:** The settings screen is a new phase: `state.phase = 'settings'`. The renderer draws it when phase is `'settings'`.

**Interaction:** This screen needs MOUSE interaction (not just keyboard). Track:
- Hovered element (for highlight)
- Click targets (mode cards, radio buttons, checkboxes, start button)

Use simple hit-testing: store clickable regions as `{ x, y, w, h, action }` arrays, check `mousedown` event coords against them.

**Flow:** Title screen ("Press Enter") → Settings screen → Game starts

**Public API:**
- `LD.Settings.init(state)` — attach mouse listeners
- `LD.Settings.render(ctx, state)` — draw the settings screen
- `LD.Settings.handleClick(mx, my, state)` — process click, return true if something changed

### Phase flow update in game.js:

```
'title' → (Enter/click) → 'settings' → (Start button) → 'playing' → 'victory'/'gameover'
                                                                    ↓
                                                              'settings' (play again)
```

---

## Part 2: Explorer Board Generation

### Board Size

**30×25 grid** (750 tiles). Viewport stays ~14×10. This is smaller than classic (40×40 = 1600) but still requires scrolling, keeping the exploration feel.

Update `board.js` to accept board dimensions from settings:
```js
function generate(state) {
  // Use dimensions from settings or default
  var w = state.width || (state.gameMode === 'explorer' ? 30 : 40);
  var h = state.height || (state.gameMode === 'explorer' ? 25 : 40);
  state.width = w;
  state.height = h;
  ...
}
```

### Planted Words

During generation, embed 8-12 specific words into the grid as connected paths (horizontal, vertical, or diagonal lines). These are the "discoveries."

**Word selection:** Pick from a curated list of thematic words:
```js
const PLANTABLE_WORDS = [
  'ARCHIVE', 'ANCIENT', 'CRYSTAL', 'DRAGON', 'ECLIPSE', 'FROZEN',
  'THUNDER', 'LIBRARY', 'MYSTIC', 'PHOENIX', 'SCHOLAR', 'TEMPLE',
  'WIZARD', 'BEACON', 'CIPHER', 'DUNGEON', 'ENIGMA', 'FORTRESS',
  'GLACIER', 'HORIZON', 'JOURNEY', 'KINGDOM', 'LANTERN', 'MIRAGE',
  'NEBULA', 'ORACLE', 'PRISM', 'QUARTET', 'RELIC', 'SPHINX',
  'TROPHY', 'UNDONE', 'VENTURE', 'WRAITH', 'ZENITH', 'ALCHEMY'
];
```

**Planting algorithm:**
1. Pick 8-12 words randomly from the list
2. For each word, find a random starting position and direction (8 directions) where:
   - The full word fits within board bounds
   - No tile in the path is already part of another planted word (unless sharing a letter — crossword-style overlaps are OK if the shared letter matches)
3. Write the word's letters into those tile positions
4. Mark each tile: `tile.planted = true` (for rendering — subtle golden underline or dot)
5. Fill remaining tiles with weighted random letters
6. Store planted word data in `state.explorer.plantedWords`

**Fragment planting:**
After words, plant 10-15 common fragments in clusters:
```js
const FRAGMENTS = ['ING', 'TION', 'COM', 'PRE', 'OUT', 'STR', 'IGHT', 'MENT', 'ABLE', 'NESS', 'OVER', 'UNDER', 'ENCE', 'NESS'];
```
Place each fragment as 3-5 adjacent tiles. These aren't hidden — they're productivity boosters that help form words. Mark tiles: `tile.fragment = 'ING'` etc.

### Special Tiles in Explorer Mode

If `settings.specialTiles` is on, place icon tiles as before but with adjusted purpose:
- **Crystal** — 2x score for the word (not cleanse radius)
- **Void** — still wildcard
- **Ember** — +20 bonus points
- **Bomb** — removed (no corruption to cleanse)

No seals, no corruption, no icon-as-barrier mechanic.

---

## Part 3: Explorer Scoring System

### Path Shape Bonus

The key new mechanic: HOW your word path looks affects its score.

```js
function getPathShapeMultiplier(path) {
  if (path.length < 2) return 1.0;

  // Check if all tiles are in a straight line (horizontal, vertical, or diagonal)
  const dc = path[1].col - path[0].col;
  const dr = path[1].row - path[0].row;
  let isStraight = true;
  for (let i = 2; i < path.length; i++) {
    if (path[i].col - path[i-1].col !== dc || path[i].row - path[i-1].row !== dr) {
      isStraight = false;
      break;
    }
  }

  if (isStraight) {
    // Perfectly straight line
    if (dc === 0 || dr === 0) return 2.0;  // horizontal or vertical = best
    return 1.5;                              // diagonal straight = good
  }

  // Count direction changes ("corners")
  let corners = 0;
  for (let i = 2; i < path.length; i++) {
    const dc1 = path[i-1].col - path[i-2].col;
    const dr1 = path[i-1].row - path[i-2].row;
    const dc2 = path[i].col - path[i-1].col;
    const dr2 = path[i].row - path[i-1].row;
    if (dc1 !== dc2 || dr1 !== dr2) corners++;
  }

  if (corners === 1) return 1.0;  // one turn = normal
  return Math.max(0.7, 1.0 - corners * 0.1);  // more corners = slight penalty (min 0.7x)
}
```

### Final Score Formula (Explorer)

```
word_score = sum(letter_points) × length_multiplier × path_shape_multiplier × combo_bonus × crystal_bonus
```

Where:
- `length_multiplier`: same as classic (3→1x, 4→1.5x, 5→2x, 6→3x, 7→5x, 8→8x)
- `path_shape_multiplier`: 0.7x to 2.0x based on path shape
- `combo_bonus`: 1.0 + (combo * 0.1) — e.g., 3rd word in a row without scrolling = 1.3x
- `crystal_bonus`: 2.0 if crystal tile in path, else 1.0

Display the breakdown as a popup: "+45 pts (STORM × 2.0 straight × 1.2 combo)"

### Combo System

Track consecutive words submitted without scrolling. Each word without scrolling increments `state.explorer.combo`. Scrolling resets it to 0.

Show combo count on HUD when > 0: "Combo: x3 (1.3x)"

---

## Part 4: Scavenger Hunt Challenges

### Challenge Object Structure

```js
{
  id: 'cross_words',
  type: 'cross',           // category for icon
  title: 'Crossroads',
  description: 'Find two words that share a tile',
  icon: '✚',               // displayed in sidebar
  completed: false,
  progress: 0,             // for multi-step challenges
  target: 1,               // how many times to complete
  reward: 100,             // bonus points on completion
  checkFn: 'checkCross',   // name of function to call after each word
}
```

### Challenge Types and Check Functions

Implement these as functions in a new `modules/challenges.js` module:

```js
window.LD.Challenges = {
  generate(round),           // returns array of challenge objects for this round
  checkAll(state, wordData), // called after each word, returns newly completed challenges
};
```

**`wordData`** passed to check functions:
```js
{
  word: 'STORM',
  path: [{col, row}, ...],
  score: 45,
  pathShape: 'straight',  // 'straight_h', 'straight_v', 'straight_diag', 'curved'
  corners: 0,
  usedFragment: 'STR',    // or null
  isPlanted: true,         // was this a pre-planted word?
  tilesUsed: Set(),        // for cross-checking
}
```

### Round 1 Challenges (10 challenges, varied difficulty)

| # | ID | Title | Description | Check Logic |
|---|-----|-------|-------------|-------------|
| 1 | `first_word` | First Steps | Submit any valid word | Always completes on first word |
| 2 | `long_word` | Linguist | Find a word with 6+ letters | `word.length >= 6` |
| 3 | `straight_line` | Ruler's Path | Submit a word in a perfect straight line (H or V) | path shape is horizontal or vertical straight |
| 4 | `high_score` | High Roller | Score 40+ points in a single word | `score >= 40` |
| 5 | `discovery` | Discovery | Find a hidden planted word | `isPlanted === true` |
| 6 | `fragment_use` | Fragment Hunter | Use a planted fragment (-ING, -TION, etc.) in a word | word contains a fragment and path passes through fragment tiles |
| 7 | `combo_3` | Chain Caster | Reach a 3-word combo (no scrolling) | `state.explorer.combo >= 3` |
| 8 | `cross` | Crossroads | Find two words that share a tile | Track all used tile positions; after each word, check if any tile in path was used by a previous word |
| 9 | `rare_letter` | Rare Find | Use Q, Z, X, or J in a word | word contains any of those letters |
| 10 | `five_words` | Prolific | Submit 5 valid words | `state.wordsSpelled >= 5` |

### Challenge Sidebar UI

Rendered on the right side of the screen (where minimap currently is — move minimap to bottom-left in explorer mode).

```
┌──────────────────────┐
│  CHALLENGES  4/10    │
│                      │
│  ✓ First Steps       │
│  ✓ Linguist          │
│  ✓ High Roller       │
│  ✓ Crossroads        │
│  ○ Ruler's Path      │  ← unfilled = incomplete
│  ○ Discovery         │
│  ○ Fragment Hunter   │
│  ○ Chain Caster      │
│  ○ Rare Find         │
│  ○ Prolific  3/5     │  ← shows progress
│                      │
│  ► Hover for details │
└──────────────────────┘
```

**Mouse hover:** When cursor hovers over a challenge row, show the full description as a tooltip box. Track mouse position in renderer, check if within challenge sidebar bounds, show tooltip for the hovered challenge.

**Completion animation:** When a challenge completes, flash the row gold, spawn particles from the sidebar, play a chime sound, show "+100" floating text.

---

## Part 5: Round/Level System

### Framework (implement just Round 1 for now)

```js
const ROUNDS = [
  {
    id: 1,
    name: 'The First Page',
    boardWidth: 30,
    boardHeight: 25,
    plantedWordCount: 8,
    fragmentCount: 10,
    challengeCount: 10,
    specialTileMultiplier: 1.0, // normal amount of special tiles
  },
  // Future rounds defined here — NOT implemented now, just the structure
  // { id: 2, name: 'Deeper Shelves', boardWidth: 35, boardHeight: 30, ... },
];
```

**Round completion:** When all challenges are done (in 'challenges' end condition), show a round-complete screen with stats, then option to continue to next round or return to menu.

For 'zen' mode, rounds aren't used — just endless play.

For 'timed' and 'turns' modes, the round ends when time/turns expire and score is shown.

---

## Part 6: Module-by-Module Implementation Instructions

### File: `modules/settings.js` (NEW — ~300 lines)

Create from scratch. IIFE on `window.LD.Settings`.

**Must implement:**
- `init(state)` — attach `mousemove`, `mousedown` listeners to canvas. Store state ref.
- `render(ctx, state)` — draw the full settings screen when `state.phase === 'settings'`
- `handleClick(mx, my, state)` — check click against stored hit regions, update `state.settings` and `state.gameMode`

**Design details:**
- Mode cards: 200×120 rectangles with border. Selected card has bright amber border + fill tint
- Radio buttons: 12px circles, filled circle for selected. Draw with arc().
- Checkboxes: 14px squares, draw checkmark (two lines) when checked
- Start button: centered, 200×40 rectangle, amber fill, "START GAME" text, hover brightens
- All text in Courier New monospace to match game aesthetic
- Colors: same palette as game (sand, amber, charcoal backgrounds)

**Hit regions array:**
```js
const hitRegions = [
  { x, y, w, h, action: () => { state.gameMode = 'classic'; } },
  { x, y, w, h, action: () => { state.gameMode = 'explorer'; } },
  { x, y, w, h, action: () => { state.settings.endCondition = 'zen'; } },
  // ... etc
  { x, y, w, h, action: () => { startGame(); } },
];
```

Rebuild hitRegions array each render call (positions depend on layout). On click, iterate and fire first matching action.

### File: `modules/challenges.js` (NEW — ~250 lines)

Create from scratch. IIFE on `window.LD.Challenges`.

**Must implement:**
- `generate(round)` → array of challenge objects for the given round number
- `checkAll(state, wordData)` → array of challenge IDs that were just completed
- `renderSidebar(ctx, state, mouseX, mouseY)` — draw challenge list in sidebar
- Challenge check functions for each type (see table above)

**Challenge check detail:**
- After each word submission in input.js (explorer mode), build `wordData` object and call `LD.Challenges.checkAll(state, wordData)`
- For `cross` challenge: maintain `state.explorer.usedTileKeys` (Set of "col,row" strings). After each word, check intersection with new path tiles.
- For `fragment_use`: check if the word contains any fragment string AND the path passes through the fragment's planted tile positions
- Return IDs of newly-completed challenges for audio/particle celebration

### File: `modules/board.js` (MODIFY)

**Add `generateExplorer(state)` function** that:
1. Creates the 30×25 grid filled with weighted random letters
2. Plants hidden words (see algorithm above)
3. Plants fragments
4. Places special tiles (if enabled, no bombs)
5. No seals, no corruption

**Modify existing functions:**
- `spreadCorruption(state)`: add early return if `state.gameMode === 'explorer'` (no-op, return [])
- `refreshTiles(state, path)`: add early return if `state.gameMode === 'explorer'` (tiles are fixed)
- `generate(state)`: check `state.gameMode` and call either existing logic or `generateExplorer`

**Add new function:**
- `checkPlantedWord(state, word, path)` → planted word object or null. Check if the submitted word matches a planted word and the path matches its planted path.

### File: `modules/input.js` (MODIFY)

**Modify `submitWord()`:**
After the existing score calculation, add explorer-mode branch:

```js
if (_state.gameMode === 'explorer') {
  // 1. Calculate explorer score (with path shape multiplier, combo, crystal)
  // 2. Check if word is a planted word
  // 3. Check if word uses a fragment
  // 4. Build wordData object
  // 5. Call LD.Challenges.checkAll(state, wordData)
  // 6. Update combo
  // 7. Add to wordsThisRound history
  // 8. Do NOT call spreadCorruption or refreshTiles
  // 9. Check end conditions (all challenges done, time/turns expired)
  // 10. Particles + audio
} else {
  // ... existing classic mode logic (unchanged)
}
```

**Modify `scrollViewport()`:**
Reset combo: `if (_state.gameMode === 'explorer') _state.explorer.combo = 0;`

### File: `modules/renderer.js` (MODIFY)

**Modify `drawHUD()`:**
In explorer mode, show:
- Score, Words, Combo (instead of Seeds, Corruption %)
- Timer or turns remaining (based on end condition)
- Round name: "Round 1: The First Page"

**Modify `drawBoard()`:**
- Planted word tiles: draw a subtle golden dot or underline indicator (only for tiles that are part of a planted word, regardless of whether the word has been found)
- Fragment tiles: draw a subtle colored dot (e.g., small cyan dot in corner)
- Already-found planted word tiles: brighter gold highlight

**Modify `drawMinimap()`:**
In explorer mode:
- No corruption coloring
- Show planted word locations as amber dots (once found) or dim dots (undiscovered but nearby)
- Show viewport rectangle

**Add `drawChallengeSidebar()` call** in the playing phase render (explorer mode only). Delegate to `LD.Challenges.renderSidebar()`.

**Modify `drawInputBar()`:**
In explorer mode, show path shape info: "STORM → Straight line! 2.0x" or "STORM → 1 corner, 1.0x"

### File: `modules/game.js` (MODIFY)

**Phase flow update:**
```
'title' → (Enter/click) → 'settings' → (Start button) → 'playing' → ...
```

**Modify `startGame()`:**
- Read `state.gameMode` and `state.settings` from the settings screen
- If explorer: call explorer board generation, generate challenges, set up timer/turns
- If classic: existing behavior

**Add timer update in game loop:**
If explorer + timed mode, decrement `state.explorer.timeRemaining` by dt each frame. If reaches 0, trigger game over.

**Modify title screen** in renderer: just show "LEXICON DEEP" and "Press Enter" — it transitions to settings screen, not directly to game.

### File: `modules/audio.js` (MODIFY)

**Add new sounds:**
- `challenge_complete` — bright ascending 3-note chime (C5 → E5 → G5, 80ms each, gain 0.25). Plays when a challenge is completed.
- `round_complete` — longer victory arpeggio variant. Plays when all challenges in a round are done.
- `combo` — quick double-tick (two sine pings at 600Hz and 800Hz, 30ms each, 50ms apart). Plays on combo increment.

---

## Part 7: Implementation Order

Execute in this order (each step should be a commit):

1. **Settings module + phase flow** — New `settings.js`, update `game.js` phase handling, update renderer to draw settings screen. Test: can navigate title → settings → start game in both modes.

2. **Explorer board generation** — Add `generateExplorer()` to board.js with planted words and fragments. No seals, no corruption. Test: start explorer mode, see planted words on board.

3. **Explorer scoring** — Path shape multiplier, combo system. Modify input.js submitWord for explorer branch. Disable tile refresh and corruption spread. Test: submit words, see score with shape bonus and combo.

4. **Challenges module** — New `challenges.js` with Round 1 challenges, check functions, sidebar rendering. Wire into input.js word submission. Test: complete challenges, see them fill in.

5. **Polish** — Challenge completion animations, score breakdown popup, round complete screen, timer/turns HUD display, tooltip hover for challenges.

6. **Reassemble** — Run `bash assemble.sh` (update it to include new modules: settings.js, challenges.js). Test full game flow in both modes.

---

## Part 8: Key Constraints

- **Single file output**: Everything must assemble into `lexicon-deep.html` via `assemble.sh`
- **No external dependencies**: No npm, no CDN, no images. All canvas-drawn.
- **Shared engine**: Don't duplicate pathfinder, dictionary, particles, audio. Branch on `state.gameMode` where behavior differs.
- **Don't break classic mode**: All classic mode behavior must remain functional. Test both modes.
- **Mouse interaction**: The settings screen and challenge sidebar need mouse support. Add mousemove/mousedown listeners. Store canvas-relative coordinates.
- **Module load order** in assemble.sh: `dictionary → board → pathfinder → challenges → particles → audio → renderer → settings → input → game`
- **Commit after each step** per the repo's conventions.
