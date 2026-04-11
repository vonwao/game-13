# LEXICON DEEP — Word Hunt Mode + Touch Support Implementation Plan

## Overview

Add a new primary game mode called **"Word Hunt"** alongside the existing corruption/seals mode (renamed to **"Siege"**). Word Hunt strips away corruption mechanics and replaces them with score-maximization, pre-planted hidden words, and a scavenger hunt challenge system. Also add a well-designed Settings screen, more granular feature toggles, and **full touch/mobile support** (tap-to-spell).

**Word Hunt is the default, primary mode.** Siege is the secondary/advanced mode.

**Guiding principle:** The existing engine (tiles, pathfinding, dictionary, rendering, particles, audio) stays shared. Mode-specific logic branches on `state.gameMode`.

---

## Architecture: Settings vs. Constants

There are two layers of configuration:

1. **User settings** (`state.settings`) — what the player chooses on the settings screen. Few, simple, meaningful choices: mode, difficulty, board size, goal, sound/particles/special tiles.
2. **Constants** (`modules/constants.js`) — internal numbers driven BY the user settings. The player never sees these. Difficulty "Medium" maps to specific word lengths, fragment counts, corruption speed, etc. These live in a constants file and are resolved at game start.

### User Settings (state.settings)

```js
STATE.gameMode = 'wordhunt'; // 'wordhunt' | 'siege' (Word Hunt is default)
STATE.settings = {
  difficulty: 'medium',    // 'easy' | 'medium' | 'hard' — means different things per mode
  boardSize: 'medium',     // 'small' | 'medium' | 'large'
  soundEnabled: true,
  particlesEnabled: true,
  specialTiles: true,      // single toggle for all special tiles
  // Word Hunt only
  endCondition: 'challenges', // 'zen' | 'timed' | 'turns' | 'challenges'
};
```

That's it — 6 settings. Clean and simple.

### Constants File (modules/constants.js)

New file. IIFE on `window.LD.Constants`. Resolves user settings into actual numbers.

```js
window.LD.Constants = {
  // Call at game start to get resolved config
  resolve(gameMode, settings) {
    const diff = settings.difficulty;
    const size = BOARD_SIZES[settings.boardSize];

    if (gameMode === 'wordhunt') {
      return {
        boardWidth: size.width,
        boardHeight: size.height,
        // Planted words
        plantedWordCount: { easy: 20, medium: 15, hard: 10 }[diff],
        plantedWordMinLen: { easy: 4, medium: 5, hard: 6 }[diff],
        plantedWordMaxLen: { easy: 6, medium: 7, hard: 8 }[diff],
        plantedDiagonalPct: { easy: 0, medium: 0.2, hard: 0.5 }[diff],    // % placed diagonally
        plantedReversePct: { easy: 0, medium: 0.15, hard: 0.4 }[diff],    // % placed backwards
        // Fragments
        fragmentCount: { easy: 18, medium: 12, hard: 6 }[diff],
        // Special tiles (if enabled)
        crystalCount: settings.specialTiles ? 6 : 0,
        voidCount: settings.specialTiles ? 5 : 0,
        emberCount: settings.specialTiles ? 4 : 0,
        bombCount: 0, // no bombs in Word Hunt
        // Scoring
        pathBonuses: true,
        comboBonuses: true,
        // Timing
        timeLimit: { easy: 420, medium: 300, hard: 180 }[diff],
        turnLimit: { easy: 60, medium: 50, hard: 35 }[diff],
      };
    }

    if (gameMode === 'siege') {
      return {
        boardWidth: size.width,
        boardHeight: size.height,
        // Corruption
        sealCount: { easy: 4, medium: 6, hard: 8 }[diff],
        corruptionSpreadChance: { easy: 0.2, medium: 0.3, hard: 0.45 }[diff],
        corruptionLossThreshold: { easy: 50, medium: 40, hard: 30 }[diff], // % to lose
        initialCorruptionRadius: { easy: 1, medium: 1, hard: 2 }[diff],    // tiles around each seal
        hardModeLetters: diff === 'hard',
        // Special tiles
        crystalCount: settings.specialTiles ? 8 : 0,
        voidCount: settings.specialTiles ? 5 : 0,
        emberCount: settings.specialTiles ? 6 : 0,
        bombCount: settings.specialTiles ? 2 : 0,
        // Scoring
        pathBonuses: false,
        comboBonuses: false,
      };
    }
  },
};

const BOARD_SIZES = {
  small:  { width: 20, height: 16 },
  medium: { width: 30, height: 25 },
  large:  { width: 40, height: 40 },
};

const FRAGMENTS = ['ING', 'TION', 'COM', 'PRE', 'OUT', 'STR', 'IGHT', 'MENT',
                   'ABLE', 'NESS', 'OVER', 'UNDER', 'ENCE', 'OUGH', 'ANCE'];
```

