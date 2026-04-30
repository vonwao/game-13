function CornerOrn({ style, flip }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 36 36"
      style={{ position: 'absolute', transform: flip, ...style }}
      aria-hidden="true"
    >
      <g stroke="#c89848" strokeWidth="0.9" fill="none">
        <path d="M2 18 Q 2 2 18 2" />
        <path d="M6 18 Q 6 6 18 6" />
        <circle cx="6" cy="6" r="1.4" fill="#c89848" />
      </g>
    </svg>
  );
}

function isPageSkin(skin) {
  return skin.id === 'page';
}

function isTerminalSkin(skin) {
  return skin.id === 'terminal';
}

function getScrimStyle(skin) {
  if (isTerminalSkin(skin)) return 'rgba(0, 0, 0, 0.72)';
  if (isPageSkin(skin)) return 'rgba(32, 20, 12, 0.46)';
  return 'rgba(7, 8, 10, 0.62)';
}

function getCardBackground(skin) {
  if (isPageSkin(skin)) {
    return 'radial-gradient(ellipse at 30% 20%, #f9f0d8 0%, #f3e9d2 55%, #e8dcbe 100%)';
  }
  if (isTerminalSkin(skin)) return '#0a0d09';
  return '#12141a';
}

function getCardBorder(skin) {
  if (isPageSkin(skin)) return '1px solid rgba(200,152,72,.5)';
  if (isTerminalSkin(skin)) return '1px solid #7fdb6a';
  return '1px solid rgba(255,255,255,.09)';
}

function getDividerColor(skin) {
  if (isPageSkin(skin)) return 'rgba(200,152,72,.28)';
  if (isTerminalSkin(skin)) return 'rgba(127,219,106,.18)';
  return 'rgba(255,255,255,.06)';
}

function FlowCard({ skin, phone, width, children, dataTestId }) {
  const isPage = isPageSkin(skin);
  const isTerm = isTerminalSkin(skin);

  return (
    <div
      data-testid={dataTestId}
      style={{
        width: width || (phone ? 300 : 400),
        maxWidth: 'calc(100vw - 32px)',
        background: getCardBackground(skin),
        border: getCardBorder(skin),
        borderRadius: isTerm ? 0 : 4,
        boxShadow: '0 12px 48px rgba(0,0,0,.75), 0 2px 8px rgba(0,0,0,.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isPage && (
        <>
          <CornerOrn style={{ top: 8, left: 8 }} />
          <CornerOrn style={{ top: 8, right: 8 }} flip="scaleX(-1)" />
          <CornerOrn style={{ bottom: 8, left: 8 }} flip="scaleY(-1)" />
          <CornerOrn style={{ bottom: 8, right: 8 }} flip="scale(-1,-1)" />
        </>
      )}
      {isTerm && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(to bottom, rgba(127,219,106,0) 0px, rgba(127,219,106,0) 2px, rgba(0,0,0,.15) 2px, rgba(0,0,0,.15) 3px)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: isTerm ? '18px 18px' : phone ? '20px 22px' : '22px 26px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function FlowHeader({ skin, eyebrow, title, subtitle, divider = true }) {
  const isPage = isPageSkin(skin);
  const isTerm = isTerminalSkin(skin);

  return (
    <div style={{ marginBottom: 18 }}>
      {eyebrow ? (
        <div
          style={{
            fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
            fontSize: isTerm ? 11 : 10,
            fontWeight: 700,
            color: isTerm ? 'rgba(127,219,106,.55)' : 'var(--ink-faint)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: isPage ? 2 : 5,
          }}
        >
          {isTerm ? `// ${eyebrow.toLowerCase()}` : eyebrow}
        </div>
      ) : null}
      {isTerm ? (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            fontWeight: 700,
            color: '#7fdb6a',
            textShadow: '0 0 8px #7fdb6a',
            letterSpacing: '0.06em',
          }}
        >
          {title.toUpperCase().replace(/ /g, '_')}
        </div>
      ) : isPage ? (
        <div
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 42,
            color: '#742818',
            lineHeight: 1,
            fontStyle: 'italic',
          }}
        >
          {title}
        </div>
      ) : (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: '#f1ece2',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>
      )}
      {subtitle ? (
        <div
          style={{
            fontSize: 11,
            marginTop: 3,
            color: isTerm ? 'rgba(127,219,106,.45)' : isPage ? '#5a4030' : 'rgba(241,236,226,.38)',
            fontStyle: isPage ? 'italic' : 'normal',
            fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
            letterSpacing: isTerm ? '0.08em' : 0,
          }}
        >
          {isTerm ? `// ${subtitle.toLowerCase().replace(/[^a-z0-9·]+/g, '_')}` : subtitle}
        </div>
      ) : null}
      {divider ? (
        <div style={{ height: 1, background: getDividerColor(skin), marginTop: 14 }} />
      ) : null}
    </div>
  );
}

