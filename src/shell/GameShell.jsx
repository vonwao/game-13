import { useEffect, useState } from 'react';
import GameCanvas from './GameCanvas.jsx';
import ShellLayout from './layout/ShellLayout.jsx';
import HUDStrip from './components/HUDStrip.jsx';
import RightRail from './components/RightRail.jsx';
import ActionBar from './components/ActionBar.jsx';
import PhoneObjTab from './components/PhoneObjTab.jsx';
import {
  PauseMenuOverlay,
  RoundCompleteOverlay,
  RunCompleteOverlay,
} from './components/NavOverlay.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import HelpPanel from './panels/HelpPanel.jsx';
import useGameShellState from './useGameShellState.js';
import useMediaQuery from './useMediaQuery.js';
import { useSkin } from './skins/SkinContext.jsx';
import { legacyModesEnabled } from './legacyModes.js';

function formatStartLabel(value, fallback) {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getHomeCardBackground(skin) {
  if (skin.id === 'page') return 'linear-gradient(180deg, rgba(249, 240, 216, 0.94), rgba(238, 226, 198, 0.96))';
  if (skin.id === 'terminal') return 'rgba(5, 10, 6, 0.94)';
  return 'rgba(15, 17, 22, 0.88)';
}

function getHomeCardBorder(skin) {
  if (skin.id === 'page') return '1px solid rgba(200, 152, 72, 0.44)';
  if (skin.id === 'terminal') return '1px solid rgba(127, 219, 106, 0.46)';
  return '1px solid rgba(255, 255, 255, 0.12)';
}

function getGoalLabel(endCondition) {
  return ({
    challenges: 'Objectives',
    zen: 'Zen',
    timed: 'Timed',
    turns: 'Turns',
  })[endCondition || 'challenges'] || 'Objectives';
}

function getBestWord(historyItems) {
  if (!historyItems.length) return null;
  return historyItems.reduce((best, entry) => {
    if (!best || (entry.score || 0) > (best.score || 0)) return entry;
    return best;
  }, null);
}

function HomePill({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 3,
        padding: '10px 12px',
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--rule-faint)',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--ink)' }}>
        {value}
      </span>
    </div>
  );
}

