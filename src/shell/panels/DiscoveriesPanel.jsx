import PanelFrame from '../components/PanelFrame.jsx';

export default function DiscoveriesPanel({ discoveries, cluesRemaining }) {
  const recent = discoveries?.recent || [];

  return (
    <PanelFrame
      eyebrow="Discoveries"
      title={`Hidden words ${discoveries?.found || 0}/${discoveries?.total || 0}`}
      subtitle={`Clues remaining: ${cluesRemaining || 0}`}
      footer="Finding planted words is a real scoring and progression lever, not just flavor."
    >
      {recent.length === 0 ? (
        <div className="panel-note">
          No hidden words found yet. Use a clue if the board goes flat.
        </div>
      ) : (
        <div className="discovery-grid">
          {recent.map((word) => (
            <span key={word.word || word} className="discovery-pill">
              {word.word || word}
            </span>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}
