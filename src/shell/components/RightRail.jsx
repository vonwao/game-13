// RightRail — objectives + recent words.
// Ported from /tmp/lexicon-design/lexicon-deep/project/layout.jsx (lines 160-300).

import ObjectivesSurface, { buildObjectivesSurfaceModel } from './ObjectivesSurface.jsx';

export default function RightRail({ skin, state, phone }) {
  const collapsed = !!skin.rightRailDefaultCollapsed && !phone;
  const model = buildObjectivesSurfaceModel(state);

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
          borderLeft: '1px solid var(--rule-faint)',
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
          {model.objectives.map((objective) => (
            <div
              key={objective.id}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: objective.done ? 'var(--accent)' : 'transparent',
                border: objective.done ? 'none' : '1.5px solid var(--ink-faint)',
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
          {model.recent.length}
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
        borderLeft: phone ? 'none' : '1px solid var(--rule-faint)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <ObjectivesSurface skin={skin} state={state} variant="rail" />
    </div>
  );
}
