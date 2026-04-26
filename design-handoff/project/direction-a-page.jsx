// Direction A — "The Page"
// Archive/journal: aged paper, deckle edge, foxing, candle bloom,
// fountain-pen tally HUD, wax-seal stamp action bar, marginalia.

const A_PALETTE = {
  paper: '#f3e9d2',          // soft cream
  paperDeep: '#e8dcbe',
  ink: '#2a1a10',
  inkSoft: '#5a4030',
  walnut: '#7a4a28',
  oxblood: '#742818',
  sepia: '#8a5a30',
  lampYellow: '#f5c860',
  rule: '#b89868',
  fox: '#a87038',
  gilt: '#c89848',
};

// SVG noise/grain overlay
const PaperGrain = ({ opacity = 0.18 }) => (
  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'multiply',opacity}}>
    <filter id="paperNoise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.4 0 0 0 0 0.28 0 0 0 0 0.16 0 0 0 1.2 -0.3"/></filter>
    <rect width="100%" height="100%" filter="url(#paperNoise)"/>
  </svg>
);

// Deckle edge: irregular paper boundary using clip-path polygon
const deckleClip = () => {
  const N = 80;
  const pts = [];
  // top
  for (let i = 0; i <= N; i++) {
    const x = (i/N)*100;
    const y = 0 + (Math.sin(i*1.7)*0.4 + Math.cos(i*0.8)*0.3 + Math.random()*0.4);
    pts.push(`${x.toFixed(2)}% ${Math.max(0,y).toFixed(2)}%`);
  }
  // right
  for (let i = 0; i <= N; i++) {
    const y = (i/N)*100;
    const x = 100 - (Math.sin(i*1.3)*0.4 + Math.cos(i*1.1)*0.3 + Math.random()*0.4);
    pts.push(`${Math.min(100,x).toFixed(2)}% ${y.toFixed(2)}%`);
  }
  // bottom
  for (let i = N; i >= 0; i--) {
    const x = (i/N)*100;
    const y = 100 - (Math.sin(i*1.5)*0.4 + Math.cos(i*0.9)*0.3 + Math.random()*0.4);
    pts.push(`${x.toFixed(2)}% ${Math.min(100,y).toFixed(2)}%`);
  }
  // left
  for (let i = N; i >= 0; i--) {
    const y = (i/N)*100;
    const x = 0 + (Math.sin(i*1.1)*0.4 + Math.cos(i*1.3)*0.3 + Math.random()*0.4);
    pts.push(`${Math.max(0,x).toFixed(2)}% ${y.toFixed(2)}%`);
  }
  return `polygon(${pts.join(', ')})`;
};

// Wax seal — circular blob with inset texture
const WaxSeal = ({ size = 64, color = A_PALETTE.oxblood, label, sub, rotate = -4 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${color} 40%, #4a1208 90%)`,
    boxShadow: `inset -3px -4px 8px rgba(0,0,0,.45), inset 3px 3px 6px rgba(255,180,140,.25), 1px 2px 4px rgba(0,0,0,.35)`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: '#f6dcc8', fontFamily: 'Garamond, "EB Garamond", serif',
    transform: `rotate(${rotate}deg)`,
    position: 'relative',
    flexShrink: 0,
  }}>
    {/* drip blob edge: irregular pseudo via clip-path */}
    <div style={{position:'absolute',inset:0,borderRadius:'48% 52% 50% 48% / 50% 48% 52% 50%',pointerEvents:'none'}}/>
    <div style={{fontSize: size*0.42, fontWeight: 700, lineHeight: 1, fontStyle: 'italic', textShadow:'0 1px 0 rgba(0,0,0,.3)'}}>{label}</div>
    {sub && <div style={{fontSize: size*0.13, letterSpacing: 1, opacity: .85, marginTop: 2}}>{sub}</div>}
  </div>
);

// Fountain-pen tally entry: italic label + scratched value
const TallyEntry = ({ label, value, accent }) => (
  <div style={{display:'flex', alignItems:'baseline', gap: 8}}>
    <span style={{fontFamily:'"Tangerine", cursive', fontSize: 22, color: A_PALETTE.inkSoft, fontStyle: 'italic'}}>{label}</span>
    <span style={{fontFamily:'Garamond, serif', fontSize: 22, color: accent || A_PALETTE.ink, fontWeight: 600, fontVariantNumeric:'oldstyle-nums'}}>{value}</span>
  </div>
);

