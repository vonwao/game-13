import PanelFrame from '../components/PanelFrame.jsx';

function pct(progress, target) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, (progress / target) * 100));
}

export default function ObjectivesPanel({ objectives }) {
  const items = objectives?.items || [];

  return (
    <PanelFrame
      eyebrow="Objectives"
      title={`Round goals ${objectives?.completed || 0}/${objectives?.total || 0}`}
      footer="Complete the current round goals to advance deeper."
    >
      {items.length === 0 ? (
        <div className="panel-note">No active objectives for this mode.</div>
      ) : (
        <div className="objective-list">
          {items.map((item) => (
            <article
              key={item.id}
              className={`objective-card${item.completed ? ' objective-card--complete' : ''}`}
            >
              <div className="objective-card__header">
                <div>
                  <strong>{item.completed ? '✓ ' : '○ '}{item.title}</strong>
                  <div className="panel-list__meta">{item.description}</div>
                </div>
                <span className="objective-card__reward">+{item.reward}</span>
              </div>
              <div className="objective-card__meter" aria-hidden="true">
                <span style={{ width: `${pct(item.progress, item.target)}%` }} />
              </div>
              <div className="objective-card__footer">
                <span>{item.progressText || `${item.progress}/${item.target}`}</span>
                <span>{item.completed ? 'Complete' : 'In progress'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}
