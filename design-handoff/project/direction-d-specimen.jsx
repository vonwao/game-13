// Direction D — "Specimen Book"
// Naturalist's notebook. Cream paper, copperplate engraving line work,
// pressed letter tiles, botanical marginalia.

const D_PALETTE = {
  paper: '#f4ecd8',
  paperEdge: '#e8dec0',
  ink: '#1a1a1a',
  inkSoft: '#3a3a3a',
  indigo: '#243a5c',
  madder: '#a04030',
  madderFaint: 'rgba(160,64,48,.4)',
  rule: '#5a4a30',
  warmSpot: '#c87838',
};

const serifFamily = '"Caslon", "Libre Caslon Text", "Cormorant Garamond", "EB Garamond", Georgia, serif';

// Pressed-letter tile — debossed, slight ink halo
const DTile = ({ ch, r, c, size, onPath, pathIdx, isHead }) => {
  const inkVar = ((r*11 + c*7) % 5) * 0.04; // 0..0.16 — letterpress ink unevenness
  const rot = ((r*5 + c*13) % 5 - 2) * 0.15;
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: serifFamily,
      fontSize: size * 0.58, fontWeight: 600,
      color: onPath ? D_PALETTE.indigo : D_PALETTE.ink,
      background: onPath ? 'rgba(36,58,92,.08)' : 'transparent',
      transform: `rotate(${rot}deg)`,
      letterSpacing: 0,
      position:'relative',
      // letterpress effect: tiny inset shadow + ink halo
      textShadow: onPath
        ? `0 0 1.5px rgba(36,58,92,.5), 0.5px 0.5px 0 rgba(36,58,92,.2)`
        : `0 0 1px rgba(26,26,26,${0.4 + inkVar}), 0.4px 0.4px 0 rgba(26,26,26,.15)`,
      filter: `opacity(${0.85 + inkVar})`,
    }}>
      {ch}
    </div>
  );
};

