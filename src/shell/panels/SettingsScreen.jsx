import React, { useState, useEffect } from 'react';
import { useSkin } from '../skins/SkinContext.jsx';
import { SKINS } from '../skins/index.jsx';
import useGameShellState from '../useGameShellState.js';

// ─── Design-faithful helper components ────────────────────

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-script)', fontSize: 24, color: 'var(--accent-2)', lineHeight: 1, borderBottom: '0.5px dotted var(--rule-faint)', paddingBottom: 6 }}>
    {children}
  </div>
);

const SettingRow = ({ label, value, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderBottom: '0.5px dotted var(--rule-faint)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500 }}>{label}</div>
      {desc && <div style={{ fontStyle: 'italic', fontSize: 11, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
    </div>
    <div style={{ flexShrink: 0, paddingTop: 2 }}>{value}</div>
  </div>
);

const Toggle = ({ on, onClick }) => (
  <div
    onClick={onClick}
    style={{
      width: 40, height: 22, borderRadius: 11, position: 'relative',
      background: on ? 'var(--accent)' : 'var(--rule-faint)',
      border: '1px solid var(--rule-faint)',
      cursor: 'pointer',
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: '50%',
      background: 'var(--surface)', transition: 'left .15s',
    }} />
  </div>
);

const Segmented = ({ options, selected, onSelect }) => (
  <div style={{ display: 'flex', border: '1px solid var(--rule-faint)' }}>
    {options.map(o => (
      <div
        key={o.value ?? o}
        onClick={() => onSelect && onSelect(o.value ?? o)}
        style={{
          padding: '4px 10px', fontSize: 12, cursor: 'pointer',
          background: (o.value ?? o) === selected ? 'var(--accent)' : 'transparent',
          color: (o.value ?? o) === selected ? 'var(--surface)' : 'var(--ink-soft)',
          fontFamily: 'var(--font-display)', fontWeight: (o.value ?? o) === selected ? 600 : 400,
        }}
      >
        {o.label ?? o}
      </div>
    ))}
  </div>
);

// MiniTile: 22px tile rendered with skin tokens
const MiniTile = ({ ch, onPath, skinVars }) => (
  <div style={{
    ...skinVars,
    width: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: onPath ? 'var(--tile-on)' : 'var(--tile-bg)',
    border: '1px solid var(--tile-border)',
    color: onPath ? 'var(--tile-on-color)' : 'var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 10,
    fontWeight: onPath ? 700 : 400,
    boxSizing: 'border-box',
  }}>
    {ch}
  </div>
);

// SkinThumb: desktop preview card
const SkinThumb = ({ skin, selected, onClick }) => {
  const previewBoard = [['A', 'R', 'C', 'H', 'I', 'V', 'E'], ['F', 'R', 'A', 'G', 'M', 'E', 'N']];
  return (
    <div
      onClick={onClick}
      style={{
        ...skin.vars,
        border: selected ? '2px solid var(--accent)' : '1px solid var(--rule-faint)',
        cursor: 'pointer', position: 'relative',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: 140, overflow: 'hidden', background: 'var(--bg)' }}>
        <skin.Background />
        <div style={{ position: 'absolute', inset: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <skin.RoundBadge round="I" />
            <div style={{ fontFamily: skin.HeadingFont, fontSize: 13, color: skin.id === 'page' ? '#7a4a28' : 'var(--ink)', fontWeight: 600 }}>
              {skin.HeadingTransform('The First Page')}
            </div>
          </div>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {previewBoard.map((row, r) => (
              <div key={r} style={{ display: 'flex' }}>
                {row.map((ch, c) => {
                  const onPath = (r === 0 && c >= 2 && c <= 6);
                  return <MiniTile key={c} ch={ch} onPath={onPath} skinVars={skin.vars} />;
                })}
              </div>
            ))}
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <path
                d={`M ${2 * 22 + 11} ${11} L ${6 * 22 + 11} ${11}`}
                stroke={skin.vars['--path-color']}
                strokeWidth={skin.PathRender === 'ink' ? 3.5 : 2}
                opacity={skin.PathRender === 'ink' ? 0.85 : 0.9}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
      <div style={{
        padding: '10px 12px', background: 'var(--surface)', color: 'var(--ink)',
        borderTop: '1px solid var(--rule-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: skin.HeadingFont, fontSize: 14, fontWeight: 600,
            color: skin.id === 'page' ? '#2a1a10' : (skin.id === 'terminal' ? '#7fdb6a' : '#f1ece2'),
          }}>
            {skin.name}
          </div>
          <div style={{
            fontSize: 10,
            color: skin.id === 'page' ? '#5a4030' : (skin.id === 'terminal' ? 'rgba(127,219,106,.55)' : 'rgba(241,236,226,.55)'),
            fontStyle: skin.id === 'page' ? 'italic' : 'normal',
            marginTop: 2,
          }}>
            {skin.blurb}
          </div>
        </div>
        {selected && (
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)',
            color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
          }}>✓</div>
        )}
      </div>
    </div>
  );
};

// SkinThumbCompact: phone list-row variant
const SkinThumbCompact = ({ skin, selected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      ...skin.vars,
      border: selected ? '2px solid var(--accent)' : '1px solid var(--rule-faint)',
      display: 'flex', alignItems: 'center', gap: 12, padding: 8,
      background: 'var(--surface)', cursor: 'pointer',
    }}
  >
    <div style={{ position: 'relative', width: 56, height: 40, overflow: 'hidden', background: 'var(--bg)', flexShrink: 0 }}>
      <skin.Background />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: skin.HeadingFont, fontSize: 20, fontWeight: 700,
        color: skin.id === 'page' ? '#742818' : (skin.id === 'terminal' ? '#7fdb6a' : '#d4a84a'),
      }}>Aa</div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: skin.HeadingFont, fontSize: 14, fontWeight: 600,
        color: skin.id === 'page' ? '#2a1a10' : (skin.id === 'terminal' ? '#7fdb6a' : '#f1ece2'),
      }}>{skin.name}</div>
      <div style={{
        fontSize: 10,
        color: skin.id === 'page' ? '#5a4030' : (skin.id === 'terminal' ? 'rgba(127,219,106,.55)' : 'rgba(241,236,226,.55)'),
        fontStyle: skin.id === 'page' ? 'italic' : 'normal',
      }}>{skin.blurb}</div>
    </div>
    {selected && (
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)',
        color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700,
      }}>✓</div>
    )}
  </div>
);

