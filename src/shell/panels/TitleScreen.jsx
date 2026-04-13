import PanelFrame from '../components/PanelFrame.jsx';

export default function TitleScreen({ state, actions }) {
  return (
    <PanelFrame
      eyebrow="Title"
      title="Lexicon Deep"
      subtitle="A responsive shell for menus, settings, help, and future game-core mounting."
      footer="This is intentionally a shell placeholder. The canvas core stays separate."
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Current phase</span>
        <span className="shell-kv__value">{state.phase}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button shell-button--accent"
          onClick={actions.startGame}
        >
          Start Game
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setUIState({ showHelp: !state.ui.showHelp })}
        >
          Toggle Help
        </button>
      </div>
    </PanelFrame>
  );
}
