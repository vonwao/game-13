import { useSyncExternalStore } from 'react';
import {
  advanceRound,
  clearCurrentWord,
  getShellState,
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

export default function useGameShellState() {
  const state = useSyncExternalStore(subscribeShell, getShellState, getShellState);

  return {
    state,
    actions: {
      setUIState,
      setSettings,
      setGameMode,
      startGame,
      advanceRound,
      returnToSettings,
      clearCurrentWord,
      submitCurrentWord,
      undoTileSelection,
      useClue,
    },
  };
}
