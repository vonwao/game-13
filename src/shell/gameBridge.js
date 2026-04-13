const DEFAULT_SETTINGS = {
  difficulty: 'easy',
  boardSize: 'small',
  soundEnabled: true,
  particlesEnabled: true,
  specialTiles: false,
  endCondition: 'challenges',
};

const DEFAULT_UI = {
  showHelp: false,
  helpTab: 'basics',
  debug: {
    enabled: false,
    tab: 'planted',
  },
};

const DEFAULT_RUN = {
  score: 0,
  wordsSpelled: 0,
  longestWord: '',
  turns: 0,
  seedsDestroyed: 0,
  totalSeeds: 6,
};

const DEFAULT_HUNT = {
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
};

const DEFAULT_INPUT = {
  typed: '',
  valid: false,
  hasPath: false,
  scorePreview: null,
};

function createShellState() {
  return {
    phase: 'title',
    gameMode: 'wordhunt',
    settings: { ...DEFAULT_SETTINGS },
    ui: { ...DEFAULT_UI, debug: { ...DEFAULT_UI.debug } },
    run: { ...DEFAULT_RUN },
    huntSummary: { ...DEFAULT_HUNT },
    inputSummary: { ...DEFAULT_INPUT },
    wordHistory: [],
  };
}

function cloneWordHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({ ...entry }));
}

function normalizeCoreState(raw) {
  if (!raw || typeof raw !== 'object') {
    return createShellState();
  }

  const hunt = raw.hunt || {};
  const input = raw.input || {};
  const history = Array.isArray(raw.wordHistory)
    ? raw.wordHistory
    : Array.isArray(hunt.wordsThisRound)
      ? hunt.wordsThisRound
      : [];

  return {
    phase: raw.phase || 'title',
    gameMode: raw.gameMode || 'wordhunt',
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings || {}),
    },
    ui: {
      showHelp: !!raw.showHelp,
      helpTab: raw.helpTab || 'basics',
      debug: {
        enabled: !!(raw.debug && raw.debug.enabled),
        tab: (raw.debug && raw.debug.tab) || 'planted',
      },
    },
    run: {
      score: raw.score || 0,
      wordsSpelled: raw.wordsSpelled || 0,
      longestWord: raw.longestWord || '',
      turns: raw.turns || 0,
      seedsDestroyed: raw.seedsDestroyed || 0,
      totalSeeds: raw.totalSeeds || 6,
    },
    huntSummary: {
      ...DEFAULT_HUNT,
      round: hunt.round || 1,
      maxRounds: hunt.maxRounds || 3,
      roundTitle: hunt.roundTitle || DEFAULT_HUNT.roundTitle,
      timeRemaining: hunt.timeRemaining || 0,
      turnsRemaining: hunt.turnsRemaining || 0,
      cluesRemaining: hunt.cluesRemaining || 0,
      combo: hunt.combo || 0,
      bestCombo: hunt.bestCombo || 0,
      completedCount: hunt.completedCount || 0,
      advanceAvailable: !!hunt.advanceAvailable,
    },
    inputSummary: {
      typed: input.typed || '',
      valid: !!input.valid,
      hasPath: !!input.hasPath,
      scorePreview: input.scorePreview || null,
    },
    wordHistory: cloneWordHistory(history),
  };
}

let shellState = createShellState();
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => {
    listener(shellState);
  });
}

function updateShellState(nextState) {
  shellState = nextState;
  emit();
}

function patchShellState(patch) {
  updateShellState({
    ...shellState,
    ...patch,
  });
}

function localGetShellState() {
  return shellState;
}

function localSubscribeShell(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function localSetUIState(patch) {
  patchShellState({
    ui: {
      ...shellState.ui,
      ...patch,
      debug: patch && patch.debug
        ? {
            ...shellState.ui.debug,
            ...patch.debug,
          }
        : shellState.ui.debug,
    },
  });
}

function localSetSettings(patch) {
  patchShellState({
    settings: {
      ...shellState.settings,
      ...patch,
    },
  });
}

function localStartGame() {
  patchShellState({
    phase: 'playing',
    ui: {
      ...shellState.ui,
      showHelp: false,
    },
  });
}

function localAdvanceRound() {
  const nextRound = Math.min(
    (shellState.huntSummary.round || 1) + 1,
    shellState.huntSummary.maxRounds || 3
  );

  patchShellState({
    phase: 'playing',
    huntSummary: {
      ...shellState.huntSummary,
      round: nextRound,
      advanceAvailable: nextRound < (shellState.huntSummary.maxRounds || 3),
    },
  });
}

const localGameApi = {
  getShellState: localGetShellState,
  subscribeShell: localSubscribeShell,
  setUIState: localSetUIState,
  setSettings: localSetSettings,
  startGame: localStartGame,
  advanceRound: localAdvanceRound,
};

function hasGameContract(api) {
  return !!api
    && typeof api.getShellState === 'function'
    && typeof api.subscribeShell === 'function'
    && typeof api.setUIState === 'function'
    && typeof api.setSettings === 'function'
    && typeof api.startGame === 'function'
    && typeof api.advanceRound === 'function';
}

function resolveGameApi() {
  if (typeof window === 'undefined') {
    return localGameApi;
  }

  window.LD = window.LD || {};
  if (!hasGameContract(window.LD.Game)) {
    window.LD.Game = localGameApi;
  }

  return hasGameContract(window.LD.Game) ? window.LD.Game : localGameApi;
}

export function getShellState() {
  return resolveGameApi().getShellState();
}

export function subscribeShell(listener) {
  return resolveGameApi().subscribeShell(listener);
}

export function setUIState(patch) {
  return resolveGameApi().setUIState(patch);
}

export function setSettings(patch) {
  return resolveGameApi().setSettings(patch);
}

export function startGame() {
  return resolveGameApi().startGame();
}

export function advanceRound() {
  return resolveGameApi().advanceRound();
}

// README: the shell uses the public LD.Game contract and falls back to a local
// no-op state store only when the core bridge is not present yet.
