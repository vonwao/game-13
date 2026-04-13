(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Difficulty descriptions per mode
  // ---------------------------------------------------------------------------

  var DIFF_DESC = {
    wordhunt: {
      easy:   'More hidden words, shorter, mostly horizontal/vertical. Extra fragments.',
      medium: 'Balanced mix. Some diagonal and reversed hidden words.',
      hard:   'Fewer hidden words, longer, many diagonal/reversed. Few fragments.',
    },
    siege: {
      easy:   '4 seals, slower corruption spread, generous loss threshold.',
      medium: '6 seals, standard corruption. The intended challenge.',
      hard:   '8 seals, fast corruption, letters degrade near ink.',
    },
  };

  var COLORS = {
    bg:        '#1a1714',
    panel:     '#12100d',
    border:    '#3a3028',
    sand:      '#d4c4a0',
    amber:     '#c8a050',
    amberBg:   '#3a2808',
    charcoal:  '#1a1714',
    dim:       '#6a5a40',
    selected:  '#c8a050',
    cardSel:   '#2a2010',
    cardBg:    '#1c1a16',
    green:     '#60c060',
    startBtn:  '#c8a050',
    startText: '#1a1210',
    white:     '#ffffff',
  };

  // ---------------------------------------------------------------------------
  // Hit regions
  // ---------------------------------------------------------------------------

  var _hitRegions = [];
  var _canvas = null;
  var _state  = null;
  var _hoverX = 0;
  var _hoverY = 0;

  function addHit(x, y, w, h, action) {
    _hitRegions.push({ x: x, y: y, w: w, h: h, action: action });
  }

  function hitTest(px, py) {
    for (var i = _hitRegions.length - 1; i >= 0; i--) {
      var r = _hitRegions[i];
      if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
        return r.action;
      }
    }
    return null;
  }

  function getCanvasXY(e) {
    var rect = _canvas.getBoundingClientRect();
    var scaleX = _canvas.width  / rect.width;
    var scaleY = _canvas.height / rect.height;
    var cx, cy;
    if (e.touches) {
      cx = (e.touches[0].clientX - rect.left) * scaleX;
      cy = (e.touches[0].clientY - rect.top)  * scaleY;
    } else {
      cx = (e.clientX - rect.left) * scaleX;
      cy = (e.clientY - rect.top)  * scaleY;
    }
    return { x: cx, y: cy };
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  function onMouseMove(e) {
    if (_state && _state.phase === 'settings') {
      var pos = getCanvasXY(e);
      _hoverX = pos.x;
      _hoverY = pos.y;
    }
  }

  function onMouseDown(e) {
    if (!_state || _state.phase !== 'settings') return;
    var pos = getCanvasXY(e);
    var action = hitTest(pos.x, pos.y);
    if (action) action();
  }

  function onTouchStart(e) {
    if (!_state || _state.phase !== 'settings') return;
    e.preventDefault();
    var pos = getCanvasXY(e);
    _hoverX = pos.x;
    _hoverY = pos.y;
    var action = hitTest(pos.x, pos.y);
    if (action) action();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function init(canvas, state) {
    _canvas = canvas;
    _state  = state;
    canvas.addEventListener('mousemove',  onMouseMove,  { passive: true });
    canvas.addEventListener('mousedown',  onMouseDown,  { passive: true });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  }

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  function roundRect(ctx, x, y, w, h, r) {
    r = r || 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function isHovered(x, y, w, h) {
    return _hoverX >= x && _hoverX <= x + w && _hoverY >= y && _hoverY <= y + h;
  }

  function text(ctx, str, x, y, size, color, align) {
    ctx.font = (size || 14) + 'px "Courier New", monospace';
    ctx.fillStyle = color || COLORS.sand;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function render(ctx, state) {
    _hitRegions = [];

    var W = _canvas.width;
    var H = _canvas.height;

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Panel dimensions — centered
    var panelW = 620;
    var panelH = 540;
    var panelX = Math.floor((W - panelW) / 2);
    var panelY = Math.floor((H - panelH) / 2);

    // Title above panel
    ctx.font = '32px "Courier New", monospace';
    ctx.fillStyle = COLORS.amber;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEXICON DEEP', W / 2, panelY - 40);
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = COLORS.dim;
    ctx.fillText('Spell to Survive', W / 2, panelY - 14);

    // Panel background
    ctx.fillStyle = COLORS.panel;
    roundRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    var cursor = panelY + 18;
    var pad = 20;

    // ── GAME MODE ──────────────────────────────────────────────────────────
    text(ctx, 'GAME MODE', panelX + pad, cursor + 8, 11, COLORS.dim, 'left');
    cursor += 24;

    var cardW = 240;
    var cardH = 100;
    var cardGap = 16;
    var cardsTotal = cardW * 2 + cardGap;
    var card1X = panelX + Math.floor((panelW - cardsTotal) / 2);
    var card2X = card1X + cardW + cardGap;
    var cardY = cursor;

    drawModeCard(ctx, card1X, cardY, cardW, cardH, 'wordhunt',
      'WORD HUNT',
      ['Find words, clear round', 'objectives, discover', 'hidden words'],
      state.gameMode === 'wordhunt');

    drawModeCard(ctx, card2X, cardY, cardW, cardH, 'siege',
      'SIEGE',
      ['Fight the spreading', 'corruption.', 'Destroy all seals.'],
      state.gameMode === 'siege');

    cursor += cardH + 18;

    // Divider
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + pad, cursor);
    ctx.lineTo(panelX + panelW - pad, cursor);
    ctx.stroke();
    cursor += 12;

    // ── DIFFICULTY ────────────────────────────────────────────────────────
    text(ctx, 'DIFFICULTY', panelX + pad, cursor + 8, 11, COLORS.dim, 'left');
    cursor += 24;

    var btnW = 100;
    var btnH = 30;
    var btnGap = 10;
    var btnsTotal = btnW * 3 + btnGap * 2;
    var btn1X = panelX + Math.floor((panelW - btnsTotal) / 2);

    drawToggleBtn(ctx, btn1X,             cursor, btnW, btnH, 'Easy',   state.settings.difficulty === 'easy',   function() { state.settings.difficulty = 'easy'; });
    drawToggleBtn(ctx, btn1X + btnW + btnGap, cursor, btnW, btnH, 'Medium', state.settings.difficulty === 'medium', function() { state.settings.difficulty = 'medium'; });
    drawToggleBtn(ctx, btn1X + (btnW + btnGap)*2, cursor, btnW, btnH, 'Hard',   state.settings.difficulty === 'hard',   function() { state.settings.difficulty = 'hard'; });

    cursor += btnH + 8;

    // Difficulty description
    var descKey = state.settings.difficulty || 'medium';
    var modeKey = state.gameMode || 'wordhunt';
    var desc = (DIFF_DESC[modeKey] || DIFF_DESC.wordhunt)[descKey] || '';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = COLORS.dim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(desc, panelX + panelW / 2, cursor + 8);
    cursor += 22;

    // Divider
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + pad, cursor);
    ctx.lineTo(panelX + panelW - pad, cursor);
    ctx.stroke();
    cursor += 12;

    // ── BOARD SIZE ────────────────────────────────────────────────────────
    text(ctx, 'BOARD SIZE', panelX + pad, cursor + 8, 11, COLORS.dim, 'left');
    cursor += 24;

    drawToggleBtn(ctx, btn1X,             cursor, btnW, btnH, 'Small',  state.settings.boardSize === 'small',  function() { state.settings.boardSize = 'small'; });
    drawToggleBtn(ctx, btn1X + btnW + btnGap, cursor, btnW, btnH, 'Medium', state.settings.boardSize === 'medium', function() { state.settings.boardSize = 'medium'; });
    drawToggleBtn(ctx, btn1X + (btnW + btnGap)*2, cursor, btnW, btnH, 'Large',  state.settings.boardSize === 'large',  function() { state.settings.boardSize = 'large'; });

    cursor += btnH + 14;

    // Divider
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + pad, cursor);
    ctx.lineTo(panelX + panelW - pad, cursor);
    ctx.stroke();
    cursor += 12;

    // ── GOAL (Word Hunt only) ─────────────────────────────────────────────
    if (state.gameMode === 'wordhunt') {
      text(ctx, 'GOAL', panelX + pad, cursor + 8, 11, COLORS.dim, 'left');
      cursor += 24;

      var goals = [
        { key: 'challenges', label: 'Objectives' },
        { key: 'zen',        label: 'Zen' },
        { key: 'timed',      label: 'Timed' },
        { key: 'turns',      label: 'Turns' },
      ];

      var goalX = panelX + pad;
      for (var gi = 0; gi < goals.length; gi++) {
        var g = goals[gi];
        var gx = goalX + gi * 145;
        drawRadio(ctx, gx, cursor + 6, g.label, state.settings.endCondition === g.key, (function(k){ return function() { state.settings.endCondition = k; }; })(g.key));
      }
      cursor += 24;

      // Divider
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(panelX + pad, cursor);
      ctx.lineTo(panelX + panelW - pad, cursor);
      ctx.stroke();
      cursor += 12;
    }

    // ── OPTIONS ───────────────────────────────────────────────────────────
    text(ctx, 'OPTIONS', panelX + pad, cursor + 8, 11, COLORS.dim, 'left');
    cursor += 24;

    var optX = panelX + pad;
    drawCheckbox(ctx, optX,       cursor, 'Special tiles (x2 crystal, ? void, +20 ember)', state.settings.specialTiles, function() { state.settings.specialTiles = !state.settings.specialTiles; });
    cursor += 24;
    drawCheckbox(ctx, optX,       cursor, 'Sound effects',   state.settings.soundEnabled,     function() { state.settings.soundEnabled = !state.settings.soundEnabled; });
    cursor += 24;
    drawCheckbox(ctx, optX,       cursor, 'Particle effects', state.settings.particlesEnabled, function() { state.settings.particlesEnabled = !state.settings.particlesEnabled; });
    cursor += 30;

    // ── START BUTTON ──────────────────────────────────────────────────────
    var startW = 220;
    var startH = 44;
    var startX = panelX + Math.floor((panelW - startW) / 2);
    var startY = panelY + panelH - startH - 16;

    var startHovered = isHovered(startX, startY, startW, startH);
    ctx.fillStyle = startHovered ? '#e0b860' : COLORS.startBtn;
    roundRect(ctx, startX, startY, startW, startH, 6);
    ctx.fill();

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.startText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('► START GAME', startX + startW / 2, startY + startH / 2);

    addHit(startX, startY, startW, startH, function() {
      if (window.LD && window.LD.Game && window.LD.Game.startGame) {
        window.LD.Game.startGame();
      }
    });

    // Hint text
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = COLORS.dim;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Press ? for help', W / 2, startY + startH + 14);
  }

  // ---------------------------------------------------------------------------
  // Drawing sub-components
  // ---------------------------------------------------------------------------

  function drawModeCard(ctx, x, y, w, h, modeKey, title, lines, selected) {
    var hov = isHovered(x, y, w, h);
    ctx.fillStyle = selected ? COLORS.cardSel : (hov ? '#222018' : COLORS.cardBg);
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = selected ? COLORS.amber : COLORS.border;
    ctx.lineWidth = selected ? 2 : 1;
    ctx.stroke();

    // Title
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = selected ? COLORS.amber : COLORS.sand;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + w / 2, y + 22);

    if (selected) {
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = COLORS.amber;
      ctx.fillText('▲ selected', x + w / 2, y + 38);
    }

    // Description lines
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = COLORS.dim;
    var lineStart = selected ? 54 : 44;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + w / 2, y + lineStart + i * 14);
    }

    addHit(x, y, w, h, (function(k) { return function() { _state.gameMode = k; }; })(modeKey));
  }

  function drawToggleBtn(ctx, x, y, w, h, label, selected, action) {
    var hov = isHovered(x, y, w, h);
    ctx.fillStyle = selected ? COLORS.amber : (hov ? '#2a2418' : '#1c1a16');
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = selected ? COLORS.amber : COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = selected ? COLORS.charcoal : (hov ? COLORS.sand : COLORS.dim);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);

    addHit(x, y, w, h, action);
  }

  function drawRadio(ctx, x, y, label, selected, action) {
    var r = 6;
    ctx.beginPath();
    ctx.arc(x + r, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = selected ? COLORS.amber : COLORS.dim;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (selected) {
      ctx.beginPath();
      ctx.arc(x + r, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.amber;
      ctx.fill();
    }
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = selected ? COLORS.sand : COLORS.dim;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + r * 2 + 4, y);

    addHit(x, y - 8, 120, 16, action);
  }

  function drawCheckbox(ctx, x, y, label, checked, action) {
    var sz = 14;
    ctx.strokeStyle = checked ? COLORS.amber : COLORS.dim;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y - sz / 2, sz, sz, 2);
    ctx.stroke();
    ctx.fillStyle = checked ? COLORS.amberBg : 'transparent';
    if (checked) { ctx.fill(); }

    if (checked) {
      ctx.strokeStyle = COLORS.amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 3, y);
      ctx.lineTo(x + 6, y + 4);
      ctx.lineTo(x + 11, y - 4);
      ctx.stroke();
    }

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = checked ? COLORS.sand : COLORS.dim;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + sz + 8, y);

    addHit(x, y - sz / 2, 400, sz, action);
  }

  // ---------------------------------------------------------------------------
  // Expose
  // ---------------------------------------------------------------------------

  window.LD.Settings = {
    init:   init,
    render: render,
  };

})();
