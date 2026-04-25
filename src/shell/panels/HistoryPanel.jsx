import PanelFrame from '../components/PanelFrame.jsx';

function formatFactor(value) {
  if (value == null) return null;
  return Number(value).toFixed(1);
}

function buildHistoryDetail(entry) {
  const parts = [];

  if (entry.basePts != null) parts.push(`base ${entry.basePts}`);
  if (entry.lenMult && entry.lenMult !== 1) parts.push(`len ×${formatFactor(entry.lenMult)}`);
  if (entry.shapeMult && entry.shapeMult !== 1) parts.push(`shape ×${formatFactor(entry.shapeMult)}`);
  if (entry.comboMult && entry.comboMult !== 1) parts.push(`combo ×${formatFactor(entry.comboMult)}`);
  if (entry.crystalMult && entry.crystalMult !== 1) parts.push(`crystal ×${formatFactor(entry.crystalMult)}`);
  if (entry.emberBonus) parts.push(`ember +${entry.emberBonus}`);
  if (entry.discoveryBonus) parts.push(`discovery +${entry.discoveryBonus}`);
  if (entry.objectiveBonus) parts.push(`objective +${entry.objectiveBonus}`);

  return parts.length > 0 ? parts.join(' · ') : (entry.reasonText || 'core-recorded scoring');
}

export default function HistoryPanel({ history }) {
  const recent = history?.recent || [];

  return (
    <PanelFrame
      eyebrow="History"
      title="Recent words"
      bodyClassName="panel-frame__body--scroll"
    >
      <div className="shell-kv">
        <span className="shell-kv__label">Words</span>
        <span className="shell-kv__value">{history?.total || 0}</span>
      </div>

      {recent.length === 0 ? (
        <div className="panel-note">No submitted words yet.</div>
      ) : (
        <div className="panel-list">
          {recent.map((entry, index) => (
            <div key={`${entry.word}-${index}`} className="panel-list__row">
              <div>
                <strong>{entry.word}</strong>
                <div className="panel-list__meta">{buildHistoryDetail(entry)}</div>
                {entry.reasonText ? <div className="panel-list__meta">{entry.reasonText}</div> : null}
              </div>
              <span className="panel-list__score">+{entry.score}</span>
            </div>
          ))}
        </div>
      )}
    </PanelFrame>
  );
}
