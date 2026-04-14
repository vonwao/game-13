import PanelFrame from '../components/PanelFrame.jsx';

export default function InspectorPanel({ state, actions }) {
  const debugEnabled = !!state.ui.debug?.enabled;
  const debugTab = state.ui.debug?.tab || 'planted';

  return (
    <PanelFrame
      eyebrow="Inspector"
      title="Shell controls"
      subtitle="The shell can drive reference and debug without reimplementing gameplay logic."
      footer="Debug overlay itself is still canvas-owned for now."
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Phase</span>
        <span className="shell-kv__value">{state.phase}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Reference</span>
        <span className="shell-kv__value">{state.ui.showHelp ? state.ui.helpTab : 'off'}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Debug</span>
        <span className="shell-kv__value">{debugEnabled ? debugTab : 'off'}</span>
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className={`shell-button${state.ui.showHelp ? ' shell-button--accent' : ''}`}
          onClick={() => actions.setUIState({ showHelp: !state.ui.showHelp, helpTab: state.ui.helpTab || 'basics' })}
        >
          {state.ui.showHelp ? 'Hide Reference' : 'Show Reference'}
        </button>
        <button
          type="button"
          className={`shell-button${debugEnabled ? ' shell-button--accent' : ''}`}
          onClick={() => actions.setUIState({ debug: { enabled: !debugEnabled } })}
        >
          {debugEnabled ? 'Hide Debug' : 'Show Debug'}
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setUIState({ debug: { enabled: true, tab: debugTab === 'history' ? 'planted' : 'history' } })}
        >
          Debug Tab: {debugTab === 'history' ? 'Planted' : 'History'}
        </button>
      </div>
    </PanelFrame>
  );
}
