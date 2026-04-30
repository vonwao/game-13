// How to Play. Ported from /tmp/lexicon-design/lexicon-deep/project/screens.jsx.
// Same component on desktop + phone — switches via a media query.
import useGameShellState from '../useGameShellState.js';
import useMediaQuery from '../useMediaQuery.js';
import { legacyModesEnabled } from '../legacyModes.js';

const Step = ({ n, title, children }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--accent)', fontWeight: 600, fontStyle: 'italic' }}>{n}</span>
      <span style={{ fontFamily: 'var(--font-script)', fontSize: 30, color: 'var(--ink)', lineHeight: 1 }}>{title}</span>
    </div>
    {children}
  </div>
);

const Kbd = ({ children }) => (
  <span style={{ padding: '2px 8px', border: '1px solid var(--ink-soft)', fontSize: 13, color: 'var(--ink)', textAlign: 'center', minWidth: 32, display: 'inline-block', fontFamily: 'var(--font-mono)' }}>
    {children}
  </span>
);

const RoundLine = ({ n, name, desc }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
    <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--accent)', fontWeight: 600, minWidth: 28 }}>{n}</span>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{name}</span>
    <span style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--ink-soft)' }}>— {desc}</span>
  </div>
);

const MiniBoard = ({ cells, path, size = 36 }) => (
  <div style={{ position: 'relative' }}>
    {cells.map((row, r) => (
      <div key={r} style={{ display: 'flex' }}>
        {row.map((ch, c) => {
          const onPath = path.findIndex((p) => p[0] === r && p[1] === c) >= 0;
          return (
            <div
              key={c}
              style={{
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: size * 0.5,
                fontWeight: 500,
                color: onPath ? 'var(--accent)' : 'var(--ink)',
                background: onPath ? 'var(--accent-soft)' : 'transparent',
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
    ))}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      <path
        d={path.map((p, i) => `${i ? 'L' : 'M'} ${p[1] * size + size / 2} ${p[0] * size + size / 2}`).join(' ')}
        stroke="var(--accent)"
        strokeWidth="2"
        fill="none"
        opacity=".7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const SpecialMark = ({ kind, size }) => {
  const s = size * 0.28;
  if (kind === 'ember') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{ position: 'absolute', top: 1, right: 1, color: 'var(--accent)' }}>
        <path d="M6 1 Q 8 4 7 6 Q 9 7 8 10 Q 6 11 4 10 Q 3 7 5 6 Q 4 4 6 1 Z" fill="currentColor" opacity=".85" />
      </svg>
    );
  }
  if (kind === 'crystal') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{ position: 'absolute', top: 1, right: 1, color: 'var(--accent-2)' }}>
        <path d="M6 1 L 11 5 L 8.5 11 L 3.5 11 L 1 5 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 11 L 6 5 L 8.5 11 M 1 5 L 11 5" fill="none" stroke="currentColor" strokeWidth="0.7" opacity=".7" />
      </svg>
    );
  }
  if (kind === 'void') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{ position: 'absolute', top: 1, right: 1, color: 'var(--ink-soft)' }}>
        <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1" />
        <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity=".4" />
      </svg>
    );
  }
  return null;
};

const SpecialDemo = ({ kind, letter, name, desc }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
    <div
      style={{
        position: 'relative',
        width: 56,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 32,
        fontWeight: 600,
        color: 'var(--ink)',
        border: '1px solid var(--rule-faint)',
      }}
    >
      {letter}
      <SpecialMark kind={kind} size={56} />
    </div>
    <div style={{ fontFamily: 'var(--font-script)', fontSize: 18, color: 'var(--accent-2)', lineHeight: 1 }}>{name}</div>
    <div style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.3 }}>{desc}</div>
  </div>
);

const HelpNote = ({ children, center = false }) => (
  <p style={{ margin: 0, fontSize: 12, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.5, textAlign: center ? 'center' : 'left' }}>
    {children}
  </p>
);

