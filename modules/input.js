/**
 * LEXICON DEEP — Input Module
 * window.LD.Input
 *
 * Handles all keyboard input and orchestrates the full turn sequence:
 *   typing → validation → path-finding → submission → board effects → win/lose check
 */
(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  let _state = null;       // reference set by init()
  let _attached = false;   // guard against double-attaching listeners

  // Word color palette — cycles with each submitted word
  const WORD_COLORS = [
    '#e05858', // red
    '#5090e0', // blue
    '#50c878', // green
    '#e09030', // orange
    '#a050e0', // purple
    '#e05090', // pink
    '#30c8c0', // teal
    '#c8c030', // yellow
    '#e07040', // coral
    '#4090c0', // steel blue
  ];

  // ---------------------------------------------------------------------------
  // Helpers — safe module calls (graceful no-ops if a module isn't loaded yet)
  // ---------------------------------------------------------------------------

  function safeCall(fn, ...args) {
    if (typeof fn === 'function') return fn(...args);
    return undefined;
  }

  function dictIsValid(word) {
    return safeCall(window.LD?.Dict?.isValid, word) ?? false;
  }

  function dictScore(word, pathTiles) {
    return safeCall(window.LD?.Dict?.score, word, pathTiles) ?? word.length;
  }

  // ---------------------------------------------------------------------------
  // Input state mutators
  // ---------------------------------------------------------------------------

  function clearInput() {
    _state.input.typed    = '';
    _state.input.path     = [];
    _state.input.valid    = false;
    _state.input.hasPath  = false;
    _state.input.matchingTiles = [];
    _state.input.scorePreview = null;
  }

  /**
   * After every keystroke, re-run validation and path search, then update
   * highlighting data for the renderer.
   */
  function refreshInputState() {
    const typed = _state.input.typed;

    if (typed.length === 0) {
      _state.input.valid        = false;
      _state.input.hasPath      = false;
      _state.input.path         = [];
      _state.input.matchingTiles = [];
      _state.input.scorePreview = null;
      return;
    }

    // 1. Dictionary validity check (Word Hunt requires min 4 letters)
    const minLen = _state.gameMode === 'wordhunt' ? 4 : 2;
    _state.input.valid = typed.length >= minLen && dictIsValid(typed);

    // 2. Path search (always, so live highlighting stays current)
    const path = window.LD.Pathfinder
      ? window.LD.Pathfinder.findPath(_state, typed)
      : [];
    _state.input.path    = path;
    _state.input.hasPath = path.length > 0;

    // 3. Score preview (Word Hunt — computed even before word is fully valid)
    if (_state.gameMode === 'wordhunt' && path.length > 0) {
      _state.input.scorePreview = computeScorePreview(path, typed);
    } else {
      _state.input.scorePreview = null;
    }

    // 4. Highlight ALL visible tiles that match any letter in the typed word
    const vp = _state.viewport;
    const board = _state.board;
    const typedLetters = new Set(typed.toUpperCase().split(''));
    const matching = [];
    for (let vr = 0; vr < vp.rows; vr++) {
      for (let vc = 0; vc < vp.cols; vc++) {
        const gc = vp.col + vc;
        const gr = vp.row + vr;
        if (gc >= board.width || gr >= board.height) continue;
        const tile = board.tiles[gr * board.width + gc];
        if (tile.corrupted || tile.isSeal) continue;
        if (tile.letter && typedLetters.has(tile.letter)) {
          matching.push({ col: gc, row: gr });
        }
      }
    }
    _state.input.matchingTiles = matching;
  }

  // ---------------------------------------------------------------------------
  // Viewport scrolling
  // ---------------------------------------------------------------------------

  function scrollViewport(dCol, dRow) {
    const vp = _state.viewport;
    const maxCol = _state.board.width  - vp.cols;
    const maxRow = _state.board.height - vp.rows;

    vp.col = Math.max(0, Math.min(maxCol, vp.col + dCol));
    vp.row = Math.max(0, Math.min(maxRow, vp.row + dRow));

    // Reset combo on scroll in Word Hunt
    if (_state.gameMode === 'wordhunt' && _state.hunt && _state.config && _state.config.comboBonuses) {
      _state.hunt.combo = 0;
    }

    // Clear word input on scroll — path is now stale
    clearInput();
  }

  // ---------------------------------------------------------------------------
  // Turn execution
  // ---------------------------------------------------------------------------

  /**
   * Resolve icon effects for tiles in the activated path.
   * Called AFTER cleanseTilesNear so the crystal radius is already applied.
   */
  function processIconEffects(path) {
    for (let i = 0; i < path.length; i++) {
      const { col, row } = path[i];
      const tile = _state.board.tiles[row * _state.board.width + col];
      if (!tile || !tile.icon) continue;

      switch (tile.icon) {
        case 'ember': {
          // 5×5 area centred on ember tile
          const emberTiles = [];
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const c = col + dc;
              const r = row + dr;
              if (c >= 0 && c < _state.board.width && r >= 0 && r < _state.board.height) {
                emberTiles.push({ col: c, row: r });
              }
            }
          }
          safeCall(window.LD?.Board?.cleanseTilesNear, _state.board || _state, emberTiles, 0);
          break;
        }
        case 'bomb': {
          // 9×9 area centred on bomb tile
          const bombTiles = [];
          for (let dr = -4; dr <= 4; dr++) {
            for (let dc = -4; dc <= 4; dc++) {
              const c = col + dc;
              const r = row + dr;
              if (c >= 0 && c < _state.board.width && r >= 0 && r < _state.board.height) {
                bombTiles.push({ col: c, row: r });
              }
            }
          }
          safeCall(window.LD?.Board?.cleanseTilesNear, _state.board || _state, bombTiles, 0);
          break;
        }
        case 'crystal':
          // Crystal radius was already handled in submitWord (doubled radius)
          break;
        case 'void':
          // Void is just a wildcard — no additional effect
          break;
        default:
          break;
      }
    }
  }

  /**
   * Determine the cleanse radius for a submitted path.
   * Crystal in the path doubles it from 2 → 4.
   */
  function getCleanseRadius(path) {
    for (let i = 0; i < path.length; i++) {
      const { col, row } = path[i];
      const tile = _state.board.tiles[row * _state.board.width + col];
      if (tile && tile.icon === 'crystal') return 4;
    }
    return 2;
  }

  // ---------------------------------------------------------------------------
  // Score preview (live breakdown while typing)
  // ---------------------------------------------------------------------------

  /**
   * Compute an estimated score breakdown for the current path + word.
   * Used by the renderer to show math as the player types.
   */
  function computeScorePreview(path, word) {
    const board  = _state.board;
    const config = _state.config || {};
    const hunt   = _state.hunt   || {};

    // Base: sum of tile letter points
    let basePts = 0;
    for (let i = 0; i < path.length; i++) {
      const t = board.tiles[path[i].row * board.width + path[i].col];
      basePts += t ? (t.points || 1) : 1;
    }

    const lenMult = lengthMultiplier(word.length);

    // Shape
    let shapeMult  = 1.0;
    let shapeLabel = '';
    if (config.pathBonuses) {
      const shape = computePathShape(path);
      shapeMult = getPathShapeMultiplier(path);
      if (shape.isStraight) {
        if (shape.isHorizontal) shapeLabel = 'horizontal';
        else if (shape.isVertical) shapeLabel = 'vertical';
        else shapeLabel = 'diagonal';
      } else {
        shapeLabel = shape.corners + (shape.corners === 1 ? ' turn' : ' turns');
      }
    }

    // Combo: preview next combo value (after this word would be submitted)
    let comboMult = 1.0;
    if (config.comboBonuses) {
      const nextCombo = (hunt.combo || 0) + 1;
      comboMult = 1.0 + (nextCombo - 1) * 0.1;
    }

    const total = Math.round(basePts * lenMult * shapeMult * comboMult);
    return { basePts, lenMult, shapeMult, shapeLabel, comboMult, total };
  }

  // ---------------------------------------------------------------------------
  // Word Hunt path-shape helpers
  // ---------------------------------------------------------------------------

  function computePathShape(path) {
    if (path.length < 2) return { isStraight: false, isHorizontal: false, isVertical: false, corners: 0 };
    const dc0 = path[1].col - path[0].col;
    const dr0 = path[1].row - path[0].row;
    let isStraight = true;
    let corners = 0;
    for (let i = 2; i < path.length; i++) {
      const dc = path[i].col - path[i-1].col;
      const dr = path[i].row - path[i-1].row;
      if (dc !== (path[i-1].col - path[i-2].col) || dr !== (path[i-1].row - path[i-2].row)) {
        isStraight = false;
        corners++;
      }
    }
    return {
      isStraight,
      isHorizontal: isStraight && dr0 === 0,
      isVertical:   isStraight && dc0 === 0,
      corners,
    };
  }

  function getPathShapeMultiplier(path) {
    if (path.length < 2) return 1.0;
    const shape = computePathShape(path);
    if (shape.isStraight) {
      if (shape.isHorizontal || shape.isVertical) return 2.0;
      return 1.5; // diagonal straight
    }
    // 0.2x penalty per direction change, min 0.4x — discourages zigzag paths
    return Math.max(0.4, 1.0 - shape.corners * 0.2);
  }

  // ---------------------------------------------------------------------------
  // Word Hunt scoring
  // ---------------------------------------------------------------------------

  function lengthMultiplier(len) {
    if (len <= 3) return 1.0;
    if (len === 4) return 1.5;
    if (len === 5) return 2.0;
    if (len === 6) return 3.0;
    if (len === 7) return 5.0;
    return 8.0;
  }

  function submitWordHunt() {
    const typed = _state.input.typed;
    const path  = _state.input.path.slice();
    const board = _state.board;
    const config = _state.config || {};
    const hunt  = _state.hunt;

    const pathTiles = path.map(({ col, row }) => board.tiles[row * board.width + col]);

    // 1. Base score (letter points × length multiplier)
    let earned = 0;
    for (let i = 0; i < pathTiles.length; i++) {
      earned += pathTiles[i].points || 1;
    }
    earned = Math.round(earned * lengthMultiplier(typed.length));

    // 2. Path shape multiplier
    let shapeMult = 1.0;
    const shape = computePathShape(path);
    if (config.pathBonuses) {
      shapeMult = getPathShapeMultiplier(path);
      earned = Math.round(earned * shapeMult);
    }

    // 3. Combo
    let comboMult = 1.0;
    if (config.comboBonuses && hunt) {
      hunt.combo++;
      if (hunt.combo > hunt.bestCombo) hunt.bestCombo = hunt.combo;
      comboMult = 1.0 + (hunt.combo - 1) * 0.1;
      earned = Math.round(earned * comboMult);
    }

    // 4. Crystal / Ember
    let crystalBonus = false;
    let emberBonus = 0;
    for (let i = 0; i < pathTiles.length; i++) {
      if (pathTiles[i].icon === 'crystal') { crystalBonus = true; }
      if (pathTiles[i].icon === 'ember')   { emberBonus += 20; }
    }
    if (crystalBonus) earned *= 2;
    earned += emberBonus;
    earned = Math.round(earned);

    // 5. Check planted words
    const planted = safeCall(window.LD?.Board?.checkPlantedWord, board, typed, path);
    if (planted) {
      planted.found = true;
      if (hunt && hunt.discoveredWords) {
        hunt.discoveredWords.push(planted.word);
      }
      // Mark individual tile objects as found (golden tint) + count as 1 use
      for (let i = 0; i < planted.path.length; i++) {
        const pt = planted.path[i];
        const t = board.tiles[pt.row * board.width + pt.col];
        if (t) {
          t.found = true;
          // useCount already incremented below in step 8 — don't double-count
        }
      }
      earned += 100;
      // Discovery visual
      const vp = _state.viewport;
      const ts = vp.tileSize || 32;
      const toPixel = (t) => ({ x: vp.offsetX + (t.col - vp.col) * ts + ts/2, y: vp.offsetY + (t.row - vp.row) * ts + ts/2 });
      const midTile = path[Math.floor(path.length / 2)];
      if (window.LD?.Particles?.text) {
        const mp = toPixel(midTile);
        LD.Particles.text(mp.x, mp.y - 30, 'DISCOVERED: ' + typed + '!', '#f0d070', 18);
      }
      safeCall(window.LD?.Audio?.play, 'challenge_complete');
    }

    if (hunt) {
      hunt.roundScore = (hunt.roundScore || 0) + earned;
    }

    // 6. Check round objectives
    const wordData = {
      word:         typed,
      path:         path,
      score:        earned,
      isStraight:   shape.isStraight,
      isHorizontal: shape.isHorizontal,
      isVertical:   shape.isVertical,
      corners:      shape.corners,
      isPlantedWord: !!planted,
      tilesUsed:    path,
      roundScore:   hunt ? (hunt.roundScore || 0) : 0,
    };
    const newlyCompleted = (window.LD?.Challenges?.checkAll)
      ? window.LD.Challenges.checkAll(_state, wordData)
      : [];

    for (let i = 0; i < newlyCompleted.length; i++) {
      const challenge = (hunt && hunt.challenges)
        ? hunt.challenges.find(c => c.id === newlyCompleted[i])
        : null;
      const reward = challenge ? (challenge.reward || 100) : 100;
      earned += reward;
      if (hunt) hunt.completedCount = (hunt.completedCount || 0) + 1;
    }

    // 7. Update stats
    _state.score        = (_state.score || 0) + earned;
    _state.wordsSpelled = (_state.wordsSpelled || 0) + 1;
    if (typed.length > ((_state.longestWord || '').length)) _state.longestWord = typed;
    if (hunt) {
      if (_state.settings.endCondition === 'turns') hunt.turnsRemaining--;
      let histShapeLabel = '';
      if (shape.isStraight) {
        histShapeLabel = (shape.isHorizontal || shape.isVertical) ? 'straight' : 'diagonal';
      } else {
        histShapeLabel = shape.corners + 't';
      }
      hunt.wordsThisRound.push({
        word: typed,
        score: earned,
        lenMult: lengthMultiplier(typed.length),
        shapeMult,
        shapeLabel: histShapeLabel,
        comboMult,
      });
    }

    // 8. Mark tiles with word color + increment useCount
    const wordColor = WORD_COLORS[(_state.wordsSpelled - 1) % WORD_COLORS.length];
    path.forEach(p => {
      const t = board.tiles[p.row * board.width + p.col];
      if (t) {
        t.useCount = (t.useCount || 0) + 1;
        if (!t.wordColors) t.wordColors = [];
        t.wordColors.push(wordColor);
      }
      if (hunt && hunt.usedTileKeys) hunt.usedTileKeys.add(p.col + ',' + p.row);
    });

    // 9. Win/lose check
    if (_state.settings.endCondition === 'challenges') {
      const total = (hunt && hunt.challenges) ? hunt.challenges.length : 0;
      if (total > 0 && (hunt.completedCount || 0) >= total) {
        if (hunt) {
          hunt.advanceAvailable = (hunt.round || 1) < (hunt.maxRounds || 3);
        }
        _state.phase = 'victory';
      }
    } else if (_state.settings.endCondition === 'turns') {
      if (hunt && hunt.turnsRemaining <= 0) _state.phase = 'gameover';
    }
    // timed: handled in game loop

    // 10. Particles & Audio
    const vp = _state.viewport;
    const ts = vp.tileSize || 32;
    const toPixel2 = (t) => ({ x: vp.offsetX + (t.col - vp.col) * ts + ts/2, y: vp.offsetY + (t.row - vp.row) * ts + ts/2, col: t.col, row: t.row });

    if (window.LD?.Particles?.wordActivation) {
      LD.Particles.wordActivation(path.map(toPixel2), ts);
    }
    if (window.LD?.Particles?.text && path.length > 0) {
      const mid = toPixel2(path[Math.floor(path.length / 2)]);
      let popupText = '+' + earned;
      if (config.pathBonuses && shapeMult !== 1.0) {
        popupText += ' ×' + shapeMult.toFixed(1);
      }
      LD.Particles.text(mid.x, mid.y - 20, popupText, '#ffd700', 18);
    }
    if (window.LD?.Audio) {
      safeCall(window.LD.Audio.play, 'word_valid');
      if (_state.hunt && _state.hunt.combo > 1) safeCall(window.LD.Audio.play, 'combo');
    }

    clearInput();
  }

  function useClue() {
    if (!_state || _state.phase !== 'playing' || _state.gameMode !== 'wordhunt') return false;

    const hunt = _state.hunt;
    if (!hunt || (hunt.cluesRemaining || 0) <= 0) return false;

    const unfound = (hunt.plantedWords || []).filter(function (entry) {
      return !entry.found;
    });
    if (unfound.length === 0) return false;

    unfound.sort(function (a, b) {
      return a.word.length - b.word.length;
    });

    const chosen = unfound[Math.floor(Math.random() * Math.min(3, unfound.length))];
    const clueTiles = [];
    if (chosen.path.length > 0) clueTiles.push(chosen.path[0]);
    if (chosen.path.length >= 6) clueTiles.push(chosen.path[chosen.path.length - 1]);

    hunt.cluesRemaining--;
    hunt.clueTiles = clueTiles;
    hunt.clueTimer = 3.2;

    if (window.LD?.Particles?.text) {
      const vp = _state.viewport;
      const ts = vp.tileSize || 24;
      const clue = clueTiles[0];
      if (clue) {
        const x = vp.offsetX + (clue.col - vp.col) * ts + ts / 2;
        const y = vp.offsetY + (clue.row - vp.row) * ts + ts / 2;
        LD.Particles.text(x, y - 18, 'CLUE · ' + chosen.word.length + ' letters', '#80d8ff', 16);
      }
    }

    safeCall(window.LD?.Audio?.play, 'tap');
    return true;
  }

  /**
   * Execute a valid, path-confirmed word submission.
   *
   * Turn sequence (per spec):
   *   1. Score calculation
   *   2. Cleanse tiles near path
   *   3. Check / destroy seals
   *   4. Process icon tile effects
   *   5. Refresh activated tiles
   *   6. Spread corruption
   *   7. Update stats
   *   8. Check win / lose
   *   9. Spawn particles
   *  10. Play audio
   *  11. Clear input
   */
  function submitWord() {
    // Route to Word Hunt or Siege submission
    if (_state.gameMode === 'wordhunt') {
      return submitWordHunt();
    }

    const typed    = _state.input.typed;
    const path     = _state.input.path.slice(); // snapshot before clear

    // ── 1. Score ──────────────────────────────────────────────────────────────
    const pathTiles = path.map(({ col, row }) =>
      _state.board.tiles[row * _state.board.width + col]
    );
    const earned = dictScore(typed, pathTiles);

    // ── 2. Cleanse tiles near path ────────────────────────────────────────────
    const board = _state.board || _state;
    const radius = getCleanseRadius(path);
    const cleansedTiles = safeCall(window.LD?.Board?.cleanseTilesNear, board, path, radius) || [];

    // ── 3. Check and destroy seals ────────────────────────────────────────────
    const sealIndex = safeCall(window.LD?.Board?.checkSealDestruction, board, path);
    let sealCleansed = [];
    if (typeof sealIndex === 'number' && sealIndex >= 0) {
      sealCleansed = safeCall(window.LD?.Board?.destroySeal, board, sealIndex) || [];
      _state.seedsDestroyed = (_state.seedsDestroyed || 0) + 1;
    }

    // ── 4. Icon tile effects ──────────────────────────────────────────────────
    processIconEffects(path);

    // ── 5. Refresh activated tiles ────────────────────────────────────────────
    safeCall(window.LD?.Board?.refreshTiles, board, path);

    // ── 6. Spread corruption ─────────────────────────────────────────────────
    const newCorruption = safeCall(window.LD?.Board?.spreadCorruption, board, _state.config) || [];

    // ── 7. Update stats ───────────────────────────────────────────────────────
    _state.score        = (_state.score        || 0) + earned;
    _state.wordsSpelled = (_state.wordsSpelled || 0) + 1;
    _state.turns        = (_state.turns        || 0) + 1;
    if (typed.length > ((_state.longestWord || '').length)) {
      _state.longestWord = typed;
    }

    // ── 8. Win / lose checks ─────────────────────────────────────────────────
    const totalSeeds = _state.totalSeeds || 0;
    if (totalSeeds > 0 && (_state.seedsDestroyed || 0) >= totalSeeds) {
      _state.phase = 'victory';
    } else {
      const corruptPct = safeCall(window.LD?.Board?.getCorruptionPercent, board) ?? 0;
      const lossThreshold = (_state.config && _state.config.corruptionLossThreshold) ? _state.config.corruptionLossThreshold : 40;
      if (corruptPct >= lossThreshold) {
        _state.phase = 'gameover';
      }
    }

    // ── 9. Particles & Audio ────────────────────────────────────────────────
    const vp = _state.viewport;
    const ts = vp.tileSize || 64;
    function toPixel(t) {
      return { x: vp.offsetX + (t.col - vp.col) * ts + ts/2, y: vp.offsetY + (t.row - vp.row) * ts + ts/2, col: t.col, row: t.row };
    }

    // Word activation sparks
    if (window.LD?.Particles?.wordActivation) {
      const pixelPath = path.map(toPixel);
      LD.Particles.wordActivation(pixelPath, ts);
    }

    // Cleanse particles
    if (window.LD?.Particles?.cleanseTiles && cleansedTiles.length > 0) {
      LD.Particles.cleanseTiles(cleansedTiles.map(toPixel), ts);
    }

    // Score popup
    if (window.LD?.Particles?.text && path.length > 0) {
      const mid = toPixel(path[Math.floor(path.length / 2)]);
      LD.Particles.text(mid.x, mid.y - 20, '+' + earned, '#ffd700', 20);
    }

    // Seal destruction effects
    if (typeof sealIndex === 'number' && sealIndex >= 0) {
      const seal = board.seals[sealIndex];
      if (seal && window.LD?.Particles?.sealDestroyed) {
        const sp = toPixel(seal);
        LD.Particles.sealDestroyed(sp.x, sp.y, sealCleansed.map(toPixel), ts);
      }
      safeCall(window.LD?.Audio?.play, 'seal_destroy');
    }

    // Corruption spread audio
    if (newCorruption.length > 0) {
      safeCall(window.LD?.Audio?.play, 'corrupt_spread');
      if (window.LD?.Particles?.corruptionSpread) {
        LD.Particles.corruptionSpread(newCorruption.map(toPixel), ts);
      }
    }

    safeCall(window.LD?.Audio?.play, 'word_valid');

    // ── 11. Clear input ───────────────────────────────────────────────────────
    clearInput();
  }

  /**
   * Handle an invalid or no-path submission attempt: give feedback without
   * consuming a turn.
   */
  function rejectWord() {
    safeCall(window.LD?.Audio?.play, 'word_invalid');
    // Signal the renderer to flash the input indicator
    _state.input.flashInvalid = true;
    // The renderer is responsible for clearing flashInvalid after animation
  }

  // ---------------------------------------------------------------------------
  // Letter-by-letter input
  // ---------------------------------------------------------------------------

  function appendLetter(letter) {
    _state.input.typed += letter.toUpperCase();
    refreshInputState();

    // Ascending pitch: index = length of current word minus 1
    const letterIndex = _state.input.typed.length - 1;
    safeCall(window.LD?.Audio?.playLetterTick, letterIndex);
  }

  function backspaceLetter() {
    if (_state.input.typed.length === 0) return;
    _state.input.typed = _state.input.typed.slice(0, -1);
    refreshInputState();
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  function onKeyDown(e) {
    if (!_state) return;

    // Do not intercept system shortcuts (Ctrl+R, Ctrl+W, Ctrl+T, etc.)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Block input when game is over (still allow scrolling to look around)
    const phase = _state.phase;
    const isGameOver = phase === 'victory' || phase === 'gameover';

    const key = e.key;

    // ── Arrow keys always scroll ────────────────────────────────────────────
    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        scrollViewport(0, -1);
        safeCall(window.LD?.Audio?.play, 'scroll');
        return;
      case 'ArrowDown':
        e.preventDefault();
        scrollViewport(0,  1);
        safeCall(window.LD?.Audio?.play, 'scroll');
        return;
      case 'ArrowLeft':
        e.preventDefault();
        scrollViewport(-1, 0);
        safeCall(window.LD?.Audio?.play, 'scroll');
        return;
      case 'ArrowRight':
        e.preventDefault();
        scrollViewport( 1, 0);
        safeCall(window.LD?.Audio?.play, 'scroll');
        return;
    }

    // ── ? — toggle help screen ─────────────────────────────────────────────
    if (key === '?') {
      e.preventDefault();
      _state.showHelp = !_state.showHelp;
      return;
    }

    // Close help on any other key
    if (_state.showHelp) {
      _state.showHelp = false;
      return;
    }

    if (isGameOver) return; // no word input after game ends

    // ── C — spend a clue in Word Hunt ──────────────────────────────────────
    if ((key === 'c' || key === 'C') && _state.gameMode === 'wordhunt') {
      e.preventDefault();
      useClue();
      return;
    }

    // ── Escape — clear input ──────────────────────────────────────────────────
    if (key === 'Escape') {
      e.preventDefault();
      clearInput();
      return;
    }

    // ── Backspace ─────────────────────────────────────────────────────────────
    if (key === 'Backspace') {
      e.preventDefault();
      backspaceLetter();
      return;
    }

    // ── Enter — submit ────────────────────────────────────────────────────────
    if (key === 'Enter') {
      e.preventDefault();
      if (_state.input.valid && _state.input.hasPath) {
        submitWord();
      } else {
        rejectWord();
      }
      return;
    }

    // ── Letter keys (A-Z) ────────────────────────────────────────────────────
    // key.length === 1 catches printable single characters
    if (key.length === 1 && /^[A-Za-z]$/.test(key)) {
      e.preventDefault();
      appendLetter(key);
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Attach keyboard listeners and store the state reference.
   * Safe to call multiple times — will only attach once.
   *
   * @param {object} state - the shared game state object
   */
  function init(state) {
    _state = state;

    // Ensure required input sub-fields exist
    state.input         = state.input         || {};
    state.input.typed   = state.input.typed   ?? '';
    state.input.path    = state.input.path    ?? [];
    state.input.valid   = state.input.valid   ?? false;
    state.input.hasPath = state.input.hasPath ?? false;
    state.input.prefixStarts = state.input.prefixStarts ?? [];
    state.input.flashInvalid = state.input.flashInvalid ?? false;

    if (!_attached) {
      window.addEventListener('keydown', onKeyDown);
      _attached = true;
    }
  }

  /**
   * Called each game loop tick. Currently event-driven so this is a no-op,
   * but provided for consistent module interface.
   *
   * @param {object} state
   */
  function update(state) {
    // Event-driven — nothing to poll each frame.
    // If flashInvalid needs timed reset (renderer doesn't clear it),
    // that can be handled here.
    _state = state; // keep reference current in case state object is replaced
  }

  window.LD.Input = {
    init,
    update,
    // Exposed for touch module to trigger submission directly
    _submitWord: submitWord,
    _rejectWord: rejectWord,
    _useClue: useClue,
    _refreshInputState: refreshInputState,
  };
})();
