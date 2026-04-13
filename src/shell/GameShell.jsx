import GameCanvas from './GameCanvas.jsx';
import useGameShellState from './useGameShellState.js';
import PanelFrame from './components/PanelFrame.jsx';
import TitleScreen from './panels/TitleScreen.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import ShellLayout from './layout/ShellLayout.jsx';

export default function GameShell() {
  const { state, actions } = useGameShellState();

  return (
    <ShellLayout state={state}>
      <div className="shell-rail">
        <TitleScreen state={state} actions={actions} />
        <SettingsScreen state={state} actions={actions} />
      </div>

      <div className="shell-stage">
        <GameCanvas state={state} />
      </div>

      <div className="shell-rail">
        <PanelFrame
          eyebrow="Bridge"
          title="Shell contract"
          subtitle="Normalized state and commands will flow through a narrow public bridge."
          footer="No gameplay internals are read here yet."
        >
          <div className="shell-kv">
            <span className="shell-kv__label">Word history</span>
            <span className="shell-kv__value">{state.wordHistory.length}</span>
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
