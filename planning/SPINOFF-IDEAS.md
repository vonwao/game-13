# Spinoff Ideas

Word-adjacent, single-screen, dictionary-checkable, no asset pipeline. Each is tight enough to one-shot in vanilla JS + canvas/DOM (same shape as Crossword Drift).

Diagrams are ASCII so they survive any renderer.

---

## Falling / cascade family

### 1. Anagram Cascade

Bookworm-style. Letters drop into columns; swap adjacent tiles to form words; words dissolve, gravity pulls down, chains combo. Burning tiles eat upward if you stall.

```
   col0  col1  col2  col3  col4  col5
  +----+----+----+----+----+----+
  |    |    | Q  |    |    |    |   ← new letter spawning
  +----+----+----+----+----+----+
  | T  | R  | A  | C  | E  |    |   ← swap A↔R to form "TRACE"
  +----+----+----+----+----+----+
  | S  | E  | N  | D  | F* |    |   ← F* is burning (timer)
  +----+----+----+----+----+----+
  | A  | I  | L  | M  | O  | P  |   ← floor
  +----+----+----+----+----+----+
              ▲
        swap with neighbor

  combo x3   score 1240   chain: TRACE → ACE → CE…
```

---

### 2. Word Snake

Snake, but the field is letters. Eating extends your tail and spells a word; submit at any time for score, longer = exponential. Hit yourself = game over.

```
  +--------------------------------+
  |  .  .  .  .  T  .  .  .  .  . |
  |  .  E  .  .  .  .  .  R  .  . |
  |  .  .  .  H ←━━━━━━━━━━━┓ .  . |   tail spells "S-N-A-K"
  |  .  .  .     S━N━A━K   ┃ .  . |
  |  .  .  .  .  .  .  .   ▼ .  . |
  |  .  A  .  .  .  .  .  head .  |
  |  .  .  .  .  .  .  .  .  .  . |
  +--------------------------------+
   tail: S N A K        [Space] = submit
   eat H next → SNAKH (invalid, lose tail)
   eat E next → SNAKE  (valid, +250)
```

---

## Tracing / pathing family

### 3. Word Wires

Flow Free with letters. Connect endpoints by tracing a path whose letters spell a valid word. Puzzle mode (curated boards) is even simpler to one-shot than endless.

```
  +----+----+----+----+----+
  | ●W |    | I  |    | ●D |    ●  = endpoint
  +----+----+----+----+----+         path must visit
  |    |    |    |    |    |         every cell once
  +----+----+----+----+----+         (or just spell a word)
  | O  |    | N  |    |    |
  +----+----+----+----+----+
  |    |    |    |    | R  |
  +----+----+----+----+----+

   solution: W → I → N → D    "WIND"
   bonus: include R, O for "WORD" alt path
```

---

### 4. Spell Climb

Endless vertical climber. Grab letters from floating platforms; the word you've collected determines jump power on submit. Hold for a longer word vs. submit before the floor catches up.

```
            ┌─────┐
            │  K  │           ← reach this with longer word
            └─────┘
       ┌───┐
       │ A │
       └───┘
  ┌───┐         ┌───┐
  │ T │         │ E │
  └───┘         └───┘
       ┌───┐
       │ ☻ │   word held: "TAK"
       └───┘   submit → jump = len² × 8
  ════════════════════════════
       rising lava floor
```

---

## Roguelike / deckbuilder family

### 5. Lex Crucible  ★ recommended

Each round, draw 7 letters, play words on a small board, score against a target. Between rounds, buy modifiers ("double Q", "vowel re-rolls", "5-letter words ×2"). Run-based, persistent meta.

```
  ┌──────────── ROUND 4 / 8 ─────────── target: 1500 ┐
  │                                                  │
  │   board (4×4)              hand                  │
  │   +--+--+--+--+         ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ │
  │   |C |R |  |  |         │T│ │A│ │S│ │I│ │N│ │E│ │
  │   +--+--+--+--+         └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ │
  │   |R |A |  |  |                                  │
  │   +--+--+--+--+         modifiers active:        │
  │   |A |T |  |  |          • Q-tile counts ×4      │
  │   +--+--+--+--+          • combo cap removed     │
  │   |S |E |  |  |          • rare letters re-roll  │
  │   +--+--+--+--+                                  │
  │                                                  │
  │   score 1180  ──  1500  [submit] [discard 2]     │
  └──────────────────────────────────────────────────┘
        ↓ shop after round
   ┌──────┐ ┌──────┐ ┌──────┐
   │ +2 Q │ │vowel │ │chain │
   │ $4   │ │+1 ea │ │ x1.5 │
   └──────┘ └──────┘ └──────┘
```

---

### 6. Etymon

Word-ladder roguelike. Start word → target, one letter change per step. Letters have rarity; rare-letter substitutions grant powers (skip a step, branch, etc.). Daily seed = built-in replay.

```
                            steps remaining: 4
                            powers: [skip×1] [branch×1]

   start                                              target
   ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐
   │COLD │ → │CORD │ → │WORD │ → │WARD │ → │WARM │
   └─────┘    └─────┘    └─────┘    └─────┘    └─────┘
                ▲          ▲                      ▲
              L→R        C→W rare:              D→M
                         "branch" earned

   alt branches you didn't take ▼
            CORK → WORK → WORM
            CORN → WORN
```

---

## Solitaire family

### 7. Lexicon Deck

Klondike-shaped, but every stack must spell a valid *prefix* at all times; completing a full word retires the stack for points. Pure logic puzzle, no twitch.

```
   stock           waste
   [☐☐☐]            [E ]              foundations (retired words)
                                       ┌──┐ ┌──┐ ┌──┐ ┌──┐
                                       │RA│ │  │ │  │ │  │
   stacks (each must be a valid prefix) ─────────────────
   ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
   │T │ │S │ │P │ │C │ │B │ │M │ │L │
   │R │ │T │ │L │ │R │ │R │ │A │ │I │
   │A │ │A │ │A │ │A │ │E │ │P │ │G │
   │C │ │R │ │N │ │N │ │A │ │  │ │H │
   │E │ │  │ │E │ │E │ │D │ │  │ │T │
   └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
   "TRACE" → submit → retires stack, +400

   move waste-E onto any stack where prefix+E is still a valid prefix
```

---

## Recommendation

- **Highest ceiling, run-based replay:** Lex Crucible
- **Most likely to finish cleanly in one shot:** Word Snake
- **Closest in feel to existing Word Hunt:** Word Wires
- **Most distinct from anything you've built:** Etymon
