function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getCardFill(skin) {
  if (skin.id === 'page') return 'rgba(232,220,190,.76)';
  if (skin.id === 'terminal') return 'rgba(127,219,106,.05)';
  return 'rgba(255,255,255,.04)';
}

function getChipFill(skin) {
  if (skin.id === 'page') return 'rgba(116,40,24,.1)';
  if (skin.id === 'terminal') return 'rgba(127,219,106,.08)';
  return 'rgba(255,255,255,.06)';
}

export function buildObjectivesSurfaceModel(state) {
  const objectives = ((state && state.objectives && state.objectives.items) || []).map((objective, index) => {
    const max = Math.max(1, toFiniteNumber(objective?.max ?? objective?.target, 1));
    const cur = Math.max(0, Math.min(max, toFiniteNumber(objective?.cur ?? objective?.progress, 0)));
    return {
      id: objective?.id || `objective-${index}`,
      text: objective?.title || objective?.description || '',
      detail:
        objective?.title &&
        objective?.description &&
        objective.description !== objective.title
          ? objective.description
          : '',
      done: !!(objective?.done || objective?.completed),
      cur,
      max,
    };
  });

  const discoveries = ((state && state.discoveries && state.discoveries.items) || [])
    .map((entry, index) => ({
      id: `${entry?.word || 'discovery'}-${typeof entry?.index === 'number' ? entry.index : index}`,
      word: entry?.word || '',
      found: entry?.found !== false,
      index: typeof entry?.index === 'number' ? entry.index : index,
    }))
    .filter((entry) => entry.word)
    .sort((a, b) => b.index - a.index);

  const recent = ((state && state.history && state.history.recent) || []).map((entry, index) => ({
    id: `${entry?.word || 'recent'}-${index}`,
    word: entry?.word || '',
    score: toFiniteNumber(entry?.score, 0),
    note: entry?.shapeLabel || '',
  }));

  const rawSolutions = (state && state.solutions) || {};
  const solutions = (rawSolutions.items || [])
    .map((entry, index) => ({
      id: entry?.id || `${entry?.word || 'solution'}-${index}`,
      rank: toFiniteNumber(entry?.rank, index + 1),
      word: entry?.word || '',
      score: toFiniteNumber(entry?.score, 0),
      length: toFiniteNumber(entry?.length, String(entry?.word || '').length),
      playable: entry?.playable !== false,
      blocked: entry?.blocked === true || entry?.playable === false,
      found: !!entry?.found,
      planted: !!entry?.planted,
      pathCount: toFiniteNumber(entry?.pathCount, 0),
      shapeLabel: entry?.shapeLabel || '',
    }))
    .filter((entry) => entry.word);

  const objectivesDone = objectives.filter((objective) => objective.done).length;
  const objectivesTotal = typeof state?.objectives?.total === 'number' ? state.objectives.total : objectives.length;
  const discoveriesFound = typeof state?.discoveries?.found === 'number'
    ? state.discoveries.found
    : discoveries.filter((entry) => entry.found).length;
  const discoveriesTotal = typeof state?.discoveries?.total === 'number'
    ? state.discoveries.total
    : Math.max(discoveriesFound, discoveries.length);

  return {
    objectives,
    recent,
    discoveries,
    solutions,
    objectiveSummary: {
      done: objectivesDone,
      total: objectivesTotal,
    },
    discoverySummary: {
      found: discoveriesFound,
      total: discoveriesTotal,
    },
    solutionSummary: {
      ready: !!rawSolutions.ready,
      minLength: toFiniteNumber(rawSolutions.minLength, 5),
      visible: toFiniteNumber(rawSolutions.visible, solutions.length),
      total: toFiniteNumber(rawSolutions.total, solutions.length),
      playable: toFiniteNumber(rawSolutions.playable, solutions.filter((entry) => entry.playable).length),
      blocked: toFiniteNumber(rawSolutions.blocked, solutions.filter((entry) => entry.blocked).length),
    },
  };
}

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
          fontSize: 13,
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
        fontSize: 12,
        letterSpacing: '0.2em',
        color: 'var(--ink-faint)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function SheetHeading({ skin, children, meta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div
        style={{
          fontFamily: skin.id === 'page' ? 'var(--font-script)' : 'var(--font-mono)',
          fontSize: skin.id === 'page' ? 26 : 11,
          letterSpacing: skin.id === 'page' ? 0 : '0.18em',
          color: skin.id === 'page' ? 'var(--accent-2)' : 'var(--ink-soft)',
          lineHeight: 1,
          textTransform: skin.id === 'page' ? 'none' : 'uppercase',
        }}
      >
        {children}
      </div>
      {meta ? (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--ink-faint)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {meta}
        </div>
      ) : null}
    </div>
  );
}