// Tile — a cast-metal letter on paper, slightly rotated, slightly inked
const PageTile = ({ ch, r, c, size = 40, onPath, pathIdx, isHead, isStart }) => {
  // tiny per-cell rotation for hand-set feel
  const rot = ((r*7 + c*13) % 7 - 3) * 0.3;
  const ink = onPath ? A_PALETTE.oxblood : A_PALETTE.ink;
  const bg = onPath ? '#f6e3c8' : 'transparent';
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Garamond, "EB Garamond", "Cormorant Garamond", serif',
      fontSize: size * 0.55, fontWeight: 500,
      color: ink,
      background: bg,
      transform: `rotate(${rot}deg)`,
      position: 'relative',
      letterSpacing: '0.02em',
      textShadow: onPath ? '0 0 1px rgba(116,40,24,.3)' : '0 0 0.5px rgba(42,26,16,.5)',
      borderRadius: onPath ? 2 : 0,
    }}>
      {ch}
      {onPath && (
        <span style={{
          position:'absolute', bottom: 1, right: 2,
          fontFamily:'Garamond, serif', fontSize: size*0.18, color: A_PALETTE.oxblood,
          fontStyle:'italic', opacity: .7,
        }}>{pathIdx+1}</span>
      )}
    </div>
  );
};

