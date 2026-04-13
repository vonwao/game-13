import PanelFrame from '../components/PanelFrame.jsx';

function cycle(value, list) {
  const index = list.indexOf(value);
  return list[(index + 1) % list.length];
}

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
      subtitle="These controls now drive the actual game bridge. The shell owns setup intent; the core still owns the rules."
      footer={describeMode(state.gameMode)}
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Difficulty</span>
        <span className="shell-kv__value">{settings.difficulty}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Board size</span>
        <span className="shell-kv__value">{settings.boardSize}</span>
      </div>
      {canShowEndCondition ? (
        <div className="shell-kv">
          <span className="shell-kv__label">End condition</span>
          <span className="shell-kv__value">{settings.endCondition}</span>
        </div>
      ) : null}
      <div className="shell-kv">
        <span className="shell-kv__label">Special tiles</span>
        <span className="shell-kv__value">{settings.specialTiles ? 'on' : 'off'}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ difficulty: cycle(settings.difficulty, ['easy', 'medium', 'hard']) })}
        >
          Cycle Difficulty
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ boardSize: cycle(settings.boardSize, ['small', 'medium', 'large']) })}
        >
          Cycle Board
        </button>
        {canShowEndCondition ? (
          <button
            type="button"
            className="shell-button"
            onClick={() => actions.setSettings({ endCondition: cycle(settings.endCondition, ['challenges', 'timed', 'turns']) })}
          >
            Cycle End Condition
          </button>
        ) : null}
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ specialTiles: !settings.specialTiles })}
        >
          Toggle Special Tiles
        </button>
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ particlesEnabled: !settings.particlesEnabled })}
        >
          Toggle Particles
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
