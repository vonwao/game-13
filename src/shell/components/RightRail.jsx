// RightRail — objectives + recent words.
// Ported from /tmp/lexicon-design/lexicon-deep/project/layout.jsx (lines 160-300).

function RailHeading({ skin, children }) {
  if (skin.id === 'page') {
    return (
      <div
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: 26,
          color: 'var(--accent-2)',
          lineHeight: 1,
          borderBottom: '0.5px dotted var(--rule-faint)',
          paddingBottom: 6,
        }}
      >
        {children}
      </div>
    );
  }
  if (skin.id === 'terminal') {
    return (
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--rule-faint)',
          paddingBottom: 6,
        }}
      >
        +--[ {String(children).toUpperCase()} ]----
      </div>
    );
  }
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.2em',
        color: 'var(--ink-faint)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function HandCheckbox({ done }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 4 }}>
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="#2a1a10" strokeWidth="1.2" transform="rotate(-2 8 8)" />
      {done && <path d="M3 8 L 7 12 L 14 3" fill="none" stroke="#742818" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

function FBCheckbox({ done }) {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        marginTop: 2,
        flexShrink: 0,
        border: done ? 'none' : '1.5px solid var(--ink-faint)',
        background: done ? 'var(--accent)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done && (
        <svg width="9" height="9" viewBox="0 0 9 9">
          <path d="M1 4.5 L 3.5 7 L 8 1.5" stroke="#0c0d0e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

function ObjectiveRow({ skin, o }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const isFB = skin.id === 'fullbleed';
  const cur = o.cur;
  const max = o.max || 1;
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {isPage && <HandCheckbox done={o.done} />}
        {isTerm && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: o.done ? 'var(--ink)' : 'var(--ink-faint)', marginTop: 1 }}>
            {o.done ? '[x]' : '[ ]'}
          </span>
        )}
        {isFB && <FBCheckbox done={o.done} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: isPage ? 'var(--font-script)' : 'var(--font-body)',
              fontSize: isPage ? 20 : (isTerm ? 12 : 14),
              fontWeight: isFB ? 500 : 400,
              lineHeight: 1.2,
              color: o.done ? 'var(--ink-faint)' : 'var(--ink)',
              textDecoration: o.done ? 'line-through' : 'none',
              textDecorationColor: 'var(--accent)',
              textTransform: isTerm ? 'uppercase' : 'none',
            }}
          >
            {o.text}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--rule-faint)', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: o.done ? 'var(--accent-2)' : 'var(--accent)',
                }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', fontVariantNumeric: 'tabular-nums' }}>
              {cur}/{max}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ skin, w, planted }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: isPage ? '0.5px dotted var(--rule-faint)' : 'none',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        {isTerm && <span style={{ color: 'var(--ink-faint)' }}>&gt;</span>}
        {planted && <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>★</span>}
        <span
          style={{
            fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
            fontSize: isTerm ? 12 : 14,
            fontVariant: isPage ? 'small-caps' : 'normal',
            letterSpacing: isPage ? '0.08em' : '0.04em',
            color: 'var(--ink)',
            fontWeight: skin.id === 'fullbleed' ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isPage ? (w.word || '').toLowerCase() : (w.word || '')}
        </span>
        {w.note && !isTerm && (
          <span style={{ fontSize: 9, fontStyle: 'italic', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{w.note}</span>
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        +{w.score}
      </span>
    </div>
  );
}

export default function RightRail({ skin, state, phone }) {
  const collapsed = !!skin.rightRailDefaultCollapsed && !phone;

  // Map state.objectives.items → design objective shape
  const objectivesRaw = (state.objectives && state.objectives.items) || [];
  const objectives = objectivesRaw.map((o) => ({
    text: o.title || o.description || '',
    done: !!o.completed,
    cur: o.progress || 0,
    max: o.target || 1,
  }));

  // Map state.history.recent → design recent shape
  const recent = ((state.history && state.history.recent) || []).map((h) => ({
    word: h.word || '',
    score: h.score || 0,
    note: h.shapeLabel || '',
  }));

  if (collapsed) {
    return (
      <div
        style={{
          width: 56,
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          borderLeft: `1px solid var(--rule-faint)`,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
          }}
        >
          OBJ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {objectives.map((o, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: o.done ? 'var(--accent)' : 'transparent',
                border: o.done ? 'none' : '1.5px solid var(--ink-faint)',
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
            writingMode: 'vertical-rl',
          }}
        >
          WORDS
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--ink)', fontWeight: 600 }}>
          {recent.length}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--ink-faint)', cursor: 'pointer' }}>›</div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: phone ? '100%' : 280,
        padding: phone ? '12px 16px' : '20px 22px',
        borderLeft: phone ? 'none' : `1px solid var(--rule-faint)`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <RailHeading skin={skin}>Objectives</RailHeading>
      <div style={{ marginTop: 10, flexShrink: 0 }}>
        {objectives.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            none yet
          </div>
        ) : (
          objectives.map((o, i) => <ObjectiveRow key={i} skin={skin} o={o} />)
        )}
      </div>

      <div style={{ height: 16 }} />

      <RailHeading skin={skin}>{skin.id === 'terminal' ? 'Scrollback' : 'Discovered'}</RailHeading>
      <div style={{ marginTop: 8, flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {recent.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            no words yet
          </div>
        ) : (
          recent.map((w, i) => <RecentRow key={i} skin={skin} w={w} planted={false} />)
        )}
      </div>
    </div>
  );
}