Modules never hardcode numbers like "30×25" or "6 seals." They call `LD.Constants.resolve()` once at game start and use the returned config object throughout.

### Runtime State

```js
// Word Hunt runtime state (only used in wordhunt mode)
STATE.hunt = {
  round: 1,
  challenges: [],
  completedCount: 0,
  plantedWords: [],     // { word, path: [{col,row}], found: false }
  timeRemaining: 0,     // set from constants at start
  turnsRemaining: 0,
  combo: 0,
  bestCombo: 0,
  wordsThisRound: [],
  usedTileKeys: new Set(),
};

// Touch/mobile state
STATE.touch = {
  enabled: false,         // auto-detected or toggled
  selectedTiles: [],      // tiles tapped in order
  lastTap: null,
};

// Resolved constants for current game (set at startGame time)
STATE.config = {};  // filled by LD.Constants.resolve()
```

### Mode Branching Points

| Module | Function | Siege behavior | Word Hunt behavior |
|--------|----------|---------------|-------------------|
| `board.js` | `generate()` | Places seals, initial corruption | No seals/corruption; plants hidden words + fragments |
| `board.js` | `spreadCorruption()` | Spreads corruption (rate from config) | No-op (return []) |
| `board.js` | `refreshTiles()` | Replaces used tiles with random letters | **No-op — tiles are fixed** |
| `input.js` | `submitWord()` | Cleanse, seal check, spread | Score with path/combo, check challenges, check planted |
| `input.js` | win/lose check | Seeds destroyed / corruption % | Challenges complete / time or turns expired |
| `renderer.js` | HUD | Corruption %, seeds | Timer/turns, combo, challenge progress |
| `renderer.js` | Board | Corruption overlay | Found planted words highlighted |
| `game.js` | `startGame()` | Generate with seals | Generate with planted words + challenges |

---

## Part 1: Settings Screen

### Design

The settings screen replaces the simple "Press Enter" title screen. It should feel like a polished game menu — not a dev panel.

**Word Hunt is listed FIRST and selected by default.**

The settings screen adapts based on the selected mode — labels, descriptions, and even which options appear change dynamically. This keeps it clean (no irrelevant options) and contextual.

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
│  │  │  WORD HUNT    │    │    SIEGE      │                 │    │
│  │  │  ▲ selected   │    │               │                 │    │
│  │  │  Find words,  │    │  Fight the    │                 │    │
│  │  │  complete     │    │  spreading    │                 │    │
│  │  │  challenges,  │    │  corruption.  │                 │    │
│  │  │  discover     │    │  Destroy all  │                 │    │
│  │  │  hidden words │    │  seals.       │                 │    │
│  │  └───────────────┘    └───────────────┘                 │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  DIFFICULTY          [  Easy  ] [ Medium ] [  Hard  ]   │    │
│  │  ← label changes →  ← description changes per mode →   │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  BOARD SIZE          [ Small ] [ Medium ] [ Large ]     │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  GOAL (Word Hunt)    or    (hidden when Siege)          │    │
│  │  (●) Challenges      ( ) Zen      ( ) Timed  ( ) Turns │    │
│  │─────────────────────────────────────────────────────────│    │
│  │  OPTIONS                                                │    │
│  │  [✓] Special tiles (crystal, void, ember)               │    │
│  │  [✓] Sound effects                                      │    │
│  │  [✓] Particle effects                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│              [ ► START GAME ]                                   │
│                                                                 │
│                     Press ? for help                             │
└─────────────────────────────────────────────────────────────────┘
```

**Dynamic difficulty labels (shown below the buttons):**

| Difficulty | Word Hunt description | Siege description |
|------------|----------------------|-------------------|
| **Easy** | "More hidden words, shorter, mostly horizontal/vertical. Extra fragments." | "4 seals, slower corruption spread, generous loss threshold." |
| **Medium** | "Balanced mix. Some diagonal and reversed hidden words." | "6 seals, standard corruption. The intended challenge." |
| **Hard** | "Fewer hidden words, longer, many diagonal/reversed. Few fragments." | "8 seals, fast corruption, letters degrade near ink." |

**Conditional sections:**
- "GOAL" only shows when Word Hunt is selected
- Difficulty descriptions change when mode changes
- Board size is always visible (same options for both modes)

### Implementation

Create `modules/settings.js` (IIFE on `window.LD.Settings`)

**Rendering:** New phase `state.phase = 'settings'`. Renderer delegates to `LD.Settings.render()`.

**Interaction:** Mouse AND touch support from the start:
- Track hovered element for highlight (mousemove)
- Click/tap targets for all interactive elements (mousedown + touchstart)
- Use simple hit-testing: store clickable regions as `{ x, y, w, h, action }` arrays

**Phase flow:**
```
'title' → (Enter/click/tap) → 'settings' → (Start button) → 'playing' → 'victory'/'gameover'
                                                                        ↓
                                                                  'settings' (play again)
