// HUDStrip — top bar, identical structure across skins.
// Updated to the unified pause-card nav pattern from LexDeep-handoff.

import { MenuButton } from './NavOverlay.jsx';

function Stat({ skin, label, value, accent, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
      <span style={skin.StatLabelStyle}>{label}</span>
      <span
        style={{
          ...skin.StatValueStyle,
          fontSize: 22,
          color: accent ? 'var(--accent)' : 'var(--ink)',
          lineHeight: 1,
          textShadow: skin.id === 'terminal' ? '0 0 6px var(--ink)' : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function formatTime(secs) {
  const safe = Math.max(0, Math.ceil(secs || 0));
  const mm = Math.floor(safe / 60);
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function HUDStrip({ skin, state, phone, onMenu, menuOpen = false }) {
  const hunt = state.huntSummary || {};
  const run = state.run || {};
  const settings = state.settings || {};
  const objectives = state.objectives || {};
  const endCondition = settings.endCondition || 'challenges';
  const objectiveDone = typeof objectives.completed === 'number' ? objectives.completed : (hunt.completedCount || 0);
  const objectiveTotal = typeof objectives.total === 'number' ? objectives.total : 0;
  const goalStat = endCondition === 'challenges'
    ? `${objectiveDone}/${objectiveTotal || 0}`
    : endCondition === 'timed'
      ? 'Score'
      : endCondition === 'turns'
        ? 'Score'
        : 'Open';
  const goalSubtitle = endCondition === 'challenges'
    ? `Goal: clear all objectives to advance (${objectiveDone}/${objectiveTotal || 0})`
    : endCondition === 'timed'
      ? 'Goal: build the highest score before time runs out'
      : endCondition === 'turns'
        ? 'Goal: build the highest score before turns run out'
        : 'Goal: explore the board and maximize score';

  const hud = {
    round: hunt.round || 1,
    roundName: hunt.roundTitle || 'The First Page',
    score: (run.score || 0).toLocaleString(),
    wordsSpelled: run.wordsSpelled || 0,
    clues: hunt.cluesRemaining || 0,
    time: endCondition === 'timed' ? formatTime(hunt.timeRemaining) : (endCondition === 'turns' ? `${hunt.turnsRemaining || 0}` : '∞'),
    timeWarning: endCondition === 'timed' && hunt.timeRemaining < 30,
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: phone ? 10 : 24,
        padding: phone ? '12px 14px 10px' : '14px 28px',
        borderBottom: `1px solid var(--rule-faint)`,
        color: 'var(--ink)',
      }}
    >
      <skin.RoundBadge round={hud.round} />
      <div style={{ minWidth: 0, flex: phone ? 1 : 'unset' }}>
        <div
          style={{
            fontFamily: skin.HeadingFont,
            fontSize: phone ? 16 : 22,
            color: skin.id === 'page' ? '#7a4a28' : 'var(--ink)',
            fontWeight: skin.id === 'terminal' ? 500 : 600,
            letterSpacing: skin.id === 'page' ? '0.02em' : (skin.id === 'terminal' ? '0.1em' : '-0.01em'),
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {skin.HeadingTransform(hud.roundName)}
        </div>
        <div
          data-testid="goal-summary"
          style={{
            fontSize: phone ? 10 : 13,
            color: 'var(--ink-faint)',
            fontStyle: skin.id === 'page' ? 'italic' : 'normal',
            fontFamily: skin.id === 'terminal' ? 'var(--font-mono)' : 'var(--font-body)',
            marginTop: 3,
            letterSpacing: skin.id === 'terminal' ? '0.12em' : 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: phone ? 190 : 420,
          }}
          title={goalSubtitle}
        >
          {goalSubtitle}
        </div>
      </div>
      <div style={{ flex: phone ? 'unset' : 1 }} />
      <Stat skin={skin} label="Score" value={String(hud.score)} />
      {!phone && <Stat skin={skin} label="Goal" value={goalStat} accent={endCondition === 'challenges' && objectiveDone >= objectiveTotal && objectiveTotal > 0} />}
      {!phone && <Stat skin={skin} label="Words" value={String(hud.wordsSpelled).padStart(2, '0')} />}
      <Stat skin={skin} label="Clues" value={String(hud.clues)} />
      <Stat skin={skin} label="Time" value={hud.time} mono accent={hud.timeWarning} />
      {onMenu ? (
        <div style={{ marginLeft: 6, flexShrink: 0 }}>
          <MenuButton skin={skin} open={menuOpen} onClick={onMenu} />
        </div>
      ) : null}
    </div>
  );
}

function romanize(n) {
  const map = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v' };
  return map[n] || String(n);
}
