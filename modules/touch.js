(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var _canvas = null;
  var _state  = null;

  // Scroll state
  var _scrollMode    = false;  // toggle: drag-to-scroll vs tap-to-spell
  var _lastTouchX    = 0;
  var _lastTouchY    = 0;
  var _pinchStartDist = 0;
  var _scrollVelX    = 0;
  var _scrollVelY    = 0;
  var _doubleTapTimer = 0;
  var _lastTapTime   = 0;

  // Action bar button regions (rebuilt each render)
  var _buttons = [];

  // ---------------------------------------------------------------------------
  // Canvas coordinate conversion
  // ---------------------------------------------------------------------------

  function canvasCoords(touch) {
    var rect = _canvas.getBoundingClientRect();
    var scaleX = _canvas.width  / rect.width;
    var scaleY = _canvas.height / rect.height;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top)  * scaleY,
    };
  }

  // ---------------------------------------------------------------------------
  // Grid coordinate from canvas pixel
  // ---------------------------------------------------------------------------

  function pixelToGrid(x, y) {
    if (!_state) return null;
    var vp = _state.viewport;
    var ts = vp.tileSize;
    var gc = Math.floor((x - vp.offsetX) / ts) + vp.col;
    var gr = Math.floor((y - vp.offsetY) / ts) + vp.row;
    if (gc < 0 || gc >= _state.board.width)  return null;
    if (gr < 0 || gr >= _state.board.height) return null;
    // Must be within the game area (below HUD, above action bar)
    var actionBarY = _canvas.height - 70;
    if (y < vp.offsetY || y > actionBarY) return null;
    return { col: gc, row: gr };
  }

  // ---------------------------------------------------------------------------
  // Tap-to-spell logic
  // ---------------------------------------------------------------------------

  function isAdjacent(a, b) {
    return Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1;
  }

  function handleTileTap(col, row) {
    if (!_state || _state.phase !== 'playing') return;

    var path   = _state.touch.selectedTiles;
    var board  = _state.board;
    var tile   = board.tiles[row * board.width + col];
    if (!tile || tile.corrupted || tile.isSeal) return;

    if (window.LD && window.LD.Audio) window.LD.Audio.play('tap');

    // If path is empty, start a new word
    if (path.length === 0) {
      _state.touch.selectedTiles = [{ col: col, row: row }];
      rebuildTyped();
      return;
    }

    var last = path[path.length - 1];

    // Tapping the last tile: undo
    if (last.col === col && last.row === row) {
      handleUndo();
      return;
    }

    // Tapping any earlier tile in the path: undo back to that tile
    for (var i = 0; i < path.length - 1; i++) {
      if (path[i].col === col && path[i].row === row) {
        _state.touch.selectedTiles = path.slice(0, i + 1);
        rebuildTyped();
        return;
      }
    }

    // Adjacent: extend path
    if (isAdjacent(last, { col: col, row: row })) {
      path.push({ col: col, row: row });
      rebuildTyped();
      return;
    }

    // Non-adjacent: start new word from this tile
    _state.touch.selectedTiles = [{ col: col, row: row }];
    rebuildTyped();
  }

  function rebuildTyped() {
    if (!_state) return;
    var path  = _state.touch.selectedTiles;
    var board = _state.board;
    var word  = '';
    for (var i = 0; i < path.length; i++) {
      var t = board.tiles[path[i].row * board.width + path[i].col];
      word += (t && t.letter) ? t.letter : '?';
    }
    _state.input.typed   = word;
    _state.input.path    = path.slice();
    if (window.LD && window.LD.Input && window.LD.Input._refreshInputState) {
      window.LD.Input._refreshInputState();
    } else {
      _state.input.valid = false;
      _state.input.hasPath = path.length > 0;
    }
  }

  function handleUndo() {
    if (!_state) return;
    var path = _state.touch.selectedTiles;
    if (path.length > 0) {
      path.pop();
      rebuildTyped();
    }
  }

  function handleClear() {
    if (!_state) return;
    _state.touch.selectedTiles = [];
    _state.input.typed   = '';
    _state.input.path    = [];
    _state.input.valid   = false;
    _state.input.hasPath = false;
    _state.input.matchingTiles = [];
    _state.input.scorePreview = null;
  }

  function handleSubmit() {
    if (!_state || _state.phase !== 'playing') return;
    if (_state.input.valid && _state.input.hasPath) {
      if (window.LD && window.LD.Input && window.LD.Input._submitWord) {
        window.LD.Input._submitWord();
      }
      _state.touch.selectedTiles = [];
    } else {
      if (window.LD && window.LD.Input && window.LD.Input._rejectWord) {
        window.LD.Input._rejectWord();
      }
    }
  }

  function handleClue() {
    if (window.LD && window.LD.Input && window.LD.Input._useClue) {
      window.LD.Input._useClue();
    }
  }

  // ---------------------------------------------------------------------------
  // Viewport scrolling
  // ---------------------------------------------------------------------------

  function scrollBy(dx, dy) {
    if (!_state) return;
    var vp = _state.viewport;
    var ts = vp.tileSize || 32;
    // Convert pixel delta to tile delta (fractional)
    var colDelta = dx / ts;
    var rowDelta = dy / ts;

    var maxCol = _state.board.width  - vp.cols;
    var maxRow = _state.board.height - vp.rows;

    // Accumulate fractional scroll into a buffer
    _state.touch._scrollBufX = (_state.touch._scrollBufX || 0) + colDelta;
    _state.touch._scrollBufY = (_state.touch._scrollBufY || 0) + rowDelta;

    var tileStepX = Math.round(_state.touch._scrollBufX);
    var tileStepY = Math.round(_state.touch._scrollBufY);

    if (tileStepX !== 0 || tileStepY !== 0) {
      vp.col = Math.max(0, Math.min(maxCol, vp.col + tileStepX));
      vp.row = Math.max(0, Math.min(maxRow, vp.row + tileStepY));
      _state.touch._scrollBufX -= tileStepX;
      _state.touch._scrollBufY -= tileStepY;

      // Clear word on scroll
      handleClear();
    }
  }

  // ---------------------------------------------------------------------------
  // Touch event handlers
  // ---------------------------------------------------------------------------

  function onTouchStart(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    // Init audio on first touch
    if (window.LD && window.LD.Audio) LD.Audio.init();

    var touches = e.touches;

    // Two-finger: enter scroll mode for this gesture
    if (touches.length >= 2) {
      _scrollMode = true;
      _lastTouchX = (touches[0].clientX + touches[1].clientX) / 2;
      _lastTouchY = (touches[0].clientY + touches[1].clientY) / 2;
      return;
    }

    var pos = canvasCoords(touches[0]);

    // Check action bar button hit
    if (checkButtonHit(pos.x, pos.y)) return;

    // Single tap on board
    if (!_scrollMode) {
      // Double-tap detection for submit
      var now = Date.now();
      if (now - _lastTapTime < 300) {
        handleSubmit();
        _lastTapTime = 0;
        return;
      }
      _lastTapTime = now;

      var grid = pixelToGrid(pos.x, pos.y);
      if (grid) {
        handleTileTap(grid.col, grid.row);
      }
    } else {
      _lastTouchX = pos.x;
      _lastTouchY = pos.y;
    }
  }

  function onTouchMove(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    var touches = e.touches;

    if (touches.length >= 2 || _scrollMode) {
      // Two-finger pan
      var cx, cy;
      if (touches.length >= 2) {
        cx = (touches[0].clientX + touches[1].clientX) / 2;
        cy = (touches[0].clientY + touches[1].clientY) / 2;
      } else {
        var pos = canvasCoords(touches[0]);
        cx = pos.x;
        cy = pos.y;
      }
      var rect = _canvas.getBoundingClientRect();
      var scaleX = _canvas.width  / rect.width;
      var scaleY = _canvas.height / rect.height;
      var canvasCX = (cx - rect.left) * scaleX;
      var canvasCY = (cy - rect.top)  * scaleY;

      var dx = canvasCX - _lastTouchX;
      var dy = canvasCY - _lastTouchY;
      scrollBy(-dx, -dy);  // negate: drag right = scroll left
      _lastTouchX = canvasCX;
      _lastTouchY = canvasCY;
    }
  }

  function onTouchEnd(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    if (e.touches.length === 0) {
      _scrollMode = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Action bar button hit testing
  // ---------------------------------------------------------------------------

  function checkButtonHit(x, y) {
    for (var i = 0; i < _buttons.length; i++) {
      var b = _buttons[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        b.action();
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Action bar rendering
  // ---------------------------------------------------------------------------

  function renderActionBar(ctx, state) {
    _buttons = [];

    var W = _canvas.width;
    var barH = 70;
    var barY = _canvas.height - barH;

    // Background
    ctx.fillStyle = '#12100d';
    ctx.fillRect(0, barY, W, barH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(W, barY);
    ctx.stroke();

    // Current word display
    var word     = state.input.typed || '';
    var isValid  = state.input.valid && state.input.hasPath;
    var isEmpty  = word.length === 0;

    ctx.font = '20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isValid ? '#80e080' : (isEmpty ? '#4a3a20' : '#d4c4a0');
    ctx.fillText(
      isEmpty ? '(tap tiles to spell)' : word.split('').join(' - '),
      W / 2,
      barY + 14
    );
    if (!isEmpty) {
      // Score preview or validity
      var sp = state.input.scorePreview;
      if (sp && state.input.hasPath) {
        var breakdown = sp.basePts + 'pts';
        if (sp.lenMult > 1.0) breakdown += ' ×' + sp.lenMult.toFixed(1);
        if (sp.shapeMult !== 1.0) breakdown += ' ×' + sp.shapeMult.toFixed(1) + ' ' + sp.shapeLabel;
        if (sp.comboMult > 1.0) breakdown += ' ×' + sp.comboMult.toFixed(1) + ' combo';
        breakdown += ' = ~' + sp.total + ' pts';
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = isValid ? '#ffd700' : '#888';
        ctx.fillText(breakdown, W / 2, barY + 28);
      } else {
        ctx.font = '11px "Courier New", monospace';
        var tooShort = state.gameMode === 'wordhunt' && word.length < 4;
        ctx.fillStyle = isValid ? '#60c060' : (tooShort ? '#c08040' : '#c04040');
        ctx.fillText(isValid ? '✓ valid' : (tooShort ? 'need 4+ letters' : '✗ invalid'), W / 2, barY + 28);
      }
    }

    // Buttons
    var isWordHunt = state.gameMode === 'wordhunt';
    var btnCount = isWordHunt ? 5 : 4;
    var btnW = Math.min(122, Math.floor((W - 40) / btnCount));
    var btnH = 36;
    var btnY = barY + 30;
    var totalBtns = btnW * btnCount + (btnCount - 1) * 10;
    var btnStartX = Math.floor((W - totalBtns) / 2);
    var gap = 10;

    var btnDefs = [
      { label: '✗ Clear',  action: handleClear,  enabled: !isEmpty },
      { label: '↩ Undo',   action: handleUndo,   enabled: !isEmpty },
      { label: '✓ Submit', action: handleSubmit, enabled: isValid  },
    ];

    if (isWordHunt) {
      btnDefs.push({
        label: '✦ Clue',
        action: handleClue,
        enabled: !!(state.hunt && state.hunt.cluesRemaining > 0),
      });
    }

    btnDefs.push({
        label: _scrollMode ? '↕ Scroll ON' : '↕ Scroll',
        action: function() { _scrollMode = !_scrollMode; },
        enabled: true,
        active: _scrollMode,
      });

    for (var i = 0; i < btnDefs.length; i++) {
      var def = btnDefs[i];
      var bx = btnStartX + i * (btnW + gap);
      var enabled = def.enabled;
      var active  = def.active;

      ctx.fillStyle = active ? '#3a2810' : (enabled ? '#1c1a16' : '#141210');
      ctx.strokeStyle = active ? '#c8a050' : (enabled ? '#3a3028' : '#2a2420');
      ctx.lineWidth = active ? 2 : 1;

      ctx.beginPath();
      ctx.rect(bx, btnY, btnW, btnH);
      ctx.fill();
      ctx.stroke();

      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = enabled ? '#d4c4a0' : '#4a3a20';
      ctx.fillText(def.label, bx + btnW / 2, btnY + btnH / 2);

      if (enabled) {
        _buttons.push({ x: bx, y: btnY, w: btnW, h: btnH, action: def.action });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Per-frame update (scroll momentum decay)
  // ---------------------------------------------------------------------------

  function update(state) {
    // Nothing to do yet — scroll is handled synchronously in event handlers
  }

  // ---------------------------------------------------------------------------
  // Helper
  // ---------------------------------------------------------------------------

  function safeCall(fn) {
    if (typeof fn === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      return fn.apply(null, args);
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init(canvas, state) {
    _canvas = canvas;
    _state  = state;

    // Initialize touch sub-state
    if (!state.touch) state.touch = {};
    state.touch.selectedTiles = state.touch.selectedTiles || [];
    state.touch._scrollBufX   = 0;
    state.touch._scrollBufY   = 0;

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
  }

  // ---------------------------------------------------------------------------
  // Expose
  // ---------------------------------------------------------------------------

  window.LD.Touch = {
    init:           init,
    handleTileTap:  handleTileTap,
    handleUndo:     handleUndo,
    handleClear:    handleClear,
    handleSubmit:   handleSubmit,
    handleClue:     handleClue,
    renderActionBar: renderActionBar,
    update:         update,
  };

})();
