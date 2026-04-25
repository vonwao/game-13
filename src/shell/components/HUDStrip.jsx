// HUDStrip — top bar, identical structure across skins.
// Ported from /tmp/lexicon-design/lexicon-deep/project/layout.jsx (lines 119-157).

function Stat({ skin, label, value, accent, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
      <span style={skin.StatLabelStyle}>{label}</span>
      <span
        style={{
          ...skin.StatValueStyle,
          fontSize: 18,
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

export default function HUDStrip({ skin, state, phone }) {
  const hunt = state.huntSummary || {};
  const run = state.run || {};
  const settings = state.settings || {};
  const endCondition = settings.endCondition || 'challenges';

  const hud = {
    round: hunt.round || 1,
    roundName: hunt.roundTitle || 'The First Page',
    score: (run.score || 0).toLocaleString(),
    combo: hunt.combo || 0,
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
            fontSize: phone ? 14 : 18,
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
        {!phone && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              fontStyle: skin.id === 'page' ? 'italic' : 'normal',
              fontFamily: skin.id === 'terminal' ? 'var(--font-mono)' : 'var(--font-body)',
              marginTop: 2,
              letterSpacing: skin.id === 'terminal' ? '0.15em' : 0,
            }}
          >
            {skin.id === 'terminal' ? '// page: the_first_page.dat' : `folio ${romanize(hud.round)} of iii`}
          </div>
        )}
      </div>
      <div style={{ flex: phone ? 'unset' : 1 }} />
      <Stat skin={skin} label="Score" value={String(hud.score)} />
      <Stat skin={skin} label="Combo" value={`×${hud.combo}`} accent />
      {!phone && <Stat skin={skin} label="Words" value={String(hud.wordsSpelled).padStart(2, '0')} />}
      <Stat skin={skin} label="Clues" value={String(hud.clues)} />
      <Stat skin={skin} label="Time" value={hud.time} mono accent={hud.timeWarning} />
    </div>
  );
}

function romanize(n) {
  const map = { 1: 'i', 2: 'ii', 3: 'iii', 4: 'iv', 5: 'v' };
  return map[n] || String(n);
}