// ─── useMediaQuery hook ────────────────────────────────────
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// ─── Board size options ────────────────────────────────────
const BOARD_SIZE_OPTIONS_DESKTOP = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
const BOARD_SIZE_OPTIONS_PHONE = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
];

// NOTE: These new settings (reduceMotion, colorBlindPath, dictionary, showKeyboardHints)
// are stored via setSettings but are silently dropped by gameBridge.js — it only
// forwards known keys (difficulty, boardSize, soundEnabled, particlesEnabled,
// specialTiles, endCondition). They persist in shell state only, ready to be
// wired through when the game core consumes them.
const NOOP_SETTINGS_WARN = (key) => {
  if (import.meta.env.DEV) {
    console.info(`[SettingsScreen] "${key}" stored in shell state but not yet consumed by game core.`);
  }
};

// ─── Main Settings View ─────────────────────────────────────
export function SettingsView({ state, actions }) {
  const { skin, skinId, setSkin } = useSkin();
  const isPhone = useMediaQuery('(max-width: 720px)');

  const settings = state?.settings ?? {};
  const setSettings = actions?.setSettings ?? (() => {});
  const goBack = actions?.returnToSettings ?? actions?.startGame ?? (() => {});

  // Local state for new settings not (yet) wired to game core
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion ?? false);
  const [colorBlindPath, setColorBlindPath] = useState(settings.colorBlindPath ?? 'default');
  const [dictionary, setDictionary] = useState(settings.dictionary ?? 'sowpods');
  const [showKeyboardHints, setShowKeyboardHints] = useState(settings.showKeyboardHints ?? true);

  const handleReduceMotion = (val) => {
    setReduceMotion(val);
    NOOP_SETTINGS_WARN('reduceMotion');
    setSettings({ reduceMotion: val });
  };
  const handleColorBlindPath = (val) => {
    setColorBlindPath(val);
    NOOP_SETTINGS_WARN('colorBlindPath');
    setSettings({ colorBlindPath: val });
  };
  const handleDictionary = (val) => {
    setDictionary(val);
    NOOP_SETTINGS_WARN('dictionary');
    setSettings({ dictionary: val });
  };
  const handleShowKeyboardHints = (val) => {
    setShowKeyboardHints(val);
    NOOP_SETTINGS_WARN('showKeyboardHints');
    setSettings({ showKeyboardHints: val });
  };

  const boardSize = settings.boardSize ?? 'medium';
  const soundEnabled = settings.soundEnabled ?? true;

  if (isPhone) {
    return (
      <div style={{ ...skin.vars, position: 'relative', width: '100%', height: '100%', overflow: 'auto', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
        <skin.Background />
        <div style={{ position: 'relative', zIndex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--rule-faint)', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--accent-2)', lineHeight: 1 }}>Settings</div>
          </div>

          {/* Skin picker — compact rows */}
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Skin</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {Object.values(SKINS).map(s => (
                <SkinThumbCompact key={s.id} skin={s} selected={skinId === s.id} onClick={() => setSkin(s.id)} />
              ))}
            </div>
          </div>

          {/* Combined settings on phone */}
          <div>
            <SectionLabel>Game</SectionLabel>
            <SettingRow
              label="Board size"
              value={
                <Segmented
                  options={BOARD_SIZE_OPTIONS_PHONE}
                  selected={boardSize}
                  onSelect={(v) => setSettings({ boardSize: v })}
                />
              }
            />
            <SettingRow
              label="Sound"
              value={<Toggle on={soundEnabled} onClick={() => setSettings({ soundEnabled: !soundEnabled })} />}
            />
            <SettingRow
              label="Reduce motion"
              value={<Toggle on={reduceMotion} onClick={() => handleReduceMotion(!reduceMotion)} />}
            />
            <SettingRow
              label="Color-blind path"
              value={
                <Segmented
                  options={[{ label: 'def', value: 'default' }, { label: 'cy', value: 'cyan' }, { label: 'y', value: 'yellow' }]}
                  selected={colorBlindPath}
                  onSelect={handleColorBlindPath}
                />
              }
            />
            <SettingRow
              label="Dictionary"
              value={
                <Segmented
                  options={[{ label: 'SOW', value: 'sowpods' }, { label: 'TWL', value: 'twl' }, { label: 'OSPD', value: 'ospd' }]}
                  selected={dictionary}
                  onSelect={handleDictionary}
                />
              }
            />
          </div>

          <div style={{ borderTop: '1px solid var(--rule-faint)', paddingTop: 12, marginTop: 16, fontSize: 11, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            Lexicon Deep · v0.1 — settings persist on this device only.
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ ...skin.vars, position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
      <skin.Background />
      <div style={{ position: 'absolute', inset: 28, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid var(--rule-faint)' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 44, color: 'var(--accent-2)', lineHeight: 1 }}>Settings</div>
          <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)' }}>— preferences for the page</div>
          <div style={{ flex: 1 }} />
          <div
            onClick={goBack}
            style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faint)', cursor: 'pointer' }}
          >
            ‹ back to the archive
          </div>
        </div>

        {/* Skin picker — 3-up grid */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>Skin</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 12 }}>
            {Object.values(SKINS).map(s => (
              <SkinThumb key={s.id} skin={s} selected={skinId === s.id} onClick={() => setSkin(s.id)} />
            ))}
          </div>
        </div>

        {/* Two-column settings */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, minHeight: 0, overflow: 'auto' }}>

          {/* Left: Board */}
          <div>
            <SectionLabel>Board</SectionLabel>
            <SettingRow
              label="Board size"
              value={
                <Segmented
                  options={BOARD_SIZE_OPTIONS_DESKTOP}
                  selected={boardSize}
                  onSelect={(v) => setSettings({ boardSize: v })}
                />
              }
            />
            <SettingRow
              label="Reduce motion"
              desc="Tone down the path trail and round transitions."
              value={<Toggle on={reduceMotion} onClick={() => handleReduceMotion(!reduceMotion)} />}
            />
            <SettingRow
              label="Color-blind path"
              desc="Path-trace color, for tiles that are easier to tell apart."
              value={
                <Segmented
                  options={[{ label: 'Default', value: 'default' }, { label: 'Cyan', value: 'cyan' }, { label: 'Yellow', value: 'yellow' }]}
                  selected={colorBlindPath}
                  onSelect={handleColorBlindPath}
                />
              }
            />
          </div>

          {/* Right: Sound & lexicon */}
          <div>
            <SectionLabel>Sound &amp; lexicon</SectionLabel>
            <SettingRow
              label="Sound"
              desc="Pen-scratch on submit, soft chime on planted words."
              value={<Toggle on={soundEnabled} onClick={() => setSettings({ soundEnabled: !soundEnabled })} />}
            />
            <SettingRow
              label="Dictionary"
              desc="Which lexicon counts as a valid word."
              value={
                <Segmented
                  options={[{ label: 'SOWPODS', value: 'sowpods' }, { label: 'TWL', value: 'twl' }, { label: 'OSPD', value: 'ospd' }]}
                  selected={dictionary}
                  onSelect={handleDictionary}
                />
              }
            />
            <SettingRow
              label="Show keyboard hints"
              desc="Display [S] [C] [U] [?] in the action bar."
              value={<Toggle on={showKeyboardHints} onClick={() => handleShowKeyboardHints(!showKeyboardHints)} />}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--rule-faint)', paddingTop: 12, marginTop: 16, display: 'flex', gap: 10, fontSize: 11, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          <span>Lexicon Deep · v0.1 — settings persist on this device only.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Legacy panel wrapper (used by existing GameShell phase==='settings') ──
export default function SettingsScreen({ state, actions }) {
  return <SettingsView state={state} actions={actions} />;
}