function StatRail({ skin, stats, compact = false }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: compact ? 14 : 20,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      {stats.map(([label, value, accent]) => (
        <div key={label}>
          <div style={{ ...skin.StatLabelStyle, fontSize: 8, marginBottom: 2 }}>{label}</div>
          <div
            style={{
              ...skin.StatValueStyle,
              fontSize: accent ? (compact ? 22 : 24) : compact ? 15 : 16,
              color: accent ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryList({ skin, label, rows }) {
  const isPage = isPageSkin(skin);
  const isTerm = isTerminalSkin(skin);

  if (!rows.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '6px 0',
            borderBottom: `1px solid ${getDividerColor(skin)}`,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--ink-soft)',
              fontStyle: isPage ? 'italic' : 'normal',
            }}
          >
            {row.label}
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            {row.meta ? (
              <span style={{ ...skin.StatValueStyle, fontSize: 13, color: 'var(--ink)' }}>{row.meta}</span>
            ) : null}
            {row.detail ? (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--ink-faint)',
                }}
              >
                {row.detail}
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectiveList({ skin, items }) {
  const isTerm = isTerminalSkin(skin);

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 8,
        }}
      >
        Objectives
      </div>
      {items.map((item, index) => (
        <div
          key={`${item.title || item.description || 'objective'}-${index}`}
          style={{
            display: 'flex',
            gap: 7,
            alignItems: 'flex-start',
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: item.completed ? 'var(--accent)' : 'var(--ink-faint)',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {item.completed ? (isTerm ? '[✓]' : '✓') : isTerm ? '[ ]' : '○'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: item.completed ? 'var(--ink-soft)' : 'var(--ink)',
              textDecoration: item.completed ? 'line-through' : 'none',
              opacity: item.completed ? 0.65 : 1,
            }}
          >
            {item.title || item.description}
          </span>
        </div>
      ))}
    </div>
  );
}

function ActionRow({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
      {children}
    </div>
  );
}

function ActionChip({ skin, label, kbd, icon, primary, onClick }) {
  const isPage = isPageSkin(skin);
  const isTerm = isTerminalSkin(skin);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        appearance: 'none',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: isTerm ? '8px 2px' : '9px 8px',
        border: 0,
        borderRadius: isTerm ? 0 : 3,
        background: primary
          ? isPage
            ? 'rgba(116,40,24,.07)'
            : 'rgba(212,168,74,.05)'
          : 'transparent',
        borderBottom: isTerm ? '1px solid rgba(127,219,106,.1)' : 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {isTerm ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'rgba(127,219,106,.5)',
            letterSpacing: '0.06em',
            width: 32,
            flexShrink: 0,
          }}
        >
          [{kbd}]
        </span>
      ) : (
        <span
          style={{
            fontSize: 13,
            width: 18,
            textAlign: 'center',
            color: primary ? 'var(--accent)' : 'var(--ink-soft)',
            opacity: primary ? 1 : 0.55,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <span
        style={{
          flex: 1,
          fontFamily: isTerm ? 'var(--font-mono)' : isPage ? 'var(--font-body)' : 'var(--font-display)',
          fontSize: isTerm ? 12 : isPage ? 15 : 14,
          fontWeight: primary ? 600 : 400,
          fontStyle: isPage && !primary ? 'italic' : 'normal',
          color: isTerm
            ? primary
              ? '#7fdb6a'
              : 'rgba(127,219,106,.75)'
            : primary
              ? isPage
                ? '#742818'
                : '#d4a84a'
              : 'var(--ink)',
          textShadow: isTerm && primary ? '0 0 6px #7fdb6a' : 'none',
          letterSpacing: isTerm ? '0.08em' : 0,
        }}
      >
        {isTerm ? label.toUpperCase() : label}
      </span>
      {!isTerm ? (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: isPage ? 'rgba(90,64,48,.3)' : 'rgba(241,236,226,.18)',
            padding: '1px 5px',
            border: `1px solid ${isPage ? 'rgba(200,152,72,.22)' : 'rgba(255,255,255,.06)'}`,
            borderRadius: 2,
            flexShrink: 0,
          }}
        >
          {kbd}
        </span>
      ) : null}
    </button>
  );
}

