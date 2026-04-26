import { useState } from 'react';
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
  const [overlay, setOverlay] = useState(null); // 'settings' | 'help' | null

  const isPlaying =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';

  if (overlay === 'settings') {
    return (
      <ShellLayout>
        <SettingsScreen onClose={() => setOverlay(null)} />
      </ShellLayout>
    );
  }
  if (overlay === 'help') {
    return (
      <ShellLayout>
        <div style={{ position: 'absolute', inset: 0, overflow: 'auto' }}>
          <HelpPanel help={state.help} actions={actions} gameMode={state.gameMode} />
        </div>
        <div
          onClick={() => setOverlay(null)}
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
      </ShellLayout>
    );
  }

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
              onSettings={() => setOverlay('settings')}
              onHelp={() => setOverlay('help')}
            />
          )}
        </div>
        {!phone && (
          <RightRail skin={skin} state={state} phone={phone} />
        )}
      </div>
      {phone && isPlaying && (
        <PhoneObjTab skin={skin} objectives={state.objectives} />
      )}
      <ActionBar skin={skin} state={state} actions={actions} phone={phone} />
    </ShellLayout>
  );
}
