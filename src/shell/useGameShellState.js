import { useSyncExternalStore } from 'react';
import {
  advanceRound,
  getShellState,
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
      startGame,
      advanceRound,
    },
  };
}
