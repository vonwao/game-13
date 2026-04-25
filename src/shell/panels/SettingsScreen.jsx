import PanelFrame from '../components/PanelFrame.jsx';

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'];
const BOARD_SIZE_OPTIONS = ['small', 'medium', 'large'];
const END_CONDITION_OPTIONS = ['challenges', 'timed', 'turns'];

function describeMode(mode) {
  return mode === 'siege'
    ? 'Destroy all seals before corruption overwhelms the board.'
    : 'Find words, clear objectives, and uncover planted hidden words.';
}

export default function SettingsScreen({ state, actions }) {
  const settings = state.settings;
  const canShowEndCondition = state.gameMode === 'wordhunt';

  return (
    <PanelFrame
      eyebrow="Settings"
      title="Run setup"
      footer={describeMode(state.gameMode)}
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Difficulty</span>
      </div>
      <div className="segmented-toggle" role="group" aria-label="Difficulty">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`segmented-toggle__btn${settings.difficulty === option ? ' segmented-toggle__btn--active' : ''}`}
            onClick={() => actions.setSettings({ difficulty: option })}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Board size</span>
      </div>
      <div className="segmented-toggle" role="group" aria-label="Board size">
        {BOARD_SIZE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`segmented-toggle__btn${settings.boardSize === option ? ' segmented-toggle__btn--active' : ''}`}
            onClick={() => actions.setSettings({ boardSize: option })}
          >
            {option}
          </button>
        ))}
      </div>
      {canShowEndCondition ? (
        <>
          <div className="shell-kv">
            <span className="shell-kv__label">End condition</span>
          </div>
          <div className="segmented-toggle" role="group" aria-label="End condition">
            {END_CONDITION_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`segmented-toggle__btn${settings.endCondition === option ? ' segmented-toggle__btn--active' : ''}`}
                onClick={() => actions.setSettings({ endCondition: option })}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      ) : null}
      <div className="shell-kv">
        <span className="shell-kv__label">Special tiles</span>
        <span className="shell-kv__value">{settings.specialTiles ? 'on' : 'off'}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ specialTiles: !settings.specialTiles })}
        >
          Toggle Special Tiles
        </button>
      </div>
      <div className="segmented-toggle" role="group" aria-label="Auxiliary settings">
        <button
          type="button"
          className={`segmented-toggle__btn${settings.soundEnabled ? ' segmented-toggle__btn--active' : ''}`}
          onClick={() => actions.setSettings({ soundEnabled: !settings.soundEnabled })}
        >
          Sound {settings.soundEnabled ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          className={`segmented-toggle__btn${settings.particlesEnabled ? ' segmented-toggle__btn--active' : ''}`}
          onClick={() => actions.setSettings({ particlesEnabled: !settings.particlesEnabled })}
        >
          FX {settings.particlesEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </PanelFrame>
  );
}
