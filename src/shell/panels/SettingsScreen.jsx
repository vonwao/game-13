import { useSkin } from '../skins/SkinContext.jsx';
import { SKINS } from '../skins/index.jsx';
import useGameShellState from '../useGameShellState.js';
import useMediaQuery from '../useMediaQuery.js';

// ─── Design-faithful helper components ────────────────────

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: 'var(--font-script)', fontSize: 24, color: 'var(--accent-2)', lineHeight: 1, borderBottom: '0.5px dotted var(--rule-faint)', paddingBottom: 6 }}>
    {children}
  </div>
);

const SettingRow = ({ label, value, desc, stackValue = false }) => (
  <div style={{
    display: 'flex',
    flexDirection: stackValue ? 'column' : 'row',
    alignItems: stackValue ? 'stretch' : 'flex-start',
    justifyContent: 'space-between',
    gap: stackValue ? 8 : 14,
    padding: '12px 0',
    borderBottom: '0.5px dotted var(--rule-faint)',
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500 }}>{label}</div>
      {desc && <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
    </div>
    <div style={stackValue ? { width: '100%', paddingTop: 2 } : { flexShrink: 0, paddingTop: 2 }}>{value}</div>
  </div>
);

const Toggle = ({ on, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    aria-pressed={on}
    style={{
      appearance: 'none',
      padding: 0,
      width: 40, height: 22, borderRadius: 11, position: 'relative',
      background: on ? 'var(--accent)' : 'var(--rule-faint)',
      border: '1px solid var(--rule-faint)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      display: 'block',
    }}
  >
    <div style={{
      position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16, borderRadius: '50%',
      background: 'var(--surface)', transition: 'left .15s',
    }} />
  </button>
);

const Segmented = ({ options, selected, onSelect, disabled = false, fullWidth = false, compact = false }) => (
  <div
    style={{
      display: fullWidth ? 'grid' : 'flex',
      gridTemplateColumns: fullWidth ? `repeat(${options.length}, minmax(0, 1fr))` : undefined,
      border: '1px solid var(--rule-faint)',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : 'auto',
    }}
  >
    {options.map((o, index) => (
      <button
        type="button"
        key={o.value ?? o}
        onClick={disabled ? undefined : () => onSelect && onSelect(o.value ?? o)}
        disabled={disabled}
        style={{
          appearance: 'none',
          border: 0,
          borderRight: index === options.length - 1 ? 0 : '1px solid var(--rule-faint)',
          padding: compact ? '5px 8px' : '4px 10px',
          fontSize: compact ? 11 : 12,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: (o.value ?? o) === selected ? 'var(--accent)' : 'transparent',
          color: (o.value ?? o) === selected ? 'var(--surface)' : 'var(--ink-soft)',
          fontFamily: 'var(--font-display)', fontWeight: (o.value ?? o) === selected ? 600 : 400,
          minWidth: 0,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {o.label ?? o}
      </button>
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
    fontSize: 12,
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
            fontSize: 12,
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
        fontSize: 12,
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

// ─── Settings constants ────────────────────────────────────
const CORE_DEFAULT_SETTINGS = {
  difficulty: 'easy',
  boardSize: 'small',
  soundEnabled: true,
  particlesEnabled: true,
  specialTiles: false,
  endCondition: 'challenges',
};

const DIFFICULTY_DESCRIPTIONS = {
  wordhunt: {
    easy: 'More hidden words, shorter paths, and extra fragments.',
    medium: 'Balanced mix with some diagonal and reversed finds.',
    hard: 'Fewer hidden words, longer paths, and fewer fragments.',
  },
  siege: {
    easy: '4 seals, slower corruption spread, generous loss threshold.',
    medium: '6 seals with the standard corruption pressure.',
    hard: '8 seals, faster corruption, and harsher board decay.',
  },
};

const DIFFICULTY_OPTIONS_DESKTOP = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];
const DIFFICULTY_OPTIONS_PHONE = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];
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
const END_CONDITION_OPTIONS_DESKTOP = [
  { label: 'Objectives', value: 'challenges' },
  { label: 'Zen', value: 'zen' },
  { label: 'Timed', value: 'timed' },
  { label: 'Turns', value: 'turns' },
];
const END_CONDITION_OPTIONS_PHONE = [
  { label: 'Obj', value: 'challenges' },
  { label: 'Zen', value: 'zen' },
  { label: 'Timed', value: 'timed' },
  { label: 'Turns', value: 'turns' },
];
const PATH_COLOR_OPTIONS_DESKTOP = [
  { label: 'Default', value: 'default' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Yellow', value: 'yellow' },
];
const PATH_COLOR_OPTIONS_PHONE = [
  { label: 'Def', value: 'default' },
  { label: 'Cyan', value: 'cyan' },
  { label: 'Yellow', value: 'yellow' },
];
const DICTIONARY_OPTIONS_DESKTOP = [
  { label: 'SOWPODS', value: 'sowpods' },
  { label: 'TWL', value: 'twl' },
  { label: 'OSPD', value: 'ospd' },
];
const DICTIONARY_OPTIONS_PHONE = [
  { label: 'SOW', value: 'sowpods' },
  { label: 'TWL', value: 'twl' },
  { label: 'OSPD', value: 'ospd' },
];

function getDifficultyDescription(gameMode, difficulty) {
  return (DIFFICULTY_DESCRIPTIONS[gameMode] || DIFFICULTY_DESCRIPTIONS.wordhunt)[difficulty] || '';
}

// ─── Main Settings View ─────────────────────────────────────
export function SettingsView({ state, actions, onClose }) {
  const { skin, skinId, setSkin } = useSkin();
  const isPhone = useMediaQuery('(max-width: 720px)');

  const settings = state?.settings ?? {};
  const setSettings = actions?.setSettings ?? (() => {});
  const goBack = onClose ?? actions?.returnToSettings ?? actions?.startGame ?? (() => {});
  const gameMode = state?.gameMode ?? 'wordhunt';

  const difficulty = settings.difficulty ?? CORE_DEFAULT_SETTINGS.difficulty;
  const boardSize = settings.boardSize ?? CORE_DEFAULT_SETTINGS.boardSize;
  const soundEnabled = settings.soundEnabled ?? CORE_DEFAULT_SETTINGS.soundEnabled;
  const particlesEnabled = settings.particlesEnabled ?? CORE_DEFAULT_SETTINGS.particlesEnabled;
  const specialTiles = settings.specialTiles ?? CORE_DEFAULT_SETTINGS.specialTiles;
  const endCondition = settings.endCondition ?? CORE_DEFAULT_SETTINGS.endCondition;
  const goalDisabled = gameMode !== 'wordhunt';
  const difficultyDescription = getDifficultyDescription(gameMode, difficulty);

  if (isPhone) {
    return (
      <div style={{ ...skin.vars, position: 'relative', width: '100%', height: '100%', overflow: 'auto', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
        <skin.Background />
        <div style={{ position: 'relative', zIndex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 8, borderBottom: '1px solid var(--rule-faint)', marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--accent-2)', lineHeight: 1 }}>Settings</div>
            <div style={{ flex: 1 }} />
            <div
              onClick={goBack}
              style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-faint)', cursor: 'pointer' }}
            >
              ‹ back
            </div>
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
              label="Difficulty"
              desc={difficultyDescription}
              stackValue
              value={
                <Segmented
                  options={DIFFICULTY_OPTIONS_PHONE}
                  selected={difficulty}
                  onSelect={(value) => setSettings({ difficulty: value })}
                  fullWidth
                  compact
                />
              }
            />
            <SettingRow
              label="Board size"
              stackValue
              value={
                <Segmented
                  options={BOARD_SIZE_OPTIONS_PHONE}
                  selected={boardSize}
                  onSelect={(v) => setSettings({ boardSize: v })}
                  fullWidth
                  compact
                />
              }
            />
            <SettingRow
              label="Goal"
              desc={goalDisabled ? 'Word Hunt only. Siege ignores this setting.' : 'How a Word Hunt round ends.'}
              stackValue
              value={
                <Segmented
                  options={END_CONDITION_OPTIONS_PHONE}
                  selected={endCondition}
                  onSelect={(value) => setSettings({ endCondition: value })}
                  disabled={goalDisabled}
                  fullWidth
                  compact
                />
              }
            />
            <SettingRow
              label="Special tiles"
              desc="Turns on crystal, void, ember, and other special tile types."
              value={<Toggle on={specialTiles} onClick={() => setSettings({ specialTiles: !specialTiles })} />}
            />
            <SettingRow
              label="Sound"
              value={<Toggle on={soundEnabled} onClick={() => setSettings({ soundEnabled: !soundEnabled })} />}
            />
            <SettingRow
              label="Particles"
              desc="Board bursts and tile effect particles."
              value={<Toggle on={particlesEnabled} onClick={() => setSettings({ particlesEnabled: !particlesEnabled })} />}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <SectionLabel>Coming soon</SectionLabel>
            <SettingRow
              label="Reduce motion"
              desc="Planned shell control. Motion is still fixed by the core."
              value={<Toggle on={false} disabled />}
            />
            <SettingRow
              label="Path colors"
              desc="Planned shell control. The renderer still uses the active skin colors."
              stackValue
              value={
                <Segmented
                  options={PATH_COLOR_OPTIONS_PHONE}
                  selected="default"
                  disabled
                  fullWidth
                  compact
                />
              }
            />
            <SettingRow
              label="Dictionary"
              desc="Planned shell control. Word validation still uses the bundled list instead."
              stackValue
              value={
                <Segmented
                  options={DICTIONARY_OPTIONS_PHONE}
                  disabled
                  fullWidth
                  compact
                />
              }
            />
            <SettingRow
              label="Keyboard hints"
              desc="Planned shell control. Action-bar key hints stay visible today."
              value={<Toggle on disabled />}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--rule-faint)', paddingTop: 12, marginTop: 16, fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            Lexicon Deep · skin persists on this device; board settings apply on the next fresh page.
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
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, minHeight: 0, overflow: 'auto', alignContent: 'start' }}>

          {/* Left: gameplay */}
          <div>
            <SectionLabel>Game</SectionLabel>
            <SettingRow
              label="Difficulty"
              desc={difficultyDescription}
              value={
                <Segmented
                  options={DIFFICULTY_OPTIONS_DESKTOP}
                  selected={difficulty}
                  onSelect={(value) => setSettings({ difficulty: value })}
                />
              }
            />
            <SettingRow
              label="Board size"
              desc="Changes the board dimensions for the next run."
              value={
                <Segmented
                  options={BOARD_SIZE_OPTIONS_DESKTOP}
                  selected={boardSize}
                  onSelect={(v) => setSettings({ boardSize: v })}
                />
              }
            />
            <SettingRow
              label="Goal"
              desc={goalDisabled ? 'Word Hunt only. Siege ignores this setting.' : 'How a Word Hunt round ends.'}
              value={
                <Segmented
                  options={END_CONDITION_OPTIONS_DESKTOP}
                  selected={endCondition}
                  onSelect={(value) => setSettings({ endCondition: value })}
                  disabled={goalDisabled}
                />
              }
            />
            <SettingRow
              label="Special tiles"
              desc="Turns on crystal, void, ember, and other special tile types."
              value={<Toggle on={specialTiles} onClick={() => setSettings({ specialTiles: !specialTiles })} />}
            />
          </div>

          {/* Right: options */}
          <div>
            <SectionLabel>Options</SectionLabel>
            <SettingRow
              label="Sound"
              desc="Submit, discovery, and interface sound effects."
              value={<Toggle on={soundEnabled} onClick={() => setSettings({ soundEnabled: !soundEnabled })} />}
            />
            <SettingRow
              label="Particles"
              desc="Board bursts and tile effect particles."
              value={<Toggle on={particlesEnabled} onClick={() => setSettings({ particlesEnabled: !particlesEnabled })} />}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <SectionLabel>Coming soon</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 12 }}>
              <div>
                <SettingRow
                  label="Reduce motion"
                  desc="Planned shell control. Motion is still fixed by the core."
                  value={<Toggle on={false} disabled />}
                />
                <SettingRow
                  label="Path colors"
                  desc="Planned shell control. The renderer still uses the active skin colors."
                  value={
                    <Segmented
                      options={PATH_COLOR_OPTIONS_DESKTOP}
                      selected="default"
                      disabled
                    />
                  }
                />
              </div>
              <div>
                <SettingRow
                  label="Dictionary"
                  desc="Planned shell control. Word validation still uses the bundled list instead."
                  value={
                    <Segmented
                      options={DICTIONARY_OPTIONS_DESKTOP}
                      disabled
                    />
                  }
                />
                <SettingRow
                  label="Keyboard hints"
                  desc="Planned shell control. Action-bar key hints stay visible today."
                  value={<Toggle on disabled />}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--rule-faint)', paddingTop: 12, marginTop: 16, display: 'flex', gap: 10, fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          <span>Lexicon Deep · skin persists on this device; board settings apply on the next fresh page.</span>
        </div>
      </div>
    </div>
  );
}

// ─── Legacy panel wrapper (used by existing GameShell phase==='settings') ──
export default function SettingsScreen({ state, actions, onClose }) {
  const shell = useGameShellState();
  return <SettingsView state={state ?? shell.state} actions={actions ?? shell.actions} onClose={onClose} />;
}
