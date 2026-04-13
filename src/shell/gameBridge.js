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
  wordHistory: [],
};

let localShellState = cloneFallbackState();
const localListeners = new Set();

function getGameApi() {
  if (typeof window === 'undefined' || !window.LD || !window.LD.Game) {
    return null;
  }
  return window.LD.Game;
}

function cloneFallbackState() {
  return JSON.parse(JSON.stringify(fallbackShellState));
}

function emitLocal() {
  localListeners.forEach((listener) => {
    listener(localShellState);
  });
}

function patchLocalShellState(patch) {
  localShellState = {
    ...localShellState,
    ...patch,
  };
  emitLocal();
}

export function getShellState() {
  const game = getGameApi();
  if (game && typeof game.getShellState === 'function') {
    return game.getShellState();
  }
  return localShellState;
}

export function subscribeShell(listener) {
  const game = getGameApi();
  if (game && typeof game.subscribeShell === 'function') {
    return game.subscribeShell(listener);
  }
  localListeners.add(listener);
  listener(localShellState);
  return () => {
    localListeners.delete(listener);
  };
}

export function setUIState(patch) {
  const game = getGameApi();
  if (game && typeof game.setUIState === 'function') {
    game.setUIState(patch);
    return;
  }

  patchLocalShellState({
    ui: {
      ...localShellState.ui,
      ...patch,
      debug: patch && patch.debug
        ? {
            ...localShellState.ui.debug,
            ...patch.debug,
          }
        : localShellState.ui.debug,
    },
  });
}

export function setSettings(patch) {
  const game = getGameApi();
  if (game && typeof game.setSettings === 'function') {
    game.setSettings(patch);
    return;
  }

  patchLocalShellState({
    settings: {
      ...localShellState.settings,
      ...patch,
    },
  });
}

export function startGame() {
  const game = getGameApi();
  if (game && typeof game.startGame === 'function') {
    game.startGame();
    return;
  }

  patchLocalShellState({
    phase: 'playing',
    ui: {
      ...localShellState.ui,
      showHelp: false,
    },
  });
}

export function advanceRound() {
  const game = getGameApi();
  if (game && typeof game.advanceRound === 'function') {
    game.advanceRound();
    return;
  }

  const nextRound = Math.min(
    (localShellState.huntSummary.round || 1) + 1,
    localShellState.huntSummary.maxRounds || 3
  );

  patchLocalShellState({
    phase: 'playing',
    huntSummary: {
      ...localShellState.huntSummary,
      round: nextRound,
      advanceAvailable: nextRound < (localShellState.huntSummary.maxRounds || 3),
    },
  });
}
