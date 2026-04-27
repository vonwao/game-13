# One-Shot Build Prompt — Crossword Drift

Paste everything below the `---` line into a fresh Claude Code session opened in an empty subdirectory (e.g. `crossword-drift/`). The prompt is fully self-contained — it must NOT read or import anything outside its own directory.

---

You are building **Crossword Drift**, a complete, playable browser game, in one shot. Work in the current directory. Do not read or reference any files outside it. When you finish, `npm install && npm run dev` must launch a working game in the browser with no console errors.

## The Game

Crossword Drift is Tetris meets crossword. Short letter fragments drift down a grid. The player moves and rotates them. When a fragment locks, the engine scans the affected row and column for newly-formed dictionary words (≥3 letters). Completed words flash, score, and become "locked" tiles (visually dimmer, gold border). A row clears (gravity-shifts everything above down by one) only when **every** tile in that row is part of a locked word. Game ends when a fragment can't spawn because the top rows are full.

### Core feel
- Calm, puzzle-y, not twitchy. Fragments fall slowly (1 cell / 800ms at level 1, scaling down).
- Big readable letters on a dark board with a subtle grid.
- Every locked word is celebrated: brief flash, floating "+score" text, soft chime (optional, off by default).
- One-screen game. No menus beyond title → play → game-over → restart.

### Controls
- ← / → : move fragment horizontally
- ↑ : rotate (horizontal ↔ vertical)
- ↓ : soft drop (faster fall while held)
- Space : hard drop (instant lock)
- P : pause
- R : restart (only on game-over screen)

### Rules
- Board: 10 columns × 16 rows.
- Fragments: 2–4 contiguous letters sliced from a real dictionary word. Orientation random on spawn (horizontal or vertical). Spawned at top center.
- Gravity: fragment falls one cell per tick. On collision (floor or any existing tile), it locks in place. If any letter of the fragment is above the board on lock → game over.
- Word detection: after lock, scan the rows and columns touched by the new tiles. Find every maximal run of ≥3 contiguous letters that is a valid dictionary word. Each newly-completed word: mark its tiles `locked=true`, award score = `word.length² × 10 × comboMultiplier`. Multiple words from one lock = combo (multiplier 1, 1.5, 2, 3...).
- Row clear: after scoring, any row where every cell is a `locked` tile is removed; rows above shift down. Award `100 × clearedRows²` bonus.
- Levels: every 10 locked words, level +1, fall interval × 0.9. Cap level 15.
- High score persists in `localStorage` under key `crossword-drift-highscore`.

## Tech Stack (non-negotiable)

- Vanilla JS, ES modules, no frameworks.
- Vite for dev server / build.
- HTML5 Canvas for rendering.
- One `index.html`, one `package.json`, source under `src/`.
- No external runtime dependencies beyond Vite (devDep only).
- Node ≥ 18.

## Architecture — Five Independent Modules

You will implement this as five modules with strict, narrow interfaces. Each module is self-contained: it imports only `src/shared/types.js` (type comments) and `src/shared/dict.js` (the dictionary). Modules do NOT import each other directly except through `src/main.js`, which wires them together.

**This split exists so the modules can be built in parallel by sub-agents. Spawn one sub-agent per module, in parallel, then integrate.**

### Shared contract (build this first, before spawning sub-agents)

`src/shared/types.js` — JSDoc typedefs only, no runtime code:
```js
/** @typedef {{ letter: string, locked: boolean }} Tile */
/** @typedef {(Tile|null)[][]} Board  // board[row][col], row 0 is top */
/** @typedef {{ letters: string[], orientation: 'h'|'v', row: number, col: number }} Fragment */
/** @typedef {{ text: string, tiles: {row:number,col:number}[], orientation:'h'|'v' }} FoundWord */
```

`src/shared/dict.js` — exports:
- `WORDS: Set<string>` — uppercase English words, length 3–8.
- `isWord(s: string): boolean` — uppercase lookup.
- `randomWord(minLen=3, maxLen=7): string` — uniformly random.

For the word list, embed ~2000 common English words inline in `dict.js` (uppercase, length 3–8, no proper nouns, no plurals-only-stems). Generate this list yourself; do not fetch from a URL. A good source pattern: hand-curate ~500 high-frequency words plus common 4–6 letter words. The list must include at least: CAT, DOG, TREE, LIGHT, STAR, MOON, SUN, WORD, GAME, PLAY, JUMP, RUN, FIRE, WATER, EARTH, WIND, GOLD, SILVER, BIRD, FISH, BOOK, READ, WRITE, DREAM, NIGHT, DAY, RAIN, SNOW, LEAF, ROOT, STONE, RIVER, HILL, ROAD, HOUSE, DOOR, WINDOW, ROOM, TABLE, CHAIR, BREAD, MILK, APPLE, ORANGE, GREEN, BLUE, RED, BLACK, WHITE, FAST, SLOW, BIG, SMALL, OLD, NEW, GOOD, BAD, HOT, COLD, LOVE, HOPE, TIME, LIFE, WORLD, PEACE, MUSIC, DANCE, SONG, VOICE, HEART, MIND, SOUL, HAND, FOOT, EYE, EAR, FACE, HEAD, ARM, LEG, KING, QUEEN, CROWN, SWORD, SHIELD, MAGIC, SPELL, SPIRIT, GHOST, BEAST.

