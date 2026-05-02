const fallbackShellState = {
  phase: 'settings',
  displayPhase: 'settings',
  isPaused: false,
  gameMode: 'wordhunt',
  settings: {
    difficulty: 'easy',
    boardSize: 'small',
    soundEnabled: true,
    particlesEnabled: true,
    specialTiles: false,
    endCondition: 'challenges',
  },
  ui: {
    showHelp: false,
    helpTab: 'basics',
    debug: {
      enabled: false,
      tab: 'planted',
    },
  },
  help: {
    open: false,
    tab: 'basics',
    tabs: [
      { key: 'basics', label: 'Basics' },
      { key: 'scoring', label: 'Scoring' },
      { key: 'tiles', label: 'Tiles' },
    ],
    sections: {
      basics: [],
      scoring: [],
      tiles: [],
    },
    footer: '',
  },
  run: {
    score: 0,
    wordsSpelled: 0,
    longestWord: '',
    turns: 0,
    seedsDestroyed: 0,
    totalSeeds: 0,
  },
  huntSummary: {
    round: 1,
    maxRounds: 3,
    roundTitle: 'The First Page',
    timeRemaining: 0,
    turnsRemaining: 0,
    cluesRemaining: 0,
    combo: 0,
    bestCombo: 0,
    completedCount: 0,
    advanceAvailable: false,
  },
  inputSummary: {
    typed: '',
    valid: false,
    hasPath: false,
    pathAmbiguous: false,
    pathCandidateCount: 0,
    scorePreview: null,
  },
  objectives: {
    total: 0,
    completed: 0,
    items: [],
  },
  discoveries: {
    total: 0,
    found: 0,
    recent: [],
    items: [],
  },
  solutions: {
    ready: false,
    reason: 'inactive',
    minLength: 5,
    maxVisible: 50,
    total: 0,
    playable: 0,
    blocked: 0,
    planted: 0,
    organic: 0,
    visible: 0,
    items: [],
  },
  solutionPreview: null,
  history: {
    total: 0,
    items: [],
    recent: [],
  },
  wordHistory: [],
};

function cloneFallbackState() {
  return JSON.parse(JSON.stringify(fallbackShellState));
}

// Single stable listener set. React subscribes here; the bridge pumps snapshots
// from the legacy core (when available) or from the local fallback writes.
const listeners = new Set();
let currentSnapshot = cloneFallbackState();
let coreUnsubscribe = null;
let attached = false;
// Remember the most recent layout the shell pushed before the core was attached
// so we can replay it as soon as the core arrives. Without this, the canvas
// boots at window-fallback dimensions and only corrects on the next resize.
let pendingShellLayout = null;

function getGameApi() {
  if (typeof window === 'undefined' || !window.LD || !window.LD.Game) {
    return null;
  }
  return window.LD.Game;
}

function emit() {
  listeners.forEach((listener) => {
    try {
      listener(currentSnapshot);
    } catch (err) {
      console.error('Shell bridge listener error:', err);
    }
  });
}

function attachToCore() {
  if (attached) return true;
  const game = getGameApi();
  if (!game || typeof game.subscribeShell !== 'function') return false;

  attached = true;
  if (import.meta?.env?.DEV) {
    console.info('[bridge] attached to legacy core; first snapshot pumping into shell');
  }
  coreUnsubscribe = game.subscribeShell((snap) => {
    currentSnapshot = snap;
    emit();
  });
  if (pendingShellLayout && typeof game.setShellLayout === 'function') {
    game.setShellLayout(pendingShellLayout);
    pendingShellLayout = null;
  }
  return true;
}

function tryAttachSoon() {
  if (attached) return;
  if (typeof window === 'undefined') return;
  if (attachToCore()) return;
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => {
      attachToCore();
    });
  }
}

// Hook for loadLegacyCore.js to call once scripts have loaded.
export function notifyCoreReady() {
  attachToCore();
}

function patchLocalSnapshot(patch) {
  currentSnapshot = {
    ...currentSnapshot,
    ...patch,
  };
  emit();
}

export function getShellState() {
  return currentSnapshot;
}

export function subscribeShell(listener) {
  listeners.add(listener);
  // Opportunistically attach if the core is now available.
  tryAttachSoon();
  listener(currentSnapshot);
  return () => {
    listeners.delete(listener);
  };
}

export function setUIState(patch) {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.setUIState === 'function') {
      game.setUIState(patch);
      return;
    }
  }

  patchLocalSnapshot({
    ui: {
      ...currentSnapshot.ui,
      ...patch,
      debug: patch && patch.debug
        ? {
            ...currentSnapshot.ui.debug,
            ...patch.debug,
          }
        : currentSnapshot.ui.debug,
    },
    help: {
      ...currentSnapshot.help,
      open: Object.prototype.hasOwnProperty.call(patch || {}, 'showHelp')
        ? !!patch.showHelp
        : currentSnapshot.help.open,
      tab: typeof patch?.helpTab === 'string' ? patch.helpTab : currentSnapshot.help.tab,
    },
  });
}

