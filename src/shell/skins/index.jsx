// Skin tokens — three skins share the same CSS variable surface.
// Each skin defines color, font, and decorative slot renderers.
// Ported from the design bundle (lexicon-deep/project/skins.jsx) as ES modules.
//
// Shape:
// {
//   id, name, blurb,
//   vars,             // CSS variables object
//   Background,       // React component, renders absolutely-positioned background
//   RoundBadge,       // ({ round }) => JSX
//   ActionBtn,        // ({ label, kbd, primary, warm, compact }) => JSX
//   PathRender,       // 'ink' | 'sharp'
//   HeadingFont,
//   HeadingTransform, // (s) => s
//   StatLabelStyle,   // style object
//   StatValueStyle,   // style object
//   rightRailDefaultCollapsed, // optional bool
// }

import React from 'react';

// ─── PAGE SKIN decorative subcomponents ──────────────────
const CornerOrn = ({ style, flip }) => (
  <svg width="32" height="32" viewBox="0 0 36 36" style={{ position: 'absolute', transform: flip, ...style }}>
    <g stroke="#c89848" strokeWidth="0.9" fill="none">
      <path d="M2 18 Q 2 2 18 2" />
      <path d="M6 18 Q 6 6 18 6" />
      <circle cx="6" cy="6" r="1.4" fill="#c89848" />
    </g>
  </svg>
);

const PageBackground = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, background: '#3a2a18' }} />
    <div style={{ position: 'absolute', inset: 8, background: 'rgba(0,0,0,.45)', filter: 'blur(14px)' }} />
    <div
      style={{
        position: 'absolute',
        inset: 12,
        background: 'radial-gradient(ellipse at 30% 25%, #f9f0d8 0%, #f3e9d2 45%, #e8dcbe 100%)',
      }}
    >
      {/* foxing */}
      <div style={{ position: 'absolute', top: '8%', left: '12%', width: 18, height: 14, borderRadius: '50%', background: 'radial-gradient(circle,#a87038 0%,transparent 70%)', opacity: 0.35 }} />
      <div style={{ position: 'absolute', top: '82%', right: '18%', width: 24, height: 18, borderRadius: '50%', background: 'radial-gradient(circle,#a87038 0%,transparent 70%)', opacity: 0.28 }} />
      <div style={{ position: 'absolute', bottom: '8%', left: '8%', width: 14, height: 12, borderRadius: '50%', background: 'radial-gradient(circle,#a87038 0%,transparent 70%)', opacity: 0.32 }} />
      <div style={{ position: 'absolute', top: '45%', right: '5%', width: 10, height: 9, borderRadius: '50%', background: 'radial-gradient(circle,#a87038 0%,transparent 70%)', opacity: 0.25 }} />
      {/* candle bloom top right */}
      <div
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(245,200,96,.45) 0%, rgba(245,200,96,.15) 35%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      {/* paper grain */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: 'multiply', opacity: 0.18 }}>
        <filter id="pgN">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.4 0 0 0 0 0.28 0 0 0 0 0.16 0 0 0 1.2 -0.3" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pgN)" />
      </svg>
      {/* dust motes */}
      {[...Array(16)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${(i * 53) % 100}%`,
            left: `${(i * 37 + 13) % 100}%`,
            width: 2 + (i % 3),
            height: 2 + (i % 3),
            borderRadius: '50%',
            background: 'rgba(245,220,160,.5)',
            boxShadow: '0 0 4px rgba(245,200,96,.4)',
          }}
        />
      ))}
      {/* gilded corners */}
      <CornerOrn style={{ top: 14, left: 14 }} flip="" />
      <CornerOrn style={{ top: 14, right: 14 }} flip="scaleX(-1)" />
      <CornerOrn style={{ bottom: 14, left: 14 }} flip="scaleY(-1)" />
      <CornerOrn style={{ bottom: 14, right: 14 }} flip="scale(-1,-1)" />
    </div>
  </>
);

const PageActionSeal = ({ label, kbd, primary, warm, compact }) => {
  const color = primary ? '#742818' : warm ? '#7a4a28' : '#5a3a2a';
  const size = compact ? 38 : 52;
  return (
    <button
      style={{
        width: size,
        height: size,
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${color} 40%, ${primary ? '#3a0c04' : '#2a1a10'} 95%)`,
        boxShadow: `inset -2px -3px 6px rgba(0,0,0,.45), inset 2px 2px 4px rgba(255,180,140,.2), 1px 2px 3px rgba(0,0,0,.4)`,
        color: '#f6dcc8',
        fontFamily: '"EB Garamond",serif',
        fontStyle: 'italic',
        transform: `rotate(${(label.length * 7) % 9 - 4}deg)`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ fontSize: size * 0.22, fontWeight: 600, lineHeight: 1, letterSpacing: '0.06em', textTransform: 'lowercase' }}>{label}</div>
      {kbd && !compact && <div style={{ fontSize: size * 0.16, opacity: 0.7, marginTop: 1 }}>{kbd}</div>}
    </button>
  );
};