### Module 1 — `src/fragments.js`
Pure functions. No DOM, no state.
```js
export function generateFragment(): { letters: string[], orientation: 'h'|'v' }
// Picks a random dict word, slices a random contiguous 2–4 letter substring,
// uppercase, picks random orientation.
```

### Module 2 — `src/board.js`
Owns board state and fragment physics. No rendering, no input listeners.
```js
export function createBoard(cols=10, rows=16): Board
export function spawnFragment(board: Board, letters: string[], orientation: 'h'|'v'): Fragment | null
  // Returns null if spawn position is blocked (game over).
export function canMove(board: Board, frag: Fragment, dRow: number, dCol: number): boolean
export function moveFragment(frag: Fragment, dRow: number, dCol: number): Fragment // returns NEW fragment
export function rotateFragment(board: Board, frag: Fragment): Fragment // no-op if rotation collides
export function lockFragment(board: Board, frag: Fragment): {row:number,col:number}[]
  // Mutates board in place, returns coords of newly placed tiles.
export function tickGravity(board: Board, frag: Fragment): { frag: Fragment|null, lockedTiles: {row:number,col:number}[] }
  // If can drop, returns moved frag. Else locks and returns lockedTiles + frag=null.
export function clearFullLockedRows(board: Board): number // returns rows cleared
```

### Module 3 — `src/words.js`
Pure word-detection. No state.
```js
import { isWord } from './shared/dict.js'
export function findNewWords(board: Board, lockedTiles: {row:number,col:number}[]): FoundWord[]
  // For each row and column touched by lockedTiles, find every maximal run of
  // contiguous letters of length >=3 that is in the dictionary AND contains
  // at least one of the lockedTiles. Dedupe across calls. Return them.
export function applyWordsToBoard(board: Board, words: FoundWord[]): void
  // Mark every tile in every word as locked=true.
export function scoreWords(words: FoundWord[]): number
  // sum over words: word.length^2 * 10. Combo multiplier handled by caller.
```

### Module 4 — `src/render.js`
Canvas rendering only. Reads state, never mutates it.
```js
export function createRenderer(canvas: HTMLCanvasElement, cols: number, rows: number): {
  draw(board: Board, frag: Fragment|null, hud: { score: number, level: number, highScore: number, paused: boolean }): void,
  flashWords(words: FoundWord[]): void,  // schedules a brief flash overlay; non-blocking
  showFloatingText(text: string, row: number, col: number): void,
  drawTitleScreen(highScore: number): void,
  drawGameOver(score: number, highScore: number): void,
}
```
Visual spec: dark slate background `#0f1419`, grid lines `#1f2937`, normal letters cream `#f5f5dc` on tile fill `#374151`, locked-word tiles fill `#854d0e` with gold border `#facc15`, falling fragment tiles slightly brighter than normal. Letters sized to ~70% of cell. HUD top: score left, level center, high-score right. Use system font stack.

### Module 5 — `src/main.js`
Wires everything together. Owns the game loop, input listeners, and game state machine (`title` | `playing` | `paused` | `gameover`).
- Initializes board, renderer, dictionary.
- `requestAnimationFrame` loop. Tracks elapsed time, calls `tickGravity` every `fallInterval` ms.
- On lock: `findNewWords` → `applyWordsToBoard` → `scoreWords` (with combo multiplier from chained calls — keep applying & scoring while new words appear, multiplier increases each chain step) → `clearFullLockedRows` → bonus → spawn next fragment → if spawn fails, game over.
- Input: keydown listeners as specified above.
- Persists high score to localStorage.

## Files to create

```
crossword-drift/
├── package.json          # name: crossword-drift, scripts: dev/build/preview, devDep: vite ^5
├── index.html            # mounts a <canvas id="game" width="500" height="800">
├── vite.config.js        # minimal
├── README.md             # how to run, controls, brief design notes
├── src/
│   ├── main.js
│   ├── board.js
│   ├── fragments.js
│   ├── words.js
│   ├── render.js
│   └── shared/
│       ├── dict.js
│       └── types.js
```

## Build order

1. Write `package.json`, `vite.config.js`, `index.html`, `src/shared/types.js`, `src/shared/dict.js` (with the embedded word list). This is the contract — everything depends on it.
2. **In parallel, spawn one sub-agent per module** (fragments, board, words, render). Brief each sub-agent with: (a) the relevant section of this prompt verbatim, (b) the contents of `src/shared/types.js` and the export signature of `src/shared/dict.js`, (c) a reminder that it MUST NOT import from any other module. Each sub-agent writes only its assigned file.
3. After all four return, write `src/main.js` yourself to integrate them.
4. Run `npm install`, then `npm run dev`. Open the URL Vite prints. Verify in a browser: title screen renders, pressing any key starts game, fragments fall, arrow keys move them, words light up gold, score increases, game over triggers when stack reaches top, high score persists across reloads.
5. If anything is broken, fix it. Do not declare done until you have actually played for at least 30 seconds without console errors.

## Constraints / non-goals
- No sound (leave a `// TODO: chime on word lock` comment in main.js).
- No mobile touch controls (keyboard only).
- No animations beyond word flash + floating text.
- No settings, no menus, no leaderboard beyond the local high score.
- Do not over-engineer. No classes unless they earn their keep. No TypeScript. No tests.
- Do not write design docs, planning docs, or summary files. Only the README.
- Keep total source under ~800 lines excluding the dictionary.

When done, print to the user: the run command, the controls, and one sentence on what to try first.
