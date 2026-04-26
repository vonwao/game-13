// Direction C — "Terminal"
// Brutalist CRT. Pure mono. Phosphor on near-black + signal red.
// ASCII-bordered panes, scanlines, keystroke hint action bar.

const C_PALETTE = {
  bg: '#0a0d09',
  bgDeep: '#06080a',
  phosphor: '#7fdb6a',
  phosphorDim: 'rgba(127,219,106,.55)',
  phosphorFaint: 'rgba(127,219,106,.25)',
  red: '#ff4030',
  redDim: 'rgba(255,64,48,.6)',
};

const monoFamily = '"IBM Plex Mono", "JetBrains Mono", "Consolas", monospace';

// Scanline overlay
const Scanlines = () => (
  <div style={{
    position:'absolute', inset:0, pointerEvents:'none',
    background: 'repeating-linear-gradient(to bottom, rgba(127,219,106,0) 0px, rgba(127,219,106,0) 2px, rgba(0,0,0,.18) 2px, rgba(0,0,0,.18) 3px)',
    mixBlendMode: 'multiply',
    opacity: 0.7,
  }}/>
);
const PhosphorGlow = () => (
  <div style={{
    position:'absolute', inset:0, pointerEvents:'none',
    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.55) 100%)',
  }}/>
);

const CTile = ({ ch, size, onPath, pathIdx, isHead }) => (
  <div style={{
    width: size, height: size,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily: monoFamily,
    fontSize: size * 0.55,
    fontWeight: 500,
    color: onPath ? C_PALETTE.bg : C_PALETTE.phosphor,
    background: onPath ? (isHead ? C_PALETTE.red : C_PALETTE.phosphor) : 'transparent',
    border: `1px solid ${C_PALETTE.phosphorFaint}`,
    marginLeft: -1, marginTop: -1,
    textShadow: onPath ? 'none' : `0 0 4px ${C_PALETTE.phosphorDim}`,
    position:'relative',
  }}>
    {ch}
  </div>
);