// ─── PAGE SKIN ────────────────────────────────────────────
export const SKIN_PAGE = {
  id: 'page',
  name: 'The Page',
  blurb: 'Archive journal. Aged paper, wax seals, marginalia.',
  vars: {
    '--bg': '#3a2a18',
    '--surface': '#f3e9d2',
    '--surface-deep': '#e8dcbe',
    '--ink': '#2a1a10',
    '--ink-soft': '#5a4030',
    '--ink-faint': 'rgba(90,64,48,.55)',
    '--rule': '#c89848',
    '--rule-faint': 'rgba(200,152,72,.4)',
    '--accent': '#742818', // oxblood — primary accent
    '--accent-soft': 'rgba(116,40,24,.18)',
    '--accent-2': '#7a4a28', // walnut
    '--warm': '#f5c860', // lamp yellow
    '--font-display': '"EB Garamond","Cormorant Garamond",Georgia,serif',
    '--font-body': '"EB Garamond",Georgia,serif',
    '--font-mono': '"EB Garamond",Georgia,serif',
    '--font-script': '"Tangerine","Italianno",cursive',
    '--tile-bg': 'transparent',
    '--tile-border': 'transparent',
    '--tile-on': '#f6e3c8',
    '--tile-on-color': '#742818',
    '--path-color': '#742818',
    '--path-style': 'ink',
    '--btn-bg': 'transparent',
    '--btn-radius': '50%',
  },
  Background: () => <PageBackground />,
  RoundBadge: ({ round }) => (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'radial-gradient(circle at 35% 30%, #742818 0%, #4a1208 95%)',
        boxShadow: 'inset -2px -3px 6px rgba(0,0,0,.45), inset 2px 2px 4px rgba(255,180,140,.2), 1px 2px 3px rgba(0,0,0,.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f6dcc8',
        fontFamily: '"EB Garamond",serif',
        fontStyle: 'italic',
        fontSize: 18,
        fontWeight: 700,
        transform: 'rotate(-5deg)',
      }}
    >
      {round}
    </div>
  ),
  ActionBtn: ({ label, kbd, primary, warm, compact }) => (
    <PageActionSeal label={label} kbd={kbd} primary={primary} warm={warm} compact={compact} />
  ),
  PathRender: 'ink',
  HeadingFont: '"Tangerine","Italianno",cursive',
  HeadingTransform: (s) => s,
  StatLabelStyle: { fontStyle: 'italic', fontFamily: '"EB Garamond",serif', textTransform: 'lowercase', letterSpacing: 'normal', fontSize: 14 },
  StatValueStyle: { fontFamily: '"EB Garamond",serif', fontVariantNumeric: 'oldstyle-nums', fontWeight: 600 },
};

// ─── TERMINAL SKIN ────────────────────────────────────────
const TerminalBackground = () => (
  <>
    <div style={{ position: 'absolute', inset: 0, background: '#0a0d09' }} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(to bottom, rgba(127,219,106,0) 0px, rgba(127,219,106,0) 2px, rgba(0,0,0,.18) 2px, rgba(0,0,0,.18) 3px)',
        mixBlendMode: 'multiply',
        opacity: 0.7,
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.55) 100%)',
        pointerEvents: 'none',
      }}
    />
  </>
);

