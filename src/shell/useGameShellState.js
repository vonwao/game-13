import { useSyncExternalStore } from 'react';
import {
  advanceRound,
  getShellState,
  returnToSettings,
  setGameMode,
  setSettings,
  setUIState,
  startGame,
  subscribeShell,
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
    },
  };
}
