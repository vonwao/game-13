// Direction B — "Full Bleed"
// Modern minimal. Solid dark bg, board edge to edge, thin top strip,
// glass-blur action pill, edge tabs for objectives/history.

const B_PALETTE = {
  bg: '#0c0d0e',
  bgDeep: '#08090a',
  ink: '#f1ece2',
  inkDim: 'rgba(241,236,226,.55)',
  inkFaint: 'rgba(241,236,226,.22)',
  accent: '#d4a84a',     // muted gold
  accentSoft: 'rgba(212,168,74,.18)',
};

// Tile in full-bleed direction
const BTile = ({ ch, size, onPath, pathIdx, isHead }) => (
  <div style={{
    width: size, height: size,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: '"Inter Tight", -apple-system, sans-serif',
    fontSize: size * 0.42, fontWeight: 500,
    color: onPath ? B_PALETTE.bg : B_PALETTE.inkDim,
    background: onPath ? B_PALETTE.accent : 'transparent',
    transition: 'all .2s',
    letterSpacing: 0,
    position: 'relative',
    borderRadius: 1,
  }}>
    {ch}
    {isHead && (
      <div style={{position:'absolute', inset: -2, border: `1.5px solid ${B_PALETTE.ink}`, borderRadius: 2, pointerEvents:'none'}}/>
    )}
  </div>
);

// Path overlay — sharp accent line connecting traced cells
const BPath = ({ cells, cellSize }) => {
  const pts = cells.map(([r,c]) => [c*cellSize + cellSize/2, r*cellSize + cellSize/2]);
  const d = pts.map((p,i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      <path d={d} stroke={B_PALETTE.bg} strokeWidth={cellSize*0.16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      {pts.map((p,i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={cellSize*0.05} fill={B_PALETTE.bg} opacity="0.7"/>
      ))}
    </svg>
  );
};

// Big numeric HUD reading — "240" in display weight
const BigStat = ({ label, value, mono, accent }) => (
  <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
    <span style={{fontFamily:'"IBM Plex Mono", monospace', fontSize: 10, letterSpacing: '0.16em', color: B_PALETTE.inkFaint, textTransform:'uppercase'}}>{label}</span>
    <span style={{
      fontFamily: mono ? '"IBM Plex Mono", monospace' : '"Inter Tight", sans-serif',
      fontSize: 22, fontWeight: 700, color: accent ? B_PALETTE.accent : B_PALETTE.ink,
      letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
    }}>{value}</span>
  </div>
);

// Action pill button
const PillBtn = ({ label, kbd, primary, dim }) => (
  <button style={{
    border: 'none',
    background: primary ? B_PALETTE.accent : 'transparent',
    color: primary ? B_PALETTE.bg : (dim ? B_PALETTE.inkDim : B_PALETTE.ink),
    fontFamily: '"Inter Tight", sans-serif',
    fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
    padding: '10px 22px',
    borderRadius: 999,
    cursor: 'pointer',
    display: 'flex', alignItems:'center', gap: 8,
  }}>
    {label}
    {kbd && <span style={{fontFamily:'"IBM Plex Mono", monospace', fontSize: 10, opacity: .65, padding:'1px 5px', background: primary?'rgba(0,0,0,.18)':'rgba(255,255,255,.06)', borderRadius: 3}}>{kbd}</span>}
  </button>
);

// Edge tab
const EdgeTab = ({ side, label, count }) => (
  <div style={{
    position:'absolute', [side]: 0, top: '50%', transform: `translateY(-50%) ${side==='left'?'':''}`,
    background: 'rgba(255,255,255,.04)', backdropFilter:'blur(8px)',
    padding: '14px 6px',
    borderRadius: side==='left' ? '0 4px 4px 0' : '4px 0 0 4px',
    color: B_PALETTE.inkDim,
    fontFamily:'"IBM Plex Mono",monospace',
    fontSize: 10, letterSpacing: '0.2em',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    textTransform:'uppercase',
    cursor:'pointer',
    display: 'flex', alignItems:'center', gap: 6,
  }}>
    {label}
    {count!==undefined && <span style={{color: B_PALETTE.accent, fontWeight: 700}}>{count}</span>}
  </div>
);

// Glass overlay — slides in from edge, board still visible behind
const ObjectivesOverlay = ({ side='left', width=300, padTop=80, padBottom=120 }) => (
  <div style={{
    position:'absolute', [side]: 0, top: padTop, bottom: padBottom, width,
    background:'rgba(20,20,22,.72)', backdropFilter:'blur(18px)',
    borderRight: side==='left' ? `1px solid rgba(255,255,255,.08)` : 'none',
    borderLeft: side==='right' ? `1px solid rgba(255,255,255,.08)` : 'none',
    padding: '24px 28px',
    color: B_PALETTE.ink,
    fontFamily:'"Inter Tight", sans-serif',
  }}>
    <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 10, letterSpacing:'0.2em', color: B_PALETTE.inkFaint, textTransform:'uppercase', marginBottom: 18}}>Objectives</div>
    {OBJECTIVES.map((o,i) => (
      <div key={i} style={{marginBottom: 22}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6}}>
          <span style={{fontSize: 15, fontWeight: 500, color: o.done? B_PALETTE.inkDim : B_PALETTE.ink, textDecoration: o.done?'line-through':'none', textDecorationColor: B_PALETTE.accent}}>{o.text}</span>
          <span style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 11, color: o.done? B_PALETTE.accent : B_PALETTE.inkDim, fontVariantNumeric:'tabular-nums'}}>{o.cur}/{o.max}</span>
        </div>
        <div style={{height: 2, background: 'rgba(255,255,255,.06)', position:'relative'}}>
          <div style={{position:'absolute', left:0, top:0, bottom:0, width: `${(o.cur/o.max)*100}%`, background: B_PALETTE.accent}}/>
        </div>
      </div>
    ))}
  </div>
);

