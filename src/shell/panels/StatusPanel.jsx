import PanelFrame from '../components/PanelFrame.jsx';

export default function StatusPanel({ state, actions }) {
  return (
    <PanelFrame
      eyebrow="Status"
      title="Shell contract"
      subtitle="The shell reads normalized bridge state and dispatches narrow commands back into the core."
      footer="This panel stays small on purpose. It exists to show the bridge state, not to re-implement it."
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
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setUIState({ showHelp: true, helpTab: state.ui.helpTab || 'basics' })}
        >
          Open Help
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setUIState({ showHelp: false })}
        >
          Close Help
        </button>
      </div>
    </PanelFrame>
  );
}
