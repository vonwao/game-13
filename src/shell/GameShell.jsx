import GameCanvas from './GameCanvas.jsx';
import useGameShellState from './useGameShellState.js';
import ActionBar from './components/ActionBar.jsx';
import GameHUD from './components/GameHUD.jsx';
import PanelFrame from './components/PanelFrame.jsx';
import TitleScreen from './panels/TitleScreen.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import HelpPanel from './panels/HelpPanel.jsx';
import ObjectivesPanel from './panels/ObjectivesPanel.jsx';
import DiscoveriesPanel from './panels/DiscoveriesPanel.jsx';
import HistoryPanel from './panels/HistoryPanel.jsx';
import ShellLayout from './layout/ShellLayout.jsx';

function RunControlsPanel({ state, actions }) {
  const hunt = state.huntSummary;

  return (
    <PanelFrame eyebrow="Run" title="Controls">
      <div className="panel-actions">
        <button
          type="button"
          className={`shell-button${state.ui.showHelp ? ' shell-button--accent' : ''}`}
          onClick={() => actions.setUIState({ showHelp: !state.ui.showHelp, helpTab: state.ui.helpTab || 'basics' })}
        >
          {state.ui.showHelp ? 'Hide Reference' : 'Open Reference'}
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
          <RunControlsPanel state={state} actions={actions} />
        )}

        {state.ui.showHelp ? (
          <HelpPanel help={state.help} actions={actions} gameMode={state.gameMode} />
        ) : null}
      </section>

      <div className="shell-stage">
        {isPlaying ? <GameHUD state={state} /> : null}
        <GameCanvas state={state} />
        {isPlaying ? <ActionBar state={state} actions={actions} /> : null}
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
      </aside>
    </ShellLayout>
  );
}