const HistoryOverlay = ({ side='right', width=280, padTop=80, padBottom=120 }) => (
  <div style={{
    position:'absolute', [side]: 0, top: padTop, bottom: padBottom, width,
    background:'rgba(20,20,22,.72)', backdropFilter:'blur(18px)',
    borderLeft: side==='right' ? `1px solid rgba(255,255,255,.08)` : 'none',
    padding: '24px 28px',
    color: B_PALETTE.ink,
    fontFamily:'"Inter Tight",sans-serif',
  }}>
    <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 10, letterSpacing:'0.2em', color: B_PALETTE.inkFaint, textTransform:'uppercase', marginBottom: 18}}>History</div>
    {RECENT.map((w,i) => (
      <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'10px 0', borderBottom:`1px solid rgba(255,255,255,.05)`}}>
        <div>
          <div style={{fontSize: 15, fontWeight: 600, letterSpacing: '0.04em'}}>{w.word}</div>
          {w.note && <div style={{fontSize: 10, color: B_PALETTE.inkFaint, fontFamily:'"IBM Plex Mono",monospace', marginTop: 2}}>{w.note}</div>}
        </div>
        <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 14, color: B_PALETTE.accent, fontVariantNumeric:'tabular-nums'}}>+{w.score}</div>
      </div>
    ))}
  </div>
);

// ─── Desktop — 1440 × 900 ─────────────────────────────────
function FullbleedDesktop() {
  // Compute tile size to fit grid edge-to-edge w/ margin
  const cellSize = 60;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows; // 840 × 600

  return (
    <div style={{position:'relative', width:'100%', height:'100%', background: B_PALETTE.bg, color: B_PALETTE.ink, fontFamily:'"Inter Tight",sans-serif', overflow:'hidden'}}>
      {/* Top strip */}
      <div style={{position:'absolute', top: 0, left: 0, right: 0, height: 60, display:'flex', alignItems:'center', padding: '0 32px', gap: 36, borderBottom: `1px solid rgba(255,255,255,.04)`}}>
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <div style={{width: 20, height: 20, borderRadius: '50%', background: B_PALETTE.accent}}/>
          <span style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 11, letterSpacing:'0.2em', color: B_PALETTE.inkDim, textTransform:'uppercase'}}>R1 / 3 — The First Page</span>
        </div>
        <div style={{flex:1}}/>
        <BigStat label="Score" value="240" mono/>
        <BigStat label="Combo" value="×2" accent/>
        <BigStat label="Words" value="07" mono/>
        <BigStat label="Clues" value="3" mono/>
        <BigStat label="Time" value="4:13" mono accent/>
      </div>

      {/* Edge tabs (closed state hint) */}
      {/* Showing OPEN objectives overlay on left as the "side surface visible" */}
      <ObjectivesOverlay side="left" width={300} padTop={60} padBottom={120}/>

      {/* History as edge tab (closed) on right */}
      <EdgeTab side="right" label="HISTORY · 7" />

      {/* Board — centered, dominant */}
      <div style={{position:'absolute', top: 60, left: 300, right: 0, bottom: 120, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div style={{position:'relative', width: gridW, height: gridH}}>
          {BOARD_ROWS.map((row,r) => (
            <div key={r} style={{display:'flex'}}>
              {row.map((ch,c) => {
                const pi = pathIndex(r,c);
                return <BTile key={c} ch={ch} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
              })}
            </div>
          ))}
          <BPath cells={PATH} cellSize={cellSize}/>
        </div>
      </div>

      {/* Current word — large, centered above action bar */}
      <div style={{position:'absolute', bottom: 80, left: 0, right: 0, textAlign:'center'}}>
        <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 10, letterSpacing:'0.3em', color: B_PALETTE.inkFaint, marginBottom: 4, textTransform:'uppercase'}}>Tracing</div>
        <div style={{display:'flex', justifyContent:'center', alignItems:'baseline', gap: 16}}>
          <div style={{fontSize: 44, fontWeight: 700, letterSpacing: '0.14em', color: B_PALETTE.ink, lineHeight: 1}}>EMBER</div>
          <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 22, color: B_PALETTE.accent, fontVariantNumeric:'tabular-nums'}}>+18</div>
        </div>
      </div>

      {/* Action pill — bottom center */}
      <div style={{position:'absolute', bottom: 18, left: '50%', transform:'translateX(-50%)',
        background:'rgba(28,28,32,.72)', backdropFilter:'blur(20px)',
        borderRadius: 999, padding: 6,
        border: '1px solid rgba(255,255,255,.06)',
        display:'flex', alignItems:'center', gap: 4,
      }}>
        <PillBtn label="Submit" kbd="↵" primary/>
        <PillBtn label="Clear" kbd="esc" dim/>
        <PillBtn label="Undo" kbd="⌘Z" dim/>
        <PillBtn label="Clue" kbd="?"/>
      </div>
    </div>
  );
}

