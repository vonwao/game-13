(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var BOARD_WIDTH = 40;
  var BOARD_HEIGHT = 40;

  // Weighted letter pool — rebalanced from Scrabble for more visual variety
  // Reduced common vowels, boosted mid-tier consonants
  var LETTER_WEIGHTS = {
    A: 7,  B: 3,  C: 4,  D: 4,  E: 9,  F: 3,  G: 3,  H: 4,
    I: 7,  J: 1,  K: 2,  L: 5,  M: 4,  N: 6,  O: 7,  P: 3,
    Q: 1,  R: 6,  S: 6,  T: 7,  U: 4,  V: 2,  W: 3,  X: 1,
    Y: 3,  Z: 1
  };

  // Point values
  var LETTER_POINTS = {
    E: 1, A: 1, I: 1, O: 1, N: 1, R: 1, T: 1, L: 1, S: 1, U: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10
  };

  // Hard mode degradation letters
  var HARD_MODE_LETTERS = ['Q', 'X', 'Z', 'V', 'J'];

  // Build weighted letter array for fast random sampling
  var WEIGHTED_LETTERS = (function () {
    var pool = [];
    var letters = Object.keys(LETTER_WEIGHTS);
    for (var i = 0; i < letters.length; i++) {
      var letter = letters[i];
      var weight = LETTER_WEIGHTS[letter];
      for (var w = 0; w < weight; w++) {
        pool.push(letter);
      }
    }
    return pool;
  })();

  // ---------------------------------------------------------------------------
  // Helper utilities
  // ---------------------------------------------------------------------------

  function rand(max) {
    return Math.floor(Math.random() * max);
  }

  function getRandomLetter() {
    return WEIGHTED_LETTERS[rand(WEIGHTED_LETTERS.length)];
  }

  function getLetterPoints(letter) {
    return LETTER_POINTS[letter] || 0;
  }

  /**
   * Returns array of [col, row] pairs for all 8-directional neighbors
   * within the board bounds.
   */
  function getAdjacent(col, row, width, height) {
    width = width || BOARD_WIDTH;
    height = height || BOARD_HEIGHT;
    var dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    var result = [];
    for (var i = 0; i < dirs.length; i++) {
      var dc = dirs[i][0];
      var dr = dirs[i][1];
      var nc = col + dc;
      var nr = row + dr;
      if (nc >= 0 && nc < width && nr >= 0 && nr < height) {
        result.push([nc, nr]);
      }
    }
    return result;
  }

  /** Manhattan distance between two positions. */
  function manhattanDist(c1, r1, c2, r2) {
    return Math.abs(c1 - c2) + Math.abs(r1 - r2);
  }

  /** Chebyshev (chess king) distance — used for 8-dir adjacency radius checks. */
  function chebyshevDist(c1, r1, c2, r2) {
    return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2));
  }

  /** Convert (col, row) to flat index. */
  function idx(col, row) {
    return row * BOARD_WIDTH + col;
  }

  // ---------------------------------------------------------------------------
  // Tile factory
  // ---------------------------------------------------------------------------

  function makeTile(col, row, letter) {
    return {
      letter: letter || null,
      icon: null,
      isSeal: false,
      corrupted: false,
      points: letter ? (getLetterPoints(letter) || 1) : 0,
      col: col,
      row: row,
      glow: 0,
      shake: 0,
      dropY: 0,
      tint: null
    };
  }

  // ---------------------------------------------------------------------------
  // Board generation
  // ---------------------------------------------------------------------------

  /**
   * Attempt to place `count` seals with minimum separation of `minDist`
   * (Chebyshev distance) using a rejection-sampling approach.
   * Returns array of { col, row }.
   */
  function placeSealPositions(count, minDist) {
    var positions = [];
    var maxAttempts = 10000;
    var attempts = 0;

    while (positions.length < count && attempts < maxAttempts) {
      attempts++;
      var col = rand(BOARD_WIDTH);
      var row = rand(BOARD_HEIGHT);

      // Reject positions too close to existing seals
      var tooClose = false;
      for (var i = 0; i < positions.length; i++) {
        if (chebyshevDist(col, row, positions[i].col, positions[i].row) < minDist) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        positions.push({ col: col, row: row });
      }
    }

    return positions;
  }

  /**
   * `generate(state)` — Builds the complete 40×40 board and writes into state.
   *
   * state must be a plain object. After generation, state will contain:
   *   state.tiles         — flat array[1600] of tile objects
   *   state.seals         — array of { col, row, alive } objects
   *   state.corruptionCount — integer
   *   state.width / state.height
   */
  function generate(state) {
    state.width = BOARD_WIDTH;
    state.height = BOARD_HEIGHT;
    state.corruptionCount = 0;

    // --- Step 1: Fill all tiles with random letters ---
    state.tiles = [];
    for (var r = 0; r < BOARD_HEIGHT; r++) {
      for (var c = 0; c < BOARD_WIDTH; c++) {
        state.tiles.push(makeTile(c, r, getRandomLetter()));
      }
    }

    // --- Step 2: Place 6 seals (min 12 tiles apart) ---
    var sealPositions = placeSealPositions(6, 12);
    state.seals = [];

    for (var si = 0; si < sealPositions.length; si++) {
      var sp = sealPositions[si];
      var sealTile = state.tiles[idx(sp.col, sp.row)];
      sealTile.isSeal = true;
      sealTile.corrupted = false;
      sealTile.letter = null;
      sealTile.icon = null;
      sealTile.points = 0;
      state.seals.push({ col: sp.col, row: sp.row, alive: true });
    }

    // --- Step 3: Place icon tiles (must be ≥3 tiles from any seal) ---
    var iconSpec = [
      { icon: 'ember',   count: 6 },
      { icon: 'crystal', count: 8 },
      { icon: 'void',    count: 5 },
      { icon: 'bomb',    count: 2 }
    ];

    for (var ii = 0; ii < iconSpec.length; ii++) {
      var spec = iconSpec[ii];
      var placed = 0;
      var iconAttempts = 0;

      while (placed < spec.count && iconAttempts < 50000) {
        iconAttempts++;
        var ic = rand(BOARD_WIDTH);
        var ir = rand(BOARD_HEIGHT);
        var tile = state.tiles[idx(ic, ir)];

        // Must not already be a seal or icon tile
        if (tile.isSeal || tile.icon !== null) {
          continue;
        }

        // Must be ≥3 Chebyshev distance from all seals
        var nearSeal = false;
        for (var sj = 0; sj < state.seals.length; sj++) {
          var seal = state.seals[sj];
          if (chebyshevDist(ic, ir, seal.col, seal.row) < 3) {
            nearSeal = true;
            break;
          }
        }
        if (nearSeal) continue;

        tile.letter = null;
        tile.icon = spec.icon;
        tile.points = 0;
        placed++;
      }
    }

    // --- Step 4: Corrupt the 8 immediate neighbors of each seal ---
    for (var sk = 0; sk < state.seals.length; sk++) {
      var s = state.seals[sk];
      var neighbors = getAdjacent(s.col, s.row, BOARD_WIDTH, BOARD_HEIGHT);
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        var ntile = state.tiles[idx(nc, nr)];
        // Icon tiles cannot be corrupted
        if (!ntile.icon && !ntile.isSeal && !ntile.corrupted) {
          ntile.corrupted = true;
          state.corruptionCount++;
        }
      }
    }

    return state;
  }

  // ---------------------------------------------------------------------------
  // Corruption spread
  // ---------------------------------------------------------------------------

  /**
   * `spreadCorruption(state)` — One corruption step.
   *
   * Each corrupted tile (and living seal positions) has a 30% chance to
   * spread to one adjacent non-corrupted, non-icon tile.
   * Prefers tiles with higher point values.
   *
   * Returns array of newly corrupted tile objects.
   */
  function spreadCorruption(state) {
    var newlyCorrupted = [];

    // Collect all source tiles: corrupted regular tiles + living seals
    var sources = [];
    for (var i = 0; i < state.tiles.length; i++) {
      var t = state.tiles[i];
      if (t.corrupted || (t.isSeal && isSealAlive(state, t.col, t.row))) {
        sources.push(t);
      }
    }

    for (var si = 0; si < sources.length; si++) {
      var source = sources[si];

      // 30% chance to spread
      if (Math.random() > 0.30) continue;

      var neighbors = getAdjacent(source.col, source.row, BOARD_WIDTH, BOARD_HEIGHT);

      // Filter to eligible spread targets
      var candidates = [];
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        var ntile = state.tiles[idx(nc, nr)];
        if (!ntile.corrupted && !ntile.icon && !ntile.isSeal) {
          candidates.push(ntile);
        }
      }

      if (candidates.length === 0) continue;

      // Sort by point value descending (prefer high-value tiles)
      candidates.sort(function (a, b) { return b.points - a.points; });

      var target = candidates[0];
      target.corrupted = true;
      state.corruptionCount++;
      newlyCorrupted.push(target);
    }

    return newlyCorrupted;
  }

  // ---------------------------------------------------------------------------
  // Cleansing
  // ---------------------------------------------------------------------------

  /**
   * `cleanseTilesNear(state, path, radius)` — Cleanse corruption within
   * Manhattan distance ≤ radius of any tile in the word path.
   *
   * path — array of { col, row } or [col, row] pairs
   * radius — default 2
   *
   * Returns array of cleansed tile objects.
   */
  function cleanseTilesNear(state, path, radius) {
    if (radius === undefined || radius === null) radius = 2;

    var cleansed = [];

    for (var ti = 0; ti < state.tiles.length; ti++) {
      var tile = state.tiles[ti];
      if (!tile.corrupted) continue;

      // Check if within Manhattan distance of any path tile
      var inRange = false;
      for (var pi = 0; pi < path.length; pi++) {
        var pc = Array.isArray(path[pi]) ? path[pi][0] : path[pi].col;
        var pr = Array.isArray(path[pi]) ? path[pi][1] : path[pi].row;
        if (manhattanDist(tile.col, tile.row, pc, pr) <= radius) {
          inRange = true;
          break;
        }
      }

      if (inRange) {
        tile.corrupted = false;
        state.corruptionCount = Math.max(0, state.corruptionCount - 1);
        cleansed.push(tile);
      }
    }

    return cleansed;
  }

  // ---------------------------------------------------------------------------
  // Seal utilities
  // ---------------------------------------------------------------------------

  function isSealAlive(state, col, row) {
    for (var i = 0; i < state.seals.length; i++) {
      var s = state.seals[i];
      if (s.col === col && s.row === row && s.alive) return true;
    }
    return false;
  }

  /**
   * `checkSealDestruction(state, path)` — Returns the index of a seal that
   * should be destroyed, or -1.
   *
   * Condition: word is 6+ letters long AND at least 2 path tiles are
   * adjacent (Chebyshev distance 1) to the seal.
   */
  function checkSealDestruction(state, path) {
    // Only valid for words of 6+ letters
    // Count letter tiles in path (exclude non-letter tiles)
    var letterCount = 0;
    for (var pi = 0; pi < path.length; pi++) {
      var ptile = Array.isArray(path[pi])
        ? state.tiles[idx(path[pi][0], path[pi][1])]
        : state.tiles[idx(path[pi].col, path[pi].row)];
      if (ptile && ptile.letter) letterCount++;
    }
    if (letterCount < 6) return -1;

    for (var si = 0; si < state.seals.length; si++) {
      var seal = state.seals[si];
      if (!seal.alive) continue;

      var adjacentCount = 0;
      for (var pi2 = 0; pi2 < path.length; pi2++) {
        var pc = Array.isArray(path[pi2]) ? path[pi2][0] : path[pi2].col;
        var pr = Array.isArray(path[pi2]) ? path[pi2][1] : path[pi2].row;
        if (chebyshevDist(pc, pr, seal.col, seal.row) === 1) {
          adjacentCount++;
          if (adjacentCount >= 2) {
            return si;
          }
        }
      }
    }

    return -1;
  }

  /**
   * `destroySeal(state, sealIndex)` — Mark seal as not alive.
   * BFS to find all corruption connected to this seal, cleanse it all.
   * Returns array of all cleansed tile objects.
   */
  function destroySeal(state, sealIndex) {
    var seal = state.seals[sealIndex];
    if (!seal) return [];

    seal.alive = false;

    // Mark the seal tile itself
    var sealTile = state.tiles[idx(seal.col, seal.row)];
    sealTile.isSeal = false; // seal is shattered

    // BFS from the seal position through connected corrupted tiles
    var visited = new Set ? new Set() : null;
    var visitedArr = []; // fallback for environments without Set
    var queue = [[seal.col, seal.row]];
    var cleansed = [];

    function hasVisited(c, r) {
      var key = c + ',' + r;
      if (visited) return visited.has(key);
      return visitedArr.indexOf(key) !== -1;
    }
    function markVisited(c, r) {
      var key = c + ',' + r;
      if (visited) visited.add(key);
      else visitedArr.push(key);
    }

    markVisited(seal.col, seal.row);

    while (queue.length > 0) {
      var current = queue.shift();
      var cc = current[0];
      var cr = current[1];
      var currentTile = state.tiles[idx(cc, cr)];

      // Cleanse if corrupted
      if (currentTile.corrupted) {
        currentTile.corrupted = false;
        state.corruptionCount = Math.max(0, state.corruptionCount - 1);
        cleansed.push(currentTile);
      }

      // Spread BFS to adjacent corrupted tiles
      var neighbors = getAdjacent(cc, cr, BOARD_WIDTH, BOARD_HEIGHT);
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        if (!hasVisited(nc, nr)) {
          var ntile = state.tiles[idx(nc, nr)];
          if (ntile.corrupted) {
            markVisited(nc, nr);
            queue.push([nc, nr]);
          }
        }
      }
    }

    return cleansed;
  }

  // ---------------------------------------------------------------------------
  // Tile refresh
  // ---------------------------------------------------------------------------

  /**
   * `refreshTiles(state, path)` — Replace used tiles with new random letters.
   *
   * path — array of { col, row } or [col, row] pairs
   */
  function refreshTiles(state, path) {
    for (var pi = 0; pi < path.length; pi++) {
      var pc = Array.isArray(path[pi]) ? path[pi][0] : path[pi].col;
      var pr = Array.isArray(path[pi]) ? path[pi][1] : path[pi].row;
      var tile = state.tiles[idx(pc, pr)];

      // Don't replace seal tiles or icon tiles
      if (tile.isSeal || tile.icon !== null) continue;

      var newLetter = getRandomLetter();
      tile.letter = newLetter;
      tile.points = getLetterPoints(newLetter);
      tile.corrupted = false;
      tile.glow = 0;
      tile.shake = 0;
      tile.dropY = 0;
      tile.tint = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Accessors
  // ---------------------------------------------------------------------------

  function getTile(state, col, row) {
    if (col < 0 || col >= BOARD_WIDTH || row < 0 || row >= BOARD_HEIGHT) {
      return null;
    }
    return state.tiles[idx(col, row)];
  }

  function getAdjacentTiles(col, row) {
    return getAdjacent(col, row, BOARD_WIDTH, BOARD_HEIGHT);
  }

  function getCorruptionPercent(state) {
    var total = BOARD_WIDTH * BOARD_HEIGHT;
    return (state.corruptionCount / total) * 100;
  }

  // ---------------------------------------------------------------------------
  // Hard Mode
  // ---------------------------------------------------------------------------

  /**
   * `applyHardMode(state)` — For each tile adjacent to a corrupted tile (but
   * not itself corrupted), apply a 50% chance to degrade it to Q/X/Z/V/J.
   */
  function applyHardMode(state) {
    for (var ti = 0; ti < state.tiles.length; ti++) {
      var tile = state.tiles[ti];

      // Skip corrupted, icon, seal tiles
      if (tile.corrupted || tile.icon || tile.isSeal) continue;

      // Check if any neighbor is corrupted
      var neighbors = getAdjacent(tile.col, tile.row, BOARD_WIDTH, BOARD_HEIGHT);
      var nearCorruption = false;
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        if (state.tiles[idx(nc, nr)].corrupted) {
          nearCorruption = true;
          break;
        }
      }

      if (nearCorruption && Math.random() < 0.5) {
        var degraded = HARD_MODE_LETTERS[rand(HARD_MODE_LETTERS.length)];
        tile.letter = degraded;
        tile.points = getLetterPoints(degraded);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.LD.Board = {
    generate: generate,
    spreadCorruption: spreadCorruption,
    cleanseTilesNear: cleanseTilesNear,
    checkSealDestruction: checkSealDestruction,
    destroySeal: destroySeal,
    refreshTiles: refreshTiles,
    getTile: getTile,
    getAdjacentTiles: getAdjacentTiles,
    getCorruptionPercent: getCorruptionPercent,
    applyHardMode: applyHardMode,
    getRandomLetter: getRandomLetter,
    getLetterPoints: getLetterPoints
  };

})();