function formatScore(score) {
  return Number(score || 0).toLocaleString();
}

function getEndConditionLabel(endCondition) {
  return ({
    challenges: 'Objectives',
    zen: 'Zen',
    timed: 'Timed',
    turns: 'Turns',
  })[endCondition || 'challenges'] || 'Objectives';
}

function getRoundTitle(round) {
  return ({
    1: 'The First Page',
    2: 'Dust and Echoes',
    3: 'The Black Index',
  })[round] || `Round ${round}`;
}

function getBestWord(historyItems) {
  if (!historyItems.length) return null;
  return historyItems.reduce((best, entry) => {
    if (!best || (entry.score || 0) > (best.score || 0)) return entry;
    return best;
  }, null);
}

export function MenuButton({ skin, open, onClick }) {
  const isTerm = isTerminalSkin(skin);

  return (
    <button
      data-testid="hud-menu-button"
      type="button"
      title={open ? 'Close menu (Esc)' : 'Open menu (Esc)'}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      onClick={onClick}
      style={{
        appearance: 'none',
        width: 36,
        height: 36,
        padding: 0,
        border: open ? '1px solid var(--accent)' : '1px solid var(--rule-faint)',
        borderRadius: isTerm ? 0 : 999,
        background: open ? 'var(--accent)' : 'transparent',
        color: open ? 'var(--surface)' : 'var(--ink-soft)',
        fontFamily: isTerm ? 'var(--font-mono)' : 'inherit',
        fontSize: 17,
        lineHeight: 1,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '-0.04em',
        textShadow: isTerm && !open ? '0 0 5px var(--ink-soft)' : 'none',
        flexShrink: 0,
      }}
    >
      {open ? '✕' : '≡'}
    </button>
  );
}

