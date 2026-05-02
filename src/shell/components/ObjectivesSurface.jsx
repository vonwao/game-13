import { useState } from 'react';

const SOLUTION_FILTERS = [
  { key: 'playable', label: 'Playable' },
  { key: 'all', label: 'All' },
  { key: 'blocked', label: 'Blocked' },
];

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
      path: Array.isArray(entry?.path)
        ? entry.path
            .filter((step) => step && Number.isFinite(step.col) && Number.isFinite(step.row))
            .map((step) => ({ col: step.col, row: step.row }))
        : [],
      score: toFiniteNumber(entry?.score, 0),
      length: toFiniteNumber(entry?.length, String(entry?.word || '').length),
      commonRank: toFiniteNumber(entry?.commonRank, 0),
      playerFacing: entry?.playerFacing !== false,
      playable: entry?.playable !== false,
      blocked: entry?.blocked === true || entry?.playable === false,
      found: !!entry?.found,
      planted: !!entry?.planted,
      pathCount: toFiniteNumber(entry?.pathCount, 0),
      lengthBase: toFiniteNumber(entry?.lengthBase, 0),
      tileBonus: toFiniteNumber(entry?.tileBonus, 0),
      shapeBonus: toFiniteNumber(entry?.shapeBonus, 0),
      shapeLabel: entry?.shapeLabel || '',
      crystalBonus: toFiniteNumber(entry?.crystalBonus, 0),
      emberBonus: toFiniteNumber(entry?.emberBonus, 0),
      wildcardPenalty: toFiniteNumber(entry?.wildcardPenalty, 0),
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
      dictionaryTotal: toFiniteNumber(rawSolutions.dictionaryTotal, rawSolutions.total || solutions.length),
      playerFacingTotal: toFiniteNumber(rawSolutions.playerFacingTotal, rawSolutions.total || solutions.length),
    },
    solutionFilterCounts: {
      all: solutions.length,
      playable: solutions.filter((entry) => entry.playable).length,
      blocked: solutions.filter((entry) => entry.blocked).length,
    },
  };
}

function filterSolutions(solutions, filter) {
  if (filter === 'blocked') return solutions.filter((entry) => entry.blocked);
  if (filter === 'all') return solutions;
  return solutions.filter((entry) => entry.playable);
}

function getSolutionEmptyCopy(filter) {
  if (filter === 'blocked') return 'no blocked solutions';
  if (filter === 'all') return 'no solutions yet';
  return 'no playable solutions';
}

function signedNumber(value) {
  const num = toFiniteNumber(value, 0);
  if (!num) return '';
  return `${num > 0 ? '+' : '-'}${Math.abs(num)}`;
}

function formatScoreFormula(entry, compact = false) {
  const parts = [];
  if (entry.lengthBase) parts.push(`Len ${entry.lengthBase}`);
  parts.push(`Tile +${entry.tileBonus || 0}`);
  const shape = signedNumber(entry.shapeBonus);
  if (shape) parts.push(`Shape ${shape}`);
  if (entry.crystalBonus) parts.push(`Crystal +${entry.crystalBonus}`);
  if (entry.emberBonus) parts.push(`Ember +${entry.emberBonus}`);
  if (entry.wildcardPenalty) parts.push(`Wild -${entry.wildcardPenalty}`);
  const joined = parts.join(compact ? ' · ' : '  ');
  return joined ? `${joined} = ${entry.score}` : String(entry.score || 0);
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

function TraceIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 2.5 L9 6 L3 9.5 Z" fill="currentColor" />
    </svg>
  );
}

