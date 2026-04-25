export default function ActionBar({ state, actions }) {
  const phase = state.phase;
  if (phase !== 'playing' && phase !== 'victory' && phase !== 'gameover') {
    return null;
  }

  const isWordHunt = state.gameMode === 'wordhunt';
  const input = state.inputSummary || {};
  const hunt = state.huntSummary || {};
  const typed = input.typed || '';
  const canSubmit = !!(input.valid && input.hasPath);
  const previewTotal = input.scorePreview && input.scorePreview.total
    ? input.scorePreview.total
    : 0;
  const showPreview = canSubmit && previewTotal > 0;
  const cluesRemaining = hunt.cluesRemaining || 0;
  const canUseClue = cluesRemaining > 0;

  return (
    <footer className="shell-actionbar" aria-label="Word actions">
      <div className="shell-actionbar__preview">
        {typed ? (
          <>
            <span className="shell-actionbar__word">{typed}</span>
            {showPreview ? (
              <span className="shell-actionbar__score">+{previewTotal}</span>
            ) : null}
          </>
        ) : (
          <span className="shell-actionbar__hint is-muted">
            Tap tiles or type to spell
          </span>
        )}
      </div>
      <div className="shell-actionbar__buttons">
        <button
          type="button"
          className="shell-button"
          onClick={actions.clearCurrentWord}
          disabled={!typed}
        >
          Clear
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={actions.undoTileSelection}
          disabled={!typed}
        >
          Undo
        </button>
        {isWordHunt ? (
          <button
            type="button"
            className="shell-button"
            onClick={actions.useClue}
            disabled={!canUseClue}
          >
            Clue ({cluesRemaining})
          </button>
        ) : null}
        <button
          type="button"
          className="shell-button shell-button--accent"
          onClick={actions.submitCurrentWord}
          disabled={!canSubmit}
        >
          Submit
        </button>
      </div>
    </footer>
  );
}