export function OverlayScrim({ skin, children, onDismiss, dataTestId }) {
  return (
    <div
      data-testid={dataTestId}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: getScrimStyle(skin),
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={onDismiss}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

export function PauseMenuOverlay({
  skin,
  phone,
  state,
  onDismiss,
  onResume,
  onSettings,
  onHelp,
  onRestart,
  onQuit,
}) {
  const hunt = state.huntSummary || {};
  const run = state.run || {};
  const settings = state.settings || {};
  const subtitle = `Round ${hunt.round || 1} · ${hunt.roundTitle || 'The First Page'}`;
  const endCondition = settings.endCondition || 'challenges';
  const paceValue = endCondition === 'timed'
    ? `${Math.max(0, Math.ceil(hunt.timeRemaining || 0))}s left`
    : endCondition === 'turns'
      ? `${hunt.turnsRemaining || 0} turns left`
      : 'no hard clock';
  const currentRows = [
    { label: 'Goal', meta: getEndConditionLabel(endCondition), detail: 'applies to the active page' },
    { label: 'Clues', meta: String(hunt.cluesRemaining || 0), detail: 'still available' },
    { label: 'Pace', meta: paceValue, detail: endCondition === 'challenges' ? 'advance by clearing objectives' : 'the page is still live when you return' },
  ];

  return (
    <OverlayScrim skin={skin} onDismiss={onDismiss} dataTestId="nav-overlay">
      <FlowCard skin={skin} phone={phone} width={phone ? 288 : 328} dataTestId="pause-card">
        <FlowHeader skin={skin} title="Paused" subtitle={subtitle} divider />
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--ink-soft)',
            lineHeight: 1.45,
            marginBottom: 14,
            fontStyle: isPageSkin(skin) ? 'italic' : 'normal',
          }}
        >
          Step away without losing the page. The board, timer, and current pressure will resume exactly where you left them.
        </div>
        <SummaryList skin={skin} label="Current Page" rows={currentRows} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: isTerminalSkin(skin) ? 0 : 2 }}>
          <ActionChip skin={skin} label="Resume" icon="▶" kbd="Esc" primary onClick={onResume} />
          <ActionChip skin={skin} label="Settings" icon="⚙" kbd="S" onClick={onSettings} />
          <ActionChip skin={skin} label="How to Play" icon="?" kbd="H" onClick={onHelp} />
          <ActionChip skin={skin} label="Restart Run" icon="↺" kbd="R" onClick={onRestart} />
          <ActionChip skin={skin} label="Quit to Start" icon="✕" kbd="Q" onClick={onQuit} />
        </div>
        <div
          style={{
            marginTop: 16,
            borderTop: `1px solid ${getDividerColor(skin)}`,
            paddingTop: 12,
            display: 'flex',
            gap: 18,
          }}
        >
          {[
            ['Score', formatScore(run.score)],
            ['Round', `${hunt.round || 1}/${hunt.maxRounds || 3}`],
            ['Words', String(run.wordsSpelled || 0)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...skin.StatLabelStyle, fontSize: 8 }}>{label}</span>
              <span style={{ ...skin.StatValueStyle, fontSize: 13, color: 'var(--ink)' }}>{value}</span>
            </div>
          ))}
        </div>
      </FlowCard>
    </OverlayScrim>
  );
}

export function RoundCompleteOverlay({ skin, phone, state, onContinue, onSettings }) {
  const hunt = state.huntSummary || {};
  const run = state.run || {};
  const settings = state.settings || {};
  const history = state.history?.items || [];
  const bestWord = getBestWord(history);
  const title = `${hunt.roundTitle || 'The First Page'} is set.`;
  const nextRound = Math.min((hunt.round || 1) + 1, hunt.maxRounds || 3);
  const nextRoundTitle = getRoundTitle(nextRound);
  const endCondition = settings.endCondition || 'challenges';
  const recapRows = [
    { label: 'Page goal', meta: getEndConditionLabel(endCondition), detail: 'cleared for this round' },
    { label: 'Clues carried', meta: String(hunt.cluesRemaining || 0), detail: 'ready for the next page' },
    { label: 'Next page', meta: nextRoundTitle, detail: nextRound > (hunt.round || 1) ? `round ${nextRound} of ${hunt.maxRounds || 3}` : 'final page already reached' },
  ];

  return (
    <OverlayScrim skin={skin} dataTestId="round-complete-overlay">
      <FlowCard skin={skin} phone={phone} width={phone ? 300 : 400} dataTestId="round-complete-card">
        <FlowHeader skin={skin} eyebrow="Round Complete" title={title} />
        <StatRail
          skin={skin}
          compact={phone}
          stats={[
            ['Score', formatScore(run.score), true],
            ['Words', String(run.wordsSpelled || 0)],
            ['Best', bestWord ? `${bestWord.word} +${bestWord.score || 0}` : '—'],
          ]}
        />
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--ink-soft)',
            lineHeight: 1.45,
            marginBottom: 14,
            fontStyle: isPageSkin(skin) ? 'italic' : 'normal',
          }}
        >
          The page is sealed. Carry what remains into the next folio, or step into Settings before you open it.
        </div>
        <SummaryList skin={skin} label="Carry Forward" rows={recapRows} />
        <ObjectiveList skin={skin} items={(state.objectives?.items || []).slice(0, 3)} />
        <div style={{ height: 1, background: getDividerColor(skin), margin: '14px 0' }} />
        <ActionRow>
          <span style={{ display: 'inline-flex', cursor: 'pointer' }} onClick={onContinue}>
            <skin.ActionBtn label="Continue" kbd="↵" primary />
          </span>
          <span style={{ display: 'inline-flex', cursor: 'pointer' }} onClick={onSettings}>
            <skin.ActionBtn label="Settings" compact={phone} />
          </span>
        </ActionRow>
      </FlowCard>
    </OverlayScrim>
  );
}

