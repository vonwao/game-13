import { useCallback } from 'react';
import {
  clearSolutionPreview,
  previewSolution,
} from './gameBridge.js';

// Single source of truth for which Solutions row is currently selected on the
// board: the legacy core's `solutionPreview` snapshot. The shell never holds
// its own copy — clicking a row pushes the path into the core, which echoes
// back through the bridge and lights up the row again. That keeps Run Complete
// auto-replays and Solutions clicks coherent without juggling two stores.
export default function useSolutionPreview(state) {
  const preview = state && state.solutionPreview;
  const previewWord = preview && preview.word ? preview.word : null;
  const isTrace = !!preview && preview.mode === 'trace';

  const selectSolution = useCallback(
    (entry) => {
      if (!entry || !Array.isArray(entry.path) || entry.path.length === 0) {
        clearSolutionPreview();
        return;
      }
      const sameStatic = previewWord === entry.word && !isTrace;
      if (sameStatic) {
        clearSolutionPreview();
        return;
      }
      previewSolution(entry, { mode: 'static' });
    },
    [previewWord, isTrace],
  );

  const traceSolution = useCallback(
    (entry) => {
      if (!entry || !Array.isArray(entry.path) || entry.path.length === 0) return;
      previewSolution(entry, { mode: 'trace' });
    },
    [],
  );

  const clear = useCallback(() => clearSolutionPreview(), []);

  const selectedId = previewWord
    ? (state.solutions && Array.isArray(state.solutions.items)
        ? (state.solutions.items.find((item) => item.word === previewWord)?.id || previewWord)
        : previewWord)
    : null;
  const tracingId = isTrace ? selectedId : null;

  return {
    preview,
    selectedId,
    tracingId,
    isTrace,
    isActive: !!preview,
    selectSolution,
    traceSolution,
    clear,
  };
}
