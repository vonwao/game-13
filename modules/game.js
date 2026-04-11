(function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const STATE = {
    phase: 'settings',
    gameMode: 'wordhunt',  // 'wordhunt' | 'siege'
    board: {
      width: 30,
      height: 25,
      tiles: [],
      seals: [],
      corruptionCount: 0,
    },
    viewport: {
      col: 0,
      row: 0,
      cols: 14,
      rows: 10,
      tileSize: 0,
      offsetX: 0,
      offsetY: 60,
    },
    input: {
      typed: '',
      path: [],
      valid: false,
      hasPath: false,
      prefixStarts: [],
      flashInvalid: false,
    },
    score: 0,
    wordsSpelled: 0,
    turns: 0,
    longestWord: '',
    seedsDestroyed: 0,
    totalSeeds: 6,
    particles: [],
    floatingTexts: [],
    animations: [],
    settings: {
      difficulty:       'medium',
      boardSize:        'medium',
      soundEnabled:     true,
      particlesEnabled: true,
      specialTiles:     true,
      endCondition:     'challenges',
    },
    config: {},
    hunt: {
      round:          1,
      challenges:     [],
      completedCount: 0,
      plantedWords:   [],
      timeRemaining:  0,
      turnsRemaining: 0,
      combo:          0,
      bestCombo:      0,
      wordsThisRound: [],
      usedTileKeys:   new Set(),
    },
    touch: {
      enabled: false,
      selectedTiles: [],
      lastTap: null,
    },
    time: 0,
    dt: 0,
  };

  window.LD.STATE = STATE;

  let canvas, ctx;
  let audioInitialized = false;
  let lastTime = 0;

  // ── Init ───────────────────────────────────────────────────────────────────

  function initCanvas() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    const dpr = 1; // keep logical pixels simple
    const w = Math.min(window.innerWidth, 1280);
    const h = Math.min(window.innerHeight, 720);
    canvas.width = 1280;
    canvas.height = 720;
    canvas.style.width = Math.min(window.innerWidth, 1280) + 'px';
    canvas.style.height = Math.min(window.innerHeight, 720) + 'px';

    if (LD.Renderer) {
      LD.Renderer.init(canvas, STATE);
    }
  }

  function startGame() {
    // Resolve constants for this game
    if (LD.Constants) {
      STATE.config = LD.Constants.resolve(STATE.gameMode, STATE.settings);
    } else {
      STATE.config = { boardWidth: 30, boardHeight: 25 };
    }

    STATE.phase = 'playing';
    STATE.score = 0;
    STATE.wordsSpelled = 0;
    STATE.turns = 0;
    STATE.longestWord = '';
    STATE.seedsDestroyed = 0;
    STATE.totalSeeds = STATE.config.sealCount || 6;
    STATE.input.typed = '';
    STATE.input.path = [];
    STATE.input.valid = false;
    STATE.input.hasPath = false;

    // Update board size from config
    STATE.board.width  = STATE.config.boardWidth  || 30;
    STATE.board.height = STATE.config.boardHeight || 25;

    // Reset Word Hunt runtime state
    STATE.hunt = {
      round:          STATE.hunt ? STATE.hunt.round : 1,
      challenges:     [],
      completedCount: 0,
      plantedWords:   [],
      timeRemaining:  STATE.config.timeLimit  || 300,
      turnsRemaining: STATE.config.turnLimit  || 50,
      combo:          0,
      bestCombo:      0,
      wordsThisRound: [],
      usedTileKeys:   new Set(),
    };

    // Generate board (pass board sub-object, gameMode, config)
    LD.Board.generate(STATE.board, STATE.gameMode, STATE.config, STATE);

    // Generate challenges for Word Hunt
    if (STATE.gameMode === 'wordhunt' && LD.Challenges) {
      STATE.hunt.challenges = LD.Challenges.generate(STATE.hunt.round);
    }

    // Center viewport on the board
    STATE.viewport.col = Math.max(0, Math.floor((STATE.board.width  - STATE.viewport.cols) / 2));
    STATE.viewport.row = Math.max(0, Math.floor((STATE.board.height - STATE.viewport.rows) / 2));

    // Re-run renderer resize to pick up new board dims
    if (LD.Renderer) LD.Renderer.init(canvas, STATE);

    // Clear particles
    if (LD.Particles && LD.Particles.clear) LD.Particles.clear();
  }

  // Expose startGame for Settings module's Start button
  window.LD.Game = { startGame: startGame };

  function initAudio() {
    if (!audioInitialized && LD.Audio) {
      LD.Audio.init();
      audioInitialized = true;
    }
  }

  // ── Phase transition key handling (captures before input.js) ───────────────

  window.addEventListener('keydown', function(e) {
    // Init audio on first interaction
    initAudio();

    if (STATE.phase === 'title' && e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      STATE.phase = 'settings';
      return;
    }

    if (STATE.phase === 'settings' && e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      startGame();
      return;
    }

    if ((STATE.phase === 'gameover' || STATE.phase === 'victory') && e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      STATE.phase = 'settings';
      return;
    }
  }, true); // capture phase — fires before input.js

  // Also init audio on click (for mobile/browser policy)
  window.addEventListener('click', function() {
    initAudio();
    if (STATE.phase === 'title') {
      STATE.phase = 'settings';
    }
  }, { once: false });

  // ── Render loop ────────────────────────────────────────────────────────────

  function gameLoop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016;
    lastTime = timestamp;

    STATE.time += dt;
    STATE.dt = dt;

    // Update systems
    if (LD.Particles) LD.Particles.update(dt);
    if (LD.Touch && STATE.touch.enabled) LD.Touch.update(STATE);

    // Word Hunt timed mode countdown
    if (STATE.phase === 'playing' && STATE.gameMode === 'wordhunt' &&
        STATE.settings.endCondition === 'timed' && STATE.hunt) {
      STATE.hunt.timeRemaining = Math.max(0, (STATE.hunt.timeRemaining || 0) - dt);
      if (STATE.hunt.timeRemaining <= 0) {
        STATE.phase = 'gameover';
      }
    }

    if (LD.Renderer) {
      LD.Renderer.updateScroll(dt, STATE);
      LD.Renderer.render(ctx, STATE);
    }

    // Spawn ambient dust particles occasionally
    if (STATE.phase === 'playing' && LD.Particles && Math.random() < 0.02) {
      const vp = STATE.viewport;
      const x = vp.offsetX + Math.random() * vp.cols * vp.tileSize;
      const y = vp.offsetY + Math.random() * vp.rows * vp.tileSize;
      LD.Particles.spawn('dust', x, y, { color: '#c8a87a' });
    }

    requestAnimationFrame(gameLoop);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  function boot() {
    initCanvas();

    // Detect touch
    STATE.touch.enabled = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Initialize Settings module (before Input so settings screen can respond to clicks)
    if (LD.Settings) LD.Settings.init(canvas, STATE);

    // Initialize input system
    if (LD.Input) LD.Input.init(STATE);

    // Initialize touch support if detected
    if (STATE.touch.enabled && LD.Touch) {
      LD.Touch.init(canvas, STATE);
    }

    // Start in settings phase
    STATE.phase = 'settings';

    // Start render loop
    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
