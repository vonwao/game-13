import GameCanvas from './GameCanvas.jsx';
import useGameShellState from './useGameShellState.js';
import PanelFrame from './components/PanelFrame.jsx';
import TitleScreen from './panels/TitleScreen.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import ShellLayout from './layout/ShellLayout.jsx';

function LiveRunPanel({ state, actions }) {
  return (
    <PanelFrame
      eyebrow="Run"
      title={state.huntSummary.roundTitle || 'In Progress'}
      subtitle="This shell panel is now reading the real game bridge instead of placeholder-only state."
      footer="The board still owns board-space rendering and input geometry."
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Score</span>
        <span className="shell-kv__value">{state.run.score}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Words</span>
        <span className="shell-kv__value">{state.run.wordsSpelled}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Round</span>
        <span className="shell-kv__value">
          {state.huntSummary.round}/{state.huntSummary.maxRounds}
        </span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Combo</span>
        <span className="shell-kv__value">×{state.huntSummary.combo}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Clues</span>
        <span className="shell-kv__value">{state.huntSummary.cluesRemaining}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={actions.startGame}
        >
          Restart Run
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={actions.returnToSettings}
        >
          Back To Setup
        </button>
        {state.huntSummary.advanceAvailable ? (
          <button
            type="button"
            className="shell-button shell-button--accent"
            onClick={actions.advanceRound}
          >
            Advance Round
          </button>
        ) : null}
      </div>
    </PanelFrame>
  );
}

function RecentWordsPanel({ state }) {
  const recent = state.wordHistory.slice(-5).reverse();

  return (
    <PanelFrame
      eyebrow="History"
      title="Recent words"
      subtitle="This will become the reusable shell-side history/objectives pattern."
      footer="Text-heavy progression and tuning surfaces belong in the shell."
    >
      {recent.length === 0 ? (
        <div className="panel-note">No submitted words yet.</div>
      ) : (
        <div className="panel-list">
          {recent.map((entry, index) => (
            <div key={`${entry.word}-${index}`} className="panel-list__row">
              <div>
                <strong>{entry.word}</strong>
                <div className="panel-list__meta">{entry.reasonText || entry.orientation || 'scored word'}</div>
              </div>
              <span className="panel-list__score">+{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}

export default function GameShell() {
  const { state, actions } = useGameShellState();
  const isPlaying =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';

  return (
    <ShellLayout state={state}>
      <div className="shell-rail">
        {!isPlaying ? (
          <>
            <TitleScreen state={state} actions={actions} />
            <SettingsScreen state={state} actions={actions} />
          </>
        ) : (
          <LiveRunPanel state={state} actions={actions} />
        )}
      </div>

      <div className="shell-stage">
        <GameCanvas state={state} />
      </div>

      <div className="shell-rail">
        <RecentWordsPanel state={state} />
        <PanelFrame
          eyebrow="Bridge"
          title="Shell contract"
          subtitle="Normalized state and commands flow through a narrow public bridge."
          footer="This panel stays here until help/debug/objectives move fully into React."
        >
          <div className="shell-kv">
            <span className="shell-kv__label">Phase</span>
            <span className="shell-kv__value">{state.phase}</span>
          </div>
          <div className="shell-kv">
            <span className="shell-kv__label">Help tab</span>
            <span className="shell-kv__value">{state.ui.helpTab}</span>
          </div>
          <div className="shell-kv">
            <span className="shell-kv__label">Debug</span>
            <span className="shell-kv__value">
              {state.ui.debug.enabled ? state.ui.debug.tab : 'off'}
            </span>
          </div>
        </PanelFrame>
      </div>
    </ShellLayout>
  );
}
