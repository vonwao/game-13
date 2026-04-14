import GameCanvas from './GameCanvas.jsx';
import useGameShellState from './useGameShellState.js';
import PanelFrame from './components/PanelFrame.jsx';
import TitleScreen from './panels/TitleScreen.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import HelpPanel from './panels/HelpPanel.jsx';
import ObjectivesPanel from './panels/ObjectivesPanel.jsx';
import DiscoveriesPanel from './panels/DiscoveriesPanel.jsx';
import HistoryPanel from './panels/HistoryPanel.jsx';
import InspectorPanel from './panels/InspectorPanel.jsx';
import ShellLayout from './layout/ShellLayout.jsx';

function LiveRunPanel({ state, actions }) {
  const hunt = state.huntSummary;

  return (
    <PanelFrame
      eyebrow="Run"
      title={hunt.roundTitle || 'In Progress'}
      subtitle="The shell reads live run state while the board still owns tile-level rendering."
      footer="Use the shell panels for reference, objectives, discoveries, and score history."
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
          {hunt.round}/{hunt.maxRounds}
        </span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Combo</span>
        <span className="shell-kv__value">×{hunt.combo}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Clues</span>
        <span className="shell-kv__value">{hunt.cluesRemaining}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className={`shell-button${state.ui.showHelp ? ' shell-button--accent' : ''}`}
          onClick={() => actions.setUIState({ showHelp: !state.ui.showHelp, helpTab: state.ui.helpTab || 'basics' })}
        >
          {state.ui.showHelp ? 'Hide Reference' : 'Open Reference'}
        </button>
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
        {hunt.advanceAvailable ? (
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

export default function GameShell() {
  const { state, actions } = useGameShellState();
  const isPlaying =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';
  const showWordHuntPanels = isPlaying && state.gameMode === 'wordhunt';

  return (
    <ShellLayout state={state}>
      <section className="shell-column shell-column--primary">
        {!isPlaying ? (
          <>
            <TitleScreen state={state} actions={actions} />
            <SettingsScreen state={state} actions={actions} />
          </>
        ) : (
          <LiveRunPanel state={state} actions={actions} />
        )}

        {state.ui.showHelp ? (
          <HelpPanel help={state.help} actions={actions} gameMode={state.gameMode} />
        ) : null}
      </section>

      <div className="shell-stage">
        <GameCanvas state={state} />
      </div>

      <aside className="shell-column shell-column--secondary">
        {showWordHuntPanels ? (
          <>
            <ObjectivesPanel objectives={state.objectives} />
            <DiscoveriesPanel
              discoveries={state.discoveries}
              cluesRemaining={state.huntSummary.cluesRemaining}
            />
          </>
        ) : null}
        <HistoryPanel history={state.history || { total: state.wordHistory.length, recent: state.wordHistory }} />
        <InspectorPanel state={state} actions={actions} />
      </aside>
    </ShellLayout>
  );
}