const CPath = ({ cells, cellSize }) => {
  const pts = cells.map(([r,c]) => [c*cellSize + cellSize/2, r*cellSize + cellSize/2]);
  const d = pts.map((p,i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  return (
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      <path d={d} stroke={C_PALETTE.red} strokeWidth={2} fill="none" opacity="0.9"/>
    </svg>
  );
};

// ASCII-bordered pane
const AsciiPane = ({ title, width, height, children, style }) => (
  <div style={{
    fontFamily: monoFamily, fontSize: 11, color: C_PALETTE.phosphor,
    width, height,
    position:'relative',
    ...style,
  }}>
    {/* top border */}
    <div style={{whiteSpace:'pre', lineHeight: 1, color: C_PALETTE.phosphorDim}}>
      {`+--[ ${title} ]${'-'.repeat(Math.max(2, Math.floor(width/7) - title.length - 6))}+`}
    </div>
    <div style={{
      borderLeft:`1px solid ${C_PALETTE.phosphorDim}`,
      borderRight:`1px solid ${C_PALETTE.phosphorDim}`,
      padding: '6px 8px',
      height: 'calc(100% - 24px)',
      overflow:'hidden',
    }}>
      {children}
    </div>
    <div style={{whiteSpace:'pre', lineHeight: 1, color: C_PALETTE.phosphorDim}}>
      {`+${'-'.repeat(Math.max(2, Math.floor(width/7) - 2))}+`}
    </div>
  </div>
);

// ─── Desktop — 1440 × 900 ─────────────────────────────────
function TerminalDesktop() {
  const cellSize = 48;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows; // 672 × 480

  return (
    <div style={{position:'relative', width:'100%', height:'100%', background: C_PALETTE.bg, color: C_PALETTE.phosphor, fontFamily: monoFamily, overflow:'hidden'}}>

      {/* Status line */}
      <div style={{position:'absolute', top: 0, left: 0, right: 0, padding: '14px 24px', borderBottom: `1px solid ${C_PALETTE.phosphorFaint}`, display:'flex', alignItems:'center', gap: 28, fontSize: 13, letterSpacing: '0.04em'}}>
        <span style={{color: C_PALETTE.phosphorDim}}>lexicon@deep:~$</span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>RND</span> 1/3</span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>SCORE</span> <span style={{textShadow:`0 0 6px ${C_PALETTE.phosphor}`}}>240</span></span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>COMBO</span> <span style={{color: C_PALETTE.red}}>×2</span></span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>CLUES</span> 3</span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>WORDS</span> 07</span>
        <span><span style={{color:C_PALETTE.phosphorDim}}>TIME</span> <span style={{color: C_PALETTE.red}}>4:13</span></span>
        <div style={{flex:1}}/>
        <span style={{color: C_PALETTE.phosphorDim}}>// page: the_first_page.dat</span>
      </div>

      {/* Round banner */}
      <div style={{position:'absolute', top: 50, left: 24, right: 24, fontSize: 12, color: C_PALETTE.phosphorDim, letterSpacing: '0.2em'}}>
        ╔══ ROUND_01 :: "THE_FIRST_PAGE" ══════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
      </div>

      {/* Grid — left side */}
      <div style={{position:'absolute', top: 84, left: 24, width: gridW + 32, height: gridH + 32}}>
        {/* col + row guides */}
        <div style={{position:'absolute', top: -16, left: 16, display:'flex'}}>
          {[...Array(gridCols)].map((_,i) => (
            <div key={i} style={{width: cellSize, textAlign:'center', fontSize: 10, color: C_PALETTE.phosphorFaint}}>{String(i).padStart(2,'0')}</div>
          ))}
        </div>
        <div style={{position:'absolute', left: -2, top: 16, display:'flex', flexDirection:'column'}}>
          {[...Array(gridRows)].map((_,i) => (
            <div key={i} style={{height: cellSize, lineHeight: cellSize+'px', fontSize: 10, color: C_PALETTE.phosphorFaint, width: 14, textAlign:'right'}}>{i}</div>
          ))}
        </div>
        <div style={{position:'absolute', top: 16, left: 16, width: gridW, height: gridH}}>
          {BOARD_ROWS.map((row,r) => (
            <div key={r} style={{display:'flex'}}>
              {row.map((ch,c) => {
                const pi = pathIndex(r,c);
                return <CTile key={c} ch={ch} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
              })}
            </div>
          ))}
          <CPath cells={PATH} cellSize={cellSize}/>
        </div>
      </div>

      {/* Right column: objectives + history panes */}
      <div style={{position:'absolute', top: 84, right: 24, width: 380, display:'flex', flexDirection:'column', gap: 16}}>
        <AsciiPane title="OBJECTIVES" width={380} height={170}>
          {OBJECTIVES.map((o,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap: 6, fontSize: 12, lineHeight: 1.7, color: o.done? C_PALETTE.phosphorDim : C_PALETTE.phosphor}}>
              <span style={{color: o.done? C_PALETTE.phosphor : C_PALETTE.phosphorFaint}}>{o.done? '[x]' : '[ ]'}</span>
              <span style={{flex:1, textTransform:'uppercase', textDecoration: o.done?'line-through':'none', textDecorationColor: C_PALETTE.phosphor}}>{o.text}</span>
              <span style={{color: o.done ? C_PALETTE.phosphor : C_PALETTE.phosphorDim}}>
                {`[${'#'.repeat(Math.round((o.cur/o.max)*8)).padEnd(8,'·')}]`} {o.cur}/{o.max}
              </span>
            </div>
          ))}
        </AsciiPane>

        <AsciiPane title="SCROLLBACK :: words" width={380} height={210}>
          {RECENT.map((w,i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize: 12, lineHeight: 1.7}}>
              <span><span style={{color: C_PALETTE.phosphorFaint}}>&gt;</span> {w.word.padEnd(10,' ')}</span>
              <span style={{color: w.note.includes('×')||w.score>=24? C_PALETTE.red : C_PALETTE.phosphor}}>+{String(w.score).padStart(3,'0')}</span>
            </div>
          ))}
          <div style={{marginTop: 10, fontSize: 11, color: C_PALETTE.phosphorFaint}}>// {RECENT.length} of 7 entries · ↑↓ to scroll</div>
        </AsciiPane>

        <AsciiPane title="PLANTED :: 1/3 found" width={380} height={84}>
          <div style={{fontSize: 12, lineHeight: 1.7, color: C_PALETTE.phosphor}}>
            <div>[x] LANTERN <span style={{color: C_PALETTE.phosphorFaint}}>// row 3</span></div>
            <div style={{color: C_PALETTE.phosphorFaint}}>[?] ??????? // hint avail</div>
            <div style={{color: C_PALETTE.phosphorFaint}}>[?] ?????</div>
          </div>
        </AsciiPane>
      </div>

      {/* Word in progress + keystroke action bar */}
      <div style={{position:'absolute', bottom: 0, left: 0, right: 0, padding: '14px 24px 18px', borderTop:`1px solid ${C_PALETTE.phosphorFaint}`, background: C_PALETTE.bgDeep}}>
        <div style={{display:'flex', alignItems:'center', gap: 14, fontSize: 14, marginBottom: 10}}>
          <span style={{color: C_PALETTE.phosphorDim}}>&gt;</span>
          <span style={{color: C_PALETTE.phosphor, fontSize: 18, letterSpacing: '0.2em', textShadow:`0 0 8px ${C_PALETTE.phosphor}`}}>EMBER<span style={{display:'inline-block', width: 10, height: 18, background: C_PALETTE.phosphor, marginLeft: 4, verticalAlign:'middle', animation:'blink 1s infinite'}}/></span>
          <span style={{color: C_PALETTE.red, fontSize: 14}}>+18</span>
          <span style={{color: C_PALETTE.phosphorDim, fontSize: 12}}>// path: r2c6→r2c10  shape: STRAIGHT  status: VALID</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: 22, fontSize: 13, color: C_PALETTE.phosphorDim}}>
          <span><Kbd>S</Kbd> submit</span>
          <span><Kbd>C</Kbd> clear</span>
          <span><Kbd>U</Kbd> undo</span>
          <span><Kbd>?</Kbd> clue</span>
          <div style={{flex:1}}/>
          <span style={{color: C_PALETTE.phosphorFaint, fontSize: 11}}>esc to abort · click tiles to trace · type letters</span>
        </div>
      </div>

      <Scanlines/>
      <PhosphorGlow/>
    </div>
  );
}