function SolutionRow({
  skin,
  entry,
  roomy = false,
  selected = false,
  onSelect,
  onTrace,
  tracing = false,
  hasPath = true,
}) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const muted = entry.blocked;
  const status = entry.found ? 'found' : (entry.blocked ? 'blocked' : `${entry.length} letters`);
  const source = entry.planted
    ? 'planted'
    : (entry.commonRank ? `common #${entry.commonRank}` : 'dictionary');
  const note = entry.shapeLabel ? `${status} · ${entry.shapeLabel} · ${source}` : `${status} · ${source}`;
  const formula = formatScoreFormula(entry, !roomy);
  const interactive = !!onSelect && hasPath;
  const selectedBorder = selected
    ? '1px solid var(--accent)'
    : '1px solid var(--rule-faint)';
  const wrapperStyle = roomy
    ? {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 6,
        border: selectedBorder,
        background: selected
          ? (skin.id === 'terminal' ? 'rgba(127,219,106,.10)' : 'rgba(255,255,255,.08)')
          : (muted ? 'transparent' : getCardFill(skin)),
        opacity: muted && !selected ? 0.55 : 1,
        cursor: interactive ? 'pointer' : 'default',
        textAlign: 'left',
        boxShadow: selected ? '0 0 0 1px var(--accent) inset' : 'none',
        transition: 'background 120ms ease, border-color 120ms ease',
      }
    : {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 8,
        alignItems: 'center',
        padding: selected ? '5px 6px' : '6px 0',
        borderRadius: selected ? 4 : 0,
        borderBottom: isPage && !selected ? '0.5px dotted var(--rule-faint)' : 'none',
        background: selected
          ? (skin.id === 'terminal' ? 'rgba(127,219,106,.10)' : 'rgba(255,255,255,.06)')
          : 'transparent',
        opacity: muted && !selected ? 0.55 : 1,
        cursor: interactive ? 'pointer' : 'default',
        textAlign: 'left',
        boxShadow: selected ? `0 0 0 1px var(--accent)` : 'none',
        transition: 'background 120ms ease, box-shadow 120ms ease',
      };

  function handleSelectClick(event) {
    if (!interactive) return;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    onSelect(entry);
  }

  function handleTraceClick(event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (!hasPath || !onTrace) return;
    onTrace(entry);
  }

  return (
    <div
      data-testid="solution-row"
      data-playable={entry.playable ? 'true' : 'false'}
      data-selected={selected ? 'true' : 'false'}
      data-tracing={tracing ? 'true' : 'false'}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? handleSelectClick : undefined}
      onKeyDown={interactive ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') handleSelectClick(event);
      } : undefined}
      style={wrapperStyle}
    >
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
          {selected ? (
            <span
              data-testid="solution-row-selected-pip"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: roomy ? 10 : 9,
                color: 'var(--accent)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {tracing ? 'tracing' : 'shown'}
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
        <div
          style={{
            marginTop: roomy ? 4 : 2,
            fontFamily: 'var(--font-mono)',
            fontSize: roomy ? 10 : 9,
            color: muted ? 'var(--ink-faint)' : 'var(--ink-faint)',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={formula}
        >
          {formula}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: roomy ? 8 : 6, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: roomy ? 13 : 12,
            color: muted ? 'var(--ink-faint)' : 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 600,
          }}
        >
          {entry.score}
        </span>
        {hasPath && onTrace ? (
          <button
            type="button"
            onClick={handleTraceClick}
            data-testid="solution-row-trace"
            aria-label={`Animate path for ${entry.word}`}
            title={tracing ? 'Tracing…' : 'Animate path'}
            style={{
              appearance: 'none',
              minWidth: 0,
              width: roomy ? 26 : 22,
              height: roomy ? 26 : 22,
              padding: 0,
              border: '1px solid var(--rule-faint)',
              borderRadius: 999,
              background: tracing ? 'var(--accent)' : 'transparent',
              color: tracing ? 'var(--bg)' : 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TraceIcon />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SolutionFilterControl({ skin, value, onChange, counts }) {
  return (
    <div
      role="tablist"
      aria-label="Solution filter"
      data-testid="solutions-filter-control"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 2,
        padding: 2,
        border: '1px solid var(--rule-faint)',
        borderRadius: 6,
        background: skin.id === 'terminal' ? 'rgba(127,219,106,.04)' : 'rgba(255,255,255,.03)',
      }}
    >
      {SOLUTION_FILTERS.map((filter) => {
        const active = value === filter.key;
        return (
          <button
            key={filter.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-pressed={active}
            data-testid={`solutions-filter-${filter.key}`}
            onClick={() => onChange(filter.key)}
            style={{
              appearance: 'none',
              minWidth: 0,
              minHeight: 28,
              border: 'none',
              borderRadius: 4,
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--ink-soft)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '5px 6px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{filter.label}</span>
            <span style={{ opacity: active ? 0.78 : 0.72 }}>{counts[filter.key] || 0}</span>
          </button>
        );
      })}
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

function RailSurface({
  skin,
  model,
  solutionFilter,
  onSolutionFilterChange,
  onSelectSolution,
  onTraceSolution,
  selectedSolutionId,
  tracingSolutionId,
}) {
  const solutionMeta = model.solutionSummary.ready
    ? `${model.solutionSummary.playable}/${model.solutionSummary.total} common playable`
    : 'pending';
  const filteredSolutions = filterSolutions(model.solutions, solutionFilter);

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
      <div style={{ marginTop: 8, flexShrink: 0 }}>
        <SolutionFilterControl
          skin={skin}
          value={solutionFilter}
          onChange={onSolutionFilterChange}
          counts={model.solutionFilterCounts}
        />
      </div>
      <div
        data-testid="solutions-surface"
        data-filter={solutionFilter}
        style={{ marginTop: 8, flex: '1 1 220px', overflow: 'auto', minHeight: 0 }}
      >
        {filteredSolutions.length === 0 ? (
          <EmptyState>{getSolutionEmptyCopy(solutionFilter)}</EmptyState>
        ) : (
          filteredSolutions.map((entry) => (
            <SolutionRow
              key={entry.id}
              skin={skin}
              entry={entry}
              hasPath={Array.isArray(entry.path) && entry.path.length > 0}
              selected={!!selectedSolutionId && selectedSolutionId === entry.id}
              tracing={!!tracingSolutionId && tracingSolutionId === entry.id}
              onSelect={onSelectSolution}
              onTrace={onTraceSolution}
            />
          ))
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

function SheetSurface({
  skin,
  model,
  solutionFilter,
  onSolutionFilterChange,
  onSelectSolution,
  onTraceSolution,
  selectedSolutionId,
  tracingSolutionId,
}) {
  const objectiveMeta = model.objectiveSummary.total > 0
    ? `${model.objectiveSummary.done}/${model.objectiveSummary.total} complete`
    : 'none yet';
  const discoveryTotal = model.discoverySummary.total || model.discoverySummary.found || 0;
  const discoveryMeta = discoveryTotal > 0
    ? `${model.discoverySummary.found}/${discoveryTotal} found`
    : 'none yet';
  const solutionMeta = model.solutionSummary.ready
    ? `${model.solutionSummary.playable}/${model.solutionSummary.total} common playable`
    : 'pending';
  const filteredSolutions = filterSolutions(model.solutions, solutionFilter);

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
          detail={model.solutionSummary.ready ? `${model.solutionSummary.minLength}+ common words, ${model.solutionSummary.blocked} blocked` : 'Pending board solve'}
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
        <div style={{ marginTop: 10 }}>
          <SolutionFilterControl
            skin={skin}
            value={solutionFilter}
            onChange={onSolutionFilterChange}
            counts={model.solutionFilterCounts}
          />
        </div>
        <div
          data-testid="solutions-sheet"
          data-filter={solutionFilter}
          style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflow: 'auto' }}
        >
          {filteredSolutions.length === 0 ? (
            <EmptyState roomy>{getSolutionEmptyCopy(solutionFilter)}</EmptyState>
          ) : (
            filteredSolutions.map((entry) => (
              <SolutionRow
                key={entry.id}
                skin={skin}
                entry={entry}
                roomy
                hasPath={Array.isArray(entry.path) && entry.path.length > 0}
                selected={!!selectedSolutionId && selectedSolutionId === entry.id}
                tracing={!!tracingSolutionId && tracingSolutionId === entry.id}
                onSelect={onSelectSolution}
                onTrace={onTraceSolution}
              />
            ))
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

export default function ObjectivesSurface({
  skin,
  state,
  variant = 'rail',
  onSelectSolution,
  onTraceSolution,
  selectedSolutionId,
  tracingSolutionId,
}) {
  const model = buildObjectivesSurfaceModel(state);
  const [solutionFilter, setSolutionFilter] = useState('playable');
  const sharedProps = {
    skin,
    model,
    solutionFilter,
    onSolutionFilterChange: setSolutionFilter,
    onSelectSolution,
    onTraceSolution,
    selectedSolutionId,
    tracingSolutionId,
  };
  return variant === 'sheet'
    ? <SheetSurface {...sharedProps} />
    : <RailSurface {...sharedProps} />;
}