export default function HelpPanel() {
  const { state } = useGameShellState();
  const phone = useMediaQuery('(max-width: 720px)');
  const legacyModes = legacyModesEnabled();
  const gameMode = legacyModes ? (state?.gameMode ?? 'wordhunt') : 'wordhunt';
  const specialTilesEnabled = state?.settings?.specialTiles ?? false;
  const specialTilesNote = specialTilesEnabled
    ? 'Special tiles are enabled for this run.'
    : 'These appear when Special tiles is turned on in Settings.';
  const siegeSpecialTilesNote = specialTilesEnabled
    ? 'Special tiles are enabled for this run. Siege can also spawn bomb tiles.'
    : 'Turn on Special tiles in Settings to add these, plus bomb tiles in Siege.';

  if (phone) {
    if (gameMode === 'siege') {
      return (
        <div style={{ position: 'absolute', inset: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
          <div style={{ paddingBottom: 6, borderBottom: '1px solid var(--rule-faint)' }}>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--accent-2)', lineHeight: 1 }}>How to play</div>
            <div style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)' }}>hold the page against corruption</div>
          </div>
          <Step n="i." title="Cast a word">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <MiniBoard cells={[['S', 'E', 'A', 'L'], ['C', 'A', 'S', 'T']]} path={[[1, 0], [1, 1], [0, 2], [0, 3]]} size={26} />
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>Drag through adjacent letters. <b>Two or more.</b> No reuse in one cast.</p>
            </div>
          </Step>
          <Step n="ii." title="Cleanse corruption">
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              Valid words clear corruption where they travel. Reach every seal before the spread crosses the page-wide loss threshold.
            </div>
          </Step>
          <Step n="iii." title="Special tiles">
            <div style={{ display: 'flex', gap: 8 }}>
              <SpecialDemo kind="ember" letter="E" name="Ember" desc="burst cleanse" />
              <SpecialDemo kind="crystal" letter="K" name="Crystal" desc="bigger reach" />
              <SpecialDemo kind="void" letter="?" name="Wildcard" desc="any letter" />
            </div>
            <HelpNote center>{siegeSpecialTilesNote}</HelpNote>
          </Step>
          <Step n="iv." title="Break the seals">
            <div style={{ fontSize: 14, lineHeight: 1.65 }}>
              Win by destroying every seal. If corruption outruns you, the archive holds.
            </div>
          </Step>
        </div>
      );
    }

    return (
      <div style={{ position: 'absolute', inset: 16, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
        <div style={{ paddingBottom: 6, borderBottom: '1px solid var(--rule-faint)' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 32, color: 'var(--accent-2)', lineHeight: 1 }}>How to play</div>
          <div style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)' }}>a word hunt in the archive</div>
        </div>
        <Step n="i." title="Trace a word">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MiniBoard cells={[['L', 'A', 'N', 'T'], ['I', 'E', 'R', 'E']]} path={[[0, 0], [1, 0], [1, 1], [0, 2], [1, 2], [1, 3]]} size={26} />
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>Drag through adjacent letters. <b>Four or more.</b> No reuse in a single word.</p>
          </div>
        </Step>
        <Step n="ii." title="Score the page">
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>
            <b>length</b> leads · <b>tiles</b> add a small bonus · <b>shape</b> rewards straight paths · <b>planted</b> words add discovery points · <b>wear</b> seals a third use
          </div>
        </Step>
        <Step n="iii." title="Special tiles">
          <div style={{ display: 'flex', gap: 8 }}>
            <SpecialDemo kind="ember" letter="E" name="Ember" desc="+10" />
            <SpecialDemo kind="crystal" letter="K" name="Crystal" desc="+12" />
            <SpecialDemo kind="void" letter="?" name="Wildcard" desc="-10" />
          </div>
          <HelpNote center>{specialTilesNote}</HelpNote>
        </Step>
        <Step n="iv." title="A run is three pages">
          <div style={{ fontSize: 14, lineHeight: 1.65 }}>
            <RoundLine n="I." name="The First Page" desc="opens" />
            <RoundLine n="II." name="Dust and Echoes" desc="paths lengthen" />
            <RoundLine n="III." name="The Black Index" desc="resists" />
          </div>
        </Step>
      </div>
    );
  }

  if (gameMode === 'siege') {
    return (
      <div style={{ position: 'absolute', inset: 28, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--rule-faint)' }}>
          <div style={{ fontFamily: 'var(--font-script)', fontSize: 44, color: 'var(--accent-2)', lineHeight: 1 }}>How to play</div>
          <div style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)' }}>— hold the archive against corruption</div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 28, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0 }}>
            <Step n="i." title="Cast a word">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <MiniBoard cells={[['S', 'E', 'A', 'L'], ['C', 'A', 'S', 'T'], ['R', 'U', 'N', 'E']]} path={[[1, 0], [1, 1], [0, 2], [0, 3]]} size={36} />
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65 }}>
                  Trace adjacent letters — or type from the keyboard — to cast a dictionary word of <b>two or more letters</b>. No tile may be used twice in the same cast.
                </p>
              </div>
            </Step>

            <Step n="ii." title="Cleanse corruption">
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 12, rowGap: 8, fontSize: 15, lineHeight: 1.5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>cast</span>
                <span>every valid word cleanses corruption along its path</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>seals</span>
                <span>route through them to break them open</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>spread</span>
                <span>corruption pushes back after each cast</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>loss</span>
                <span>if the page crosses the corruption threshold, the siege is lost</span>
              </div>
            </Step>

            <Step n="iii." title="Special tiles">
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <SpecialDemo kind="ember" letter="E" name="Ember" desc="cleanses a small burst around the path" />
                <SpecialDemo kind="crystal" letter="K" name="Crystal" desc="pushes the cleanse farther" />
                <SpecialDemo kind="void" letter="?" name="Wildcard" desc="stands in for any letter you need" />
              </div>
              <HelpNote>{siegeSpecialTilesNote}</HelpNote>
            </Step>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingLeft: 24, borderLeft: '1px solid var(--rule-faint)' }}>
            <Step n="iv." title="Break every seal">
              <p style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.65 }}>
                The board is safe only when every seal is gone. Longer routes can carve a cleaner lane, but the real goal is to keep the corruption from taking too much ground.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, background: 'var(--accent-soft)' }}>
                <span style={{ color: 'var(--accent)', fontSize: 18 }}>✶</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, fontVariant: 'small-caps', letterSpacing: '0.08em', color: 'var(--accent)' }}>
                    seal broken{' '}
                    <span style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', fontVariant: 'normal', letterSpacing: 0 }}>— the corruption line falls back</span>
                  </div>
                </div>
              </div>
            </Step>

            <Step n="v." title="Keys at hand">
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', columnGap: 14, rowGap: 6, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
                <Kbd>type</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>build a word from your fingers</span>
                <Kbd>↵</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>submit</span>
                <Kbd>esc</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>clear the trace</span>
              </div>
            </Step>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 28, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--rule-faint)' }}>
        <div style={{ fontFamily: 'var(--font-script)', fontSize: 44, color: 'var(--accent-2)', lineHeight: 1 }}>How to play</div>
        <div style={{ fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)' }}>— a word hunt in the archive</div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 28, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0 }}>
          <Step n="i." title="Trace a word">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <MiniBoard cells={[['L', 'A', 'N', 'T'], ['I', 'E', 'R', 'E'], ['G', 'H', 'N', 'S']]} path={[[0, 0], [1, 0], [1, 1], [0, 2], [1, 2], [1, 3]]} size={36} />
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65 }}>
                Drag through adjacent letters — orthogonal or diagonal — to spell a word of <b>four or more letters</b>. No tile may be used twice in the same word. Type on a keyboard if you prefer.
              </p>
            </div>
          </Step>

          <Step n="ii." title="Scoring rewards">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 12, rowGap: 8, fontSize: 15, lineHeight: 1.5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>length</span>
              <span>fixed table: 5=55, 6=85, 7=120, 8+=160</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>shape</span>
              <span>straight paths add points; corners subtract points</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>planted</span>
              <span>discover hidden words seeded into the page</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 600 }}>wear</span>
              <span>tiles can be used twice across the page; a third use seals them</span>
            </div>
          </Step>

          <Step n="iii." title="Special tiles">
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <SpecialDemo kind="ember" letter="E" name="Ember" desc="adds 10 points" />
              <SpecialDemo kind="crystal" letter="K" name="Crystal" desc="adds 12 points" />
              <SpecialDemo kind="void" letter="?" name="Wildcard" desc="subtracts 10 points" />
            </div>
            <HelpNote>{specialTilesNote}</HelpNote>
          </Step>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingLeft: 24, borderLeft: '1px solid var(--rule-faint)' }}>
          <Step n="iv." title="Planted words">
            <p style={{ margin: '0 0 8px', fontSize: 16, lineHeight: 1.65 }}>
              Each page has <b>hidden words</b> set into the type — particular finds the archivist would like you to discover. Mark them off as you go.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 10, background: 'var(--accent-soft)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 18 }}>★</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, fontVariant: 'small-caps', letterSpacing: '0.08em', color: 'var(--accent)' }}>
                  lantern{' '}
                  <span style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--ink-soft)', fontVariant: 'normal', letterSpacing: 0 }}>— a planted word</span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>+28</span>
            </div>
          </Step>

          <Step n="v." title="A run is three pages">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15 }}>
              <RoundLine n="I." name="The First Page" desc="objectives invite — the lexicon opens" />
              <RoundLine n="II." name="Dust and Echoes" desc="paths grow longer — the archive narrows" />
              <RoundLine n="III." name="The Black Index" desc="time tightens — the page resists" />
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              Each page sets its own objectives. Complete them to advance.
            </p>
          </Step>

          <Step n="vi." title="Keys at hand">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', columnGap: 14, rowGap: 6, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
              <Kbd>type</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>build a word from your fingers</span>
              <Kbd>↵</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>submit</span>
              <Kbd>esc</Kbd><span style={{ color: 'var(--ink-soft)' }}>→</span><span style={{ fontFamily: 'var(--font-body)' }}>clear the trace</span>
            </div>
          </Step>
        </div>
      </div>
    </div>
  );
}