```

**Public API:**
- `LD.Settings.init(canvas, state)` — attach mouse+touch listeners
- `LD.Settings.render(ctx, state)` — draw the settings screen (adapts to selected mode)
- Internal click handler updates `state.settings` and `state.gameMode` directly

**Dynamic behavior:**
- When mode changes, the difficulty description text updates immediately
- The "GOAL" section only renders when Word Hunt is selected
- Difficulty buttons (Easy/Medium/Hard) are 3 toggle buttons in a row, selected = amber fill
- Board size buttons (Small/Medium/Large) same style
- Descriptions shown below the difficulty buttons change based on mode (see table above)

**Design details:**
- Mode cards: ~220×130 rectangles. Selected = amber border + subtle fill tint. Unselected = dark border.
- Toggle buttons (difficulty, board size): ~100×32, 3 in a row. Selected = amber fill, unselected = dark.
- Radio buttons (goal): 12px circles, filled for selected
- Checkboxes: 14px squares, checkmark when checked
- Start button: centered, ~220×44 rectangle, amber fill, "START GAME" text, hover/touch brightens
- All text Courier New monospace
- Colors: same palette (sand #d4c4a0, amber #c8a050, charcoal #1a1714)
- Must fit within 720px height — keep sections compact

---

## Part 2: Word Hunt Board Generation

### Board Size

Driven by `state.config.boardWidth` and `state.config.boardHeight`, resolved from the user's board size setting via `LD.Constants.resolve()`. Same sizes available for both modes:

| Setting | Dimensions | Tiles | Feel |
|---------|-----------|-------|------|
| Small | 20×16 | 320 | Fits almost on screen, minimal scrolling |
| Medium | 30×25 | 750 | Requires scrolling, good exploration |
| Large | 40×40 | 1600 | Big map, lots to discover |

In `board.js`, `generate()` checks `state.gameMode`:
```js
if (state.gameMode === 'wordhunt') {
  return generateWordHunt(state);
} else {
  return generateSiege(state); // existing logic, renamed
}
```

Both generators read dimensions from `state.config`.

### Planted Words

Embed hidden words as straight-line paths (horizontal, vertical, or diagonal). **NO visual hints on planted tiles** — discovery IS the game.

**Word selection — dictionary-driven:**
```js
function selectPlantableWords(config) {
  // Filter dictionary by length range from constants
  const candidates = [];
  LD.Dict.DICT.forEach(word => {
    const len = word.length;
    if (len >= config.plantedWordMinLen && len <= config.plantedWordMaxLen) {
      candidates.push(word.toUpperCase());
    }
  });
  shuffle(candidates);
  return candidates.slice(0, config.plantedWordCount * 2); // grab extras since some will fail to place
}
```

Every board is unique — words are randomly selected from the full dictionary each game.

**Planting algorithm:**
1. Select candidate words from dictionary (2x the target count, since some won't fit)
2. Determine direction pool based on difficulty:
   - **Easy:** only horizontal and vertical (2 directions)
   - **Medium:** horizontal, vertical, + some diagonal (8 directions, but `config.plantedDiagonalPct` of words forced diagonal)
   - **Hard:** all 8 directions, with `config.plantedDiagonalPct` forced diagonal AND `config.plantedReversePct` placed backwards (e.g., DRAGON planted as NOGARD)
3. For each word, try up to 100 random positions × allowed directions:
   - Must fit within board bounds
   - May overlap with previously planted words ONLY if the overlapping letter matches (crossword-style encouraged)
   - If placement fails after 100 attempts, skip this word
4. Write letters into tile positions
5. `tile.planted` stored for game logic only — NOT rendered
6. Fill remaining tiles with weighted random letters
7. Store in `state.hunt.plantedWords`: `{ word, path: [{col,row}], found: false, reversed: bool }`
8. Target: `config.plantedWordCount` successfully placed words

### Fragment Planting

Fragments are common letter sequences (ING, TION, COM, etc.) placed naturally across the board to help players form words. Driven by `config.fragmentCount` from constants.

Fragment list lives in `constants.js`:
```js
const FRAGMENTS = ['ING', 'TION', 'COM', 'PRE', 'OUT', 'STR', 'IGHT', 'MENT',
                   'ABLE', 'NESS', 'OVER', 'UNDER', 'ENCE', 'OUGH', 'ANCE'];