function HandCheckbox({ done, roomy }) {
  return (
    <svg
      width={roomy ? '16' : '14'}
      height={roomy ? '16' : '14'}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0, marginTop: roomy ? 2 : 4 }}
    >
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="#2a1a10" strokeWidth="1.2" transform="rotate(-2 8 8)" />
      {done ? <path d="M3 8 L 7 12 L 14 3" fill="none" stroke="#742818" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /> : null}
    </svg>
  );
}

function FBCheckbox({ done, roomy }) {
  return (
    <div
      style={{
        width: roomy ? 16 : 14,
        height: roomy ? 16 : 14,
        marginTop: roomy ? 1 : 2,
        flexShrink: 0,
        border: done ? 'none' : '1.5px solid var(--ink-faint)',
        background: done ? 'var(--accent)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {done ? (
        <svg width="9" height="9" viewBox="0 0 9 9">
          <path d="M1 4.5 L 3.5 7 L 8 1.5" stroke="#0c0d0e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      ) : null}
    </div>
  );
}

function ObjectiveRow({ skin, objective, roomy = false }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const isFB = skin.id === 'fullbleed';
  const pct = Math.max(0, Math.min(100, (objective.cur / objective.max) * 100));
  const wrapperStyle = roomy
    ? {
        marginBottom: 10,
        padding: '12px 12px 10px',
        borderRadius: 16,
        border: '1px solid var(--rule-faint)',
        background: getCardFill(skin),
      }
    : {
        marginBottom: 12,
      };

  return (
    <div style={wrapperStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: roomy ? 10 : 8 }}>
        {isPage ? <HandCheckbox done={objective.done} roomy={roomy} /> : null}
        {isTerm ? (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: roomy ? 13 : 12,
              color: objective.done ? 'var(--ink)' : 'var(--ink-faint)',
              marginTop: 1,
            }}
          >
            {objective.done ? '[x]' : '[ ]'}
          </span>
        ) : null}
        {isFB ? <FBCheckbox done={objective.done} roomy={roomy} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: isPage ? 'var(--font-script)' : 'var(--font-body)',
              fontSize: isPage ? (roomy ? 24 : 20) : (isTerm ? (roomy ? 13 : 12) : (roomy ? 16 : 14)),
              fontWeight: isFB ? 500 : 400,
              lineHeight: 1.2,
              color: objective.done ? 'var(--ink-faint)' : 'var(--ink)',
              textDecoration: objective.done ? 'line-through' : 'none',
              textDecorationColor: 'var(--accent)',
              textTransform: isTerm ? 'uppercase' : 'none',
            }}
          >
            {objective.text}
          </div>
          {roomy && objective.detail ? (
            <div
              style={{
                marginTop: 3,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--ink-soft)',
                lineHeight: 1.3,
              }}
            >
              {objective.detail}
            </div>
          ) : null}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: roomy ? 8 : 4 }}>
            <div style={{ flex: 1, height: roomy ? 4 : 2, background: 'var(--rule-faint)', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${pct}%`,
                  background: objective.done ? 'var(--accent-2)' : 'var(--accent)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: roomy ? 11 : 10,
                color: 'var(--ink-faint)',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {objective.cur}/{objective.max}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ skin, entry, roomy = false }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const wrapperStyle = roomy
    ? {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 14,
        border: '1px solid var(--rule-faint)',
        background: getCardFill(skin),
      }
    : {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: isPage ? '0.5px dotted var(--rule-faint)' : 'none',
        gap: 8,
      };

  return (
    <div style={wrapperStyle}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        {isTerm ? <span style={{ color: 'var(--ink-faint)' }}>&gt;</span> : null}
        <span
          style={{
            fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
            fontSize: roomy ? 15 : (isTerm ? 12 : 14),
            fontVariant: isPage ? 'small-caps' : 'normal',
            letterSpacing: isPage ? '0.08em' : '0.04em',
            color: 'var(--ink)',
            fontWeight: skin.id === 'fullbleed' ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {isPage ? (entry.word || '').toLowerCase() : (entry.word || '')}
        </span>
        {entry.note && !isTerm ? (
          <span style={{ fontSize: roomy ? 10 : 9, fontStyle: 'italic', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
            {entry.note}
          </span>
        ) : null}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: roomy ? 13 : 12,
          color: 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        +{entry.score}
      </span>
    </div>
  );
}

function SolutionRow({ skin, entry, roomy = false }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const muted = entry.blocked;
  const status = entry.found ? 'found' : (entry.blocked ? 'blocked' : `${entry.length} letters`);
  const note = entry.shapeLabel ? `${status} · ${entry.shapeLabel}` : status;
  const wrapperStyle = roomy
    ? {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 6,
        border: '1px solid var(--rule-faint)',
        background: muted ? 'transparent' : getCardFill(skin),
        opacity: muted ? 0.48 : 1,
      }
    : {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 8,
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: isPage ? '0.5px dotted var(--rule-faint)' : 'none',
        opacity: muted ? 0.45 : 1,
      };

  return (
    <div data-testid="solution-row" data-playable={entry.playable ? 'true' : 'false'} style={wrapperStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
          {isTerm ? <span style={{ color: muted ? 'var(--ink-faint)' : 'var(--accent)' }}>{entry.playable ? '$' : '#'}</span> : null}
          <span
            style={{
              fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
              fontSize: roomy ? 15 : (isTerm ? 12 : 14),
              fontVariant: isPage ? 'small-caps' : 'normal',
              letterSpacing: isPage ? '0.08em' : '0.04em',
              color: muted ? 'var(--ink-faint)' : 'var(--ink)',
              fontWeight: skin.id === 'fullbleed' ? 600 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: entry.found ? 'line-through' : 'none',
              textDecorationColor: 'var(--accent)',
            }}
          >
            {isPage ? (entry.word || '').toLowerCase() : (entry.word || '')}
          </span>
          {entry.found ? (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: roomy ? 10 : 9,
                color: 'var(--accent)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              done
            </span>
          ) : null}
        </div>
        <div
          style={{
            marginTop: roomy ? 3 : 1,
            fontFamily: 'var(--font-mono)',
            fontSize: roomy ? 10 : 9,
            color: muted ? 'var(--ink-faint)' : 'var(--ink-soft)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {note}
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: roomy ? 13 : 12,
          color: muted ? 'var(--ink-faint)' : 'var(--accent)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {entry.score}
      </span>
    </div>
  );
}

function EmptyState({ children, roomy = false }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: roomy ? 13 : 12,
        color: 'var(--ink-faint)',
        fontStyle: 'italic',
        lineHeight: 1.35,
      }}
    >
      {children}
    </div>
  );
}

function SummaryCard({ skin, label, value, detail }) {
  return (
    <div
      style={{
        padding: '12px 12px 11px',
        borderRadius: 16,
        border: '1px solid var(--rule-faint)',
        background: getCardFill(skin),
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: skin.id === 'page' ? 'var(--font-script)' : 'var(--font-display)',
          fontSize: skin.id === 'page' ? 28 : 20,
          color: 'var(--ink)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 5,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          color: 'var(--ink-soft)',
          lineHeight: 1.25,
        }}
      >
        {detail}
      </div>
    </div>
  );
}

function DiscoveryChip({ skin, word }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 10px',
        borderRadius: 999,
        border: '1px solid var(--rule-faint)',
        background: getChipFill(skin),
        maxWidth: '100%',
      }}
    >
      <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, flexShrink: 0 }}>★</span>
      <span
        style={{
          fontFamily: skin.id === 'terminal' ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: 14,
          color: 'var(--ink)',
          letterSpacing: skin.id === 'page' ? '0.06em' : '0.03em',
          fontVariant: skin.id === 'page' ? 'small-caps' : 'normal',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {skin.id === 'page' ? String(word).toLowerCase() : word}
      </span>
    </div>
  );
}

function RailSurface({ skin, model }) {
  const solutionMeta = model.solutionSummary.ready
    ? `${model.solutionSummary.playable}/${model.solutionSummary.total} playable`
    : 'pending';

  return (
    <>
      <RailHeading skin={skin}>Objectives</RailHeading>
      <div style={{ marginTop: 10, flexShrink: 0 }}>
        {model.objectives.length === 0 ? (
          <EmptyState>none yet</EmptyState>
        ) : (
          model.objectives.map((objective) => <ObjectiveRow key={objective.id} skin={skin} objective={objective} />)
        )}
      </div>

      <div style={{ height: 16 }} />

      <RailHeading skin={skin}>Solutions</RailHeading>
      <div
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--ink-faint)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {model.solutionSummary.minLength}+ letters · {solutionMeta}
      </div>
      <div data-testid="solutions-surface" style={{ marginTop: 8, flex: '1 1 220px', overflow: 'auto', minHeight: 0 }}>
        {model.solutions.length === 0 ? (
          <EmptyState>no solutions yet</EmptyState>
        ) : (
          model.solutions.map((entry) => <SolutionRow key={entry.id} skin={skin} entry={entry} />)
        )}
      </div>

      <div style={{ height: 14, flexShrink: 0 }} />

      <RailHeading skin={skin}>{skin.id === 'terminal' ? 'Scrollback' : 'Recent'}</RailHeading>
      <div style={{ marginTop: 8, flex: '0 0 auto', maxHeight: 138, overflow: 'auto', minHeight: 0 }}>
        {model.recent.length === 0 ? (
          <EmptyState>no words yet</EmptyState>
        ) : (
          model.recent.map((entry) => <RecentRow key={entry.id} skin={skin} entry={entry} />)
        )}
      </div>
    </>
  );
}

function SheetSurface({ skin, model }) {
  const objectiveMeta = model.objectiveSummary.total > 0
    ? `${model.objectiveSummary.done}/${model.objectiveSummary.total} complete`
    : 'none yet';
  const discoveryTotal = model.discoverySummary.total || model.discoverySummary.found || 0;
  const discoveryMeta = discoveryTotal > 0
    ? `${model.discoverySummary.found}/${discoveryTotal} found`
    : 'none yet';
  const solutionMeta = model.solutionSummary.ready
    ? `${model.solutionSummary.playable}/${model.solutionSummary.total} playable`
    : 'pending';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))', gap: 10 }}>
        <SummaryCard
          skin={skin}
          label="Objectives"
          value={`${model.objectiveSummary.done}/${model.objectiveSummary.total || 0}`}
          detail={model.objectiveSummary.total > 0 ? `${Math.max(0, model.objectiveSummary.total - model.objectiveSummary.done)} remaining` : 'No objectives yet'}
        />
        <SummaryCard
          skin={skin}
          label="Solutions"
          value={`${model.solutionSummary.playable}`}
          detail={model.solutionSummary.ready ? `${model.solutionSummary.minLength}+ letters, ${model.solutionSummary.blocked} blocked` : 'Pending board solve'}
        />
        <SummaryCard
          skin={skin}
          label="Discovered"
          value={`${model.discoverySummary.found}/${discoveryTotal}`}
          detail={discoveryTotal > 0 ? 'Found planted words this round' : 'No planted words found yet'}
        />
      </div>

      <div>
        <SheetHeading skin={skin} meta={objectiveMeta}>Objectives</SheetHeading>
        <div style={{ marginTop: 10 }}>
          {model.objectives.length === 0 ? (
            <EmptyState roomy>No objectives yet.</EmptyState>
          ) : (
            model.objectives.map((objective) => <ObjectiveRow key={objective.id} skin={skin} objective={objective} roomy />)
          )}
        </div>
      </div>

      <div>
        <SheetHeading skin={skin} meta={solutionMeta}>Solutions</SheetHeading>
        <div
          data-testid="solutions-sheet"
          style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}
        >
          {model.solutions.length === 0 ? (
            <EmptyState roomy>No solutions yet.</EmptyState>
          ) : (
            model.solutions.map((entry) => <SolutionRow key={entry.id} skin={skin} entry={entry} roomy />)
          )}
        </div>
      </div>

      <div>
        <SheetHeading skin={skin} meta={discoveryMeta}>Discovered</SheetHeading>
        <div style={{ marginTop: 10 }}>
          {model.discoveries.length === 0 ? (
            <EmptyState roomy>Find planted words to populate this list.</EmptyState>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {model.discoveries.map((entry) => <DiscoveryChip key={entry.id} skin={skin} word={entry.word} />)}
            </div>
          )}
        </div>
      </div>

      {model.recent.length > 0 ? (
        <div>
          <SheetHeading skin={skin} meta={`${model.recent.length} recent`}>Latest Scores</SheetHeading>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {model.recent.slice(0, 4).map((entry) => <RecentRow key={entry.id} skin={skin} entry={entry} roomy />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ObjectivesSurface({ skin, state, variant = 'rail' }) {
  const model = buildObjectivesSurfaceModel(state);
  return variant === 'sheet'
    ? <SheetSurface skin={skin} model={model} />
    : <RailSurface skin={skin} model={model} />;
}
