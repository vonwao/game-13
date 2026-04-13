import PanelFrame from '../components/PanelFrame.jsx';

export default function TitleScreen({ state, actions }) {
  return (
    <PanelFrame
      eyebrow="Title"
      title="Lexicon Deep"
      subtitle="The React shell now owns the pre-play experience while the board remains canvas-based."
      footer="This panel is a real setup surface now, not just a placeholder."
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Current mode</span>
        <span className="shell-kv__value">{state.gameMode}</span>
      </div>
      <div className="segmented-toggle" role="group" aria-label="Game mode">
        <button
          type="button"
          className={`segmented-toggle__btn${state.gameMode === 'wordhunt' ? ' segmented-toggle__btn--active' : ''}`}
          onClick={() => actions.setGameMode('wordhunt')}
        >
          Word Hunt
        </button>
        <button
          type="button"
          className={`segmented-toggle__btn${state.gameMode === 'siege' ? ' segmented-toggle__btn--active' : ''}`}
          onClick={() => actions.setGameMode('siege')}
        >
          Siege
        </button>
      </div>
      <div className="panel-copy">
        {state.gameMode === 'wordhunt'
          ? 'Find valid words, complete objectives, and discover planted words hidden in the archive.'
          : 'Fight spreading corruption by casting words that cleanse ink and destroy every seal.'}
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
          {state.ui.showHelp ? 'Hide Help' : 'Show Help'}
        </button>
      </div>
    </PanelFrame>
  );
}