```

**Placement:** After planting words, before random fill:
1. For each fragment (up to `config.fragmentCount`):
   - Pick a random empty position
   - Pick a random direction (horizontal or vertical preferred)
   - If the fragment fits (all positions empty or letter matches), write it in
   - Otherwise try another position (up to 50 attempts)
2. Remaining tiles filled with weighted random letters

No visual indicator. Fragments are just convenient groupings that naturally improve the board's playability. Easy difficulty gets more fragments (18), hard gets fewer (6).

### Special Tiles in Word Hunt

Placed when `settings.specialTiles` is on. Counts come from `state.config`:
- **Crystal** — 2x score multiplier for the entire word
- **Void** — wildcard (matches any letter in the path)
- **Ember** — +20 bonus points when used in a word
- **Bomb** — not placed in Word Hunt (`config.bombCount = 0`)

Placement: random positions, avoiding each other and planted word paths.

---

## Part 3: Word Hunt Scoring System

### Path Shape Bonus

When `settings.pathBonuses` is on:

```js
function getPathShapeMultiplier(path) {
  if (path.length < 2) return 1.0;

  // Check if all tiles are in a straight line
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
    if (dc === 0 || dr === 0) return 2.0;  // horizontal or vertical = best
    return 1.5;                              // diagonal straight
  }

  // Count direction changes
  let corners = 0;
  for (let i = 2; i < path.length; i++) {
    const dc1 = path[i-1].col - path[i-2].col;
    const dr1 = path[i-1].row - path[i-2].row;
    const dc2 = path[i].col - path[i-1].col;
    const dr2 = path[i].row - path[i-1].row;
    if (dc1 !== dc2 || dr1 !== dr2) corners++;
  }

  if (corners <= 1) return 1.0;
  return Math.max(0.7, 1.0 - corners * 0.1);  // more corners = slight penalty, min 0.7x
}
```

### Combo System

When `settings.comboBonuses` is on:
- Each word submitted without scrolling increments `state.hunt.combo`
- Scrolling resets combo to 0
- Combo multiplier: `1.0 + (combo * 0.1)` — 3rd word = 1.3x, 5th = 1.5x, etc.
- Play a `combo` sound on each increment

### Final Score Formula (Word Hunt)

```
word_score = sum(letter_points) × length_multiplier × path_shape_multiplier × combo_bonus × crystal_bonus + ember_bonus
```

Where:
- `length_multiplier`: 3→1x, 4→1.5x, 5→2x, 6→3x, 7→5x, 8→8x
- `path_shape_multiplier`: 0.7x to 2.0x (only if pathBonuses on)
- `combo_bonus`: 1.0 to ~2.0x (only if comboBonuses on)
- `crystal_bonus`: 2.0x if crystal in path, else 1.0x
- `ember_bonus`: +20 flat per ember tile in path

**Display breakdown as floating text popup:** "+52 pts (STORM × 2.0 straight × 1.2 combo)"

### Planted Word Discovery Bonus

When a player submits a word that matches a planted word AND the path matches the planted path:
- **+100 bonus points** (on top of normal score)
- Mark it as found: `plantedWord.found = true`
- Play `challenge_complete` sound
- Big particle celebration
- Flash "DISCOVERED: PHOENIX!" text

Checking: after each word, compare against all unfound planted words. Match requires same word (case-insensitive) and the submitted path must cover the exact planted tiles (in any direction — finding it backwards counts).

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
  target: 1,               // how many times needed
  reward: 100,             // bonus points on completion
}
```

### Challenge Module

New `modules/challenges.js` (IIFE on `window.LD.Challenges`):

```js
window.LD.Challenges = {
  generate(round),           // returns challenge array for this round
  checkAll(state, wordData), // called after each word, returns newly completed IDs
  renderSidebar(ctx, state, mouseX, mouseY), // draw sidebar with hover tooltips
};
```

**`wordData`** passed after each word:
```js
{
  word: 'STORM',
  path: [{col, row}, ...],
  score: 45,
  isStraight: true,
  isHorizontal: false,
  isVertical: false,
  corners: 0,
  isPlantedWord: false,
  tilesUsed: [{col,row}, ...],
}
```

### Round 1 Challenges (10 total)

| # | ID | Title | Description | Check Logic |
|---|-----|-------|-------------|-------------|
| 1 | `first_word` | First Steps | Submit any valid word | Always on first word |
| 2 | `long_word` | Linguist | Find a 6+ letter word | `word.length >= 6` |
| 3 | `straight_h` | Ruler's Path | Submit a word in a perfect horizontal line | `isStraight && isHorizontal` |
| 4 | `high_score` | High Roller | Score 50+ points in a single word | `score >= 50` |
| 5 | `discovery` | Discovery | Find a hidden planted word | `isPlantedWord === true` |
| 6 | `combo_3` | Chain Caster | Reach a 3-word combo | `state.hunt.combo >= 3` |
| 7 | `cross` | Crossroads | Spell two words sharing a tile | Check `usedTileKeys` intersection |
| 8 | `rare_letter` | Rare Find | Use Q, Z, X, or J in a word | word contains any of those |
| 9 | `five_words` | Prolific | Submit 5 valid words | `state.wordsSpelled >= 5` (progress: X/5) |
| 10 | `straight_long` | Laser Focus | 5+ letter word in a straight line | `isStraight && word.length >= 5` |

