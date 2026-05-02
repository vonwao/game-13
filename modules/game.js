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
    shellLayout: null,
    solutionPreview: null,
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
  const shellListeners = new Set();
  let lastShellSignature = '';
  let lastShellEmitAt = 0;
  const SHELL_THROTTLE_MS = 100; // ~10Hz cap for unforced notifyShellState
  const SOLUTION_MIN_LENGTH_DEFAULT = 5;
  const SOLUTION_MAX_VISIBLE_DEFAULT = 50;
  const SOLUTION_COMMON_RANK_LIMIT = 6000;
  let shellSolutionsCache = {
    signature: '',
    boardIdentity: '',
    pinnedWords: [],
    value: null,
  };
  let commonRankByWord = null;
  let resizeBound = false;
  let loopStarted = false;
  let booted = false;
  let gameplayActionsGuarded = false;

  function isShellMode() {
    return !!window.__LD_SHELL_MODE__;
  }

  function normalizeObjective(objective) {
    if (!objective) {
      return {
        id: '',
        type: '',
        title: '',
        description: '',
        target: 0,
        reward: 0,
        progress: 0,
        completed: false,
      };
    }
    return {
      id: objective.id || '',
      type: objective.type || '',
      title: objective.title || '',
      description: objective.description || '',
      target: objective.target || 0,
      reward: objective.reward || 0,
      progress: objective.progress || 0,
      completed: !!objective.completed,
    };
  }

  function normalizeDiscoveryWord(word, index) {
    if (word && typeof word === 'object') {
      return {
        word: word.word || '',
        found: word.found !== false,
        index: typeof word.index === 'number' ? word.index : (typeof index === 'number' ? index : 0),
      };
    }
    return {
      word: String(word || ''),
      found: true,
      index: typeof index === 'number' ? index : 0,
    };
  }

  function clonePath(path) {
    if (!Array.isArray(path)) return [];
    var out = [];
    for (var i = 0; i < path.length; i++) {
      var step = path[i];
      if (!step) continue;
      out.push({ col: step.col, row: step.row });
    }
    return out;
  }

  function normalizeHistoryEntry(entry) {
    entry = entry || {};
    return {
      word: entry.word || '',
      score: entry.score || 0,
      pathLength: entry.pathLength || (Array.isArray(entry.path) ? entry.path.length : 0),
      path: clonePath(entry.path),
      basePts: entry.basePts || 0,
      tilePoints: entry.tilePoints || entry.basePts || 0,
      lengthBase: entry.lengthBase || 0,
      tileBonus: entry.tileBonus || 0,
      shapeBonus: entry.shapeBonus || 0,
      crystalBonus: entry.crystalBonus || 0,
      wildcardPenalty: entry.wildcardPenalty || 0,
      wildcardCount: entry.wildcardCount || 0,
      scoreModel: entry.scoreModel || '',
      lenMult: entry.lenMult || 1,
      shapeMult: entry.shapeMult || 1,
      shapeLabel: entry.shapeLabel || '',
      corners: entry.corners || 0,
      comboCount: entry.comboCount || 0,
      comboMult: entry.comboMult || 1,
      crystalMult: entry.crystalMult || 1,
      emberBonus: entry.emberBonus || 0,
      discoveryBonus: entry.discoveryBonus || 0,
      objectiveBonus: entry.objectiveBonus || 0,
      orientation: entry.orientation || '',
      reasonText: entry.reasonText || '',
    };
  }

  function emptySolutionsState(reason) {
    return {
      ready: false,
      reason: reason || '',
      minLength: SOLUTION_MIN_LENGTH_DEFAULT,
      maxVisible: SOLUTION_MAX_VISIBLE_DEFAULT,
      total: 0,
      playable: 0,
      blocked: 0,
      planted: 0,
      organic: 0,
      visible: 0,
      items: [],
    };
  }

  function resetShellSolutionsCache() {
    shellSolutionsCache.signature = '';
    shellSolutionsCache.boardIdentity = '';
    shellSolutionsCache.pinnedWords = [];
    shellSolutionsCache.value = null;
  }

  function getCommonRankByWord() {
    if (commonRankByWord) return commonRankByWord;
    commonRankByWord = new Map();
    var ranked = window.LD && window.LD.CommonWords && Array.isArray(window.LD.CommonWords.RANKED)
      ? window.LD.CommonWords.RANKED
      : [];
    for (var i = 0; i < ranked.length; i++) {
      var word = String(ranked[i] || '').toUpperCase();
      if (word && !commonRankByWord.has(word)) commonRankByWord.set(word, i + 1);
    }
    return commonRankByWord;
  }

  function getCommonRank(word) {
    return getCommonRankByWord().get(String(word || '').toUpperCase()) || 0;
  }

  function isPlayerFacingSolution(entry) {
    if (!entry || !entry.word) return false;
    if (entry.planted) return true;
    var rank = getCommonRank(entry.word);
    return rank > 0 && rank <= SOLUTION_COMMON_RANK_LIMIT;
  }

  function buildSolutionBoardSignature(includeWear) {
    var board = STATE.board || {};
    if (!Array.isArray(board.tiles) || !board.width || !board.height) return '';

    var parts = [board.width, board.height];
    for (var i = 0; i < board.tiles.length; i++) {
      var tile = board.tiles[i] || {};
      parts.push([
        tile.letter || '',
        tile.icon || '',
        typeof tile.points === 'number' ? tile.points : '',
        tile.isSeal ? 1 : 0,
        tile.corrupted ? 1 : 0,
        includeWear ? (tile.useCount || 0) : 0,
      ].join(':'));
    }
    return parts.join('|');
  }

  function buildSolutionHistorySignature() {
    var history = STATE.wordHistory || [];
    var words = [];
    for (var i = 0; i < history.length; i++) {
      if (history[i] && history[i].word) words.push(String(history[i].word).toUpperCase());
    }
    return words.join(',');
  }

  function normalizeSolutionEntry(entry, foundSet, rank) {
    entry = entry || {};
    var word = String(entry.word || '').toUpperCase();
    return {
      id: word || ('solution-' + rank),
      rank: rank,
      word: word,
      path: clonePath(entry.path),
      score: entry.score || 0,
      length: entry.length || word.length || 0,
      commonRank: entry.commonRank || getCommonRank(word),
      playerFacing: entry.playerFacing !== false,
      playable: entry.playable !== false,
      blocked: entry.playable === false,
      found: foundSet.has(word),
      planted: !!entry.planted,
      organic: !!entry.organic,
      pathCount: entry.pathCount || 0,
      playablePathCount: entry.playablePathCount || 0,
      blockedPathCount: entry.blockedPathCount || 0,
      lengthBase: entry.lengthBase || 0,
      tileBonus: entry.tileBonus || 0,
      shapeBonus: entry.shapeBonus || 0,
      shapeLabel: entry.shapeLabel || '',
      crystalBonus: entry.crystalBonus || 0,
      emberBonus: entry.emberBonus || 0,
      wildcardPenalty: entry.wildcardPenalty || 0,
      scoreModel: entry.scoreModel || '',
    };
  }

  function getShellSolutions(history) {
    var active =
      STATE.gameMode === 'wordhunt' &&
      (STATE.phase === 'playing' || STATE.phase === 'paused' || STATE.phase === 'victory' || STATE.phase === 'gameover');

    if (!active) {
      shellSolutionsCache.signature = '';
      return emptySolutionsState('inactive');
    }

    var solver = window.LD && window.LD.Solver;
    if (!solver || typeof solver.solveBoard !== 'function') {
      return emptySolutionsState('solver unavailable');
    }

    var boardIdentity = buildSolutionBoardSignature(false);
    var wearSignature = buildSolutionBoardSignature(true);
    if (!boardIdentity || !wearSignature) return emptySolutionsState('no board');

    var historySignature = buildSolutionHistorySignature();
    var signature = [
      boardIdentity,
      wearSignature,
      historySignature,
      SOLUTION_MIN_LENGTH_DEFAULT,
      SOLUTION_MAX_VISIBLE_DEFAULT,
    ].join('||');

    if (shellSolutionsCache.signature === signature && shellSolutionsCache.value) {
      return shellSolutionsCache.value;
    }

    var solved = solver.solveBoard(STATE, {
      minLength: SOLUTION_MIN_LENGTH_DEFAULT,
      dedupeBy: 'word',
    }) || [];

    var foundSet = new Set();
    for (var h = 0; h < history.length; h++) {
      if (history[h] && history[h].word) foundSet.add(String(history[h].word).toUpperCase());
    }

    var byWord = new Map();
    var summary = {
      total: solved.length,
      playable: 0,
      blocked: 0,
      planted: 0,
      organic: 0,
      dictionaryTotal: solved.length,
      dictionaryPlayable: 0,
      playerFacingTotal: 0,
      playerFacingPlayable: 0,
      playerFacingBlocked: 0,
    };

    for (var i = 0; i < solved.length; i++) {
      var entry = solved[i];
      entry.commonRank = getCommonRank(entry.word);
      entry.playerFacing = isPlayerFacingSolution(entry);
      byWord.set(entry.word, entry);
      if (entry.playable) {
        summary.playable++;
        summary.dictionaryPlayable++;
      }
      else summary.blocked++;
      if (entry.planted) summary.planted++;
      if (entry.organic) summary.organic++;
      if (entry.playerFacing) {
        summary.playerFacingTotal++;
        if (entry.playable) summary.playerFacingPlayable++;
        else summary.playerFacingBlocked++;
      }
    }

    if (shellSolutionsCache.boardIdentity !== boardIdentity) {
      shellSolutionsCache.boardIdentity = boardIdentity;
      var playerFacing = solved.filter(function(entry) { return entry.playerFacing; });
      shellSolutionsCache.pinnedWords = [];
      var initialLookup = new Set();
      var initialSources = [playerFacing, solved];
      for (var s = 0; s < initialSources.length && shellSolutionsCache.pinnedWords.length < SOLUTION_MAX_VISIBLE_DEFAULT; s++) {
        var source = initialSources[s];
        for (var ps = 0; ps < source.length && shellSolutionsCache.pinnedWords.length < SOLUTION_MAX_VISIBLE_DEFAULT; ps++) {
          var sourceWord = source[ps].word;
          if (initialLookup.has(sourceWord)) continue;
          shellSolutionsCache.pinnedWords.push(sourceWord);
          initialLookup.add(sourceWord);
        }
      }
    }

    var pinnedLookup = new Set(shellSolutionsCache.pinnedWords);
    var refillSources = [
      solved.filter(function(entry) { return entry.playerFacing; }),
      solved,
    ];
    for (var rs = 0; rs < refillSources.length && shellSolutionsCache.pinnedWords.length < SOLUTION_MAX_VISIBLE_DEFAULT; rs++) {
      var refillSource = refillSources[rs];
      for (var j = 0; j < refillSource.length && shellSolutionsCache.pinnedWords.length < SOLUTION_MAX_VISIBLE_DEFAULT; j++) {
        var candidateWord = refillSource[j].word;
        if (!pinnedLookup.has(candidateWord)) {
          shellSolutionsCache.pinnedWords.push(candidateWord);
          pinnedLookup.add(candidateWord);
        }
      }
    }

    var items = [];
    for (var p = 0; p < shellSolutionsCache.pinnedWords.length; p++) {
      var pinnedEntry = byWord.get(shellSolutionsCache.pinnedWords[p]);
      if (pinnedEntry) items.push(normalizeSolutionEntry(pinnedEntry, foundSet, items.length + 1));
    }
    items.sort(function(a, b) {
      if (a.playable !== b.playable) return a.playable ? -1 : 1;
      return a.rank - b.rank;
    });
    for (var r = 0; r < items.length; r++) {
      items[r].rank = r + 1;
    }

    var value = {
      ready: true,
      reason: '',
      minLength: SOLUTION_MIN_LENGTH_DEFAULT,
      maxVisible: SOLUTION_MAX_VISIBLE_DEFAULT,
      total: summary.playerFacingTotal || summary.total,
      playable: summary.playerFacingTotal ? summary.playerFacingPlayable : summary.playable,
      blocked: summary.playerFacingTotal ? summary.playerFacingBlocked : summary.blocked,
      planted: summary.planted,
      organic: summary.organic,
      dictionaryTotal: summary.dictionaryTotal,
      dictionaryPlayable: summary.dictionaryPlayable,
      playerFacingTotal: summary.playerFacingTotal,
      playerFacingPlayable: summary.playerFacingPlayable,
      playerFacingBlocked: summary.playerFacingBlocked,
      commonRankLimit: SOLUTION_COMMON_RANK_LIMIT,
      visible: items.length,
      items: items,
    };

    shellSolutionsCache.signature = signature;
    shellSolutionsCache.value = value;
    return value;
  }

  function normalizeShellLayout(layout) {
    if (!layout) return null;

    if (typeof layout === 'string') {
      return {
        orientation: layout === 'portrait' ? 'portrait' : 'landscape',
      };
    }

    if (typeof layout !== 'object') return null;

    var bounds = layout.bounds || layout.rect || layout.viewport || layout.frame || layout.size || null;
    var orientation = null;
    var width = null;
    var height = null;
    var aspect = null;

    if (typeof layout.orientation === 'string') {
      orientation = layout.orientation === 'portrait' ? 'portrait' : 'landscape';
    } else if (typeof layout.orientationHint === 'string') {
      orientation = layout.orientationHint === 'portrait' ? 'portrait' : 'landscape';
    }

    if (typeof layout.width === 'number' && isFinite(layout.width)) {
      width = layout.width;
    } else if (bounds && typeof bounds.width === 'number' && isFinite(bounds.width)) {
      width = bounds.width;
    }

    if (typeof layout.height === 'number' && isFinite(layout.height)) {
      height = layout.height;
    } else if (bounds && typeof bounds.height === 'number' && isFinite(bounds.height)) {
      height = bounds.height;
    }

    if (typeof layout.aspect === 'number' && isFinite(layout.aspect)) {
      aspect = layout.aspect;
    } else if (typeof layout.aspect === 'string') {
      aspect = layout.aspect;
    } else if (width !== null && height !== null && height !== 0) {
      aspect = width / height;
    }

    if (!orientation && width !== null && height !== null) {
      orientation = width < height ? 'portrait' : 'landscape';
    }

    if (!orientation && aspect !== null && typeof aspect === 'number') {
      orientation = aspect < 1 ? 'portrait' : 'landscape';
    }

    if (!orientation && width === null && height === null && aspect === null) {
      return null;
    }

    var normalized = {};
    if (orientation) normalized.orientation = orientation;
    if (width !== null) normalized.width = width;
    if (height !== null) normalized.height = height;
    if (aspect !== null) normalized.aspect = aspect;
    return normalized;
  }

  function cloneShellLayout(layout) {
    if (!layout) return null;
    return {
      orientation: layout.orientation || 'landscape',
      width: typeof layout.width === 'number' ? layout.width : null,
      height: typeof layout.height === 'number' ? layout.height : null,
      aspect: typeof layout.aspect === 'number' ? layout.aspect : layout.aspect || null,
    };
  }

  function isPausedPhase() {
    return STATE.phase === 'paused';
  }

  function canPauseGame() {
    return STATE.phase === 'playing';
  }

  function canResumeGame() {
    return isPausedPhase();
  }

  function getHelpState() {
    const isWH = STATE.gameMode === 'wordhunt';
    return {
      open: !!STATE.showHelp,
      tab: STATE.helpTab || 'basics',
      tabs: [
        { key: 'basics', label: 'Basics' },
        { key: 'scoring', label: 'Scoring' },
        { key: 'tiles', label: 'Tiles' },
      ],
      sections: {
        basics: isWH ? [
          'Type any 4+ letter dictionary word.',
          'Click or drag tiles to spell on the board.',
          'The game picks the best-scoring path for that word.',
          'Find hidden planted words for bonus points.',
          'Clear the objectives to finish the round.',
        ] : [
          'Type a word and submit it to cast.',
          'Use words to clear corruption from the board.',
          'Destroy all seals before corruption wins.',
        ],
        scoring: [
          'length = primary score table',
          'tiles = small capped letter-point bonus',
          'shape = straight paths add points; corners subtract points',
          'special tiles = crystal and ember add small bonuses',
          'wildcards = each icon path step subtracts points',
          'discovery = planted words grant bonus points',
          'objective rewards are added after the word resolves',
        ],
        tiles: [
          'Void (?) can stand in for any letter.',
          'Crystal adds a small score bonus when routed through it.',
          'Ember adds a small score bonus when routed through it.',
          'Special tiles only count if the chosen path uses them.',
        ],
      },
      footer: 'Press ? or Escape to close',
    };
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function initCanvas(explicitCanvas) {
    canvas = explicitCanvas || document.getElementById('game');
    if (!canvas) {
      throw new Error('Lexicon Deep requires a canvas element to mount.');
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
    if (!resizeBound) {
      window.addEventListener('resize', resizeCanvas);
      resizeBound = true;
    }
  }

  function resizeCanvas() {
    const shellMode =
      isShellMode() && STATE.shellLayout && STATE.shellLayout.width && STATE.shellLayout.height;

    let displayW;
    let displayH;

    if (shellMode) {
      displayW = STATE.shellLayout.width;
      displayH = STATE.shellLayout.height;
    } else {
      const isMobileLike = window.innerWidth < 900 || window.innerHeight > window.innerWidth;
      displayW = window.innerWidth;
      displayH = window.innerHeight;

      if (!isMobileLike) {
        displayW = Math.min(displayW, 1280);
        displayH = Math.min(displayH, 720);
      }
    }

    canvas.width = Math.max(1, Math.floor(displayW));
    canvas.height = Math.max(1, Math.floor(displayH));

    if (shellMode) {
      // CSS sizes the canvas to fill the mount; we only own the pixel buffer.
      canvas.style.width = '';
      canvas.style.height = '';
    } else {
      canvas.style.width = displayW + 'px';
      canvas.style.height = displayH + 'px';
    }

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
      STATE.config = LD.Constants.resolve(STATE.gameMode, STATE.settings, STATE.shellLayout);
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
    resetShellSolutionsCache();
    STATE.solutionPreview = null;
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
    if (!booted) {
      var prestartCanvas = document.getElementById('game');
      if (prestartCanvas) boot(prestartCanvas);
    }
    STATE.hunt = STATE.hunt || {};
    STATE.hunt.round = 1;
    setupRound(true);
    notifyShellState(true);
  }

  function advanceRound() {
    if (!booted) {
      var preroundCanvas = document.getElementById('game');
      if (preroundCanvas) boot(preroundCanvas);
    }
    if (STATE.gameMode !== 'wordhunt') return;
    STATE.hunt = STATE.hunt || {};
    STATE.hunt.round = (STATE.hunt.round || 1) + 1;
    setupRound(false);
    notifyShellState(true);
  }

  function pauseGame() {
    if (!canPauseGame()) return false;
    STATE.phase = 'paused';
    notifyShellState(true);
    return true;
  }

  function resumeGame() {
    if (!canResumeGame()) return false;
    STATE.phase = 'playing';
    notifyShellState(true);
    return true;
  }

  function setGameMode(mode) {
    if (mode !== 'wordhunt' && mode !== 'siege') return;
    STATE.gameMode = mode;
    notifyShellState(true);
  }

  function setShellLayout(layout) {
    STATE.shellLayout = normalizeShellLayout(layout);
    if (canvas) {
      resizeCanvas();
    }
    notifyShellState(true);
  }

  function returnToSettings() {
    STATE.phase = 'settings';
    notifyShellState(true);
  }

  function cloneScorePreview(sp) {
    if (!sp) return null;
    return {
      basePts: sp.basePts || 0,
      tilePoints: sp.tilePoints || sp.basePts || 0,
      lengthBase: sp.lengthBase || 0,
      tileBonus: sp.tileBonus || 0,
      shapeBonus: sp.shapeBonus || 0,
      crystalBonus: sp.crystalBonus || 0,
      wildcardPenalty: sp.wildcardPenalty || 0,
      wildcardCount: sp.wildcardCount || 0,
      scoreModel: sp.scoreModel || '',
      lenMult: sp.lenMult || 1,
      shapeMult: sp.shapeMult || 1,
      shapeLabel: sp.shapeLabel || '',
      comboCount: sp.comboCount || 0,
      comboMult: sp.comboMult || 1,
      crystalMult: sp.crystalMult || 1,
      emberBonus: sp.emberBonus || 0,
      total: sp.total || 0,
      corners: sp.corners || 0,
    };
  }

  function getShellState() {
    const hunt = STATE.hunt || {};
    const input = STATE.input || {};
    const debug = STATE.debug || {};
    const objectives = (hunt.challenges || []).map(normalizeObjective);
    const discoveries = (hunt.discoveredWords || []).map(normalizeDiscoveryWord);
    const history = (STATE.wordHistory || []).map(normalizeHistoryEntry);
    const solutions = getShellSolutions(history);
    return {
      phase: STATE.phase,
      displayPhase: isPausedPhase() ? 'playing' : STATE.phase,
      isPaused: isPausedPhase(),
      shellMode: isShellMode(),
      gameMode: STATE.gameMode,
      shellLayout: cloneShellLayout(STATE.shellLayout),
      settings: {
        difficulty: STATE.settings.difficulty,
        boardSize: STATE.settings.boardSize,
        soundEnabled: !!STATE.settings.soundEnabled,
        particlesEnabled: !!STATE.settings.particlesEnabled,
        specialTiles: !!STATE.settings.specialTiles,
        endCondition: STATE.settings.endCondition,
      },
      ui: {
        showHelp: !!STATE.showHelp,
        helpTab: STATE.helpTab || 'basics',
        debug: {
          enabled: !!debug.enabled,
          tab: debug.tab || 'planted',
        },
      },
      help: getHelpState(),
      run: {
        score: STATE.score || 0,
        wordsSpelled: STATE.wordsSpelled || 0,
        longestWord: STATE.longestWord || '',
        turns: STATE.turns || 0,
        seedsDestroyed: STATE.seedsDestroyed || 0,
        totalSeeds: STATE.totalSeeds || 0,
      },
      huntSummary: {
        round: hunt.round || 1,
        maxRounds: hunt.maxRounds || 3,
        roundTitle: hunt.roundTitle || '',
        timeRemaining: Math.max(0, Math.ceil(hunt.timeRemaining || 0)),
        turnsRemaining: hunt.turnsRemaining || 0,
        cluesRemaining: hunt.cluesRemaining || 0,
        combo: hunt.combo || 0,
        bestCombo: hunt.bestCombo || 0,
        completedCount: hunt.completedCount || 0,
        advanceAvailable: !!hunt.advanceAvailable,
      },
      objectives: {
        total: objectives.length,
        completed: hunt.completedCount || 0,
        items: objectives,
      },
      discoveries: {
        total: (hunt.plantedWords || []).length,
        found: (hunt.plantedWords || []).filter(function(p) { return p.found; }).length,
        recent: discoveries.slice(-4).reverse(),
        items: discoveries,
      },
      solutions: solutions,
      solutionPreview: STATE.solutionPreview ? {
        word: STATE.solutionPreview.word,
        score: STATE.solutionPreview.score,
        mode: STATE.solutionPreview.mode,
        blocked: !!STATE.solutionPreview.blocked,
        pathLength: STATE.solutionPreview.path.length,
        tilesRevealed: STATE.solutionPreview.tilesRevealed,
        caption: STATE.solutionPreview.caption || '',
        sequence: STATE.solutionPreview.sequence ? {
          tag: STATE.solutionPreview.sequence.tag || '',
          currentIndex: STATE.solutionPreview.sequence.currentIndex || 0,
          total: STATE.solutionPreview.sequence.items.length,
        } : null,
      } : null,
      inputSummary: {
        typed: input.typed || '',
        valid: !!input.valid,
        hasPath: !!input.hasPath,
        pathAmbiguous: !!input.pathAmbiguous,
        pathCandidateCount: input.pathCandidateCount || 0,
        scorePreview: cloneScorePreview(input.scorePreview),
      },
      history: {
        total: history.length,
        items: history,
        recent: history.slice(-6).reverse(),
      },
      wordHistory: history,
    };
  }

  // Throttle: unforced calls (per-frame from gameLoop) skipped if <100ms since last emit;
  // explicit mutators pass force=true and always emit through the dedupe.
  function notifyShellState(force) {
    if (!force) {
      var now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
      if (now - lastShellEmitAt < SHELL_THROTTLE_MS) return;
      lastShellEmitAt = now;
    } else {
      lastShellEmitAt = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
    }
    const snapshot = getShellState();
    const signature = JSON.stringify(snapshot);
    if (!force && signature === lastShellSignature) return;
    lastShellSignature = signature;
    shellListeners.forEach(function(listener) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Shell listener error:', err);
      }
    });
  }

  function subscribeShell(listener) {
    if (typeof listener !== 'function') {
      throw new Error('subscribeShell(listener) requires a function');
    }
    shellListeners.add(listener);
    listener(getShellState());
    return function unsubscribeShell() {
      shellListeners.delete(listener);
    };
  }

  function setUIState(patch) {
    if (!patch || typeof patch !== 'object') return;

    if (Object.prototype.hasOwnProperty.call(patch, 'showHelp')) {
      STATE.showHelp = !!patch.showHelp;
      if (STATE.showHelp) {
        STATE.debug = STATE.debug || {};
        STATE.debug.enabled = false;
      }
    }

    if (typeof patch.helpTab === 'string') {
      STATE.helpTab = patch.helpTab;
    }

    if (patch.debug && typeof patch.debug === 'object') {
      STATE.debug = STATE.debug || {};
      if (Object.prototype.hasOwnProperty.call(patch.debug, 'enabled')) {
        STATE.debug.enabled = !!patch.debug.enabled;
        if (STATE.debug.enabled) STATE.showHelp = false;
      }
      if (typeof patch.debug.tab === 'string') {
        STATE.debug.tab = patch.debug.tab;
      }
    }

    notifyShellState(true);
  }

  // ── Solution preview ────────────────────────────────────────────────────────
  // The shell sends a chosen solution (from the Solutions surface or a Run
  // Complete replay) and the renderer paints it as an overlay on the board.
  // Trace mode advances `tilesRevealed` per-frame from the game loop. A
  // sequence ({ items, currentIndex }) chains traces so Run Complete can
  // auto-replay the player's top words back-to-back.
  const TRACE_TILE_SECONDS = 0.08;
  const TRACE_HOLD_SECONDS = 0.7;
  const TRACE_SEQUENCE_GAP_SECONDS = 0.35;

  function getNowSeconds() {
    return STATE.time || 0;
  }

  function buildPreviewEntry(solution, mode) {
    if (!solution || !Array.isArray(solution.path) || solution.path.length === 0) return null;
    return {
      word: String(solution.word || '').toUpperCase(),
      score: typeof solution.score === 'number' ? solution.score : null,
      path: clonePath(solution.path),
      mode: mode === 'trace' ? 'trace' : 'static',
      blocked: !!solution.blocked,
      startedAt: getNowSeconds(),
      tilesRevealed: mode === 'trace' ? 0 : (solution.path ? solution.path.length : 0),
      caption: solution.caption || '',
      sequence: null,
    };
  }

  function previewSolution(solution, options) {
    options = options || {};
    var mode = options.mode === 'trace' ? 'trace' : 'static';
    var preview = buildPreviewEntry(solution, mode);
    if (!preview) {
      clearSolutionPreview();
      return;
    }
    STATE.solutionPreview = preview;
    notifyShellState(true);
  }

  function playSolutionSequence(items, options) {
    options = options || {};
    var validItems = (items || []).filter(function(item) {
      return item && Array.isArray(item.path) && item.path.length > 0;
    });
    if (!validItems.length) {
      clearSolutionPreview();
      return;
    }
    var first = validItems[0];
    var preview = buildPreviewEntry(first, 'trace');
    if (!preview) {
      clearSolutionPreview();
      return;
    }
    preview.sequence = {
      items: validItems.map(function(item) {
        return {
          word: String(item.word || '').toUpperCase(),
          score: typeof item.score === 'number' ? item.score : null,
          path: clonePath(item.path),
          caption: item.caption || '',
          blocked: !!item.blocked,
        };
      }),
      currentIndex: 0,
      tag: options.tag || '',
    };
    STATE.solutionPreview = preview;
    notifyShellState(true);
  }

  function clearSolutionPreview() {
    if (!STATE.solutionPreview) return;
    STATE.solutionPreview = null;
    notifyShellState(true);
  }

  function advanceSolutionSequence(preview) {
    var seq = preview.sequence;
    if (!seq) return false;
    var nextIndex = (seq.currentIndex || 0) + 1;
    if (nextIndex >= seq.items.length) return false;
    var nextItem = seq.items[nextIndex];
    var carry = seq;
    var nextPreview = buildPreviewEntry(nextItem, 'trace');
    if (!nextPreview) return false;
    nextPreview.startedAt = getNowSeconds() + TRACE_SEQUENCE_GAP_SECONDS;
    nextPreview.sequence = {
      items: carry.items,
      currentIndex: nextIndex,
      tag: carry.tag || '',
    };
    STATE.solutionPreview = nextPreview;
    notifyShellState(true);
    return true;
  }

  function tickSolutionPreview() {
    var preview = STATE.solutionPreview;
    if (!preview) return;
    var totalTiles = preview.path.length;
    if (preview.mode !== 'trace' || totalTiles === 0) return;
    var elapsed = getNowSeconds() - (preview.startedAt || 0);
    if (elapsed < 0) {
      // Holding before sequence trace begins.
      if (preview.tilesRevealed !== 0) {
        preview.tilesRevealed = 0;
        notifyShellState(true);
      }
      return;
    }
    var revealed = Math.min(totalTiles, Math.floor(elapsed / TRACE_TILE_SECONDS) + 1);
    if (revealed !== preview.tilesRevealed) {
      preview.tilesRevealed = revealed;
      notifyShellState(true);
    }
    if (revealed >= totalTiles) {
      var holdSince = elapsed - totalTiles * TRACE_TILE_SECONDS;
      if (holdSince >= TRACE_HOLD_SECONDS) {
        if (!advanceSolutionSequence(preview)) {
          clearSolutionPreview();
        }
      }
    }
  }

  function getTopRunWords(limit) {
    var items = (STATE.wordHistory || []).filter(function(entry) {
      return entry && Array.isArray(entry.path) && entry.path.length > 0;
    });
    items.sort(function(a, b) {
      return (b.score || 0) - (a.score || 0);
    });
    return items.slice(0, limit).map(function(entry) {
      return {
        word: entry.word,
        score: entry.score,
        path: entry.path,
        caption: (entry.word || '') + (entry.score ? ' · ' + entry.score + ' pts' : ''),
        blocked: false,
      };
    });
  }

  function playRunCompleteReplays() {
    var top = getTopRunWords(3);
    if (!top.length) {
      clearSolutionPreview();
      return false;
    }
    playSolutionSequence(top, { tag: 'run-complete' });
    return true;
  }

  function setSettings(patch) {
    if (!patch || typeof patch !== 'object') return;
    const allowed = ['difficulty', 'boardSize', 'soundEnabled', 'particlesEnabled', 'specialTiles', 'endCondition'];
    for (let i = 0; i < allowed.length; i++) {
      const key = allowed[i];
      if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
      STATE.settings[key] = patch[key];
    }
    notifyShellState(true);
  }

  function installPhaseAwareActionGuards() {
    if (gameplayActionsGuarded) return;
    if (!window.LD || !window.LD.Actions) return;

    var actions = window.LD.Actions;
    var guardedActions = [
      'startPath',
      'extendPath',
      'trimPathTo',
      'restartPath',
      'tapTile',
      'undoTileSelection',
      'clearCurrentWord',
      'submitCurrentWord',
      'rejectCurrentWord',
      'useClue',
      'appendLetter',
      'backspaceLetter',
      'scrollBoard',
    ];

    guardedActions.forEach(function(name) {
      if (typeof actions[name] !== 'function') return;
      var original = actions[name];
      actions[name] = function guardedGameplayAction() {
        if (isPausedPhase()) return false;
        return original.apply(this, arguments);
      };
    });

    gameplayActionsGuarded = true;
  }

  // Public shell/game bridge
  window.LD.Game = {
    startGame: startGame,
    advanceRound: advanceRound,
    pauseGame: pauseGame,
    resumeGame: resumeGame,
    setGameMode: setGameMode,
    setShellLayout: setShellLayout,
    returnToSettings: returnToSettings,
    getShellState: getShellState,
    subscribeShell: subscribeShell,
    setUIState: setUIState,
    setSettings: setSettings,
    previewSolution: previewSolution,
    clearSolutionPreview: clearSolutionPreview,
    playRunCompleteReplays: playRunCompleteReplays,
    mount: boot,
    isBooted: function() { return booted; },
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

    if (isShellMode() && (STATE.phase === 'title' || STATE.phase === 'settings')) {
      return;
    }

    if (STATE.phase === 'title' && e.key === 'Enter') {
      e.preventDefault();
      e.stopImmediatePropagation();
      STATE.phase = 'settings';
      notifyShellState(true);
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
      notifyShellState(true);
      return;
    }
  }, true); // capture phase — fires before input.js

  // Also init audio on click (for mobile/browser policy)
  window.addEventListener('click', function() {
    initAudio();
    if (!isShellMode() && STATE.phase === 'title') {
      STATE.phase = 'settings';
      notifyShellState(true);
    }
  }, { once: false });

  // ── Render loop ────────────────────────────────────────────────────────────

  function gameLoop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016;
    const paused = isPausedPhase();
    const activeDt = paused ? 0 : dt;
    lastTime = timestamp;

    STATE.time += activeDt;
    STATE.dt = activeDt;

    // Update systems
    if (!paused && LD.Particles) LD.Particles.update(activeDt);
    const gameplayAdapter = STATE.inputAdapter || getGameplayAdapter();
    if (!paused && gameplayAdapter && gameplayAdapter.update) {
      gameplayAdapter.update(STATE);
    }

    // Word Hunt timed mode countdown
    if (!paused && STATE.phase === 'playing' && STATE.gameMode === 'wordhunt' &&
        STATE.settings.endCondition === 'timed' && STATE.hunt) {
      STATE.hunt.timeRemaining = Math.max(0, (STATE.hunt.timeRemaining || 0) - activeDt);
      if (STATE.hunt.timeRemaining <= 0) {
        STATE.phase = 'gameover';
      }
    }

    tickSolutionPreview();

    notifyShellState(false);

    if (!paused && STATE.phase === 'playing' && STATE.gameMode === 'wordhunt' && STATE.hunt) {
      STATE.hunt.clueTimer = Math.max(0, (STATE.hunt.clueTimer || 0) - activeDt);
      if (STATE.hunt.clueTimer <= 0) {
        STATE.hunt.clueTiles = [];
      }
    }

    if (LD.Renderer) {
      LD.Renderer.updateScroll(activeDt, STATE);
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
    var explicitCanvas = arguments.length > 0 ? arguments[0] : null;

    if (booted) {
      if (explicitCanvas && canvas !== explicitCanvas) {
        initCanvas(explicitCanvas);
      }
      notifyShellState(true);
      return window.LD.Game;
    }

    if (explicitCanvas) {
      window.__LD_SHELL_MODE__ = true;
    }

    initCanvas(explicitCanvas);
    booted = true;

    installPhaseAwareActionGuards();

    // Initialize Settings module (before Input so settings screen can respond to clicks)
    if (LD.Settings && !isShellMode()) LD.Settings.init(canvas, STATE);

    // Initialize input system
    if (LD.Input) LD.Input.init(STATE);

    // Initialize the gameplay adapter unconditionally so desktop pointer play can work.
    initGameplayAdapter();

    // Start in settings phase
    STATE.phase = 'settings';
    notifyShellState(true);

    // Start render loop
    if (!loopStarted) {
      loopStarted = true;
      requestAnimationFrame(gameLoop);
    }

    return window.LD.Game;
  }

  if (!window.__LD_DISABLE_AUTO_BOOT__) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { boot(); });
    } else {
      boot();
    }
  }
})();
