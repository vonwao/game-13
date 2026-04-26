// ActionBar — typed-word preview, status note, four action buttons.
// Ported from /tmp/lexicon-design/lexicon-deep/project/layout.jsx (lines 303-351).

export default function ActionBar({ skin, state, actions, phone }) {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const isFB = skin.id === 'fullbleed';

  const input = state.inputSummary || {};
  const hunt = state.huntSummary || {};
  const word = (input.typed || '').toUpperCase();
  const ambiguous = !!input.pathAmbiguous;
  const previewTotal = input.scorePreview && typeof input.scorePreview.total === 'number'
    ? `+${input.scorePreview.total}`
    : '';
  const status = !word ? 'empty' : (input.valid && input.hasPath ? 'valid' : 'invalid');
  const statusText = ambiguous
    ? (isTerm ? 'MULTIPLE ROUTES' : 'multiple routes')
    : status === 'valid'
      ? (isTerm ? 'VALID' : 'valid')
      : status === 'invalid'
        ? (isTerm ? 'NOT IN LEXICON' : 'not in the lexicon')
        : (isTerm ? 'AWAITING INPUT' : 'trace tiles or type');

  const submitDisabled = !(input.valid && input.hasPath);
  const undoDisabled = !word;
  const clearDisabled = !word;
  const clueDisabled = (hunt.cluesRemaining || 0) <= 0;

  return (
    <div
      style={{
        padding: phone ? '12px 14px 14px' : '16px 28px 18px',
        borderTop: '1px solid var(--rule-faint)',
        background: isTerm ? 'var(--surface-deep)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: phone ? 8 : 18,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: phone ? 9 : 10,
            letterSpacing: '0.2em',
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          {isPage ? 'Inscribed' : 'Tracing'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: phone ? 8 : 14 }}>
          {isTerm && <span style={{ color: 'var(--ink-soft)' }}>&gt;</span>}
          <span
            data-testid="action-bar-word"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: phone ? 22 : (isFB ? 32 : 28),
              fontWeight: 700,
              letterSpacing: isPage ? '0.18em' : '0.14em',
              color: status === 'invalid' ? 'var(--ink-faint)' : (isFB ? 'var(--ink)' : 'var(--accent)'),
              lineHeight: 1,
              textShadow: isTerm && status === 'valid' ? '0 0 8px var(--ink)' : 'none',
              transition: 'color .15s',
              animation: status === 'invalid' ? 'shake .35s' : 'none',
            }}
          >
            {word
              ? (isPage ? word.split('').join('·') : word)
              : <span style={{ color: 'var(--ink-faint)', fontWeight: 400, fontSize: phone ? 16 : 18, letterSpacing: 0 }}>{isTerm ? '_' : '—'}</span>}
          </span>
          {previewTotal && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: phone ? 14 : 18,
                color: status === 'invalid' ? 'var(--ink-faint)' : 'var(--accent)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {status === 'invalid' ? '·' : previewTotal}
            </span>
          )}
          {!phone && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink-faint)',
                fontStyle: isPage ? 'italic' : 'normal',
                fontFamily: isTerm ? 'var(--font-mono)' : 'var(--font-body)',
              }}
            >
              {statusText}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: phone ? 6 : 10, flexShrink: 0 }}>
        <BtnWrap onClick={actions.submitCurrentWord} disabled={submitDisabled}>
          <skin.ActionBtn label="Submit" kbd="↵" primary compact={phone} />
        </BtnWrap>
        <BtnWrap onClick={actions.clearCurrentWord} disabled={clearDisabled}>
          <skin.ActionBtn label="Clear" kbd="esc" compact={phone} />
        </BtnWrap>
        <BtnWrap onClick={actions.undoTileSelection} disabled={undoDisabled}>
          <skin.ActionBtn label="Undo" kbd="⌫" compact={phone} />
        </BtnWrap>
        <BtnWrap onClick={actions.useClue} disabled={clueDisabled}>
          <skin.ActionBtn label="Clue" kbd="c" warm compact={phone} />
        </BtnWrap>
      </div>
    </div>
  );
}

// Wrap the skin's ActionBtn (itself a <button>) to attach onClick + disabled
// without each skin needing to know about wiring.
function BtnWrap({ children, onClick, disabled }) {
  return (
    <span
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </span>
  );
}