### Challenge Sidebar UI

Right side of screen (minimap moves to bottom-left in Word Hunt).

```
┌──────────────────────────┐
│  CHALLENGES  4/10        │
│                          │
│  ✓ First Steps           │
│  ✓ Linguist              │
│  ✓ High Roller           │
│  ✓ Crossroads            │
│  ○ Ruler's Path          │  ← unfilled = incomplete
│  ○ Discovery             │
│  ○ Chain Caster          │
│  ○ Rare Find             │
│  ○ Prolific  3/5         │  ← shows progress
│  ○ Laser Focus           │
│                          │
│  ► Hover/tap for details │
└──────────────────────────┘
```

**Hover (desktop) / Tap (mobile):** Show description tooltip for the challenge.

**Completion animation:** Flash row gold, particles burst from sidebar, chime sound, "+100" floating text.

---

## Part 5: Touch / Mobile Support

### Detection

Auto-detect touch capability:
```js
STATE.touch.enabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
```

Also allow manual toggle in settings: `[✓] Touch mode (tap tiles to spell)`

When touch is enabled, show on-screen controls and use tap-based input instead of keyboard.

### Tap-to-Spell Input

This is the primary mobile input method. Instead of typing letters, the player taps tiles directly to build a word path.

**Flow:**
1. Player taps a tile → it becomes the first letter, highlighted
2. Player taps an adjacent tile → added to path (must be 8-directionally adjacent to last tile)
3. Continue tapping adjacent tiles to spell a word
4. If player taps a non-adjacent tile → start a new word from that tile
5. If player taps the last tile in the path → undo (remove last letter)
6. The typed word is assembled from the path: `state.input.typed = path.map(t => tile.letter || '?').join('')`
7. Validity check runs after each tap (same as keyboard: dictionary + path validation)

**Important:** In tap mode, the path is built by the player directly — no need for pathfinder DFS. The player IS the pathfinder. But we still validate that:
- Each tile is adjacent to the previous one
- No tile is used twice in the same word
- The resulting word is in the dictionary

### On-Screen UI Elements (Touch Mode)

Draw these at the bottom of the screen, replacing the keyboard-focused input bar:

```
┌────────────────────────────────────────────────────────────────┐
│  S - T - O - R - M     ✓ valid                                │
│                                                                │
│  [ ✗ Clear ]    [ ↩ Undo ]    [ ✓ Submit ]    [ ↕ Scroll ]   │
└────────────────────────────────────────────────────────────────┘
```

Buttons:
- **Clear** — reset current word (like Escape)
- **Undo** — remove last tapped tile (like Backspace)
- **Submit** — submit the word (like Enter). Only enabled when valid + path exists.
- **Scroll toggle** — when active, touch-drag scrolls the viewport instead of selecting tiles. Visual indicator shows which mode is active (spell vs scroll). By default, single taps = spell, two-finger drag or long-press-drag = scroll.

### Viewport Scrolling (Touch)

Two approaches, implement both:
1. **Two-finger drag** — pans the viewport (pinch-to-zoom NOT needed, tile size is fixed)
2. **Scroll mode button** — toggles between tap-to-spell and drag-to-scroll modes
3. **Edge swipe** — swiping from the edge of the game area scrolls in that direction

Recommendation: default to tap-to-spell, with two-finger drag for scrolling. The scroll-mode button is a fallback for devices where multi-touch is awkward.

### Touch Event Handling

Add to `modules/input.js` (or a new `modules/touch.js`):

```js
// Canvas touch listeners
canvas.addEventListener('touchstart', onTouchStart, { passive: false });
canvas.addEventListener('touchmove', onTouchMove, { passive: false });
canvas.addEventListener('touchend', onTouchEnd, { passive: false });

function onTouchStart(e) {
  e.preventDefault(); // prevent scroll/zoom
  const touch = e.touches[0];
  const { x, y } = canvasCoords(touch);

  // Check if touch is on a UI button
  if (checkButtonHit(x, y)) return;

  // Check if touch is on a tile
  const grid = LD.Renderer.screenToGrid(x, y, state);
  if (grid) {
    handleTileTap(grid.col, grid.row);
  }
}
```

**Multi-touch detection:** If `e.touches.length >= 2`, enter scroll mode (track the gesture for panning).

### Responsive Layout

