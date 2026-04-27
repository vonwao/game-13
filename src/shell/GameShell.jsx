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

function StartOverlay({ skin, actions, gameMode, legacyModes, onSettings, onHelp }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', textAlign: 'center' }}>
        <div
          style={{
            fontFamily: skin.HeadingFont,
            fontSize: 56,
            color: skin.id === 'page' ? '#7a4a28' : 'var(--ink)',
            letterSpacing: skin.id === 'page' ? '0.02em' : (skin.id === 'terminal' ? '0.16em' : '-0.02em'),
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {skin.HeadingTransform('Lexicon Deep')}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: skin.id === 'page' ? 'italic' : 'normal',
            color: 'var(--ink-soft)',
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {skin.id === 'terminal' ? '// a word puzzle in the archive' : 'a word puzzle in the archive'}
        </div>
        <div style={{ display: 'inline-flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span onClick={actions.startGame} style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <skin.ActionBtn label="Start Game" kbd="↵" primary />
          </span>
          {legacyModes ? (
            <span
              onClick={() => actions.setGameMode(gameMode === 'wordhunt' ? 'siege' : 'wordhunt')}
              style={{ display: 'inline-flex', cursor: 'pointer' }}
            >
              <skin.ActionBtn label={gameMode === 'wordhunt' ? 'Legacy Siege' : 'Word Hunt'} kbd="m" />
            </span>
          ) : null}
          <span onClick={onHelp} style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <skin.ActionBtn label="How" kbd="?" warm />
          </span>
          <span onClick={onSettings} style={{ display: 'inline-flex', cursor: 'pointer' }}>
            <skin.ActionBtn label="Settings" kbd="s" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GameShell() {
  const { state, actions } = useGameShellState();
  const { skin } = useSkin();
  const phone = useMediaQuery('(max-width: 720px)');
  const legacyModes = legacyModesEnabled();
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

      if (legacyModes && (event.key === 'm' || event.key === 'M')) {
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
              actions={actions}
              gameMode={state.gameMode}
              legacyModes={legacyModes}
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
      <ActionBar skin={skin} state={state} actions={actions} phone={phone} />

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