export const SKIN_TERMINAL = {
  id: 'terminal',
  name: 'Terminal',
  blurb: 'Phosphor on near-black. The archive as something queried.',
  vars: {
    '--bg': '#0a0d09',
    '--surface': '#0a0d09',
    '--surface-deep': '#06080a',
    '--ink': '#7fdb6a',
    '--ink-soft': 'rgba(127,219,106,.7)',
    '--ink-faint': 'rgba(127,219,106,.35)',
    '--rule': 'rgba(127,219,106,.35)',
    '--rule-faint': 'rgba(127,219,106,.18)',
    '--accent': '#ff4030',
    '--accent-soft': 'rgba(255,64,48,.18)',
    '--accent-2': '#7fdb6a',
    '--warm': '#7fdb6a',
    '--font-display': '"IBM Plex Mono","JetBrains Mono",Consolas,monospace',
    '--font-body': '"IBM Plex Mono",Consolas,monospace',
    '--font-mono': '"IBM Plex Mono",Consolas,monospace',
    '--font-script': '"IBM Plex Mono",Consolas,monospace',
    '--tile-bg': 'transparent',
    '--tile-border': 'rgba(127,219,106,.2)',
    '--tile-on': '#7fdb6a',
    '--tile-on-color': '#0a0d09',
    '--path-color': '#ff4030',
    '--path-style': 'sharp',
    '--btn-bg': 'transparent',
    '--btn-radius': '0',
  },
  Background: () => <TerminalBackground />,
  RoundBadge: ({ round }) => (
    <div
      style={{
        padding: '6px 10px',
        flexShrink: 0,
        border: `1px solid #7fdb6a`,
        color: '#7fdb6a',
        fontFamily: '"IBM Plex Mono",monospace',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textShadow: `0 0 6px #7fdb6a`,
      }}
    >
      R{round}/3
    </div>
  ),
  ActionBtn: ({ label, kbd, primary, warm, compact }) => (
    <button
      style={{
        padding: compact ? '5px 8px' : '8px 14px',
        minWidth: compact ? 0 : 80,
        background: 'transparent',
        border: `1px solid ${primary ? '#7fdb6a' : 'rgba(127,219,106,.5)'}`,
        color: primary ? '#7fdb6a' : 'rgba(127,219,106,.85)',
        fontFamily: '"IBM Plex Mono",monospace',
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        textShadow: primary ? `0 0 6px #7fdb6a` : 'none',
      }}
    >
      {kbd && (
        <span style={{ padding: '1px 5px', border: `1px solid currentColor`, fontSize: compact ? 9 : 10, fontWeight: 700 }}>
          {kbd}
        </span>
      )}
      {label}
    </button>
  ),
  PathRender: 'sharp',
  HeadingFont: '"IBM Plex Mono",monospace',
  HeadingTransform: (s) => s.toUpperCase(),
  StatLabelStyle: { fontFamily: '"IBM Plex Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 12, color: 'rgba(127,219,106,.7)' },
  StatValueStyle: { fontFamily: '"IBM Plex Mono",monospace', fontVariantNumeric: 'tabular-nums', fontWeight: 600 },
};

// ─── FULL BLEED SKIN ──────────────────────────────────────
export const SKIN_FULLBLEED = {
  id: 'fullbleed',
  name: 'Full Bleed',
  blurb: 'Modern minimal. Solid dark, the board is the UI.',
  vars: {
    '--bg': '#0c0d0e',
    '--surface': '#0c0d0e',
    '--surface-deep': '#08090a',
    '--ink': '#f1ece2',
    '--ink-soft': 'rgba(241,236,226,.55)',
    '--ink-faint': 'rgba(241,236,226,.22)',
    '--rule': 'rgba(255,255,255,.08)',
    '--rule-faint': 'rgba(255,255,255,.04)',
    '--accent': '#d4a84a',
    '--accent-soft': 'rgba(212,168,74,.18)',
    '--accent-2': '#d4a84a',
    '--warm': '#d4a84a',
    '--font-display': '"Inter Tight",-apple-system,sans-serif',
    '--font-body': '"Inter Tight",-apple-system,sans-serif',
    '--font-mono': '"IBM Plex Mono",monospace',
    '--font-script': '"Inter Tight",sans-serif',
    '--tile-bg': 'transparent',
    '--tile-border': 'transparent',
    '--tile-on': '#d4a84a',
    '--tile-on-color': '#0c0d0e',
    '--path-color': '#0c0d0e',
    '--path-style': 'sharp',
    '--btn-bg': 'transparent',
    '--btn-radius': '999px',
  },
  Background: () => <div style={{ position: 'absolute', inset: 0, background: '#0c0d0e' }} />,
  RoundBadge: ({ round }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#d4a84a' }} />
      <span
        style={{
          fontFamily: '"IBM Plex Mono",monospace',
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'rgba(241,236,226,.55)',
          textTransform: 'uppercase',
        }}
      >
        R{round}/3
      </span>
    </div>
  ),
  ActionBtn: ({ label, kbd, primary, warm, compact }) => (
    <button
      style={{
        border: 'none',
        background: primary ? '#d4a84a' : 'transparent',
        color: primary ? '#0c0d0e' : warm ? '#d4a84a' : '#f1ece2',
        fontFamily: '"Inter Tight",sans-serif',
        fontSize: compact ? 12 : 14,
        fontWeight: 600,
        letterSpacing: '0.02em',
        padding: compact ? '7px 12px' : '10px 20px',
        borderRadius: 999,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
      {kbd && !compact && (
        <span
          style={{
            fontFamily: '"IBM Plex Mono",monospace',
            fontSize: 9,
            opacity: 0.7,
            padding: '1px 4px',
            background: primary ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.06)',
            borderRadius: 3,
          }}
        >
          {kbd}
        </span>
      )}
    </button>
  ),
  // Full Bleed: collapsible right rail (collapsed by default)
  rightRailDefaultCollapsed: true,
  PathRender: 'sharp',
  HeadingFont: '"Inter Tight",sans-serif',
  HeadingTransform: (s) => s,
  StatLabelStyle: { fontFamily: '"IBM Plex Mono",monospace', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 12, color: 'rgba(241,236,226,.55)' },
  StatValueStyle: { fontFamily: '"Inter Tight",sans-serif', fontVariantNumeric: 'tabular-nums', fontWeight: 700, letterSpacing: '-0.01em' },
};

export const SKINS = {
  page: SKIN_PAGE,
  terminal: SKIN_TERMINAL,
  fullbleed: SKIN_FULLBLEED,
};

export default SKINS;
