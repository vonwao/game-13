import { useEffect, useState } from 'react';
import GameCanvas from './GameCanvas.jsx';
import ShellLayout from './layout/ShellLayout.jsx';
import HUDStrip from './components/HUDStrip.jsx';
import RightRail from './components/RightRail.jsx';
import ActionBar from './components/ActionBar.jsx';
import PhoneObjTab from './components/PhoneObjTab.jsx';
import SettingsScreen from './panels/SettingsScreen.jsx';
import HelpPanel from './panels/HelpPanel.jsx';
import useGameShellState from './useGameShellState.js';
import useMediaQuery from './useMediaQuery.js';
import { useSkin } from './skins/SkinContext.jsx';

function StartOverlay({ skin, actions, gameMode, onSettings, onHelp }) {
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
          <span
            onClick={() => actions.setGameMode(gameMode === 'wordhunt' ? 'siege' : 'wordhunt')}
            style={{ display: 'inline-flex', cursor: 'pointer' }}
          >
            <skin.ActionBtn label={gameMode === 'wordhunt' ? 'Word Hunt' : 'Siege'} kbd="m" />
          </span>
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
  const [showSettings, setShowSettings] = useState(false);

  const isPlaying =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';
  const showHelp = !!state.ui?.showHelp;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (showSettings && event.key === 'Escape') {
        event.preventDefault();
        setShowSettings(false);
        return;
      }

      if (showHelp && event.key === 'Escape') {
        event.preventDefault();
        actions.setUIState({ showHelp: false });
        return;
      }

      if (isPlaying || showSettings || showHelp) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        actions.startGame();
        return;
      }

      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        actions.setGameMode(state.gameMode === 'wordhunt' ? 'siege' : 'wordhunt');
        return;
      }

      if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        setShowSettings(true);
        return;
      }

      if (event.key === '?') {
        event.preventDefault();
        actions.setUIState({ showHelp: true });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, isPlaying, showHelp, showSettings, state.gameMode]);

  return (
    <ShellLayout>
      <HUDStrip skin={skin} state={state} phone={phone} />
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
          {!isPlaying && (
            <StartOverlay
              skin={skin}
              actions={actions}
              gameMode={state.gameMode}
              onSettings={() => {
                actions.setUIState({ showHelp: false });
                setShowSettings(true);
              }}
              onHelp={() => actions.setUIState({ showHelp: true })}
            />
          )}
        </div>
        {!phone && (
          <RightRail skin={skin} state={state} phone={phone} />
        )}
      </div>
      {phone && isPlaying && (
        <PhoneObjTab skin={skin} state={state} />
      )}
      <ActionBar skin={skin} state={state} actions={actions} phone={phone} />

      {showHelp && (
        <div
          data-testid="help-overlay"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'var(--bg)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
            <HelpPanel />
          </div>
          <div
            onClick={() => actions.setUIState({ showHelp: false })}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              cursor: 'pointer',
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 13,
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
          }}
        >
          <SettingsScreen state={state} actions={actions} onClose={() => setShowSettings(false)} />
        </div>
      )}
    </ShellLayout>
  );
}
