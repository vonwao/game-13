// PhoneObjTab — collapsed objectives strip for phone layout.
// Ported from /tmp/lexicon-design/lexicon-deep/project/layout.jsx (lines 354-380).

export default function PhoneObjTab({ skin, objectives, onExpand }) {
  const items = objectives?.items || [];
  const done = items.filter((o) => o.done || o.completed).length;
  return (
    <div
      onClick={onExpand}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderTop: '1px solid var(--rule-faint)',
        borderBottom: '1px solid var(--rule-faint)',
        fontSize: 11,
        color: 'var(--ink-soft)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        cursor: onExpand ? 'pointer' : 'default',
      }}
    >
      <span>Objectives</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {items.map((o, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: (o.done || o.completed) ? 'var(--accent)' : 'transparent',
              border: (o.done || o.completed) ? 'none' : '1px solid var(--ink-faint)',
            }}
          />
        ))}
      </div>
      <span style={{ color: 'var(--ink-faint)' }}>
        {done}/{items.length}
      </span>
      <div style={{ flex: 1 }} />
      {onExpand ? <span style={{ color: 'var(--ink-faint)' }}>tap to expand ›</span> : null}
    </div>
  );
}