function HomeSection({ title, children }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StartOverlay({ skin, state, actions, gameMode, legacyModes, phone, onSettings, onHelp }) {
  const settings = state.settings || {};
  const run = state.run || {};
  const historyItems = state.history?.items || [];
  const bestWord = getBestWord(historyItems);
  const hasLastRun = (run.wordsSpelled || 0) > 0 || historyItems.length > 0;
  const legacyModeActive = import.meta.env.DEV && legacyModes && gameMode === 'siege';
  const nextRunSummary = [
    ['Difficulty', formatStartLabel(settings.difficulty, 'Easy')],
    ['Board', formatStartLabel(settings.boardSize, 'Small')],
    ['Goal', getGoalLabel(settings.endCondition)],
    ['Tiles', settings.specialTiles ? 'Wildcard rules on' : 'Letters only'],
  ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: phone ? 16 : 28,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          width: phone ? '100%' : 760,
          maxWidth: '100%',
          background: getHomeCardBackground(skin),
          border: getHomeCardBorder(skin),
          borderRadius: skin.id === 'terminal' ? 0 : 6,
          boxShadow: '0 18px 48px rgba(0, 0, 0, 0.34)',
          backdropFilter: 'blur(10px)',
          padding: phone ? '18px 18px 16px' : '24px 26px 22px',
          display: 'grid',
          gap: phone ? 16 : 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: phone ? 'column' : 'row',
            alignItems: phone ? 'flex-start' : 'baseline',
            gap: phone ? 8 : 16,
            paddingBottom: 14,
            borderBottom: '1px solid var(--rule-faint)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            {legacyModeActive ? 'Legacy Mode' : 'Word Hunt'}
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-soft)',
              fontStyle: skin.id === 'page' ? 'italic' : 'normal',
              fontFamily: skin.id === 'terminal' ? 'var(--font-mono)' : 'var(--font-body)',
            }}
          >
            {import.meta.env.DEV && legacyModes ? 'Legacy modes are available locally only.' : 'One run, three pages, one front door.'}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: phone ? '1fr' : 'minmax(0, 1.2fr) minmax(280px, 0.9fr)',
            gap: phone ? 18 : 24,
          }}
        >
          <div style={{ display: 'grid', gap: phone ? 14 : 18 }}>
            <div>
              <div
                style={{
                  fontFamily: skin.HeadingFont,
                  fontSize: phone ? 42 : 58,
                  color: skin.id === 'page' ? '#7a4a28' : 'var(--ink)',
                  letterSpacing: skin.id === 'page' ? '0.02em' : (skin.id === 'terminal' ? '0.16em' : '-0.03em'),
                  lineHeight: 0.98,
                  marginBottom: 10,
                }}
              >
                {skin.HeadingTransform('Lexicon Deep')}
              </div>
              <div
                style={{
                  maxWidth: 420,
                  fontFamily: 'var(--font-body)',
                  fontStyle: skin.id === 'page' ? 'italic' : 'normal',
                  color: 'var(--ink-soft)',
                  fontSize: phone ? 13 : 15,
                  lineHeight: 1.5,
                }}
              >
                {legacyModeActive
                  ? 'The archive still keeps the retired Siege build for local testing, but the live game now centers on Word Hunt.'
                  : 'Trace words through the page, manage a board that wears down as you use it, and clear three rounds without losing the shape of the run.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span onClick={actions.startGame} style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <skin.ActionBtn label="Start Run" kbd="↵" primary />
              </span>
              <span onClick={onSettings} style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <skin.ActionBtn label="Settings" kbd="S" />
              </span>
              <span onClick={onHelp} style={{ display: 'inline-flex', cursor: 'pointer' }}>
                <skin.ActionBtn label="How to Play" kbd="?" warm />
              </span>
              {import.meta.env.DEV && legacyModes ? (
                <span
                  onClick={() => actions.setGameMode(gameMode === 'wordhunt' ? 'siege' : 'wordhunt')}
                  style={{ display: 'inline-flex', cursor: 'pointer' }}
                >
                  <skin.ActionBtn label={gameMode === 'wordhunt' ? 'Legacy Siege' : 'Word Hunt'} kbd="M" />
                </span>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                fontSize: 12,
                color: 'var(--ink-faint)',
                fontStyle: skin.id === 'page' ? 'italic' : 'normal',
              }}
            >
              <span>Enter starts immediately.</span>
              <span>S opens Settings.</span>
              <span>? opens Help.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <HomeSection title="Next Run">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                {nextRunSummary.map(([label, value]) => (
                  <HomePill key={label} label={label} value={value} />
                ))}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.45,
                  fontStyle: skin.id === 'page' ? 'italic' : 'normal',
                }}
              >
                Skin changes apply immediately. Board settings take effect on the next run.
              </div>
            </HomeSection>

            <HomeSection title={hasLastRun ? 'Last Run' : 'Run Shape'}>
              {hasLastRun ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <HomePill label="Score" value={Number(run.score || 0).toLocaleString()} />
                  <HomePill label="Words" value={String(run.wordsSpelled || 0)} />
                  <HomePill label="Best" value={bestWord ? `${bestWord.word} +${bestWord.score || 0}` : '—'} />
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: 8,
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    lineHeight: 1.45,
                  }}
                >
                  <div>Each run spans three pages with its own objective pressure.</div>
                  <div>Fresh tiles are safest, worn tiles are still legal, and spent tiles close that route.</div>
                </div>
              )}
            </HomeSection>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameShell() {
  const { state, actions } = useGameShellState();
  const { skin } = useSkin();
  const phone = useMediaQuery('(max-width: 720px)');
  const legacyModes = import.meta.env.DEV && legacyModesEnabled();
  const [panel, setPanel] = useState(null);
  const phase = state.phase;
  const rawPhase = state.rawPhase || phase;
  const isPaused = !!state.isPaused || rawPhase === 'paused';
  const showSettings = panel === 'settings';
  const showMenu = panel === 'menu';
  const showHelp = !!state.ui?.showHelp;
  const isRunActive = rawPhase === 'playing' || isPaused;
  const showStartOverlay = rawPhase === 'settings' && !showSettings && !showHelp;
  const isRoundComplete = rawPhase === 'victory' && !!state.huntSummary?.advanceAvailable;
  const isRunComplete = rawPhase === 'gameover' || (rawPhase === 'victory' && !state.huntSummary?.advanceAvailable);

  function openMenu() {
    if (!isRunActive) return;
    actions.setUIState({ showHelp: false });
    if (rawPhase === 'playing' && typeof actions.pauseGame === 'function') {
      actions.pauseGame();
    }
    setPanel('menu');
  }

  function closeMenu() {
    setPanel(null);
    if (isPaused && typeof actions.resumeGame === 'function') {
      actions.resumeGame();
    }
  }

  function openSettings() {
    actions.setUIState({ showHelp: false });
    if (rawPhase === 'playing' && typeof actions.pauseGame === 'function') {
      actions.pauseGame();
    }
    setPanel('settings');
  }

  function closeSettings() {
    setPanel(isPaused ? 'menu' : null);
  }

  function openHelp() {
    if (rawPhase === 'playing' && typeof actions.pauseGame === 'function') {
      actions.pauseGame();
    }
    setPanel(null);
    actions.setUIState({ showHelp: true });
  }

  function closeHelp() {
    actions.setUIState({ showHelp: false });
    if (isPaused) {
      setPanel('menu');
    }
  }

  function restartRun() {
    actions.setUIState({ showHelp: false });
    setPanel(null);
    actions.startGame();
  }

  function quitToStart() {
    actions.setUIState({ showHelp: false });
    setPanel(null);
    actions.returnToSettings();
  }

  useEffect(() => {
    if (!legacyModes && state.gameMode !== 'wordhunt') {
      actions.setGameMode('wordhunt');
    }
  }, [actions, legacyModes, state.gameMode]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (showSettings && event.key === 'Escape') {
        event.preventDefault();
        closeSettings();
        return;
      }

      if (showHelp && event.key === 'Escape') {
        event.preventDefault();
        closeHelp();
        return;
      }

      if (showMenu) {
        const key = event.key.toLowerCase();
        if (event.key === 'Escape') {
          event.preventDefault();
          closeMenu();
          return;
        }
        if (key === 's') {
          event.preventDefault();
          setPanel('settings');
          return;
        }
        if (key === 'h' || event.key === '?') {
          event.preventDefault();
          openHelp();
          return;
        }
        if (key === 'r') {
          event.preventDefault();
          restartRun();
          return;
        }
        if (key === 'q') {
          event.preventDefault();
          quitToStart();
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          closeMenu();
        }
        return;
      }

      if (rawPhase === 'playing') {
        if (event.key === 'Escape') {
          event.preventDefault();
          openMenu();
        }
        return;
      }

      if (isPaused) {
        if (event.key === 'Escape') {
          event.preventDefault();
          openMenu();
        }
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        actions.startGame();
        return;
      }

      if (import.meta.env.DEV && legacyModes && (event.key === 'm' || event.key === 'M')) {
        event.preventDefault();
        actions.setGameMode(state.gameMode === 'wordhunt' ? 'siege' : 'wordhunt');
        return;
      }

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        openSettings();
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        openHelp();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, isPaused, legacyModes, openHelp, openMenu, quitToStart, rawPhase, restartRun, showHelp, showMenu, showSettings, state.gameMode]);

  return (
    <ShellLayout>
      <HUDStrip
        skin={skin}
        state={state}
        phone={phone}
        onMenu={isRunActive ? (showMenu ? closeMenu : openMenu) : undefined}
        menuOpen={showMenu}
      />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'stretch',
            minWidth: 0,
            position: 'relative',
          }}
        >
          <GameCanvas state={state} />
          {showStartOverlay && (
            <StartOverlay
              skin={skin}
              state={state}
              actions={actions}
              gameMode={legacyModes ? state.gameMode : 'wordhunt'}
              legacyModes={legacyModes}
              phone={phone}
              onSettings={openSettings}
              onHelp={openHelp}
            />
          )}
        </div>
        {!phone && <RightRail skin={skin} state={state} phone={phone} />}
      </div>
      {phone && isRunActive && (
        <PhoneObjTab skin={skin} state={state} />
      )}
      {!showStartOverlay && <ActionBar skin={skin} state={state} actions={actions} phone={phone} />}

      {showMenu && (
        <PauseMenuOverlay
          skin={skin}
          phone={phone}
          state={state}
          onDismiss={closeMenu}
          onResume={closeMenu}
          onSettings={() => setPanel('settings')}
          onHelp={openHelp}
          onRestart={restartRun}
          onQuit={quitToStart}
        />
      )}

      {!showMenu && !showSettings && !showHelp && isRoundComplete && (
        <RoundCompleteOverlay
          skin={skin}
          phone={phone}
          state={state}
          onContinue={() => {
            setPanel(null);
            actions.advanceRound();
          }}
          onSettings={() => setPanel('settings')}
        />
      )}

      {!showMenu && !showSettings && !showHelp && isRunComplete && (
        <RunCompleteOverlay
          skin={skin}
          phone={phone}
          state={state}
          onNewRun={restartRun}
          onQuit={quitToStart}
        />
      )}

      {showHelp && (
        <div
          data-testid="help-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'var(--bg)',
            overflow: 'hidden',
          }}
        >
          <skin.Background />
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
            <HelpPanel />
          </div>
          <div
            onClick={closeHelp}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              cursor: 'pointer',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 14,
              zIndex: 10,
            }}
          >
            ‹ back
          </div>
        </div>
      )}

      {showSettings && (
        <div
          data-testid="settings-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 21,
            background: 'var(--bg)',
            overflow: 'hidden',
          }}
        >
          <skin.Background />
          <SettingsScreen state={state} actions={actions} onClose={closeSettings} />
        </div>
      )}
    </ShellLayout>
  );
}