// ─── Phone — 390 × 844 ─────────────────────────────────
function FullbleedPhone() {
  // Phone: 14×10 board sideways doesn't fit, so rotate framing to use width.
  // Full-bleed approach: tile size driven by viewport width.
  const cellSize = Math.floor((390 - 16) / 14); // 26
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;

  return (
    <div style={{position:'relative', width:'100%', height:'100%', background: B_PALETTE.bg, color: B_PALETTE.ink, fontFamily:'"Inter Tight",sans-serif', overflow:'hidden'}}>

      {/* Top strip */}
      <div style={{position:'absolute', top: 0, left: 0, right: 0, padding: '14px 16px 10px', display:'flex', flexDirection:'column', gap: 8, borderBottom: `1px solid rgba(255,255,255,.04)`}}>
        <div style={{display:'flex', alignItems:'center', gap: 8}}>
          <div style={{width: 8, height: 8, borderRadius: '50%', background: B_PALETTE.accent}}/>
          <span style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 9, letterSpacing:'0.2em', color: B_PALETTE.inkDim, textTransform:'uppercase'}}>R1/3 — The First Page</span>
          <div style={{flex:1}}/>
          <span style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 13, color: B_PALETTE.accent, fontVariantNumeric:'tabular-nums'}}>4:13</span>
        </div>
        <div style={{display:'flex', alignItems:'baseline', gap: 16}}>
          <BigStat label="Score" value="240" mono/>
          <BigStat label="Combo" value="×2" accent/>
          <div style={{flex:1}}/>
          <BigStat label="Clues" value="3" mono/>
        </div>
      </div>

      {/* Board — centered, edge-to-edge with breathing margin */}
      <div style={{position:'absolute', top: 96, left: 0, right: 0, display:'flex', justifyContent:'center'}}>
        <div style={{position:'relative', width: gridW, height: gridH}}>
          {BOARD_ROWS.map((row,r) => (
            <div key={r} style={{display:'flex'}}>
              {row.map((ch,c) => {
                const pi = pathIndex(r,c);
                return <BTile key={c} ch={ch} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
              })}
            </div>
          ))}
          <BPath cells={PATH} cellSize={cellSize}/>
        </div>
      </div>

      {/* Mini edge tabs */}
      <div style={{position:'absolute', top: 96 + gridH + 18, left: 16, fontFamily:'"IBM Plex Mono",monospace', fontSize: 9, letterSpacing:'0.2em', color: B_PALETTE.inkDim, textTransform:'uppercase'}}>← OBJ ·  <span style={{color: B_PALETTE.accent}}>1/3</span></div>
      <div style={{position:'absolute', top: 96 + gridH + 18, right: 16, fontFamily:'"IBM Plex Mono",monospace', fontSize: 9, letterSpacing:'0.2em', color: B_PALETTE.inkDim, textTransform:'uppercase'}}>HIST · 7 →</div>

      {/* Current word */}
      <div style={{position:'absolute', bottom: 132, left: 0, right: 0, textAlign:'center'}}>
        <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 9, letterSpacing:'0.3em', color: B_PALETTE.inkFaint, marginBottom: 4, textTransform:'uppercase'}}>Tracing</div>
        <div style={{display:'flex', justifyContent:'center', alignItems:'baseline', gap: 12}}>
          <div style={{fontSize: 32, fontWeight: 700, letterSpacing:'0.14em', color: B_PALETTE.ink, lineHeight: 1}}>EMBER</div>
          <div style={{fontFamily:'"IBM Plex Mono",monospace', fontSize: 16, color: B_PALETTE.accent, fontVariantNumeric:'tabular-nums'}}>+18</div>
        </div>
      </div>

      {/* Action pill */}
      <div style={{position:'absolute', bottom: 32, left: 16, right: 16,
        background:'rgba(28,28,32,.72)', backdropFilter:'blur(20px)',
        borderRadius: 999, padding: 5,
        border: '1px solid rgba(255,255,255,.06)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap: 2,
      }}>
        <PillBtn label="Submit" primary/>
        <PillBtn label="Clear" dim/>
        <PillBtn label="Undo" dim/>
        <PillBtn label="Clue"/>
      </div>
    </div>
  );
}

Object.assign(window, { FullbleedDesktop, FullbleedPhone });