const Kbd = ({ children }) => (
  <span style={{
    display:'inline-block', padding:'2px 7px', minWidth: 20, textAlign:'center',
    border:`1px solid ${C_PALETTE.phosphor}`,
    color: C_PALETTE.phosphor,
    fontFamily: monoFamily, fontSize: 12, fontWeight: 700,
    marginRight: 4,
  }}>{children}</span>
);

// ─── Phone — 390 × 844 ─────────────────────────────────
function TerminalPhone() {
  const cellSize = Math.floor((390 - 16) / 14); // 26
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize * gridCols, gridH = cellSize * gridRows;

  return (
    <div style={{position:'relative', width:'100%', height:'100%', background: C_PALETTE.bg, color: C_PALETTE.phosphor, fontFamily: monoFamily, overflow:'hidden'}}>

      {/* Status line - condensed */}
      <div style={{position:'absolute', top: 0, left: 0, right: 0, padding: '10px 12px', borderBottom: `1px solid ${C_PALETTE.phosphorFaint}`, fontSize: 10, lineHeight: 1.5}}>
        <div style={{display:'flex', justifyContent:'space-between', color: C_PALETTE.phosphorDim}}>
          <span>lexicon@deep:~$</span>
          <span style={{color: C_PALETTE.red}}>● REC 4:13</span>
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop: 2}}>
          <span>RND <span style={{color: C_PALETTE.phosphor}}>1/3</span></span>
          <span>SCORE <span style={{color: C_PALETTE.phosphor, textShadow: `0 0 6px ${C_PALETTE.phosphor}`}}>240</span></span>
          <span>COMBO <span style={{color: C_PALETTE.red}}>×2</span></span>
          <span>CLUES <span style={{color: C_PALETTE.phosphor}}>3</span></span>
        </div>
        <div style={{marginTop: 4, color: C_PALETTE.phosphorDim, fontSize: 9, letterSpacing: '0.15em'}}>══ "THE_FIRST_PAGE" ══════════════════════════</div>
      </div>

      {/* Board */}
      <div style={{position:'absolute', top: 78, left: 0, right: 0, display:'flex', justifyContent:'center'}}>
        <div style={{position:'relative', width: gridW, height: gridH}}>
          {BOARD_ROWS.map((row,r) => (
            <div key={r} style={{display:'flex'}}>
              {row.map((ch,c) => {
                const pi = pathIndex(r,c);
                return <CTile key={c} ch={ch} size={cellSize} onPath={pi>=0} pathIdx={pi} isHead={pi===PATH.length-1}/>;
              })}
            </div>
          ))}
          <CPath cells={PATH} cellSize={cellSize}/>
        </div>
      </div>

      {/* Word in progress */}
      <div style={{position:'absolute', top: 78 + gridH + 14, left: 12, right: 12, fontSize: 12}}>
        <div style={{color: C_PALETTE.phosphorDim, fontSize: 9, letterSpacing: '0.15em', marginBottom: 2}}>// TRACING</div>
        <div style={{display:'flex', alignItems:'center', gap: 8}}>
          <span style={{color: C_PALETTE.phosphorDim}}>&gt;</span>
          <span style={{color: C_PALETTE.phosphor, fontSize: 18, letterSpacing: '0.2em', textShadow:`0 0 8px ${C_PALETTE.phosphor}`}}>EMBER</span>
          <span style={{color: C_PALETTE.red, fontSize: 13}}>+18</span>
          <div style={{flex:1}}/>
          <span style={{color: C_PALETTE.phosphorFaint, fontSize: 9}}>STRAIGHT · VALID</span>
        </div>
      </div>

      {/* Side surface — objectives pane */}
      <div style={{position:'absolute', top: 78 + gridH + 56, left: 12, right: 12}}>
        <AsciiPane title="OBJECTIVES" width={366} height={108}>
          {OBJECTIVES.map((o,i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap: 4, fontSize: 11, lineHeight: 1.6, color: o.done? C_PALETTE.phosphorDim : C_PALETTE.phosphor}}>
              <span>{o.done? '[x]' : '[ ]'}</span>
              <span style={{flex:1, textTransform:'uppercase'}}>{o.text}</span>
              <span style={{color: o.done? C_PALETTE.phosphor : C_PALETTE.phosphorDim, fontSize: 10}}>
                {`[${'#'.repeat(Math.round((o.cur/o.max)*5)).padEnd(5,'·')}]`} {o.cur}/{o.max}
              </span>
            </div>
          ))}
        </AsciiPane>
      </div>

      {/* Recent inline */}
      <div style={{position:'absolute', top: 78 + gridH + 180, left: 12, right: 12, fontSize: 10, color: C_PALETTE.phosphorDim, lineHeight: 1.6}}>
        <div style={{color: C_PALETTE.phosphorFaint, fontSize: 9, letterSpacing: '0.15em', marginBottom: 2}}>// SCROLLBACK</div>
        {RECENT.slice(0,3).map((w,i) => (
          <div key={i} style={{display:'flex', justifyContent:'space-between'}}>
            <span>&gt; {w.word}</span>
            <span style={{color: w.score>=24? C_PALETTE.red : C_PALETTE.phosphor}}>+{String(w.score).padStart(3,'0')}</span>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{position:'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px 16px', borderTop:`1px solid ${C_PALETTE.phosphorFaint}`, background: C_PALETTE.bgDeep, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 11, color: C_PALETTE.phosphorDim}}>
        <span><Kbd>S</Kbd> sub</span>
        <span><Kbd>C</Kbd> clr</span>
        <span><Kbd>U</Kbd> undo</span>
        <span><Kbd>?</Kbd> clue</span>
      </div>

      <Scanlines/>
      <PhosphorGlow/>
    </div>
  );
}

Object.assign(window, { TerminalDesktop, TerminalPhone });
