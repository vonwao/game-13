import PanelFrame from '../components/PanelFrame.jsx';

function cycle(value, list) {
  const index = list.indexOf(value);
  return list[(index + 1) % list.length];
}

export default function SettingsScreen({ state, actions }) {
  const settings = state.settings;

  return (
    <PanelFrame
      eyebrow="Settings"
      title="Shell direction"
      subtitle="These controls are placeholder shell-first settings. The gameplay core will read them through the bridge later."
      footer="The shell owns presentation and settings intent; the game core owns the rules."
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Difficulty</span>
        <span className="shell-kv__value">{settings.difficulty}</span>
      </div>
      <div className="shell-kv">
        <span className="shell-kv__label">Board size</span>
        <span className="shell-kv__value">{settings.boardSize}</span>
      </div>
      <div className="panel-actions">
        <button
          type="button"
          className="shell-button"
          onClick={() => actions.setSettings({ difficulty: cycle(settings.difficulty, ['easy', 'normal', 'hard']) })}
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
    </PanelFrame>
  );
}
