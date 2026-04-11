(function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────
  const STATE = {
    phase: 'title',
    board: {
      width: 40,
      height: 40,
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
    settings: { hardMode: false },
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
    STATE.phase = 'playing';
    STATE.score = 0;
    STATE.wordsSpelled = 0;
    STATE.turns = 0;
    STATE.longestWord = '';
    STATE.seedsDestroyed = 0;
    STATE.input.typed = '';
    STATE.input.path = [];
    STATE.input.valid = false;
    STATE.input.hasPath = false;

    // Generate board
    LD.Board.generate(STATE.board);

    // Center viewport on the board
    STATE.viewport.col = Math.floor((STATE.board.width - STATE.viewport.cols) / 2);
    STATE.viewport.row = Math.floor((STATE.board.height - STATE.viewport.rows) / 2);

    // Clear particles
    if (LD.Particles && LD.Particles.clear) LD.Particles.clear();
  }

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
      startGame();
      return;
    }

    if ((STATE.phase === 'gameover' || STATE.phase === 'victory') && e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      startGame();
      return;
    }
  }, true); // capture phase — fires before input.js

  // Also init audio on click (for mobile/browser policy)
  window.addEventListener('click', function() {
    initAudio();
    if (STATE.phase === 'title') {
      startGame();
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

    // Initialize input system
    if (LD.Input) LD.Input.init(STATE);

    // Start render loop
    requestAnimationFrame(gameLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
