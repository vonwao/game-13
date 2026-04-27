import { useSyncExternalStore } from 'react';
import {
  advanceRound,
  clearCurrentWord,
  getShellState,
  pauseGame,
  resumeGame,
  returnToSettings,
  setGameMode,
  setSettings,
  setUIState,
  startGame,
  submitCurrentWord,
  subscribeShell,
  undoTileSelection,
  useClue,
} from './gameBridge.js';

function normalizeShellState(state) {
  const rawPhase = state?.phase || 'settings';
  const isPaused = !!state?.isPaused || rawPhase === 'paused';
  const displayPhase = state?.displayPhase || (isPaused ? 'playing' : rawPhase);

  return {
    ...(state || {}),
    rawPhase,
    isPaused,
    displayPhase,
    phase: displayPhase,
  };
}

export default function useGameShellState() {
  const snapshot = useSyncExternalStore(subscribeShell, getShellState, getShellState);
  const state = normalizeShellState(snapshot);

  return {
    state,
    actions: {
      setUIState,
      setSettings,
      setGameMode,
      startGame,
      advanceRound,
      pauseGame,
      resumeGame,
      returnToSettings,
      clearCurrentWord,
      submitCurrentWord,
      undoTileSelection,
      useClue,
    },
  };
}
