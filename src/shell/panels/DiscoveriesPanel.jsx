import PanelFrame from '../components/PanelFrame.jsx';

export default function DiscoveriesPanel({ discoveries, cluesRemaining }) {
  const recent = discoveries?.recent || [];

  return (
    <PanelFrame
      eyebrow="Discoveries"
      title={`Hidden words ${discoveries?.found || 0}/${discoveries?.total || 0}`}
      subtitle={`Clues remaining: ${cluesRemaining || 0}`}
      footer="Hidden words boost your score and progression."
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
