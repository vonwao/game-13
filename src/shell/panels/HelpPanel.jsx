import PanelFrame from '../components/PanelFrame.jsx';

export default function HelpPanel({ help, actions, gameMode }) {
  const tabs = help?.tabs || [];
  const activeTab = help?.tab || 'basics';
  const sections = help?.sections || {};
  const lines = sections[activeTab] || [];

  return (
    <PanelFrame
      eyebrow="Reference"
      title={gameMode === 'wordhunt' ? 'Word Hunt guide' : 'Siege guide'}
      footer={help?.footer || 'Press ? or Escape to close.'}
    >
      <div className="segmented-toggle" role="tablist" aria-label="Help sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`segmented-toggle__btn${activeTab === tab.key ? ' segmented-toggle__btn--active' : ''}`}
            onClick={() => actions.setUIState({ showHelp: true, helpTab: tab.key })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-copy panel-copy--stack">
        {lines.map((line, index) => (
          <p key={`${activeTab}-${index}`} className={line ? '' : 'is-spacer'}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>

      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setUIState({ showHelp: false })}
        >
          Hide Reference
        </button>
      </div>
    </PanelFrame>
  );
}
