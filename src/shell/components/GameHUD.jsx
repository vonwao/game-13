function formatTime(secs) {
  const safe = Math.max(0, Math.ceil(secs || 0));
  const mm = Math.floor(safe / 60);
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function HudStat({ label, value, tone }) {
  const toneClass = tone ? ` shell-hud__stat--${tone}` : '';
  return (
    <div className={`shell-hud__stat${toneClass}`}>
      <span className="shell-hud__stat-label">{label}</span>
      <span className="shell-hud__stat-value">{value}</span>
    </div>
  );
}

export default function GameHUD({ state }) {
  const phase = state.phase;
  if (phase !== 'playing' && phase !== 'victory' && phase !== 'gameover') {
    return null;
  }

  const isWordHunt = state.gameMode === 'wordhunt';
  const hunt = state.huntSummary || {};
  const run = state.run || {};
  const endCondition = (state.settings && state.settings.endCondition) || 'challenges';

  if (!isWordHunt) {
    // Siege: seeds destroyed of total
    const seedsDestroyed = run.seedsDestroyed || 0;
    const totalSeeds = run.totalSeeds || 0;
    return (
      <header className="shell-hud" role="status" aria-label="Run status">
        <div className="shell-hud__title">
          <span className="shell-hud__eyebrow">Lexicon Deep</span>
          <span className="shell-hud__round">Turn {run.turns || 0}</span>
        </div>
        <div className="shell-hud__stats">
          <HudStat label="Score" value={(run.score || 0).toLocaleString()} />
          <HudStat label="Words" value={run.wordsSpelled || 0} />
          <HudStat label="Seeds" value={`${seedsDestroyed}/${totalSeeds}`} />
        </div>
      </header>
    );
  }

  const round = hunt.round || 1;
  const maxRounds = hunt.maxRounds || 3;
  const combo = hunt.combo || 0;
  const showCombo = combo > 1;
  const showTime = endCondition === 'timed';
  const showTurns = endCondition === 'turns';

  return (
    <header className="shell-hud" role="status" aria-label="Run status">
      <div className="shell-hud__title">
        <span className="shell-hud__eyebrow">Word Hunt</span>
        <span className="shell-hud__round">
          Round {round}/{maxRounds}
          {hunt.roundTitle ? <span className="shell-hud__round-title"> · {hunt.roundTitle}</span> : null}
        </span>
      </div>
      <div className="shell-hud__stats">
        <HudStat label="Score" value={(run.score || 0).toLocaleString()} />
        <HudStat label="Words" value={run.wordsSpelled || 0} />
        {showCombo ? (
          <HudStat label="Combo" value={`x${combo}`} tone="accent" />
        ) : null}
        <HudStat label="Clues" value={hunt.cluesRemaining || 0} />
        {showTime ? (
          <HudStat
            label="Time"
            value={formatTime(hunt.timeRemaining)}
            tone={hunt.timeRemaining < 30 ? 'danger' : undefined}
          />
        ) : null}
        {showTurns ? (
          <HudStat label="Turns" value={hunt.turnsRemaining || 0} />
        ) : null}
      </div>
    </header>
  );
}