When touch mode is active OR screen width < 768px:
- Increase tile size slightly for easier tapping (min 44px per tile — Apple's recommended touch target)
- Reduce viewport to ~10×7 tiles to fit larger tiles
- Move challenge sidebar below the board (or make it a collapsible drawer)
- Larger on-screen buttons (min 44×44px)
- Input bar becomes the touch action bar with bigger buttons

The canvas should scale to fill the screen:
```js
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Recompute tile size to fit viewport.cols tiles with 44px minimum
  const minTileSize = state.touch.enabled ? 44 : 30;
  ...
}
```

### Audio on Mobile

Mobile browsers require audio context to be created inside a user gesture handler. The current `LD.Audio.init()` is called on first keydown — add it to the first touchstart as well.

---

## Part 6: Round/Level System

### Framework (implement just Round 1 for now)

```js
const ROUNDS = [
  {
    id: 1,
    name: 'The First Page',
    boardWidth: 30,
    boardHeight: 25,
    plantedWordCount: 15,     // target (may get fewer if placement fails)
    plantedWordMinLen: 5,
    plantedWordMaxLen: 7,
    challengeCount: 10,
  },
  // Round 2+: NOT implemented now, just the structure for future use
  // { id: 2, name: 'Deeper Shelves', boardWidth: 32, boardHeight: 28, plantedWordCount: 20, ... },
];
```

**Round completion:** When all challenges are done (in 'challenges' mode), show a round-complete screen:
- Stats: score, words found, challenges completed, time taken
- Planted words found: X/Y
- "Continue" button (loads next round) or "Menu" button (back to settings)

For now, "Continue" just starts a new Round 1 with a fresh board (since Round 2+ isn't defined yet).

---

## Part 7: Module-by-Module Implementation Instructions

### File: `modules/constants.js` (NEW — ~100 lines)

IIFE on `window.LD.Constants`. This is loaded FIRST (after dictionary).

Contains:
- `BOARD_SIZES` object mapping 'small'/'medium'/'large' to {width, height}
- `FRAGMENTS` array of common letter sequences
- `resolve(gameMode, settings)` function that returns the full config object (see Architecture section above)

This file is the single source of truth for all gameplay numbers. No other module hardcodes counts, percentages, or thresholds.

### File: `modules/settings.js` (NEW — ~400 lines)

IIFE on `window.LD.Settings`.

**Must implement:**
- `init(canvas, state)` — attach `mousemove`, `mousedown`, `touchstart` listeners to canvas
- `render(ctx, state)` — draw the settings screen with mode-adaptive sections
- Click/tap handler updates `state.settings` and `state.gameMode` directly

**Key design rules:**
- Rebuild hit regions every render (positions depend on which sections are visible)
- Difficulty description text changes when mode or difficulty selection changes
- "GOAL" section only visible when Word Hunt is selected
- Start button always active (default selections are valid)
- The whole panel should be centered vertically on the 720px canvas

### File: `modules/challenges.js` (NEW — ~300 lines)

IIFE on `window.LD.Challenges`.

**Must implement:**
- `generate(round)` → array of challenge objects
- `checkAll(state, wordData)` → array of newly completed challenge IDs
- `renderSidebar(ctx, state, mouseX, mouseY)` — draw challenge list, handle hover tooltips

**Challenge check detail:**
- Called after every word submission in Word Hunt mode
- `cross` check: maintain `state.hunt.usedTileKeys` Set. After each word, check if any tile key in the new path already exists in the set. If so, challenge complete. Then add all new path tile keys to the set.
- Each challenge `checkFn` is a method on the Challenges object, looked up by ID
- Return value is array of IDs that JUST completed (for celebration effects)

### File: `modules/touch.js` (NEW — ~250 lines)

IIFE on `window.LD.Touch`.

**Must implement:**
- `init(canvas, state)` — attach touch event listeners
- `handleTileTap(col, row, state)` — add tile to current path, validate adjacency
- `handleUndo(state)` — remove last tile from path
- `handleClear(state)` — clear entire path
- `handleSubmit(state)` — trigger word submission (call same logic as Enter key)
- `renderActionBar(ctx, state)` — draw touch buttons at bottom of screen
- `isScrollGesture(e)` — detect multi-touch pan
- `update(state)` — process scroll momentum if needed

**Tap-to-spell rules:**
- First tap: any non-corrupted tile starts the word
- Subsequent taps: must be 8-directionally adjacent to the last tile in path
- Tap on last tile in path: undo (remove it)
- Tap on non-adjacent tile: clear and start new word from that tile
- Double-tap: submit word (alternative to submit button)
- After each tap, assemble `state.input.typed` from path tiles and run validation

### File: `modules/board.js` (MODIFY)

**Add `generateWordHunt(state)` function.** All numbers come from `state.config` (resolved from constants):
1. Set dimensions from `state.config.boardWidth` / `boardHeight`
2. Create empty tile array
3. Plant words using `selectPlantableWords(state.config)` — length range and count from config. Direction pool from config (`plantedDiagonalPct`, `plantedReversePct`).
4. Plant fragments: count from `state.config.fragmentCount`, fragment list from `LD.Constants.FRAGMENTS`
5. Fill remaining tiles with weighted random letters
6. Place special tiles: counts from `state.config.crystalCount`, `voidCount`, `emberCount`
7. Set `state.corruptionCount = 0` (no corruption)

**Modify `generateSiege(state)` (renamed from current generate internals):**
- Read seal count, corruption spread chance, initial radius from `state.config`
- Everything else stays the same

**Modify existing functions:**
- `generate(state)` becomes a router: checks `state.gameMode` and calls the right generator
- `spreadCorruption(state)`: early return `[]` if gameMode is 'wordhunt'. In siege, use `state.config.corruptionSpreadChance` instead of hardcoded 0.30.
- `refreshTiles(state, path)`: early return if gameMode is 'wordhunt'

**Add:**
- `checkPlantedWord(state, word, path)` → matching planted word object or null. Compare word (case-insensitive) and check that path tiles cover the planted path positions. Finding a word backwards counts (compare reversed path too).

### File: `modules/input.js` (MODIFY)

**Modify `submitWord()`:**

Add a mode branch at the top of the function:

```js
function submitWord() {
  if (_state.gameMode === 'wordhunt') {
    return submitWordHunt();
  }
  // ... existing Siege logic unchanged
}

function submitWordHunt() {
  const typed = _state.input.typed;
  const path = _state.input.path.slice();
  const board = _state.board;

  // 1. Base score
  const pathTiles = path.map(({col, row}) => board.tiles[row * board.width + col]);
  let earned = dictScore(typed, pathTiles);

  // 2. Path shape multiplier
  let shapeMult = 1.0;
  let isStraight = false, isH = false, isV = false, corners = 0;
  if (_state.settings.pathBonuses) {
    // ... compute shape (see Part 3)
    shapeMult = getPathShapeMultiplier(path);
    earned = Math.round(earned * shapeMult);
  }

  // 3. Combo
  let comboMult = 1.0;
  if (_state.settings.comboBonuses) {
    _state.hunt.combo++;
    comboMult = 1.0 + (_state.hunt.combo - 1) * 0.1;
    earned = Math.round(earned * comboMult);
  }

  // 4. Crystal / Ember bonuses
  // ... check for crystal (2x) and ember (+20) in path tiles

  // 5. Check planted words
  const planted = safeCall(LD.Board?.checkPlantedWord, board, typed, path);
  if (planted) {
    planted.found = true;
    earned += 100; // discovery bonus
    // celebration effects
  }

  // 6. Check challenges
  const wordData = { word: typed, path, score: earned, isStraight, isHorizontal: isH, isVertical: isV, corners, isPlantedWord: !!planted, tilesUsed: path };
  const newlyCompleted = safeCall(LD.Challenges?.checkAll, _state, wordData) || [];
  for (const id of newlyCompleted) {
    // award challenge reward points, play sound, particles
  }

  // 7. Update stats (do NOT call refreshTiles or spreadCorruption)
  _state.score += earned;
  _state.wordsSpelled++;
  if (_state.settings.endCondition === 'turns') _state.hunt.turnsRemaining--;
  _state.hunt.wordsThisRound.push({ word: typed, score: earned });

  // 8. Track used tiles for cross-word challenge
  path.forEach(p => _state.hunt.usedTileKeys.add(p.col + ',' + p.row));

  // 9. Win/lose check
  if (_state.settings.endCondition === 'challenges') {
    if (_state.hunt.completedCount >= _state.hunt.challenges.length) {
      _state.phase = 'victory';
    }
  } else if (_state.settings.endCondition === 'turns') {
    if (_state.hunt.turnsRemaining <= 0) _state.phase = 'gameover';
  }

  // 10. Particles, audio, clear input
  // ... (same particle/audio calls as existing, with score popup)

  clearInput();
}
```

**Modify `scrollViewport()`:**
Add: `if (_state.gameMode === 'wordhunt' && _state.settings.comboBonuses) _state.hunt.combo = 0;`

### File: `modules/renderer.js` (MODIFY)

**Modify `drawHUD()`:**
```js
if (state.gameMode === 'wordhunt') {
  drawHUDWordHunt(ctx, state);
} else {
  drawHUDSiege(ctx, state); // existing HUD code, renamed
}
```

Word Hunt HUD shows:
- Score, Words, Round name
- Combo indicator (when > 0)
- Timer or turns remaining (per end condition)
- No corruption bar, no seeds indicator

**Modify `drawBoard()`:**
- No planted-word visual hints (tiles look normal)
- Once a planted word is found: highlight its path tiles with a subtle golden tint and a small star icon — this is the REWARD for finding it, not a hint
- In Siege mode: existing corruption rendering, unchanged

**Modify `drawMinimap()`:**
Word Hunt mode:
- All tiles rendered as sand-colored dots
- Found planted word tiles as amber dots
- Special tiles as their color dots
- Viewport rectangle
- No corruption coloring

**Add `drawChallengeSidebar()` delegation** in playing phase:
```js
if (state.gameMode === 'wordhunt' && LD.Challenges) {
  LD.Challenges.renderSidebar(ctx, state, mouseX, mouseY);
}
```

**Modify `drawInputBar()`:**
- Word Hunt: show path shape info ("Straight 2.0x!" or "1 corner")
- Touch mode: delegate to `LD.Touch.renderActionBar(ctx, state)` instead

### File: `modules/game.js` (MODIFY)

**Phase flow update:**
```
'title' → 'settings' → 'playing' → 'victory'/'gameover' → 'settings'
```

Title screen now just shows logo briefly then transitions to settings (or skip title, go straight to settings).

**Modify `startGame()`:**
- Initialize based on `state.gameMode` and `state.settings`
- Word Hunt: call word hunt board generation, generate challenges
- Siege: existing behavior

**Game loop additions:**
- If Word Hunt + timed: decrement `state.hunt.timeRemaining` by dt. If ≤ 0, trigger gameover.
- Touch mode: call `LD.Touch.update(state)` for scroll momentum

**Boot sequence:**
```js
// Detect touch
STATE.touch.enabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// Init modules
if (LD.Settings) LD.Settings.init(canvas, STATE);
if (LD.Input) LD.Input.init(STATE);
if (LD.Touch && STATE.touch.enabled) LD.Touch.init(canvas, STATE);

// Start in settings phase (skip title or show it briefly)
STATE.phase = 'settings';
```

### File: `modules/audio.js` (MODIFY)

**Add sounds:**
- `challenge_complete` — bright 3-note ascending chime (C5→E5→G5, 80ms each, gain 0.25)
- `round_complete` — extended victory arpeggio
- `combo` — quick double-tick (600Hz + 800Hz, 30ms each, 50ms apart)
- `discovery` — magical shimmer (high sine with vibrato → chord swell, 500ms)
- `tap` — very short click for tile taps in touch mode (similar to `scroll` but slightly brighter)

### File: `assemble.sh` (MODIFY)

Update module order:
```bash
for mod in dictionary board pathfinder challenges particles audio renderer settings touch input game; do
```

---

## Part 8: Implementation Order

Execute in this order. Each step = one commit.

1. **Settings module + phase flow** — New `settings.js`. Update `game.js` to route through settings phase. Update renderer to draw settings screen. Test: navigate title → settings → start game in both modes. Both modes should start the existing game (Word Hunt just acts like Siege for now).

2. **Word Hunt board generation** — Add `generateWordHunt()` to board.js. Plant words from dictionary, plant fragments, fill remaining tiles. Disable corruption spread and tile refresh for Word Hunt. Test: start Word Hunt, verify board has no corruption, tiles don't refresh after words.

3. **Word Hunt scoring** — Path shape multiplier function, combo tracking, crystal/ember bonuses. New `submitWordHunt()` in input.js. Planted word detection with `checkPlantedWord()`. Score breakdown popup. Test: submit words, see shape/combo bonuses, find a planted word.

4. **Challenges module** — New `challenges.js` with Round 1 challenges, check functions, sidebar rendering with hover tooltips. Wire into `submitWordHunt()`. Test: complete challenges, see sidebar update, celebrations fire.

5. **Touch support** — New `touch.js`. Tap-to-spell input, action bar buttons, two-finger scroll. Touch detection in settings. Responsive tile sizing. Test: use touch mode (Chrome DevTools device emulation or actual phone).

6. **Polish + reassemble** — Completion animations, round-complete screen, timer/turns HUD, Word Hunt minimap. Update `assemble.sh` with new modules. Run assembly. Test full game flow in both modes, both input methods.

---

## Part 9: Key Constraints

- **Single file output**: Everything assembles into `lexicon-deep.html` via `bash assemble.sh`
- **No external dependencies**: No npm, no CDN, no images. Canvas-drawn everything.
- **Shared engine**: Pathfinder, dictionary, particles, audio are shared. Branch on `state.gameMode`.
- **Don't break Siege mode**: All existing corruption/seal behavior must still work when Siege is selected.
- **Word Hunt is primary**: Default selection, listed first, most polished.
- **Touch targets**: All interactive elements ≥ 44×44px in touch mode (Apple HIG minimum).
- **No planted word hints**: Planted tiles look identical to random tiles. Discovery IS the game.
- **Module load order**: `dictionary → board → pathfinder → challenges → particles → audio → renderer → settings → touch → input → game`
- **Commit after each step** per the repo's CLAUDE.md conventions.
- **Test both modes** after each step to prevent regressions.
