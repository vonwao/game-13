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
    wordHistory: [],
    turns: 0,
    longestWord: '',
    seedsDestroyed: 0,
    totalSeeds: 6,
    particles: [],
    floatingTexts: [],
    animations: [],
    settings: {
      difficulty:       'easy',
      boardSize:        'small',
      soundEnabled:     true,
      particlesEnabled: true,
      specialTiles:     false,
      endCondition:     'challenges',
    },
    config: {},
    hunt: {
      round:          1,
      maxRounds:      3,
      challenges:     [],
      completedCount: 0,
      plantedWords:   [],
      discoveredWords: [],
      timeRemaining:  0,
      turnsRemaining: 0,
      combo:          0,
      bestCombo:      0,
      roundScore:     0,
      wordsThisRound: [],
      usedTileKeys:   new Set(),
      cluesRemaining: 0,
      clueTiles:      [],
      clueTimer:      0,
      roundTitle:     'The First Page',
      advanceAvailable: false,
    },
    touch: {
      enabled: false,
      selectedTiles: [],
      lastTap: null,
    },
    inputAdapter: null,
    showHelp: false,
    helpTab: 'basics',
    debug: {
      enabled: false,
      tab: 'planted',
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
    const isMobileLike = window.innerWidth < 900 || window.innerHeight > window.innerWidth;
    let displayW = window.innerWidth;
    let displayH = window.innerHeight;

    if (!isMobileLike) {
      displayW = Math.min(displayW, 1280);
      displayH = Math.min(displayH, 720);
    }

    canvas.width = Math.max(1, Math.floor(displayW));
    canvas.height = Math.max(1, Math.floor(displayH));
    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';

    if (LD.Renderer) {
      LD.Renderer.init(canvas, STATE);
    }
  }

  function getRoundTitle(round) {
    var titles = [
      'The First Page',
      'Dust and Echoes',
      'The Black Index'
    ];
    return titles[round - 1] || ('Round ' + round);
  }

  function buildRoundConfig() {
    // Resolve constants for this game
    if (LD.Constants) {
      STATE.config = LD.Constants.resolve(STATE.gameMode, STATE.settings);
    } else {
      STATE.config = { boardWidth: 30, boardHeight: 25 };
    }

    if (STATE.gameMode === 'wordhunt') {
      var round = (STATE.hunt && STATE.hunt.round) || 1;
      if (round > 1) {
        STATE.config.commonWordRankLimit += (round - 1) * (STATE.config.commonWordRankStep || 0);
        STATE.config.fragmentCount = Math.max(3, (STATE.config.fragmentCount || 8) - (round - 1) * 2);
        STATE.config.plantedDiagonalPct = Math.min(0.8, (STATE.config.plantedDiagonalPct || 0) + (round - 1) * 0.12);
        STATE.config.plantedReversePct  = Math.min(0.65, (STATE.config.plantedReversePct  || 0) + (round - 1) * 0.10);
        STATE.config.clueCount = Math.max(0, (STATE.config.clueCount || 0) - Math.floor((round - 1) / 2));
      }
    }
  }

  function setupRound(resetRunStats) {
    buildRoundConfig();

    STATE.phase = 'playing';
    if (resetRunStats) {
      STATE.score = 0;
      STATE.wordsSpelled = 0;
      STATE.wordHistory = [];
      STATE.turns = 0;
      STATE.longestWord = '';
      STATE.seedsDestroyed = 0;
    }
    STATE.totalSeeds = STATE.gameMode === 'siege' ? (STATE.config.sealCount || 6) : 0;
    STATE.input.typed = '';
    STATE.input.path = [];
    STATE.input.valid = false;
    STATE.input.hasPath = false;
    STATE.input.scorePreview = null;

    // Update board size from config
    STATE.board.width  = STATE.config.boardWidth  || 30;
    STATE.board.height = STATE.config.boardHeight || 25;

    // Reset Word Hunt runtime state
    STATE.hunt = {
      round:          STATE.hunt ? STATE.hunt.round : 1,
      maxRounds:      STATE.config.roundsToWin || (STATE.hunt ? STATE.hunt.maxRounds : 3) || 3,
      challenges:     [],
      completedCount: 0,
      plantedWords:   [],
      discoveredWords: [],
      timeRemaining:  STATE.config.timeLimit  || 300,
      turnsRemaining: STATE.config.turnLimit  || 50,
      combo:          0,
      bestCombo:      resetRunStats ? 0 : (STATE.hunt ? STATE.hunt.bestCombo : 0),
      roundScore:     0,
      wordsThisRound: [],
      usedTileKeys:   new Set(),
      cluesRemaining: STATE.config.clueCount || 0,
      clueTiles:      [],
      clueTimer:      0,
      roundTitle:     getRoundTitle(STATE.hunt ? STATE.hunt.round : 1),
      advanceAvailable: false,
    };

    // Generate board (pass board sub-object, gameMode, config)
    LD.Board.generate(STATE.board, STATE.gameMode, STATE.config, STATE);

    // Generate challenges for Word Hunt
    if (STATE.gameMode === 'wordhunt' && LD.Challenges) {
      STATE.hunt.challenges = LD.Challenges.generate(STATE.hunt.round, STATE.config);
    }

    // Show the full board — let resize() compute tile size to fit
    STATE.viewport.cols = STATE.board.width;
    STATE.viewport.rows = STATE.board.height;
    STATE.viewport.col  = 0;
    STATE.viewport.row  = 0;

    // Re-run renderer resize to pick up new board dims
    if (LD.Renderer) LD.Renderer.init(canvas, STATE);

    // Clear particles
    if (LD.Particles && LD.Particles.clear) LD.Particles.clear();
  }

  function startGame() {
    STATE.hunt = STATE.hunt || {};
    STATE.hunt.round = 1;
    setupRound(true);
  }

  function advanceRound() {
    if (STATE.gameMode !== 'wordhunt') return;
    STATE.hunt = STATE.hunt || {};
    STATE.hunt.round = (STATE.hunt.round || 1) + 1;
    setupRound(false);
  }

  // Expose startGame for Settings module's Start button
  window.LD.Game = {
    startGame: startGame,
    advanceRound: advanceRound
  };

  function initAudio() {
    if (!audioInitialized && LD.Audio) {
      LD.Audio.init();
      audioInitialized = true;
    }
  }

  function getGameplayAdapter() {
    if (window.LD && window.LD.PointerInput) return window.LD.PointerInput;
    if (window.LD && window.LD.Touch) return window.LD.Touch;
    return null;
  }

  function initGameplayAdapter() {
    const adapter = getGameplayAdapter();
    STATE.inputAdapter = adapter;

    // Legacy compatibility flag: keep it in sync with "some gameplay adapter exists",
    // but do not use it to decide whether to initialize or render input.
    STATE.touch.enabled = !!adapter;

    if (adapter && adapter.init) {
      adapter.init(canvas, STATE);
    }

    return adapter;
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
      if (
        STATE.phase === 'victory' &&
        STATE.gameMode === 'wordhunt' &&
        STATE.hunt &&
        STATE.hunt.advanceAvailable
      ) {
        advanceRound();
        return;
      }
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
    const gameplayAdapter = STATE.inputAdapter || getGameplayAdapter();
    if (gameplayAdapter && gameplayAdapter.update) {
      gameplayAdapter.update(STATE);
    }

    // Word Hunt timed mode countdown
    if (STATE.phase === 'playing' && STATE.gameMode === 'wordhunt' &&
        STATE.settings.endCondition === 'timed' && STATE.hunt) {
      STATE.hunt.timeRemaining = Math.max(0, (STATE.hunt.timeRemaining || 0) - dt);
      if (STATE.hunt.timeRemaining <= 0) {
        STATE.phase = 'gameover';
      }
    }

    if (STATE.phase === 'playing' && STATE.gameMode === 'wordhunt' && STATE.hunt) {
      STATE.hunt.clueTimer = Math.max(0, (STATE.hunt.clueTimer || 0) - dt);
      if (STATE.hunt.clueTimer <= 0) {
        STATE.hunt.clueTiles = [];
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

    // Initialize Settings module (before Input so settings screen can respond to clicks)
    if (LD.Settings) LD.Settings.init(canvas, STATE);

    // Initialize input system
    if (LD.Input) LD.Input.init(STATE);

    // Initialize the gameplay adapter unconditionally so desktop pointer play can work.
    initGameplayAdapter();

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