// Path overlay: hand-inked line connecting traced cells
const InkPath = ({ cells, cellSize, gridX, gridY, stroke = A_PALETTE.oxblood }) => {
  const pts = cells.map(([r,c]) => [gridX + c*cellSize + cellSize/2, gridY + r*cellSize + cellSize/2]);
  const d = pts.map((p,i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      <defs>
        <filter id="inkBleed"><feGaussianBlur stdDeviation="0.6"/></filter>
      </defs>
      {/* shadow stroke — wider, softer, gives ink-bleed feel */}
      <path d={d} stroke={stroke} strokeWidth={cellSize*0.42} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.16" filter="url(#inkBleed)"/>
      <path d={d} stroke={stroke} strokeWidth={cellSize*0.16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
      {/* node dots */}
      {pts.map((p,i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={cellSize*0.06} fill={stroke} opacity="0.9"/>
      ))}
      {/* arrowhead at last node */}
      {pts.length >= 2 && (() => {
        const [a,b] = [pts[pts.length-2], pts[pts.length-1]];
        const ang = Math.atan2(b[1]-a[1], b[0]-a[0]);
        const len = cellSize*0.22;
        const x1 = b[0] - Math.cos(ang-0.5)*len, y1 = b[1] - Math.sin(ang-0.5)*len;
        const x2 = b[0] - Math.cos(ang+0.5)*len, y2 = b[1] - Math.sin(ang+0.5)*len;
        return <path d={`M ${b[0]} ${b[1]} L ${x1} ${y1} M ${b[0]} ${b[1]} L ${x2} ${y2}`} stroke={stroke} strokeWidth={cellSize*0.08} strokeLinecap="round" fill="none"/>;
      })()}
    </svg>
  );
};

// The aged paper page surface (used by both desktop and phone)
const AgedPage = ({ children, padding = 36, candleCorner = 'tr', style = {} }) => {
  const [clip] = React.useState(() => deckleClip());
  return (
    <div style={{position:'relative', width:'100%', height:'100%', background: '#3a2a18', overflow:'hidden', ...style}}>
      {/* desk shadow underneath */}
      <div style={{position:'absolute',inset:8,background:'rgba(0,0,0,.45)',filter:'blur(14px)'}}/>
      {/* the page itself */}
      <div style={{
        position:'absolute', inset: 12,
        background: `radial-gradient(ellipse at 30% 25%, #f9f0d8 0%, ${A_PALETTE.paper} 45%, ${A_PALETTE.paperDeep} 100%)`,
        clipPath: clip,
      }}>
        {/* foxing spots */}
        <div style={{position:'absolute',top:'8%',left:'12%',width:18,height:14,borderRadius:'50%',background:'radial-gradient(circle,'+A_PALETTE.fox+' 0%,transparent 70%)',opacity:.35}}/>
        <div style={{position:'absolute',top:'82%',right:'18%',width:24,height:18,borderRadius:'50%',background:'radial-gradient(circle,'+A_PALETTE.fox+' 0%,transparent 70%)',opacity:.28}}/>
        <div style={{position:'absolute',bottom:'8%',left:'8%',width:14,height:12,borderRadius:'50%',background:'radial-gradient(circle,'+A_PALETTE.fox+' 0%,transparent 70%)',opacity:.32}}/>
        <div style={{position:'absolute',top:'45%',right:'5%',width:10,height:9,borderRadius:'50%',background:'radial-gradient(circle,'+A_PALETTE.fox+' 0%,transparent 70%)',opacity:.25}}/>

        {/* candle bloom */}
        {candleCorner === 'tr' && (
          <div style={{position:'absolute',top:-60,right:-60,width:300,height:300,
            background:'radial-gradient(circle, rgba(245,200,96,.45) 0%, rgba(245,200,96,.15) 35%, transparent 70%)', pointerEvents:'none'}}/>
        )}
        {/* faint rule lines */}
        <div style={{position:'absolute', inset: padding, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(180,140,90,.18) 27px, rgba(180,140,90,.18) 28px)`, pointerEvents:'none'}}/>

        <PaperGrain opacity={0.22}/>

        {/* dust motes */}
        {[...Array(20)].map((_,i)=>(
          <div key={i} style={{
            position:'absolute',
            top: `${(i*53)%100}%`, left: `${(i*37+13)%100}%`,
            width: 2+(i%3), height: 2+(i%3), borderRadius:'50%',
            background: 'rgba(245,220,160,.5)',
            boxShadow: '0 0 4px rgba(245,200,96,.4)',
          }}/>
        ))}

        {/* gilded corner ornaments */}
        <CornerOrnament style={{top: 14, left: 14}} flip=""/>
        <CornerOrnament style={{top: 14, right: 14}} flip="scaleX(-1)"/>
        <CornerOrnament style={{bottom: 14, left: 14}} flip="scaleY(-1)"/>
        <CornerOrnament style={{bottom: 14, right: 14}} flip="scale(-1,-1)"/>

        <div style={{position:'absolute', inset: padding}}>
          {children}
        </div>
      </div>
    </div>
  );
};

const CornerOrnament = ({ style, flip }) => (
  <svg width="36" height="36" viewBox="0 0 36 36" style={{position:'absolute', transform: flip, ...style}}>
    <g stroke={A_PALETTE.gilt} strokeWidth="0.9" fill="none">
      <path d="M2 18 Q 2 2 18 2"/>
      <path d="M6 18 Q 6 6 18 6"/>
      <circle cx="6" cy="6" r="1.4" fill={A_PALETTE.gilt}/>
      <path d="M2 18 Q 8 12 14 14 Q 12 8 18 2" opacity="0.5"/>
    </g>
  </svg>
);

// ─── Desktop — 1440 × 900 ─────────────────────────────────
function PageDesktop() {
  const cellSize = 38;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;
  const gridLeft = 38, gridTop = 18; // within the board container

  return (
    <AgedPage padding={32}>
      <div style={{position:'absolute', inset: 0, fontFamily: 'Garamond, "EB Garamond", serif', color: A_PALETTE.ink}}>

        {/* Top: round wax seal + fountain-pen tally */}
        <div style={{position:'absolute', top: 6, left: 0, right: 0, display:'flex', alignItems:'center', gap: 22}}>
          <WaxSeal size={72} label="I" sub="ROUND" rotate={-6}/>
          <div>
            <div style={{fontFamily:'"Tangerine", "Italianno", cursive', fontSize: 36, color: A_PALETTE.walnut, lineHeight: 1, letterSpacing: 0.5}}>The First Page</div>
            <div style={{fontStyle:'italic', fontSize: 13, color: A_PALETTE.inkSoft, marginTop: 2, letterSpacing: 0.5}}>— folio the first, of three —</div>
          </div>
          <div style={{flex:1}}/>
          {/* tally */}
          <div style={{display:'flex', gap: 26, alignItems: 'baseline', paddingRight: 8}}>
            <TallyEntry label="score" value="240" accent={A_PALETTE.ink}/>
            <TallyEntry label="combo" value="×2" accent={A_PALETTE.oxblood}/>
            <TallyEntry label="clues" value="iii" accent={A_PALETTE.walnut}/>
            <TallyEntry label="glass" value="4:13" accent={A_PALETTE.ink}/>
          </div>
        </div>

        {/* Decorative rule under header */}
        <div style={{position:'absolute', top: 92, left: 0, right: 0, height: 8}}>
          <svg width="100%" height="8" viewBox="0 0 1376 8" preserveAspectRatio="none">
            <line x1="0" y1="3" x2="1376" y2="3" stroke={A_PALETTE.gilt} strokeWidth="0.6"/>
            <line x1="0" y1="6" x2="1376" y2="6" stroke={A_PALETTE.gilt} strokeWidth="0.3"/>
            <g transform="translate(688 4)">
              <circle r="3" fill={A_PALETTE.gilt}/><circle r="1" fill={A_PALETTE.paper}/>
            </g>
          </svg>
        </div>

        {/* Layout: board (center) + right marginalia */}
        <div style={{position:'absolute', top: 110, bottom: 90, left: 0, right: 280, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{position:'relative', width: gridW + gridLeft*2, height: gridH + gridTop*2}}>
            {/* row & column markers in roman/italic */}
            <div style={{position:'absolute', top: gridTop - 14, left: gridLeft, fontFamily:'Garamond,serif', fontStyle:'italic', fontSize: 10, color: A_PALETTE.inkSoft, display:'flex'}}>
              {[...Array(gridCols)].map((_,i)=>(<div key={i} style={{width: cellSize, textAlign:'center', opacity:.7}}>{String.fromCharCode(97+i)}</div>))}
            </div>
            <div style={{position:'absolute', left: gridLeft - 18, top: gridTop, fontFamily:'Garamond,serif', fontStyle:'italic', fontSize: 10, color: A_PALETTE.inkSoft, display:'flex', flexDirection:'column'}}>
              {[...Array(gridRows)].map((_,i)=>(<div key={i} style={{height: cellSize, lineHeight: cellSize+'px', opacity:.7}}>{['i','ii','iii','iv','v','vi','vii','viii','ix','x'][i]}</div>))}
            </div>

            {/* board cells */}
            <div style={{position:'absolute', top: gridTop, left: gridLeft, width: gridW, height: gridH}}>
              {BOARD_ROWS.map((row,r) => (
                <div key={r} style={{display:'flex'}}>
                  {row.map((ch,c) => {
                    const pi = pathIndex(r,c);
                    return <PageTile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
                  })}
                </div>
              ))}
              <InkPath cells={PATH} cellSize={cellSize} gridX={0} gridY={0}/>
            </div>

            {/* current word ribbon below grid */}
            <div style={{position:'absolute', top: gridTop + gridH + 14, left: gridLeft, right: gridLeft, display:'flex', alignItems:'center', gap: 14}}>
              <div style={{fontStyle:'italic', fontSize: 13, color: A_PALETTE.inkSoft}}>currently inscribed —</div>
              <div style={{fontFamily:'Garamond, serif', fontSize: 32, fontWeight: 600, color: A_PALETTE.oxblood, letterSpacing: '0.18em'}}>E·M·B·E·R</div>
              <div style={{fontStyle:'italic', fontSize: 18, color: A_PALETTE.walnut}}>+18</div>
              <div style={{flex:1}}/>
              <div style={{fontStyle:'italic', fontSize: 12, color: A_PALETTE.inkSoft, opacity: .7}}>✓ valid</div>
            </div>
          </div>
        </div>

        {/* Right margin: marginalia — objectives + recent words */}
        <div style={{position:'absolute', top: 110, bottom: 90, right: 8, width: 260, paddingLeft: 14, borderLeft: `1px solid ${A_PALETTE.gilt}`}}>
          <div style={{fontFamily:'"Tangerine","Italianno",cursive', fontSize: 28, color: A_PALETTE.walnut, lineHeight: 1, marginBottom: 6}}>Objectives</div>
          <div style={{borderBottom: `0.5px dotted ${A_PALETTE.rule}`, marginBottom: 10}}/>
          {OBJECTIVES.map((o,i) => (
            <div key={i} style={{display:'flex', alignItems:'flex-start', gap: 8, marginBottom: 12}}>
              <HandCheckbox done={o.done}/>
              <div style={{flex:1, fontFamily:'"Tangerine","Italianno",cursive', fontSize: 22, color: o.done? A_PALETTE.inkSoft : A_PALETTE.ink, lineHeight: 1.1, textDecoration: o.done?'line-through':'none', textDecorationColor: A_PALETTE.oxblood}}>
                {o.text}
                <div style={{fontFamily:'Garamond,serif', fontSize: 11, color: A_PALETTE.inkSoft, fontStyle:'italic', marginTop: 2}}>
                  {o.cur}/{o.max}
                  <span style={{display:'inline-block', width: 80, height: 3, background: A_PALETTE.paperDeep, marginLeft: 8, position:'relative', verticalAlign:'middle'}}>
                    <span style={{position:'absolute', left:0, top:0, height:'100%', width: `${(o.cur/o.max)*100}%`, background: o.done? A_PALETTE.walnut : A_PALETTE.oxblood}}/>
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div style={{fontFamily:'"Tangerine","Italianno",cursive', fontSize: 28, color: A_PALETTE.walnut, lineHeight: 1, marginTop: 22, marginBottom: 6}}>Discovered</div>
          <div style={{borderBottom: `0.5px dotted ${A_PALETTE.rule}`, marginBottom: 10}}/>
          {RECENT.map((w,i) => (
            <div key={i} style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 6, fontFamily:'Garamond,serif'}}>
              <div>
                <span style={{fontSize: 15, fontVariant:'small-caps', letterSpacing: '0.08em', color: A_PALETTE.ink}}>{w.word.toLowerCase()}</span>
                {w.note && <span style={{fontSize: 10, fontStyle:'italic', color: A_PALETTE.inkSoft, marginLeft: 6}}>{w.note}</span>}
              </div>
              <span style={{fontVariantNumeric:'oldstyle-nums', fontSize: 14, color: A_PALETTE.oxblood, fontWeight: 600}}>+{w.score}</span>
            </div>
          ))}
        </div>

        {/* Bottom: wax-seal stamp action bar */}
        <div style={{position:'absolute', bottom: 8, left: 0, right: 0, display:'flex', alignItems:'center', gap: 26, justifyContent:'center'}}>
          <ActionSeal label="Submit" sub="↵" color={A_PALETTE.oxblood} size={64} primary/>
          <ActionSeal label="Clear"  sub="esc" color="#5a3a2a" size={56}/>
          <ActionSeal label="Undo"   sub="⌫"   color="#5a3a2a" size={56}/>
          <ActionSeal label="Clue"   sub="?"   color={A_PALETTE.walnut} size={56}/>
        </div>
      </div>
    </AgedPage>
  );
}

const HandCheckbox = ({ done }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{flexShrink:0, marginTop:4}}>
    <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke={A_PALETTE.ink} strokeWidth="1.2" transform="rotate(-2 8 8)"/>
    {done && <path d="M3 8 L 7 12 L 14 3" fill="none" stroke={A_PALETTE.oxblood} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const ActionSeal = ({ label, sub, color, size, primary }) => (
  <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap: 4}}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, ${color} 0%, ${color} 40%, ${primary?'#3a0c04':'#2a1a10'} 95%)`,
      boxShadow: `inset -3px -4px 8px rgba(0,0,0,.45), inset 3px 3px 6px rgba(255,180,140,.2), 1px 2px 4px rgba(0,0,0,.4)`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      color:'#f6dcc8', fontFamily:'Garamond, serif', fontStyle:'italic',
      transform: `rotate(${(label.length*7)%9-4}deg)`,
      cursor: 'pointer',
    }}>
      <div style={{fontSize: size*0.22, fontWeight: 600, lineHeight: 1, letterSpacing: '0.08em', textTransform:'lowercase'}}>{label}</div>
      <div style={{fontSize: size*0.16, opacity: .7, marginTop: 2}}>{sub}</div>
    </div>
  </div>
);

// ─── Phone — 390 × 844 ─────────────────────────────────
function PagePhone() {
  const cellSize = 23.5;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;

  return (
    <AgedPage padding={16}>
      <div style={{position:'absolute', inset: 0, fontFamily: 'Garamond, "EB Garamond", serif', color: A_PALETTE.ink}}>

        {/* Header: small wax seal + tally */}
        <div style={{position:'absolute', top: 4, left: 0, right: 0, display:'flex', alignItems:'center', gap: 10}}>
          <WaxSeal size={42} label="I" sub="" rotate={-5}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:'"Tangerine","Italianno",cursive', fontSize: 22, color: A_PALETTE.walnut, lineHeight: 1}}>The First Page</div>
            <div style={{fontStyle:'italic', fontSize: 9, color: A_PALETTE.inkSoft, marginTop: 1}}>folio i of iii</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'Garamond,serif', fontSize: 22, fontWeight: 600, color: A_PALETTE.ink, lineHeight: 1, fontVariantNumeric:'oldstyle-nums'}}>240</div>
            <div style={{fontStyle:'italic', fontSize: 10, color: A_PALETTE.oxblood}}>×2 · 4:13</div>
          </div>
        </div>

        {/* mini tally line */}
        <div style={{position:'absolute', top: 50, left: 0, right: 0, fontFamily:'Garamond,serif', fontSize: 10, color: A_PALETTE.inkSoft, display:'flex', justifyContent:'space-between', fontStyle:'italic', borderBottom:`0.5px dotted ${A_PALETTE.rule}`, paddingBottom: 4}}>
          <span>clues iii</span><span>words vii</span><span>combo ×2</span><span>glass 4:13</span>
        </div>

        {/* Board — centered */}
        <div style={{position:'absolute', top: 76, left: 0, right: 0, display:'flex', justifyContent:'center'}}>
          <div style={{position:'relative', width: gridW, height: gridH}}>
            {BOARD_ROWS.map((row,r) => (
              <div key={r} style={{display:'flex'}}>
                {row.map((ch,c) => {
                  const pi = pathIndex(r,c);
                  return <PageTile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} pathIdx={pi}/>;
                })}
              </div>
            ))}
            <InkPath cells={PATH} cellSize={cellSize} gridX={0} gridY={0}/>
          </div>
        </div>

        {/* current word inscription */}
        <div style={{position:'absolute', top: 76 + gridH + 14, left: 0, right: 0, textAlign:'center'}}>
          <div style={{fontStyle:'italic', fontSize: 10, color: A_PALETTE.inkSoft}}>currently inscribed</div>
          <div style={{fontFamily:'Garamond,serif', fontSize: 26, fontWeight: 600, color: A_PALETTE.oxblood, letterSpacing: '0.18em', lineHeight: 1.1}}>E·M·B·E·R</div>
          <div style={{fontStyle:'italic', fontSize: 13, color: A_PALETTE.walnut}}>+18 · ✓ valid</div>
        </div>

        {/* Marginalia — objectives (left half) + recent (right half) */}
        <div style={{position:'absolute', top: 76 + gridH + 78, left: 0, right: 0, display:'flex', gap: 8}}>
          <div style={{flex: 1, paddingRight: 6, borderRight: `0.5px dotted ${A_PALETTE.rule}`}}>
            <div style={{fontFamily:'"Tangerine","Italianno",cursive', fontSize: 18, color: A_PALETTE.walnut, lineHeight: 1, marginBottom: 4}}>Objectives</div>
            {OBJECTIVES.map((o,i) => (
              <div key={i} style={{display:'flex', gap: 4, marginBottom: 4, alignItems:'flex-start'}}>
                <HandCheckbox done={o.done}/>
                <div style={{flex:1, fontFamily:'"Tangerine","Italianno",cursive', fontSize: 14, lineHeight: 1.1, color: o.done? A_PALETTE.inkSoft : A_PALETTE.ink, textDecoration: o.done?'line-through':'none'}}>
                  {o.text} <span style={{fontFamily:'Garamond,serif', fontSize: 9, fontStyle:'italic'}}>({o.cur}/{o.max})</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{flex: 1, paddingLeft: 6}}>
            <div style={{fontFamily:'"Tangerine","Italianno",cursive', fontSize: 18, color: A_PALETTE.walnut, lineHeight: 1, marginBottom: 4}}>Discovered</div>
            {RECENT.map((w,i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', fontFamily:'Garamond,serif', fontSize: 11, marginBottom: 2}}>
                <span style={{fontVariant:'small-caps', letterSpacing:'0.06em'}}>{w.word.toLowerCase()}</span>
                <span style={{color: A_PALETTE.oxblood, fontWeight: 600}}>+{w.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action bar — bottom */}
        <div style={{position:'absolute', bottom: 4, left: 0, right: 0, display:'flex', alignItems:'center', gap: 10, justifyContent:'center'}}>
          <ActionSeal label="Submit" sub="↵" color={A_PALETTE.oxblood} size={48} primary/>
          <ActionSeal label="Clear" sub="" color="#5a3a2a" size={40}/>
          <ActionSeal label="Undo" sub="" color="#5a3a2a" size={40}/>
          <ActionSeal label="Clue" sub="" color={A_PALETTE.walnut} size={40}/>
        </div>
      </div>
    </AgedPage>
  );
}

Object.assign(window, { PageDesktop, PagePhone });