export function setSettings(patch) {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.setSettings === 'function') {
      game.setSettings(patch);
      return;
    }
  }

  patchLocalSnapshot({
    settings: {
      ...currentSnapshot.settings,
      ...patch,
    },
  });
}

export function startGame() {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.startGame === 'function') {
      game.startGame();
      return;
    }
  }

  patchLocalSnapshot({
    phase: 'playing',
    displayPhase: 'playing',
    isPaused: false,
    ui: {
      ...currentSnapshot.ui,
      showHelp: false,
    },
    help: {
      ...currentSnapshot.help,
      open: false,
    },
  });
}

export function advanceRound() {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.advanceRound === 'function') {
      game.advanceRound();
      return;
    }
  }

  const nextRound = Math.min(
    (currentSnapshot.huntSummary.round || 1) + 1,
    currentSnapshot.huntSummary.maxRounds || 3
  );

  patchLocalSnapshot({
    phase: 'playing',
    displayPhase: 'playing',
    isPaused: false,
    huntSummary: {
      ...currentSnapshot.huntSummary,
      round: nextRound,
      advanceAvailable: nextRound < (currentSnapshot.huntSummary.maxRounds || 3),
    },
  });
}

export function pauseGame() {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.pauseGame === 'function') {
      game.pauseGame();
      return;
    }
  }

  if (currentSnapshot.phase !== 'playing') return;

  patchLocalSnapshot({
    phase: 'paused',
    displayPhase: 'playing',
    isPaused: true,
  });
}

export function resumeGame() {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.resumeGame === 'function') {
      game.resumeGame();
      return;
    }
  }

  if (currentSnapshot.phase !== 'paused') return;

  patchLocalSnapshot({
    phase: 'playing',
    displayPhase: 'playing',
    isPaused: false,
  });
}

export function setGameMode(mode) {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.setGameMode === 'function') {
      game.setGameMode(mode);
      return;
    }
  }

  patchLocalSnapshot({
    gameMode: mode,
  });
}

export function returnToSettings() {
  if (attachToCore()) {
    const game = getGameApi();
    if (game && typeof game.returnToSettings === 'function') {
      game.returnToSettings();
      return;
    }
  }

  patchLocalSnapshot({
    phase: 'settings',
    displayPhase: 'settings',
    isPaused: false,
  });
}

function getActionsApi() {
  if (typeof window === 'undefined' || !window.LD || !window.LD.Actions) {
    return null;
  }
  return window.LD.Actions;
}

function gameplayBlocked() {
  return currentSnapshot.phase === 'paused' || !!currentSnapshot.isPaused;
}

export function clearCurrentWord() {
  if (gameplayBlocked()) return;
  const api = getActionsApi();
  if (api && typeof api.clearCurrentWord === 'function') {
    api.clearCurrentWord();
  }
}

export function submitCurrentWord() {
  if (gameplayBlocked()) return;
  const api = getActionsApi();
  if (api && typeof api.submitCurrentWord === 'function') {
    api.submitCurrentWord();
  }
}

export function undoTileSelection() {
  if (gameplayBlocked()) return;
  const api = getActionsApi();
  if (api && typeof api.undoTileSelection === 'function') {
    api.undoTileSelection();
  }
}

export function useClue() {
  if (gameplayBlocked()) return;
  const api = getActionsApi();
  if (api && typeof api.useClue === 'function') {
    api.useClue();
  }
}

export function previewSolution(solution, options) {
  const game = getGameApi();
  if (game && typeof game.previewSolution === 'function') {
    game.previewSolution(solution, options || {});
    return;
  }
  patchLocalSnapshot({
    solutionPreview: solution
      ? {
          word: String(solution.word || '').toUpperCase(),
          score: typeof solution.score === 'number' ? solution.score : null,
          mode: options && options.mode === 'trace' ? 'trace' : 'static',
          blocked: !!solution.blocked,
          pathLength: Array.isArray(solution.path) ? solution.path.length : 0,
          tilesRevealed: options && options.mode === 'trace' ? 0 : (Array.isArray(solution.path) ? solution.path.length : 0),
          caption: solution.caption || '',
          sequence: null,
        }
      : null,
  });
}

export function clearSolutionPreview() {
  const game = getGameApi();
  if (game && typeof game.clearSolutionPreview === 'function') {
    game.clearSolutionPreview();
    return;
  }
  patchLocalSnapshot({ solutionPreview: null });
}

export function playRunCompleteReplays() {
  const game = getGameApi();
  if (game && typeof game.playRunCompleteReplays === 'function') {
    return !!game.playRunCompleteReplays();
  }
  return false;
}

export function setShellLayout(layout) {
  // Try to attach (in case core just arrived) before forwarding.
  attachToCore();
  const game = getGameApi();
  if (game && typeof game.setShellLayout === 'function') {
    game.setShellLayout(layout);
    pendingShellLayout = null;
    return;
  }
  // Core not ready yet — remember the latest layout so attachToCore can replay it.
  pendingShellLayout = layout;
}
