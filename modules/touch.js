(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------

  var _canvas = null;
  var _state  = null;

  var _initialized = false;
  var _listenersBound = false;
  var _actionsInitialized = false;
  var _autoInitTimer = 0;

  // Scroll state
  var _scrollMode      = false; // persistent toggle from the action bar
  var _gestureScroll   = false;  // temporary two-pointer scroll gesture
  var _gestureCenterX  = 0;
  var _gestureCenterY  = 0;
  var _scrollVelX      = 0;
  var _scrollVelY      = 0;

  // Tap state
  var _lastTapTime = 0;
  var _lastTapCol  = -1;
  var _lastTapRow  = -1;

  // Active pointers for unified pointer input
  var _activePointers = {};
  var _activePointerCount = 0;

  // Action bar button regions (rebuilt each render)
  var _buttons = [];

  // ---------------------------------------------------------------------------
  // Action API helpers
  // ---------------------------------------------------------------------------

  function getActions() {
    return window.LD && window.LD.Actions ? window.LD.Actions : null;
  }

  function hasAction(name) {
    var actions = getActions();
    return !!(actions && typeof actions[name] === 'function');
  }

  function callAction(name) {
    var actions = getActions();
    if (!actions || typeof actions[name] !== 'function') return null;
    var args = Array.prototype.slice.call(arguments, 1);
    return actions[name].apply(actions, args);
  }

  function getSelectedTiles() {
    var actions = getActions();
    if (actions && typeof actions.getSelectedTiles === 'function') {
      return actions.getSelectedTiles() || [];
    }
    if (_state && _state.touch && Array.isArray(_state.touch.selectedTiles)) {
      return _state.touch.selectedTiles;
    }
    return [];
  }

  function isCurrentWordValid() {
    return !!(_state && _state.input && _state.input.valid && _state.input.hasPath);
  }

  // ---------------------------------------------------------------------------
  // Canvas coordinate conversion
  // ---------------------------------------------------------------------------

  function getCanvasPointFromEvent(ev) {
    var rect = _canvas.getBoundingClientRect();
    var scaleX = _canvas.width  / rect.width;
    var scaleY = _canvas.height / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top)  * scaleY,
    };
  }

  function getCanvasPointFromTouch(touch) {
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

  function isAdjacent(a, b) {
    return Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1;
  }

  function traceLine(start, end) {
    var points = [{ col: start.col, row: start.row }];
    var x0 = start.col;
    var y0 = start.row;
    var x1 = end.col;
    var y1 = end.row;
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1;
    var sy = y0 < y1 ? 1 : -1;
    var err = dx - dy;

    while (x0 !== x1 || y0 !== y1) {
      var e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
      points.push({ col: x0, row: y0 });
    }

    return points;
  }

  // ---------------------------------------------------------------------------
  // Legacy fallback state
  // ---------------------------------------------------------------------------

  function ensureTouchState() {
    if (!_state) return;
    if (!_state.touch) _state.touch = {};
    if (!Array.isArray(_state.touch.selectedTiles)) {
      _state.touch.selectedTiles = [];
    }
    if (typeof _state.touch._scrollBufX !== 'number') _state.touch._scrollBufX = 0;
    if (typeof _state.touch._scrollBufY !== 'number') _state.touch._scrollBufY = 0;
  }

  function syncFallbackInputFromSelection() {
    if (!_state) return;
    ensureTouchState();

    var path = _state.touch.selectedTiles;
    var board = _state.board;
    var word = '';

    for (var i = 0; i < path.length; i++) {
      var t = board.tiles[path[i].row * board.width + path[i].col];
      word += (t && t.letter) ? t.letter : '?';
    }

    _state.input.typed = word;
    _state.input.path = path.slice();

    if (window.LD && window.LD.Input && window.LD.Input.refreshCurrentWord) {
      window.LD.Input.refreshCurrentWord();
    } else {
      _state.input.valid = false;
      _state.input.hasPath = path.length > 0;
    }
  }

  function legacyTapTile(col, row) {
    if (!_state || _state.phase !== 'playing') return;

    ensureTouchState();
    var path = _state.touch.selectedTiles;
    var board = _state.board;
    var tile = board.tiles[row * board.width + col];
    if (!tile || tile.corrupted || tile.isSeal) return;

    if (window.LD && window.LD.Audio) window.LD.Audio.play('tap');

    if (path.length === 0) {
      _state.touch.selectedTiles = [{ col: col, row: row }];
      syncFallbackInputFromSelection();
      return;
    }

    var last = path[path.length - 1];

    if (last.col === col && last.row === row) {
      legacyUndoSelection();
      return;
    }

    for (var i = 0; i < path.length - 1; i++) {
      if (path[i].col === col && path[i].row === row) {
        _state.touch.selectedTiles = path.slice(0, i + 1);
        syncFallbackInputFromSelection();
        return;
      }
    }

    if (isAdjacent(last, { col: col, row: row })) {
      path.push({ col: col, row: row });
      syncFallbackInputFromSelection();
      return;
    }

    _state.touch.selectedTiles = [{ col: col, row: row }];
    syncFallbackInputFromSelection();
  }

  function legacyUndoSelection() {
    if (!_state) return;
    ensureTouchState();
    var path = _state.touch.selectedTiles;
    if (path.length > 0) {
      path.pop();
      syncFallbackInputFromSelection();
    }
  }

  function legacyClearWord() {
    if (!_state) return;
    ensureTouchState();
    _state.touch.selectedTiles = [];
    _state.input.typed = '';
    _state.input.path = [];
    _state.input.valid = false;
    _state.input.hasPath = false;
    _state.input.matchingTiles = [];
    _state.input.scorePreview = null;
    _lastTapTime = 0;
    _lastTapCol = -1;
    _lastTapRow = -1;
  }

  function legacySubmitWord() {
    if (!_state || _state.phase !== 'playing') return;
    if (_state.input.valid && _state.input.hasPath) {
      if (window.LD && window.LD.Input && window.LD.Input.submitCurrentWord) {
        window.LD.Input.submitCurrentWord();
      }
      ensureTouchState();
      _state.touch.selectedTiles = [];
      _lastTapTime = 0;
      _lastTapCol = -1;
      _lastTapRow = -1;
    } else if (window.LD && window.LD.Input && window.LD.Input.rejectCurrentWord) {
      window.LD.Input.rejectCurrentWord();
    }
  }

  function legacyUseClue() {
    if (window.LD && window.LD.Input && window.LD.Input.useClue) {
      window.LD.Input.useClue();
    }
  }

  function legacyScrollBy(dx, dy) {
    if (!_state) return;
    var vp = _state.viewport;
    var ts = vp.tileSize || 32;
    var colDelta = dx / ts;
    var rowDelta = dy / ts;

    var maxCol = _state.board.width  - vp.cols;
    var maxRow = _state.board.height - vp.rows;

    ensureTouchState();
    _state.touch._scrollBufX = (_state.touch._scrollBufX || 0) + colDelta;
    _state.touch._scrollBufY = (_state.touch._scrollBufY || 0) + rowDelta;

    var tileStepX = Math.round(_state.touch._scrollBufX);
    var tileStepY = Math.round(_state.touch._scrollBufY);

    if (tileStepX !== 0 || tileStepY !== 0) {
      vp.col = Math.max(0, Math.min(maxCol, vp.col + tileStepX));
      vp.row = Math.max(0, Math.min(maxRow, vp.row + tileStepY));
      _state.touch._scrollBufX -= tileStepX;
      _state.touch._scrollBufY -= tileStepY;
      legacyClearWord();
    }
  }

  // ---------------------------------------------------------------------------
  // Public action wrappers
  // ---------------------------------------------------------------------------

  function handleTileTap(col, row) {
    if (hasAction('tapTile')) {
      return callAction('tapTile', col, row);
    }
    return legacyTapTile(col, row);
  }

  function handleUndo() {
    if (hasAction('undoTileSelection')) {
      return callAction('undoTileSelection');
    }
    return legacyUndoSelection();
  }

  function handleClear() {
    if (hasAction('clearCurrentWord')) {
      return callAction('clearCurrentWord');
    }
    return legacyClearWord();
  }

  function handleSubmit() {
    if (!_state || _state.phase !== 'playing') return;
    if (hasAction('submitCurrentWord')) {
      if (isCurrentWordValid()) {
        return callAction('submitCurrentWord');
      }
      if (window.LD && window.LD.Input && window.LD.Input.rejectCurrentWord) {
        return window.LD.Input.rejectCurrentWord();
      }
      return;
    }
    return legacySubmitWord();
  }

  function handleClue() {
    if (hasAction('useClue')) {
      return callAction('useClue');
    }
    return legacyUseClue();
  }

  function scrollBy(dx, dy) {
    if (hasAction('scrollBoard')) {
      return callAction('scrollBoard', dx, dy);
    }
    return legacyScrollBy(dx, dy);
  }

  function getScrollModeActive() {
    return _scrollMode || _gestureScroll;
  }

  function resetScrollTracking() {
    _gestureScroll = false;
    _gestureCenterX = 0;
    _gestureCenterY = 0;
    clearDragTracking();
  }

  function toggleScrollMode() {
    _scrollMode = !_scrollMode;
    resetScrollTracking();
    return _scrollMode;
  }

  // ---------------------------------------------------------------------------
  // Pointer events
  // ---------------------------------------------------------------------------

  function getPointerState(pointerId) {
    return _activePointers[pointerId] || null;
  }

  function getPointerCenter() {
    var sumX = 0;
    var sumY = 0;
    var count = 0;
    var id;
    for (id in _activePointers) {
      if (!_activePointers.hasOwnProperty(id)) continue;
      sumX += _activePointers[id].x;
      sumY += _activePointers[id].y;
      count++;
    }
    if (count === 0) return null;
    return { x: sumX / count, y: sumY / count };
  }

  function clearDragTracking() {
    var id;
    for (id in _activePointers) {
      if (_activePointers.hasOwnProperty(id)) {
        _activePointers[id].lastGrid = null;
      }
    }
  }

  function updateScrollGestureState() {
    if (_scrollMode) {
      _gestureScroll = false;
      return;
    }

    if (_activePointerCount >= 2) {
      if (!_gestureScroll) {
        var center = getPointerCenter();
        _gestureScroll = true;
        _gestureCenterX = center ? center.x : 0;
        _gestureCenterY = center ? center.y : 0;
        clearDragTracking();
      }
    } else if (_gestureScroll) {
      _gestureScroll = false;
    }
  }

  function registerPointer(e) {
    var point = getCanvasPointFromEvent(e);
    var state = {
      id: e.pointerId,
      type: e.pointerType || 'mouse',
      x: point.x,
      y: point.y,
      lastX: point.x,
      lastY: point.y,
      lastGrid: null,
    };
    _activePointers[e.pointerId] = state;
    _activePointerCount++;
    updateScrollGestureState();
    return state;
  }

  function releasePointer(pointerId) {
    if (_activePointers[pointerId]) {
      delete _activePointers[pointerId];
      _activePointerCount = Math.max(0, _activePointerCount - 1);
    }
    updateScrollGestureState();
  }

  function handlePointerDown(e) {
    if (!_state || _state.phase === 'settings') return;
    if (e.button != null && e.button !== 0) return;

    var pos = getCanvasPointFromEvent(e);

    // Buttons are handled immediately and do not become active pointers.
    if (checkButtonHit(pos.x, pos.y)) {
      e.preventDefault();
      return;
    }

    maybeInitAudio();
    e.preventDefault();

    var pointer = registerPointer(e);

    if (e.currentTarget && typeof e.currentTarget.setPointerCapture === 'function') {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }

    // Two-pointer gestures become temporary scroll mode.
    if (_gestureScroll || _activePointerCount >= 2 || _scrollMode) {
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    var grid = pixelToGrid(pos.x, pos.y);
    if (!grid) return;

    var now = Date.now();
    if (_lastTapCol === grid.col && _lastTapRow === grid.row && (now - _lastTapTime) < 300) {
      handleSubmit();
      _lastTapTime = 0;
      _lastTapCol = -1;
      _lastTapRow = -1;
      return;
    }

    handleTileTap(grid.col, grid.row);
    pointer.lastGrid = grid;
    _lastTapTime = now;
    _lastTapCol = grid.col;
    _lastTapRow = grid.row;
  }

  function handlePointerMove(e) {
    if (!_state || _state.phase === 'settings') return;
    var pointer = getPointerState(e.pointerId);
    if (!pointer) return;

    e.preventDefault();
    var pos = getCanvasPointFromEvent(e);
    pointer.x = pos.x;
    pointer.y = pos.y;

    if (_activePointerCount >= 2) {
      var center = getPointerCenter();
      if (center) {
        var cdx = center.x - _gestureCenterX;
        var cdy = center.y - _gestureCenterY;
        if (cdx || cdy) scrollBy(-cdx, -cdy);
        _gestureCenterX = center.x;
        _gestureCenterY = center.y;
      }
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    if (_scrollMode) {
      var dx = pos.x - pointer.lastX;
      var dy = pos.y - pointer.lastY;
      if (dx || dy) scrollBy(-dx, -dy);
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    var grid = pixelToGrid(pos.x, pos.y);
    if (!grid) {
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    if (!pointer.lastGrid) {
      pointer.lastGrid = grid;
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    if (pointer.lastGrid.col === grid.col && pointer.lastGrid.row === grid.row) {
      pointer.lastX = pos.x;
      pointer.lastY = pos.y;
      return;
    }

    var trace = traceLine(pointer.lastGrid, grid);
    for (var i = 1; i < trace.length; i++) {
      handleTileTap(trace[i].col, trace[i].row);
    }
    pointer.lastGrid = grid;
    pointer.lastX = pos.x;
    pointer.lastY = pos.y;
  }

  function handlePointerUp(e) {
    if (!_state || _state.phase === 'settings') return;
    var pointer = getPointerState(e.pointerId);
    if (!pointer) return;
    e.preventDefault();
    releasePointer(e.pointerId);
    if (_activePointerCount === 0) {
      _gestureCenterX = 0;
      _gestureCenterY = 0;
    }
  }

  function handlePointerCancel(e) {
    handlePointerUp(e);
  }

  // ---------------------------------------------------------------------------
  // Legacy touch event handlers
  // ---------------------------------------------------------------------------

  function onTouchStart(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    if (window.LD && window.LD.Audio) LD.Audio.init();

    var touches = e.touches;

    if (touches.length >= 2) {
      resetScrollTracking();
      _scrollMode = true;
      _lastTapTime = 0;
      _lastTapCol = -1;
      _lastTapRow = -1;
      _activePointers = {};
      _activePointerCount = 0;
      _gestureCenterX = (touches[0].clientX + touches[1].clientX) / 2;
      _gestureCenterY = (touches[0].clientY + touches[1].clientY) / 2;
      return;
    }

    var pos = getCanvasPointFromTouch(touches[0]);

    if (checkButtonHit(pos.x, pos.y)) return;

    if (!_scrollMode) {
      var now = Date.now();
      var grid = pixelToGrid(pos.x, pos.y);
      if (grid && _lastTapCol === grid.col && _lastTapRow === grid.row && (now - _lastTapTime) < 300) {
        handleSubmit();
        _lastTapTime = 0;
        _lastTapCol = -1;
        _lastTapRow = -1;
        return;
      }
      _lastTapTime = now;
      if (grid) {
        handleTileTap(grid.col, grid.row);
      }
    } else {
      _gestureCenterX = pos.x;
      _gestureCenterY = pos.y;
    }
  }

  function onTouchMove(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    var touches = e.touches;

    if (touches.length >= 2 || _scrollMode) {
      var cx, cy;
      if (touches.length >= 2) {
        cx = (touches[0].clientX + touches[1].clientX) / 2;
        cy = (touches[0].clientY + touches[1].clientY) / 2;
      } else {
        var pos = getCanvasPointFromTouch(touches[0]);
        cx = pos.x;
        cy = pos.y;
      }
      var rect = _canvas.getBoundingClientRect();
      var scaleX = _canvas.width  / rect.width;
      var scaleY = _canvas.height / rect.height;
      var canvasCX = (cx - rect.left) * scaleX;
      var canvasCY = (cy - rect.top)  * scaleY;

      var dx = canvasCX - _gestureCenterX;
      var dy = canvasCY - _gestureCenterY;
      scrollBy(-dx, -dy);
      _gestureCenterX = canvasCX;
      _gestureCenterY = canvasCY;
    }
  }

  function onTouchEnd(e) {
    if (!_state || _state.phase === 'settings') return;
    e.preventDefault();

    if (e.touches.length === 0) {
      _scrollMode = false;
      resetScrollTracking();
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
      isEmpty ? '(tap/click tiles to spell)' : word.split('').join(' - '),
      W / 2,
      barY + 14
    );
    if (!isEmpty) {
      var sp = state.input.scorePreview;
      if (sp && state.input.hasPath) {
        var breakdown = sp.basePts + 'pts';
        if (sp.lenMult > 1.0) breakdown += ' ×' + sp.lenMult.toFixed(1);
        if (sp.shapeMult !== 1.0) breakdown += ' ×' + sp.shapeMult.toFixed(1) + ' ' + sp.shapeLabel;
        if (sp.comboMult > 1.0) breakdown += ' ×' + sp.comboMult.toFixed(1) + ' combo';
        if (sp.crystalMult > 1.0) breakdown += ' ×2 crystal';
        if (sp.emberBonus > 0) breakdown += ' +' + sp.emberBonus + ' ember';
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
      action: toggleScrollMode,
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
  // Per-frame update
  // ---------------------------------------------------------------------------

  function update(state) {
    if (!_initialized) {
      maybeAutoInit();
    }
    // Nothing else to do yet.
  }

  // ---------------------------------------------------------------------------
  // Init / bootstrap
  // ---------------------------------------------------------------------------

  function bindListeners(canvas) {
    if (_listenersBound) return;

    if (window.PointerEvent) {
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
      canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
      canvas.addEventListener('pointerup', handlePointerUp, { passive: false });
      canvas.addEventListener('pointercancel', handlePointerCancel, { passive: false });
    } else {
      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
    }

    _listenersBound = true;
  }

  function maybeInitAudio() {
    if (_initialized && window.LD && window.LD.Audio && typeof LD.Audio.init === 'function') {
      // Audio init is idempotent in the main game, but only prime it once here.
      if (!maybeInitAudio._done) {
        maybeInitAudio._done = true;
        LD.Audio.init();
      }
    }
  }

  function init(canvas, state) {
    if (_initialized && _canvas === canvas && _state === state) {
      return;
    }

    _canvas = canvas;
    _state  = state;

    if (!state.touch) state.touch = {};
    state.touch.enabled = true;
    ensureTouchState();

    if (!_actionsInitialized && window.LD && window.LD.Actions && typeof window.LD.Actions.init === 'function') {
      window.LD.Actions.init(state);
      _actionsInitialized = true;
    }

    bindListeners(canvas);
    _initialized = true;
    _autoInitTimer = 0;
  }

  function maybeAutoInit() {
    if (_initialized) return true;
    var canvas = document.getElementById('game');
    var state = window.LD && window.LD.STATE;
    if (canvas && state) {
      init(canvas, state);
      return true;
    }
    return false;
  }

  function scheduleAutoInit() {
    if (_initialized) return;
    if (_autoInitTimer) return;

    function attempt() {
      if (_initialized) return;
      if (maybeAutoInit()) return;
      _autoInitTimer = window.setTimeout(function () {
        _autoInitTimer = 0;
        attempt();
      }, 50);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attempt, { once: true });
    }

    attempt();
  }

  scheduleAutoInit();

  // ---------------------------------------------------------------------------
  // Expose
  // ---------------------------------------------------------------------------

  window.LD.Touch = {
    init:            init,
    handleTileTap:   handleTileTap,
    handleUndo:      handleUndo,
    handleClear:     handleClear,
    handleSubmit:    handleSubmit,
    handleClue:      handleClue,
    renderActionBar: renderActionBar,
    update:          update,
  };

})();
