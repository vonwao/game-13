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
  }

  /**
   * After every keystroke, re-run validation and path search, then update
   * highlighting data for the renderer.
   */
  function refreshInputState() {
    const typed = _state.input.typed;

    if (typed.length === 0) {
      _state.input.valid       = false;
      _state.input.hasPath     = false;
      _state.input.path        = [];
      _state.input.matchingTiles = [];
      return;
    }

    // 1. Dictionary validity check
    _state.input.valid = dictIsValid(typed);

    // 2. Path search (always, so live highlighting stays current)
    const path = window.LD.Pathfinder
      ? window.LD.Pathfinder.findPath(_state, typed)
      : [];
    _state.input.path    = path;
    _state.input.hasPath = path.length > 0;

    // 3. Highlight ALL visible tiles that match any letter in the typed word
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
    const newCorruption = safeCall(window.LD?.Board?.spreadCorruption, board) || [];

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
      if (corruptPct >= 40) {
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
  };
})();