const DPath = ({ cells, cellSize }) => {
  const pts = cells.map(([r,c]) => [c*cellSize + cellSize/2, r*cellSize + cellSize/2]);
  const d = pts.map((p,i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      <path d={d} stroke={D_PALETTE.indigo} strokeWidth={cellSize*0.06} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.55"/>
      <path d={d} stroke={D_PALETTE.indigo} strokeWidth={cellSize*0.16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.18"/>
      {pts.map((p,i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={cellSize*0.08} fill="none" stroke={D_PALETTE.indigo} strokeWidth="1" opacity="0.7"/>
      ))}
    </svg>
  );
};

// Botanical engravings — small SVG line drawings (placeholders that look like real engravings)
const Fern = ({ size = 80, color = D_PALETTE.ink }) => (
  <svg width={size} height={size*1.4} viewBox="0 0 80 110" style={{display:'block'}}>
    <g stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round">
      <path d="M40 105 Q 40 60 38 20"/>
      {[...Array(12)].map((_,i) => {
        const y = 100 - i*7;
        const len = 8 + i*1.2;
        const curve = 4 + i*0.4;
        return (
          <g key={i}>
            <path d={`M40 ${y} Q ${40-curve} ${y-len/2} ${40-len} ${y-len*0.4}`}/>
            <path d={`M40 ${y} Q ${40+curve} ${y-len/2} ${40+len} ${y-len*0.4}`}/>
            {i < 8 && [...Array(4)].map((_,j) => (
              <g key={j}>
                <path d={`M${40-curve-j*1.5} ${y-j*1.3} Q ${40-curve-j*2.2} ${y-j*1.6-1.5} ${40-curve-j*3} ${y-j*1.4-2.5}`}/>
                <path d={`M${40+curve+j*1.5} ${y-j*1.3} Q ${40+curve+j*2.2} ${y-j*1.6-1.5} ${40+curve+j*3} ${y-j*1.4-2.5}`}/>
              </g>
            ))}
          </g>
        );
      })}
    </g>
  </svg>
);

const Mushroom = ({ size = 60, color = D_PALETTE.ink }) => (
  <svg width={size} height={size*1.3} viewBox="0 0 60 78" style={{display:'block'}}>
    <g stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round">
      {/* cap */}
      <path d="M8 30 Q 30 -4 52 30 Q 30 42 8 30 Z"/>
      {/* gills */}
      {[...Array(7)].map((_,i) => (
        <line key={i} x1={14 + i*5} y1={32} x2={14 + i*5} y2={36} />
      ))}
      {/* stem */}
      <path d="M22 36 Q 20 55 22 75"/>
      <path d="M38 36 Q 40 55 38 75"/>
      <path d="M22 75 L 38 75"/>
      {/* spots */}
      <circle cx="18" cy="22" r="1.6"/>
      <circle cx="32" cy="14" r="2"/>
      <circle cx="42" cy="22" r="1.4"/>
      <circle cx="28" cy="26" r="1"/>
    </g>
  </svg>
);

const Lichen = ({ size = 70, color = D_PALETTE.ink }) => (
  <svg width={size} height={size*0.7} viewBox="0 0 70 50" style={{display:'block'}}>
    <g stroke={color} strokeWidth="0.55" fill="none" strokeLinecap="round">
      {[...Array(8)].map((_,i) => {
        const cx = 8 + (i%4)*16;
        const cy = 12 + Math.floor(i/4)*20;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3"/>
            <circle cx={cx} cy={cy} r="5.5"/>
            <path d={`M${cx-7} ${cy} Q ${cx-3} ${cy-2} ${cx} ${cy}`}/>
            <path d={`M${cx} ${cy} Q ${cx+3} ${cy+2} ${cx+7} ${cy}`}/>
          </g>
        );
      })}
    </g>
  </svg>
);

const Leaf = ({ size = 80, color = D_PALETTE.ink, rotate = 0 }) => (
  <svg width={size} height={size*1.4} viewBox="0 0 80 110" style={{display:'block', transform:`rotate(${rotate}deg)`}}>
    <g stroke={color} strokeWidth="0.6" fill="none" strokeLinecap="round">
      <path d="M40 5 Q 10 40 25 90 Q 40 100 55 90 Q 70 40 40 5 Z"/>
      <path d="M40 5 L 40 95"/>
      {[...Array(10)].map((_,i) => {
        const y = 15 + i*8;
        const w = 25 - Math.abs(i-4)*2;
        return (
          <g key={i}>
            <path d={`M40 ${y} Q ${40-w/2} ${y+5} ${40-w} ${y+10}`}/>
            <path d={`M40 ${y} Q ${40+w/2} ${y+5} ${40+w} ${y+10}`}/>
          </g>
        );
      })}
    </g>
  </svg>
);

// Printer's flower / fleuron divider
const Fleuron = ({ width = 200, color = D_PALETTE.rule }) => (
  <svg width={width} height="20" viewBox="0 0 200 20">
    <g stroke={color} strokeWidth="0.6" fill="none">
      <line x1="0" y1="10" x2="80" y2="10"/>
      <line x1="120" y1="10" x2="200" y2="10"/>
      <g transform="translate(100 10)">
        <path d="M-12 0 Q -6 -4 0 0 Q 6 4 12 0 Q 6 -4 0 0 Q -6 4 -12 0 Z"/>
        <circle r="2" fill={color}/>
        <line x1="-18" y1="0" x2="-12" y2="0"/>
        <line x1="12" y1="0" x2="18" y2="0"/>
      </g>
    </g>
  </svg>
);

const SpecimenPaper = ({ children, padding = 36 }) => (
  <div style={{position:'relative', width:'100%', height:'100%', background: D_PALETTE.paper, overflow:'hidden'}}>
    {/* paper texture: subtle radial vignette + grain */}
    <div style={{position:'absolute', inset: 0,
      background: `radial-gradient(ellipse at 35% 30%, #faf3df 0%, ${D_PALETTE.paper} 55%, ${D_PALETTE.paperEdge} 100%)`,
    }}/>
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', mixBlendMode:'multiply', opacity:.18}}>
      <filter id="dpaperNoise"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.3 0 0 0 0 0.22 0 0 0 0 0.12 0 0 0 0.5 0"/></filter>
      <rect width="100%" height="100%" filter="url(#dpaperNoise)"/>
    </svg>
    {/* engraved double-rule frame */}
    <div style={{position:'absolute', inset: 16, border: `1px solid ${D_PALETTE.rule}`, opacity: .55}}/>
    <div style={{position:'absolute', inset: 21, border: `0.5px solid ${D_PALETTE.rule}`, opacity: .35}}/>
    <div style={{position:'absolute', inset: padding}}>{children}</div>
  </div>
);

// ─── Desktop — 1440 × 900 ─────────────────────────────────
function SpecimenDesktop() {
  const cellSize = 40;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;

  return (
    <SpecimenPaper padding={32}>
      <div style={{position:'absolute', inset: 0, fontFamily: serifFamily, color: D_PALETTE.ink}}>

        {/* Botanical marginalia — corners */}
        <div style={{position:'absolute', top: -10, right: -10, opacity: 0.78}}><Fern size={92}/></div>
        <div style={{position:'absolute', bottom: 30, left: -8, opacity: 0.7}}><Leaf size={70} rotate={-25}/></div>
        <div style={{position:'absolute', bottom: 0, right: 8, opacity: 0.65}}><Mushroom size={62}/></div>

        {/* Header */}
        <div style={{position:'absolute', top: 0, left: 0, right: 120, display:'flex', alignItems:'baseline', gap: 18}}>
          <div style={{fontVariant:'small-caps', letterSpacing: '0.18em', fontSize: 14, color: D_PALETTE.inkSoft}}>Plate</div>
          <div style={{fontFamily: serifFamily, fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em'}}>I.</div>
          <div style={{fontStyle:'italic', fontSize: 22, color: D_PALETTE.ink}}>The First Page</div>
          <div style={{flex:1}}/>
          <div style={{fontStyle:'italic', fontSize: 12, color: D_PALETTE.inkSoft}}>—  fasc. i of iii  —</div>
        </div>

        <div style={{position:'absolute', top: 38, left: 0, right: 120}}>
          <Fleuron width={1180}/>
        </div>

        {/* HUD line — small caps stats below fleuron */}
        <div style={{position:'absolute', top: 60, left: 0, right: 120, display:'flex', alignItems:'baseline', gap: 32, fontSize: 13}}>
          <Stat label="Score" value="240"/>
          <Stat label="Combo" value="× ii" accent={D_PALETTE.madder}/>
          <Stat label="Words" value="vii"/>
          <Stat label="Clues" value="iii"/>
          <Stat label="Glass" value="4 ′ 13 ″"/>
          <div style={{flex:1}}/>
          <div style={{fontStyle:'italic', fontSize: 11, color: D_PALETTE.inkSoft}}>printed for the Lexicon · MMXXVI</div>
        </div>

        {/* Layout: board + right column with engraved illustrations interleaved */}
        <div style={{position:'absolute', top: 100, bottom: 100, left: 0, right: 360, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{position:'relative'}}>
            {/* row + column markers */}
            <div style={{position:'absolute', top: -16, left: 0, display:'flex', fontSize: 9, color: D_PALETTE.inkSoft, fontStyle:'italic'}}>
              {[...Array(gridCols)].map((_,i)=>(<div key={i} style={{width: cellSize, textAlign:'center'}}>{i+1}</div>))}
            </div>
            <div style={{position:'absolute', left: -16, top: 0, display:'flex', flexDirection:'column', fontSize: 9, color: D_PALETTE.inkSoft, fontStyle:'italic'}}>
              {[...Array(gridRows)].map((_,i)=>(<div key={i} style={{height: cellSize, lineHeight: cellSize+'px'}}>{['a','b','c','d','e','f','g','h','i','j'][i]}</div>))}
            </div>
            {/* faint engraved grid */}
            <div style={{position:'relative', width: gridW, height: gridH}}>
              <svg style={{position:'absolute', inset: 0, width: gridW, height: gridH, pointerEvents:'none'}}>
                {[...Array(gridCols+1)].map((_,i)=>(
                  <line key={'v'+i} x1={i*cellSize} y1={0} x2={i*cellSize} y2={gridH} stroke={D_PALETTE.rule} strokeWidth="0.3" opacity="0.35"/>
                ))}
                {[...Array(gridRows+1)].map((_,i)=>(
                  <line key={'h'+i} x1={0} y1={i*cellSize} x2={gridW} y2={i*cellSize} stroke={D_PALETTE.rule} strokeWidth="0.3" opacity="0.35"/>
                ))}
              </svg>
              {BOARD_ROWS.map((row,r) => (
                <div key={r} style={{display:'flex'}}>
                  {row.map((ch,c) => {
                    const pi = pathIndex(r,c);
                    return <DTile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
                  })}
                </div>
              ))}
              <DPath cells={PATH} cellSize={cellSize}/>
            </div>

            {/* current word */}
            <div style={{position:'absolute', top: gridH + 14, left: 0, right: 0, display:'flex', alignItems:'center', gap: 14}}>
              <div style={{fontVariant:'small-caps', letterSpacing:'0.14em', fontSize: 11, color: D_PALETTE.inkSoft}}>specimen</div>
              <div style={{fontSize: 28, fontWeight: 600, letterSpacing: '0.18em', color: D_PALETTE.indigo, lineHeight: 1}}>EMBER</div>
              <div style={{fontStyle:'italic', fontSize: 15, color: D_PALETTE.madder}}>+18</div>
              <div style={{flex:1}}/>
              <div style={{fontStyle:'italic', fontSize: 11, color: D_PALETTE.inkSoft}}>fig. e₁ — straight; valid</div>
            </div>
          </div>
        </div>

        {/* Right column — engraved sidebar */}
        <div style={{position:'absolute', top: 100, bottom: 100, right: 30, width: 320, paddingLeft: 18, borderLeft: `0.5px solid ${D_PALETTE.rule}`}}>
          <div style={{fontVariant:'small-caps', letterSpacing:'0.18em', fontSize: 13, marginBottom: 6, color: D_PALETTE.ink}}>Objectives</div>
          <Fleuron width={280}/>
          <div style={{marginTop: 10}}>
            {OBJECTIVES.map((o,i) => (
              <div key={i} style={{display:'flex', alignItems:'flex-start', gap: 8, marginBottom: 14}}>
                <EngravedCheck done={o.done}/>
                <div style={{flex:1}}>
                  <div style={{fontSize: 14, fontStyle: 'italic', color: o.done? D_PALETTE.inkSoft : D_PALETTE.ink, textDecoration: o.done?'line-through':'none', textDecorationColor: D_PALETTE.madder, lineHeight: 1.3}}>{o.text}</div>
                  <div style={{display:'flex', alignItems:'center', gap: 8, marginTop: 4}}>
                    <div style={{flex:1, height: 1, position:'relative', background: D_PALETTE.paperEdge, borderTop: `0.5px solid ${D_PALETTE.rule}`}}>
                      <div style={{position:'absolute', left:0, top:-1.5, height: 3, width: `${(o.cur/o.max)*100}%`, background: o.done? D_PALETTE.indigo : D_PALETTE.madder, opacity: .85}}/>
                    </div>
                    <div style={{fontFamily: serifFamily, fontSize: 11, fontVariantNumeric:'oldstyle-nums', color: D_PALETTE.inkSoft}}>{o.cur}/{o.max}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop: 14}}>
            <div style={{fontVariant:'small-caps', letterSpacing:'0.18em', fontSize: 13, marginBottom: 6}}>Discoveries</div>
            <Fleuron width={280}/>
            <div style={{marginTop: 8}}>
              {RECENT.map((w,i) => (
                <div key={i} style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', padding: '5px 0', borderBottom: `0.5px dotted ${D_PALETTE.rule}`}}>
                  <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
                    <span style={{fontFamily: serifFamily, fontSize: 11, color: D_PALETTE.inkSoft, fontVariantNumeric:'oldstyle-nums'}}>{String(i+1).padStart(2,'0')}.</span>
                    <span style={{fontSize: 14, fontVariant:'small-caps', letterSpacing:'0.08em'}}>{w.word.toLowerCase()}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'baseline', gap: 6}}>
                    {w.note && <span style={{fontSize: 9, fontStyle:'italic', color: D_PALETTE.inkSoft}}>{w.note}</span>}
                    <span style={{fontSize: 13, color: D_PALETTE.madder, fontVariantNumeric:'oldstyle-nums', fontWeight: 600}}>+{w.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* small engraved illustration bottom */}
          <div style={{position:'absolute', bottom: 0, left: 18, right: 0, display:'flex', justifyContent:'center', opacity: 0.6}}>
            <Lichen size={140}/>
          </div>
        </div>

        {/* Action bar — bottom, engraved buttons */}
        <div style={{position:'absolute', bottom: 24, left: 0, right: 360, display:'flex', alignItems:'center', justifyContent:'center', gap: 18}}>
          <EngravedBtn label="Submit" sub="↵" primary/>
          <EngravedBtn label="Clear" sub="esc"/>
          <EngravedBtn label="Undo" sub="⌫"/>
          <EngravedBtn label="Clue" sub="?" warm/>
        </div>
      </div>
    </SpecimenPaper>
  );
}

const Stat = ({ label, value, accent }) => (
  <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
    <span style={{fontVariant:'small-caps', letterSpacing:'0.16em', fontSize: 10, color: D_PALETTE.inkSoft}}>{label}</span>
    <span style={{fontFamily: serifFamily, fontSize: 18, fontWeight: 600, color: accent || D_PALETTE.ink, fontVariantNumeric:'oldstyle-nums', lineHeight: 1}}>{value}</span>
  </div>
);

const EngravedCheck = ({ done }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" style={{flexShrink:0, marginTop: 3}}>
    <rect x="1" y="1" width="12" height="12" fill="none" stroke={D_PALETTE.rule} strokeWidth="0.8"/>
    <rect x="2" y="2" width="10" height="10" fill="none" stroke={D_PALETTE.rule} strokeWidth="0.4"/>
    {done && <path d="M3 7 L 6 10 L 11 3" fill="none" stroke={D_PALETTE.indigo} strokeWidth="1.2" strokeLinecap="round"/>}
  </svg>
);

const EngravedBtn = ({ label, sub, primary, warm, compact }) => {
  const color = primary ? D_PALETTE.indigo : warm ? D_PALETTE.warmSpot : D_PALETTE.ink;
  return (
    <div style={{
      padding: compact ? '7px 12px' : '10px 26px',
      border: `1px solid ${color}`,
      boxShadow: `inset 0 0 0 2px ${D_PALETTE.paper}, 0 0 0 1.5px ${color}`,
      background: primary ? 'rgba(36,58,92,.06)' : 'transparent',
      color,
      fontFamily: serifFamily,
      cursor: 'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', gap: 0,
      minWidth: compact ? 0 : 90,
    }}>
      <div style={{fontSize: compact ? 12 : 16, fontVariant:'small-caps', letterSpacing: compact ? '0.1em' : '0.16em', fontWeight: 600, lineHeight: 1.1}}>{label}</div>
      {sub && <div style={{fontSize: 9, fontStyle:'italic', opacity: .7}}>{sub}</div>}
    </div>
  );
};

// ─── Phone — 390 × 844 ─────────────────────────────────
function SpecimenPhone() {
  const cellSize = Math.floor((390 - 24) / 14); // 26
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;

  return (
    <SpecimenPaper padding={14}>
      <div style={{position:'absolute', inset: 0, fontFamily: serifFamily, color: D_PALETTE.ink}}>

        {/* botanical corner */}
        <div style={{position:'absolute', top: -6, right: -8, opacity: 0.7}}><Fern size={56}/></div>
        <div style={{position:'absolute', bottom: 4, left: -4, opacity: 0.6}}><Leaf size={44} rotate={-20}/></div>

        {/* Header */}
        <div style={{position:'absolute', top: 0, left: 0, right: 60, display:'flex', alignItems:'baseline', gap: 8}}>
          <span style={{fontVariant:'small-caps', letterSpacing:'0.14em', fontSize: 10, color: D_PALETTE.inkSoft}}>plate</span>
          <span style={{fontSize: 22, fontWeight: 600}}>I.</span>
          <span style={{fontStyle:'italic', fontSize: 14}}>The First Page</span>
        </div>
        <div style={{position:'absolute', top: 28, left: 0, right: 60}}><Fleuron width={300}/></div>

        {/* HUD line */}
        <div style={{position:'absolute', top: 46, left: 0, right: 60, display:'flex', alignItems:'baseline', gap: 12, fontSize: 11, flexWrap:'wrap'}}>
          <Stat label="Sc" value="240"/>
          <Stat label="Cb" value="×ii" accent={D_PALETTE.madder}/>
          <Stat label="W" value="vii"/>
          <Stat label="Cl" value="iii"/>
          <Stat label="t" value="4′13″"/>
        </div>

        {/* Board */}
        <div style={{position:'absolute', top: 76, left: 0, right: 0, display:'flex', justifyContent:'center'}}>
          <div style={{position:'relative', width: gridW, height: gridH}}>
            <svg style={{position:'absolute', inset: 0, width: gridW, height: gridH, pointerEvents:'none'}}>
              {[...Array(gridCols+1)].map((_,i)=>(
                <line key={'v'+i} x1={i*cellSize} y1={0} x2={i*cellSize} y2={gridH} stroke={D_PALETTE.rule} strokeWidth="0.3" opacity="0.3"/>
              ))}
              {[...Array(gridRows+1)].map((_,i)=>(
                <line key={'h'+i} x1={0} y1={i*cellSize} x2={gridW} y2={i*cellSize} stroke={D_PALETTE.rule} strokeWidth="0.3" opacity="0.3"/>
              ))}
            </svg>
            {BOARD_ROWS.map((row,r) => (
              <div key={r} style={{display:'flex'}}>
                {row.map((ch,c) => {
                  const pi = pathIndex(r,c);
                  return <DTile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} pathIdx={pi}/>;
                })}
              </div>
            ))}
            <DPath cells={PATH} cellSize={cellSize}/>
          </div>
        </div>

        {/* current word */}
        <div style={{position:'absolute', top: 76 + gridH + 12, left: 0, right: 0, textAlign:'center'}}>
          <div style={{fontVariant:'small-caps', letterSpacing:'0.14em', fontSize: 9, color: D_PALETTE.inkSoft}}>specimen</div>
          <div style={{fontSize: 22, fontWeight: 600, letterSpacing:'0.18em', color: D_PALETTE.indigo, lineHeight: 1.1}}>EMBER</div>
          <div style={{fontStyle:'italic', fontSize: 11, color: D_PALETTE.madder}}>+18 · fig. e₁ — straight, valid</div>
        </div>

        {/* Side surface — objectives */}
        <div style={{position:'absolute', top: 76 + gridH + 70, left: 4, right: 4, display:'flex', gap: 10}}>
          <div style={{flex: 1.1, paddingRight: 8, borderRight: `0.5px solid ${D_PALETTE.rule}`}}>
            <div style={{fontVariant:'small-caps', letterSpacing:'0.14em', fontSize: 10, marginBottom: 4}}>Objectives</div>
            {OBJECTIVES.map((o,i) => (
              <div key={i} style={{display:'flex', gap: 5, alignItems:'flex-start', marginBottom: 5}}>
                <EngravedCheck done={o.done}/>
                <div style={{flex:1}}>
                  <div style={{fontSize: 11, fontStyle:'italic', color: o.done? D_PALETTE.inkSoft : D_PALETTE.ink, textDecoration: o.done?'line-through':'none', lineHeight: 1.2}}>{o.text}</div>
                  <div style={{fontSize: 9, color: D_PALETTE.inkSoft, fontVariantNumeric:'oldstyle-nums'}}>{o.cur}/{o.max}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{flex: 1, paddingLeft: 4}}>
            <div style={{fontVariant:'small-caps', letterSpacing:'0.14em', fontSize: 10, marginBottom: 4}}>Discoveries</div>
            {RECENT.map((w,i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 10, marginBottom: 3, alignItems:'baseline'}}>
                <span style={{fontVariant:'small-caps', letterSpacing:'0.06em'}}>{w.word.toLowerCase()}</span>
                <span style={{color: D_PALETTE.madder, fontVariantNumeric:'oldstyle-nums', fontWeight: 600}}>+{w.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div style={{position:'absolute', bottom: 8, left: 8, right: 8, display:'flex', justifyContent:'space-between', gap: 4}}>
          <EngravedBtn label="Submit" sub="↵" primary compact/>
          <EngravedBtn label="Clear" compact/>
          <EngravedBtn label="Undo" compact/>
          <EngravedBtn label="Clue" warm compact/>
        </div>
      </div>
    </SpecimenPaper>
  );
}

Object.assign(window, { SpecimenDesktop, SpecimenPhone });
