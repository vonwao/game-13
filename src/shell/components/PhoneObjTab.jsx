import { useEffect, useState } from 'react';
import ObjectivesSurface, { buildObjectivesSurfaceModel } from './ObjectivesSurface.jsx';
import useGameShellState from '../useGameShellState.js';

function getSheetBackdrop(skin) {
  if (skin.id === 'terminal') return 'rgba(0,0,0,.72)';
  if (skin.id === 'page') return 'rgba(42,26,16,.28)';
  return 'rgba(7,8,10,.56)';
}

function getSheetFill(skin) {
  if (skin.id === 'terminal') return 'rgba(6,8,10,.98)';
  if (skin.id === 'page') return 'rgba(243,233,210,.98)';
  return 'rgba(18,20,24,.98)';
}

function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      style={{
        flexShrink: 0,
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform .18s ease',
      }}
      aria-hidden="true"
    >
      <path d="M3 5.25 7 9 11 5.25" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PhoneObjTab({
  skin,
  objectives,
  state,
  open,
  defaultOpen = false,
  onOpenChange,
  onExpand,
}) {
  const { state: shellState } = useGameShellState();
  const resolvedState = state || (objectives ? { ...shellState, objectives } : shellState);
  const model = buildObjectivesSurfaceModel(resolvedState);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : uncontrolledOpen;
  const discoveryTotal = model.discoverySummary.total || model.discoverySummary.found || 0;
  const discoveryLabel = discoveryTotal > 0
    ? `Discovered ${model.discoverySummary.found}/${discoveryTotal}`
    : 'No discoveries yet';

  function setOpenState(nextOpen) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    if (nextOpen && !isOpen && onExpand) {
      onExpand(nextOpen);
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenState(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', zIndex: isOpen ? 30 : 1 }}>
      {isOpen ? (
        <>
          <div
            data-testid="phone-objectives-backdrop"
            onClick={() => setOpenState(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 30,
              background: getSheetBackdrop(skin),
              backdropFilter: 'blur(6px)',
            }}
          />
          <div
            data-testid="phone-objectives-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Objectives and discovered words"
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 31,
              paddingLeft: 'max(10px, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(10px, env(safe-area-inset-right, 0px))',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div
              style={{
                maxHeight: 'min(74vh, 640px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderTopLeftRadius: 22,
                borderTopRightRadius: 22,
                border: '1px solid var(--rule-faint)',
                background: getSheetFill(skin),
                boxShadow: '0 -18px 50px rgba(0,0,0,.32)',
              }}
            >
              <div
                style={{
                  paddingTop: 8,
                  paddingBottom: 6,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 999,
                    background: 'var(--rule-faint)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0 16px 14px',
                  borderBottom: '1px solid var(--rule-faint)',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: skin.id === 'page' ? 'var(--font-script)' : 'var(--font-display)',
                      fontSize: skin.id === 'page' ? 28 : 20,
                      color: 'var(--ink)',
                      lineHeight: 1,
                    }}
                  >
                    Objectives &amp; Discovered
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--ink-faint)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Tap outside or close to return to play
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenState(false)}
                  style={{
                    appearance: 'none',
                    border: '1px solid var(--rule-faint)',
                    background: 'transparent',
                    color: 'var(--ink)',
                    padding: '10px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  Close
                </button>
              </div>

              <div
                style={{
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                  padding: '14px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <ObjectivesSurface skin={skin} state={resolvedState} variant="sheet" />
              </div>
            </div>
          </div>
        </>
      ) : null}

      <button
        data-testid="phone-objectives-tab"
        type="button"
        onClick={() => setOpenState(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          appearance: 'none',
          width: '100%',
          minHeight: 54,
          border: 'none',
          borderTop: '1px solid var(--rule-faint)',
          borderBottom: '1px solid var(--rule-faint)',
          background: skin.id === 'terminal' ? 'var(--surface-deep)' : 'transparent',
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px max(14px, env(safe-area-inset-right, 0px)) 10px max(14px, env(safe-area-inset-left, 0px))',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink-soft)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Objectives
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, minWidth: 0, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink)',
                padding: '3px 7px',
                border: '1px solid var(--rule-faint)',
                borderRadius: 999,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {model.objectiveSummary.done}/{model.objectiveSummary.total || 0}
            </span>

            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              {model.objectives.slice(0, 6).map((objective) => (
                <div
                  key={objective.id}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: objective.done ? 'var(--accent)' : 'transparent',
                    border: objective.done ? 'none' : '1px solid var(--ink-faint)',
                  }}
                />
              ))}
            </div>

            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--ink-soft)',
                whiteSpace: 'nowrap',
              }}
            >
              {discoveryLabel}
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            color: 'var(--ink-faint)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            {isOpen ? 'Close' : 'Open'}
          </span>
          <Chevron open={isOpen} />
        </div>
      </button>
    </div>
  );
}
