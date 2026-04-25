const fallbackShellState = {
  phase: 'settings',
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
  coreUnsubscribe = game.subscribeShell((snap) => {
    currentSnapshot = snap;
    emit();
  });
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
    huntSummary: {
      ...currentSnapshot.huntSummary,
      round: nextRound,
      advanceAvailable: nextRound < (currentSnapshot.huntSummary.maxRounds || 3),
    },
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
  });
}

export function setShellLayout(layout) {
  // Try to attach (in case core just arrived) before forwarding.
  attachToCore();
  const game = getGameApi();
  if (game && typeof game.setShellLayout === 'function') {
    game.setShellLayout(layout);
  }
}
