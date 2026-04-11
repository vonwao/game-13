(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Letter tables (shared between modes)
  // ---------------------------------------------------------------------------

  var LETTER_WEIGHTS = {
    A: 7,  B: 3,  C: 4,  D: 4,  E: 9,  F: 3,  G: 3,  H: 4,
    I: 7,  J: 1,  K: 2,  L: 5,  M: 4,  N: 6,  O: 7,  P: 3,
    Q: 1,  R: 6,  S: 6,  T: 7,  U: 4,  V: 2,  W: 3,  X: 1,
    Y: 3,  Z: 1
  };

  var LETTER_POINTS = {
    E: 1, A: 1, I: 1, O: 1, N: 1, R: 1, T: 1, L: 1, S: 1, U: 1,
    D: 2, G: 2,
    B: 3, C: 3, M: 3, P: 3,
    F: 4, H: 4, V: 4, W: 4, Y: 4,
    K: 5,
    J: 8, X: 8,
    Q: 10, Z: 10
  };

  var HARD_MODE_LETTERS = ['Q', 'X', 'Z', 'V', 'J'];

  var WEIGHTED_LETTERS = (function () {
    var pool = [];
    var letters = Object.keys(LETTER_WEIGHTS);
    for (var i = 0; i < letters.length; i++) {
      var letter = letters[i];
      var weight = LETTER_WEIGHTS[letter];
      for (var w = 0; w < weight; w++) pool.push(letter);
    }
    return pool;
  })();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function rand(max) { return Math.floor(Math.random() * max); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = rand(i + 1);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function getRandomLetter() {
    return WEIGHTED_LETTERS[rand(WEIGHTED_LETTERS.length)];
  }

  function getLetterPoints(letter) {
    return LETTER_POINTS[letter] || 0;
  }

  function idx(col, row, width) {
    return row * width + col;
  }

  function getAdjacent(col, row, width, height) {
    var dirs = [
      [-1,-1],[-1,0],[-1,1],
      [0,-1],         [0,1],
      [1,-1], [1,0],  [1,1]
    ];
    var result = [];
    for (var i = 0; i < dirs.length; i++) {
      var nc = col + dirs[i][0];
      var nr = row + dirs[i][1];
      if (nc >= 0 && nc < width && nr >= 0 && nr < height) {
        result.push([nc, nr]);
      }
    }
    return result;
  }

  function manhattanDist(c1, r1, c2, r2) {
    return Math.abs(c1 - c2) + Math.abs(r1 - r2);
  }

  function chebyshevDist(c1, r1, c2, r2) {
    return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2));
  }

  // ---------------------------------------------------------------------------
  // Tile factory
  // ---------------------------------------------------------------------------

  function makeTile(col, row, letter) {
    return {
      letter:    letter || null,
      icon:      null,
      isSeal:    false,
      corrupted: false,
      points:    letter ? (getLetterPoints(letter) || 1) : 0,
      col:       col,
      row:       row,
      glow:      0,
      shake:     0,
      dropY:     0,
      tint:      null,
      planted:   false,  // true if part of a planted word (Word Hunt)
      found:     false,  // true if the planted word has been found
    };
  }

  // ---------------------------------------------------------------------------
  // Board generation — router
  // ---------------------------------------------------------------------------

  /**
   * generate(board, gameMode, config, fullState)
   *   board     — the STATE.board sub-object to write into
   *   gameMode  — 'wordhunt' | 'siege'
   *   config    — resolved constants object from LD.Constants.resolve()
   *   fullState — full STATE, needed to write plantedWords into state.hunt
   */
  function generate(board, gameMode, config, fullState) {
    config    = config    || {};
    gameMode  = gameMode  || 'siege';
    fullState = fullState || {};

    var W = config.boardWidth  || 40;
    var H = config.boardHeight || 40;
    board.width  = W;
    board.height = H;
    board.gameMode = gameMode;

    if (gameMode === 'wordhunt') {
      generateWordHunt(board, config, fullState);
    } else {
      generateSiege(board, config);
    }

    return board;
  }

  // ---------------------------------------------------------------------------
  // Siege generation (original logic, now config-driven)
  // ---------------------------------------------------------------------------

  function generateSiege(board, config) {
    var W = board.width;
    var H = board.height;
    var sealCount = config.sealCount || 6;

    board.corruptionCount = 0;
    board.seals = [];

    // Fill with random letters
    board.tiles = [];
    for (var r = 0; r < H; r++) {
      for (var c = 0; c < W; c++) {
        board.tiles.push(makeTile(c, r, getRandomLetter()));
      }
    }

    // Place seals
    var sealPositions = placeSealPositions(sealCount, 12, W, H);
    for (var si = 0; si < sealPositions.length; si++) {
      var sp = sealPositions[si];
      var sealTile = board.tiles[idx(sp.col, sp.row, W)];
      sealTile.isSeal    = true;
      sealTile.corrupted = false;
      sealTile.letter    = null;
      sealTile.icon      = null;
      sealTile.points    = 0;
      board.seals.push({ col: sp.col, row: sp.row, alive: true });
    }

    // Place icon tiles
    var iconSpec = [
      { icon: 'ember',   count: config.emberCount   || 0 },
      { icon: 'crystal', count: config.crystalCount || 0 },
      { icon: 'void',    count: config.voidCount    || 0 },
      { icon: 'bomb',    count: config.bombCount    || 0 },
    ];
    placeIconTiles(board, iconSpec, board.seals, W, H);

    // Initial corruption around each seal
    var radius = config.initialCorruptionRadius || 1;
    for (var sk = 0; sk < board.seals.length; sk++) {
      var s = board.seals[sk];
      var neighbors = getAdjacent(s.col, s.row, W, H);
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        if (chebyshevDist(s.col, s.row, nc, nr) > radius) continue;
        var ntile = board.tiles[idx(nc, nr, W)];
        if (!ntile.icon && !ntile.isSeal && !ntile.corrupted) {
          ntile.corrupted = true;
          board.corruptionCount++;
        }
      }
    }
  }

  function placeSealPositions(count, minDist, W, H) {
    var positions = [];
    var maxAttempts = 10000;
    var attempts = 0;
    while (positions.length < count && attempts < maxAttempts) {
      attempts++;
      var col = rand(W);
      var row = rand(H);
      var tooClose = false;
      for (var i = 0; i < positions.length; i++) {
        if (chebyshevDist(col, row, positions[i].col, positions[i].row) < minDist) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) positions.push({ col: col, row: row });
    }
    return positions;
  }

  function placeIconTiles(board, iconSpec, seals, W, H) {
    for (var ii = 0; ii < iconSpec.length; ii++) {
      var spec = iconSpec[ii];
      var placed = 0;
      var attempts = 0;
      while (placed < spec.count && attempts < 50000) {
        attempts++;
        var ic = rand(W);
        var ir = rand(H);
        var tile = board.tiles[idx(ic, ir, W)];
        if (tile.isSeal || tile.icon !== null || tile.planted) continue;
        var nearSeal = false;
        for (var sj = 0; sj < (seals || []).length; sj++) {
          if (chebyshevDist(ic, ir, seals[sj].col, seals[sj].row) < 3) {
            nearSeal = true;
            break;
          }
        }
        if (nearSeal) continue;
        tile.letter = null;
        tile.icon   = spec.icon;
        tile.points = 0;
        placed++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Word Hunt generation
  // ---------------------------------------------------------------------------

  function generateWordHunt(board, config, fullState) {
    var W = board.width;
    var H = board.height;

    board.corruptionCount = 0;
    board.seals = [];

    // Step 1: Fill all tiles with random letters
    board.tiles = [];
    for (var r = 0; r < H; r++) {
      for (var c = 0; c < W; c++) {
        board.tiles.push(makeTile(c, r, getRandomLetter()));
      }
    }

    // Step 2: Plant hidden words from dictionary
    var plantedWords = plantWords(board, config, W, H);

    // Step 3: Plant fragments (common letter sequences)
    plantFragments(board, config, W, H);

    // Step 4: Place special tiles
    var iconSpec = [
      { icon: 'crystal', count: config.crystalCount || 0 },
      { icon: 'void',    count: config.voidCount    || 0 },
      { icon: 'ember',   count: config.emberCount   || 0 },
      // no bombs in Word Hunt
    ];
    placeIconTiles(board, iconSpec, [], W, H);

    // Store planted words in fullState.hunt
    if (fullState && fullState.hunt) {
      fullState.hunt.plantedWords = plantedWords;
    }
  }

  // Word planting ─────────────────────────────────────────────────────────────

  var DIRECTIONS = [
    [1, 0],   // right
    [0, 1],   // down
    [-1, 0],  // left
    [0, -1],  // up
    [1, 1],   // down-right
    [-1, 1],  // down-left
    [1, -1],  // up-right
    [-1, -1], // up-left
  ];

  function selectPlantableWords(config) {
    var minLen = config.plantedWordMinLen || 5;
    var maxLen = config.plantedWordMaxLen || 7;
    var count  = config.plantedWordCount  || 15;
    var candidates = [];

    // LD.Dict.DICT is the flat array of words
    var dict = (window.LD && window.LD.Dict && window.LD.Dict.DICT) ? window.LD.Dict.DICT : [];
    for (var i = 0; i < dict.length; i++) {
      var w = dict[i];
      if (w.length >= minLen && w.length <= maxLen) {
        candidates.push(w.toUpperCase());
      }
    }
    shuffle(candidates);
    return candidates.slice(0, count * 3); // grab extras
  }

  function plantWords(board, config, W, H) {
    var candidates = selectPlantableWords(config);
    var targetCount = config.plantedWordCount || 15;
    var diagPct     = config.plantedDiagonalPct || 0;
    var revPct      = config.plantedReversePct  || 0;
    var planted     = [];

    for (var ci = 0; ci < candidates.length && planted.length < targetCount; ci++) {
      var word = candidates[ci];
      var reversed = Math.random() < revPct;
      var actualWord = reversed ? word.split('').reverse().join('') : word;

      // Build direction pool based on difficulty
      var dirPool;
      if (diagPct === 0) {
        // Easy: only H and V
        dirPool = [DIRECTIONS[0], DIRECTIONS[1], DIRECTIONS[2], DIRECTIONS[3]];
      } else {
        dirPool = DIRECTIONS.slice(); // all 8
      }

      var placed = false;
      for (var attempt = 0; attempt < 100 && !placed; attempt++) {
        var dir = dirPool[rand(dirPool.length)];

        // For easy/medium, limit diagonal usage
        if (diagPct > 0 && diagPct < 1) {
          var isDiag = (dir[0] !== 0 && dir[1] !== 0);
          if (isDiag && Math.random() > diagPct) {
            dir = DIRECTIONS[rand(4)]; // pick H or V
          }
        }

        var col = rand(W);
        var row = rand(H);

        // Check if word fits
        var path = [];
        var fits = true;
        for (var li = 0; li < actualWord.length; li++) {
          var c = col + dir[0] * li;
          var r = row + dir[1] * li;
          if (c < 0 || c >= W || r < 0 || r >= H) { fits = false; break; }
          var tile = board.tiles[idx(c, r, W)];
          // Allow overlap only if letters match
          if (tile.planted && tile.letter !== actualWord[li]) { fits = false; break; }
          // Don't overwrite icons or seals
          if (tile.icon || tile.isSeal) { fits = false; break; }
          path.push({ col: c, row: r });
        }

        if (fits) {
          // Write letters into tiles
          for (var li2 = 0; li2 < actualWord.length; li2++) {
            var wt = board.tiles[idx(path[li2].col, path[li2].row, W)];
            wt.letter  = actualWord[li2];
            wt.points  = getLetterPoints(actualWord[li2]) || 1;
            wt.planted = true;
          }
          planted.push({
            word:     word,
            path:     path,
            found:    false,
            reversed: reversed,
          });
          placed = true;
        }
      }
    }

    return planted;
  }

  function plantFragments(board, config, W, H) {
    var fragments = (window.LD && window.LD.Constants && window.LD.Constants.FRAGMENTS)
      ? window.LD.Constants.FRAGMENTS
      : ['ING', 'TION', 'COM', 'PRE', 'OUT', 'STR'];

    var count = config.fragmentCount || 12;
    var hv = [DIRECTIONS[0], DIRECTIONS[1]]; // H and V only

    for (var fi = 0; fi < Math.min(count, fragments.length); fi++) {
      var frag = fragments[fi % fragments.length];
      var placed = false;
      for (var attempt = 0; attempt < 50 && !placed; attempt++) {
        var dir = hv[rand(2)];
        var col = rand(W);
        var row = rand(H);
        var fits = true;
        var path = [];
        for (var li = 0; li < frag.length; li++) {
          var c = col + dir[0] * li;
          var r = row + dir[1] * li;
          if (c < 0 || c >= W || r < 0 || r >= H) { fits = false; break; }
          var tile = board.tiles[idx(c, r, W)];
          if (tile.planted || tile.icon || tile.isSeal) { fits = false; break; }
          path.push({ col: c, row: r });
        }
        if (fits) {
          for (var li2 = 0; li2 < frag.length; li2++) {
            var ft = board.tiles[idx(path[li2].col, path[li2].row, W)];
            ft.letter = frag[li2];
            ft.points = getLetterPoints(frag[li2]) || 1;
          }
          placed = true;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Corruption spread (Siege only)
  // ---------------------------------------------------------------------------

  function spreadCorruption(board, config) {
    // No-op in Word Hunt
    if (board.gameMode === 'wordhunt') return [];

    config = config || {};
    var spreadChance = (config.corruptionSpreadChance !== undefined)
      ? config.corruptionSpreadChance
      : 0.30;

    var W = board.width;
    var H = board.height;
    var newlyCorrupted = [];
    var sources = [];
    for (var i = 0; i < board.tiles.length; i++) {
      var t = board.tiles[i];
      if (t.corrupted || (t.isSeal && isSealAlive(board, t.col, t.row))) {
        sources.push(t);
      }
    }

    for (var si = 0; si < sources.length; si++) {
      var source = sources[si];
      if (Math.random() > spreadChance) continue;

      var neighbors = getAdjacent(source.col, source.row, W, H);
      var candidates = [];
      for (var ni = 0; ni < neighbors.length; ni++) {
        var ntile = board.tiles[idx(neighbors[ni][0], neighbors[ni][1], W)];
        if (!ntile.corrupted && !ntile.icon && !ntile.isSeal) {
          candidates.push(ntile);
        }
      }
      if (candidates.length === 0) continue;
      candidates.sort(function(a, b) { return b.points - a.points; });
      var target = candidates[0];
      target.corrupted = true;
      board.corruptionCount++;
      newlyCorrupted.push(target);
    }

    return newlyCorrupted;
  }

  // ---------------------------------------------------------------------------
  // Cleansing
  // ---------------------------------------------------------------------------

  function cleanseTilesNear(board, path, radius) {
    if (radius === undefined || radius === null) radius = 2;
    var W = board.width;
    var cleansed = [];
    for (var ti = 0; ti < board.tiles.length; ti++) {
      var tile = board.tiles[ti];
      if (!tile.corrupted) continue;
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
        board.corruptionCount = Math.max(0, board.corruptionCount - 1);
        cleansed.push(tile);
      }
    }
    return cleansed;
  }

  // ---------------------------------------------------------------------------
  // Seal utilities
  // ---------------------------------------------------------------------------

  function isSealAlive(board, col, row) {
    for (var i = 0; i < (board.seals || []).length; i++) {
      var s = board.seals[i];
      if (s.col === col && s.row === row && s.alive) return true;
    }
    return false;
  }

  function checkSealDestruction(board, path) {
    var letterCount = 0;
    for (var pi = 0; pi < path.length; pi++) {
      var ptile = Array.isArray(path[pi])
        ? board.tiles[idx(path[pi][0], path[pi][1], board.width)]
        : board.tiles[idx(path[pi].col, path[pi].row, board.width)];
      if (ptile && ptile.letter) letterCount++;
    }
    if (letterCount < 6) return -1;

    for (var si = 0; si < (board.seals || []).length; si++) {
      var seal = board.seals[si];
      if (!seal.alive) continue;
      var adjacentCount = 0;
      for (var pi2 = 0; pi2 < path.length; pi2++) {
        var pc = Array.isArray(path[pi2]) ? path[pi2][0] : path[pi2].col;
        var pr = Array.isArray(path[pi2]) ? path[pi2][1] : path[pi2].row;
        if (chebyshevDist(pc, pr, seal.col, seal.row) === 1) {
          adjacentCount++;
          if (adjacentCount >= 2) return si;
        }
      }
    }
    return -1;
  }

  function destroySeal(board, sealIndex) {
    var seal = board.seals[sealIndex];
    if (!seal) return [];
    seal.alive = false;

    var W = board.width;
    var sealTile = board.tiles[idx(seal.col, seal.row, W)];
    sealTile.isSeal = false;

    var visited = {};
    var queue = [[seal.col, seal.row]];
    var cleansed = [];
    visited[seal.col + ',' + seal.row] = true;

    while (queue.length > 0) {
      var current = queue.shift();
      var cc = current[0];
      var cr = current[1];
      var currentTile = board.tiles[idx(cc, cr, W)];
      if (currentTile.corrupted) {
        currentTile.corrupted = false;
        board.corruptionCount = Math.max(0, board.corruptionCount - 1);
        cleansed.push(currentTile);
      }
      var neighbors = getAdjacent(cc, cr, W, board.height);
      for (var ni = 0; ni < neighbors.length; ni++) {
        var nc = neighbors[ni][0];
        var nr = neighbors[ni][1];
        var key = nc + ',' + nr;
        if (!visited[key]) {
          var ntile = board.tiles[idx(nc, nr, W)];
          if (ntile.corrupted) {
            visited[key] = true;
            queue.push([nc, nr]);
          }
        }
      }
    }
    return cleansed;
  }

  // ---------------------------------------------------------------------------
  // Tile refresh (Siege only)
  // ---------------------------------------------------------------------------

  function refreshTiles(board, path) {
    // No-op in Word Hunt — tiles are fixed
    if (board.gameMode === 'wordhunt') return;

    var W = board.width;
    for (var pi = 0; pi < path.length; pi++) {
      var pc = Array.isArray(path[pi]) ? path[pi][0] : path[pi].col;
      var pr = Array.isArray(path[pi]) ? path[pi][1] : path[pi].row;
      var tile = board.tiles[idx(pc, pr, W)];
      if (tile.isSeal || tile.icon !== null) continue;
      var newLetter = getRandomLetter();
      tile.letter    = newLetter;
      tile.points    = getLetterPoints(newLetter);
      tile.corrupted = false;
      tile.glow      = 0;
      tile.shake     = 0;
      tile.dropY     = 0;
      tile.tint      = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Planted word check (Word Hunt)
  // ---------------------------------------------------------------------------

  /**
   * checkPlantedWord(board, word, path) — return matching planted word or null.
   * Matching: same word (case-insensitive), path tiles cover planted path positions.
   * Finding backwards counts.
   */
  function checkPlantedWord(board, word, path) {
    // Needs access to state.hunt.plantedWords — but board doesn't have them.
    // We access via window.LD.STATE (set in game.js as window.LD.STATE).
    var plantedWords = [];
    if (window.LD && window.LD.STATE && window.LD.STATE.hunt) {
      plantedWords = window.LD.STATE.hunt.plantedWords;
    }

    var upperWord = word.toUpperCase();
    for (var i = 0; i < plantedWords.length; i++) {
      var pw = plantedWords[i];
      if (pw.found) continue;
      if (pw.word.toUpperCase() !== upperWord) continue;

      // Check if path positions match planted path
      var plantedKeys = {};
      for (var pi = 0; pi < pw.path.length; pi++) {
        plantedKeys[pw.path[pi].col + ',' + pw.path[pi].row] = true;
      }
      var submitKeys = {};
      for (var si = 0; si < path.length; si++) {
        submitKeys[path[si].col + ',' + path[si].row] = true;
      }

      // Check forward match: every planted tile is in submitted path
      var allMatch = true;
      var pKeys = Object.keys(plantedKeys);
      for (var k = 0; k < pKeys.length; k++) {
        if (!submitKeys[pKeys[k]]) { allMatch = false; break; }
      }
      if (allMatch) return pw;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Hard Mode
  // ---------------------------------------------------------------------------

  function applyHardMode(board) {
    var W = board.width;
    var H = board.height;
    for (var ti = 0; ti < board.tiles.length; ti++) {
      var tile = board.tiles[ti];
      if (tile.corrupted || tile.icon || tile.isSeal) continue;
      var neighbors = getAdjacent(tile.col, tile.row, W, H);
      var nearCorruption = false;
      for (var ni = 0; ni < neighbors.length; ni++) {
        if (board.tiles[idx(neighbors[ni][0], neighbors[ni][1], W)].corrupted) {
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
  // Accessors
  // ---------------------------------------------------------------------------

  function getTile(board, col, row) {
    var W = board.width;
    var H = board.height;
    if (col < 0 || col >= W || row < 0 || row >= H) return null;
    return board.tiles[idx(col, row, W)];
  }

  function getAdjacentTiles(board, col, row) {
    return getAdjacent(col, row, board.width, board.height);
  }

  function getCorruptionPercent(board) {
    var total = board.width * board.height;
    return (board.corruptionCount / total) * 100;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.LD.Board = {
    generate:            generate,
    spreadCorruption:    spreadCorruption,
    cleanseTilesNear:    cleanseTilesNear,
    checkSealDestruction: checkSealDestruction,
    destroySeal:         destroySeal,
    refreshTiles:        refreshTiles,
    checkPlantedWord:    checkPlantedWord,
    getTile:             getTile,
    getAdjacentTiles:    getAdjacentTiles,
    getCorruptionPercent: getCorruptionPercent,
    applyHardMode:       applyHardMode,
    getRandomLetter:     getRandomLetter,
    getLetterPoints:     getLetterPoints,
  };

})();