export function RunCompleteOverlay({ skin, phone, state, onNewRun, onQuit }) {
  const run = state.run || {};
  const history = state.history?.items || [];
  const bestWord = getBestWord(history);
  const phase = state.phase;
  const success = phase === 'victory';
  const settings = state.settings || {};
  const rows = (state.history?.recent || [])
    .slice(0, phone ? 3 : 6)
    .map((entry) => ({
      label: entry.word,
      meta: `+${entry.score || 0}`,
      detail: entry.shapeLabel || `${entry.pathLength || 0} letters`,
    }));
  const archiveRows = [
    { label: 'Goal shape', meta: getEndConditionLabel(settings.endCondition), detail: 'used for this run' },
    { label: 'Board size', meta: settings.boardSize || 'small', detail: 'next run can change this' },
    { label: 'Wildcard rule', meta: settings.specialTiles ? 'enabled' : 'off', detail: settings.specialTiles ? 'icon paths subtract points' : 'letters only' },
  ];

  return (
    <OverlayScrim skin={skin} dataTestId="run-complete-overlay">
      <FlowCard skin={skin} phone={phone} width={phone ? 308 : 440} dataTestId="run-complete-card">
        <FlowHeader
          skin={skin}
          eyebrow={success ? 'Volume i, complete' : 'Run complete'}
          title={success ? 'Volume i, complete.' : 'The archive closes.'}
        />
        <StatRail
          skin={skin}
          compact={phone}
          stats={[
            ['Total Score', formatScore(run.score), true],
            ['Words Found', String(run.wordsSpelled || 0)],
            ['Best Word', bestWord ? bestWord.word : '—'],
          ]}
        />
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--ink-soft)',
            lineHeight: 1.45,
            marginBottom: 14,
            fontStyle: isPageSkin(skin) ? 'italic' : 'normal',
          }}
        >
          {success
            ? 'The full volume is closed. Start another run with the same setup, or return to the front door and reset the page.'
            : 'This run is over, but the archive is ready for another attempt whenever you are.'}
        </div>
        <SummaryList skin={skin} label="Run Shape" rows={archiveRows} />
        {!phone ? <SummaryList skin={skin} label="Recent Words" rows={rows} /> : null}
        <div style={{ height: 1, background: getDividerColor(skin), margin: '14px 0' }} />
        <ActionRow>
          <span style={{ display: 'inline-flex', cursor: 'pointer' }} onClick={onNewRun}>
            <skin.ActionBtn label="New Run" kbd="↵" primary />
          </span>
          <span style={{ display: 'inline-flex', cursor: 'pointer' }} onClick={onQuit}>
            <skin.ActionBtn label="Quit to Start" compact={phone} />
          </span>
        </ActionRow>
      </FlowCard>
    </OverlayScrim>
  );
}
