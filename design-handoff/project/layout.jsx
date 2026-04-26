// Canonical layout — skin-agnostic. Same DOM in all three skins;
// only CSS vars + decorative slot renderers vary.
//
// Desktop:
//   ┌─────────────────────── HUD ───────────────────────┐
//   │ board (dominant left)        │ objectives         │
//   │                              │ ─────────          │
//   │                              │ recent words       │
//   │ current word + actions       │                    │
//   └────────────────────────────────────────────────────┘
//
// Phone:
//   HUD on top, board below, current word + actions bottom,
//   objectives behind a tab.

const PathOverlay = ({ cells, cellSize, skin, status='valid' }) => {
  const pts = cells.map(([r,c]) => [c*cellSize + cellSize/2, r*cellSize + cellSize/2]);
  if (pts.length === 0) return null;
  const d = pts.map((p,i) => (i===0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const color = status === 'invalid' ? 'var(--ink-faint)' : 'var(--path-color)';

  if (skin.PathRender === 'ink') {
    // Page: bleed+core stroke + node dots + arrowhead
    return (
      <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
        <path d={d} stroke={color} strokeWidth={cellSize*0.42} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.16" filter="blur(0.6px)"/>
        <path d={d} stroke={color} strokeWidth={cellSize*0.16} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85"/>
        {pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r={cellSize*0.06} fill={color} opacity=".9"/>)}
      </svg>
    );
  }
  // sharp (Terminal + Full Bleed)
  return (
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      {skin.id === 'fullbleed' && (
        <path d={d} stroke="var(--accent)" strokeWidth={cellSize*0.06} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" filter="blur(2px)"/>
      )}
      <path d={d} stroke={color} strokeWidth={skin.id==='terminal'?2:cellSize*0.14} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={status==='invalid'?0.4:0.9}/>
      {pts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r={cellSize*0.05} fill={color} opacity={status==='invalid'?0.4:0.7}/>)}
    </svg>
  );
};

// Tile — receives skin + special tile flag (ember, crystal, void)
const Tile = ({ ch, r, c, size, onPath, isHead, special, skin, status='valid' }) => {
  const isPage = skin.id === 'page';
  const isTerm = skin.id === 'terminal';
  const isFB = skin.id === 'fullbleed';

  const rot = isPage ? ((r*7 + c*13) % 7 - 3) * 0.3 : 0;
  const inkVar = isPage ? ((r*11 + c*7) % 5) * 0.04 : 0;

  const onColor = onPath ? 'var(--tile-on-color)' : (status==='invalid' ? 'var(--ink-faint)' : 'var(--ink)');
  const onBg = onPath ? 'var(--tile-on)' : 'var(--tile-bg)';

  return (
    <div style={{
      width: size, height: size, position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--font-display)',
      fontSize: size * (isTerm ? 0.55 : 0.5),
      fontWeight: isTerm ? 500 : (isPage ? 500 : 600),
      color: onColor,
      background: onBg,
      border: isTerm ? `1px solid var(--tile-border)` : 'none',
      marginLeft: isTerm ? -1 : 0, marginTop: isTerm ? -1 : 0,
      transform: `rotate(${rot}deg)`,
      letterSpacing: isPage ? '0.02em' : 0,
      transition: 'background .15s, color .15s',
      borderRadius: onPath ? (isTerm?0:2) : 0,
      textShadow: isTerm
        ? (onPath ? 'none' : '0 0 4px var(--ink-soft)')
        : isPage
          ? (onPath ? '0 0 1px rgba(116,40,24,.3)' : '0 0 0.5px rgba(42,26,16,.5)')
          : 'none',
      filter: isPage ? `opacity(${0.85 + inkVar})` : 'none',
      opacity: status === 'invalid' && onPath ? 0.4 : 1,
    }}>
      {ch}
      {special && <SpecialMark kind={special} skin={skin} size={size}/>}
      {isHead && isFB && (
        <div style={{position:'absolute', inset:-2, border:`1.5px solid var(--ink)`, borderRadius:2, pointerEvents:'none'}}/>
      )}
    </div>
  );
};

// Special tiles: ember (flame corner), crystal (faceted outline), void (hollow ring)
const SpecialMark = ({ kind, skin, size }) => {
  const s = size * 0.28;
  const isPage = skin.id === 'page';
  if (kind === 'ember') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{position:'absolute', top: 1, right: 1, color: isPage?'#742818':'var(--accent)'}}>
        <path d="M6 1 Q 8 4 7 6 Q 9 7 8 10 Q 6 11 4 10 Q 3 7 5 6 Q 4 4 6 1 Z" fill="currentColor" opacity=".85"/>
      </svg>
    );
  }
  if (kind === 'crystal') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{position:'absolute', top: 1, right: 1, color:'var(--accent-2)'}}>
        <path d="M6 1 L 11 5 L 8.5 11 L 3.5 11 L 1 5 Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M3.5 11 L 6 5 L 8.5 11 M 1 5 L 11 5" fill="none" stroke="currentColor" strokeWidth="0.7" opacity=".7"/>
      </svg>
    );
  }
  if (kind === 'void') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" style={{position:'absolute', top: 1, right: 1, color:'var(--ink-soft)'}}>
        <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.5 1"/>
        <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity=".4"/>
      </svg>
    );
  }
  return null;
};

// HUD strip — top bar, identical structure across skins
const HUDStrip = ({ skin, hud, phone }) => (
  <div style={{
    display:'flex', alignItems:'center', gap: phone ? 10 : 24,
    padding: phone ? '12px 14px 10px' : '14px 28px',
    borderBottom: `1px solid var(--rule-faint)`,
    color:'var(--ink)',
  }}>
    <skin.RoundBadge round={hud.round}/>
    <div style={{minWidth: 0, flex: phone ? 1 : 'unset'}}>
      <div style={{
        fontFamily: skin.HeadingFont, fontSize: phone ? 14 : 18,
        color: skin.id==='page' ? '#7a4a28' : 'var(--ink)',
        fontWeight: skin.id==='terminal'?500:600,
        letterSpacing: skin.id==='page'?'0.02em':(skin.id==='terminal'?'0.1em':'-0.01em'),
        lineHeight: 1.1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
      }}>{skin.HeadingTransform(hud.roundName)}</div>
      {!phone && <div style={{fontSize: 11, color:'var(--ink-faint)', fontStyle: skin.id==='page'?'italic':'normal', fontFamily: skin.id==='terminal'?'var(--font-mono)':'var(--font-body)', marginTop: 2, letterSpacing: skin.id==='terminal'?'0.15em':0}}>{skin.id==='terminal' ? '// page: the_first_page.dat' : 'folio i of iii'}</div>}
    </div>
    <div style={{flex: phone?'unset':1}}/>
    <Stat skin={skin} label="Score" value={String(hud.score)}/>
    <Stat skin={skin} label="Combo" value={`×${hud.combo}`} accent/>
    {!phone && <Stat skin={skin} label="Words" value={String(hud.wordsSpelled).padStart(2,'0')}/>}
    <Stat skin={skin} label="Clues" value={String(hud.clues)}/>
    <Stat skin={skin} label="Time" value={hud.time} mono accent={hud.timeWarning}/>
  </div>
);

const Stat = ({ skin, label, value, accent, mono }) => (
  <div style={{display:'flex', alignItems:'baseline', gap: 6, flexShrink: 0}}>
    <span style={skin.StatLabelStyle}>{label}</span>
    <span style={{
      ...skin.StatValueStyle,
      fontSize: 18,
      color: accent ? 'var(--accent)' : 'var(--ink)',
      lineHeight: 1,
      textShadow: skin.id==='terminal' ? '0 0 6px var(--ink)' : 'none',
    }}>{value}</span>
  </div>
);

// Right rail — objectives (primary, fixed) + recent (secondary, compresses)
const RightRail = ({ skin, objectives, recent, collapsed, phone, foundPlanted }) => {
  if (collapsed) {
    // Full Bleed collapsed state — thin column with progress dots + word count
    return (
      <div style={{width: 56, padding: '20px 0', display:'flex', flexDirection:'column', alignItems:'center', gap: 28, borderLeft:`1px solid var(--rule-faint)`}}>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 9, letterSpacing:'0.2em', color:'var(--ink-faint)', textTransform:'uppercase', writingMode:'vertical-rl'}}>OBJ</div>
        <div style={{display:'flex', flexDirection:'column', gap: 8}}>
          {objectives.map((o,i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: o.done ? 'var(--accent)' : 'transparent',
              border: o.done ? 'none' : '1.5px solid var(--ink-faint)',
            }}/>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 9, letterSpacing:'0.2em', color:'var(--ink-faint)', textTransform:'uppercase', writingMode:'vertical-rl'}}>WORDS</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 16, color:'var(--ink)', fontWeight: 600}}>{recent.length}</div>
        <div style={{fontFamily:'var(--font-mono)', fontSize: 16, color:'var(--ink-faint)', cursor:'pointer'}}>›</div>
      </div>
    );
  }

  return (
    <div style={{
      width: phone ? '100%' : 280,
      padding: phone ? '12px 16px' : '20px 22px',
      borderLeft: phone ? 'none' : `1px solid var(--rule-faint)`,
      display:'flex', flexDirection:'column',
      minHeight: 0,
    }}>
      <RailHeading skin={skin}>Objectives</RailHeading>
      <div style={{marginTop: 10, flexShrink: 0}}>
        {objectives.map((o,i) => (
          <ObjectiveRow key={i} skin={skin} o={o}/>
        ))}
      </div>

      <div style={{height: 16}}/>

      <RailHeading skin={skin}>{skin.id==='terminal'?'Scrollback':'Discovered'}</RailHeading>
      <div style={{marginTop: 8, flex: 1, overflow:'hidden', minHeight: 0}}>
        {recent.map((w,i) => (
          <RecentRow key={i} skin={skin} w={w} planted={foundPlanted && i===0}/>
        ))}
      </div>
    </div>
  );
};

const RailHeading = ({ skin, children }) => {
  if (skin.id === 'page') {
    return <div style={{fontFamily:'var(--font-script)', fontSize: 26, color:'var(--accent-2)', lineHeight: 1, borderBottom: '0.5px dotted var(--rule-faint)', paddingBottom: 6}}>{children}</div>;
  }
  if (skin.id === 'terminal') {
    return <div style={{fontFamily:'var(--font-mono)', fontSize: 11, letterSpacing:'0.2em', color:'var(--ink-soft)', textTransform:'uppercase', borderBottom: '1px solid var(--rule-faint)', paddingBottom: 6}}>+--[ {String(children).toUpperCase()} ]----</div>;
  }
  return <div style={{fontFamily:'var(--font-mono)', fontSize: 10, letterSpacing:'0.2em', color:'var(--ink-faint)', textTransform:'uppercase'}}>{children}</div>;
};

const ObjectiveRow = ({ skin, o }) => {
  const isPage = skin.id==='page', isTerm = skin.id==='terminal', isFB = skin.id==='fullbleed';
  return (
    <div style={{marginBottom: 12}}>
      <div style={{display:'flex', alignItems:'flex-start', gap: 8}}>
        {isPage && <HandCheckbox done={o.done}/>}
        {isTerm && <span style={{fontFamily:'var(--font-mono)', fontSize: 12, color: o.done?'var(--ink)':'var(--ink-faint)', marginTop: 1}}>{o.done?'[x]':'[ ]'}</span>}
        {isFB && <FBCheckbox done={o.done}/>}
        <div style={{flex:1, minWidth: 0}}>
          <div style={{
            fontFamily: isPage?'var(--font-script)':'var(--font-body)',
            fontSize: isPage?20:(isTerm?12:14),
            fontWeight: isFB?500:400,
            lineHeight: 1.2,
            color: o.done ? 'var(--ink-faint)' : 'var(--ink)',
            textDecoration: o.done?'line-through':'none',
            textDecorationColor: 'var(--accent)',
            textTransform: isTerm?'uppercase':'none',
          }}>{o.text}</div>
          <div style={{display:'flex', alignItems:'center', gap: 8, marginTop: 4}}>
            <div style={{flex:1, height: 2, background:'var(--rule-faint)', position:'relative'}}>
              <div style={{position:'absolute', left:0, top:0, bottom:0, width:`${(o.cur/o.max)*100}%`, background: o.done?'var(--accent-2)':'var(--accent)'}}/>
            </div>
            <span style={{fontFamily:'var(--font-mono)', fontSize: 10, color:'var(--ink-faint)', fontVariantNumeric:'tabular-nums'}}>{o.cur}/{o.max}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const HandCheckbox = ({ done }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" style={{flexShrink:0, marginTop: 4}}>
    <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="#2a1a10" strokeWidth="1.2" transform="rotate(-2 8 8)"/>
    {done && <path d="M3 8 L 7 12 L 14 3" fill="none" stroke="#742818" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const FBCheckbox = ({ done }) => (
  <div style={{
    width: 14, height: 14, marginTop: 2, flexShrink: 0,
    border: done ? 'none' : '1.5px solid var(--ink-faint)',
    background: done ? 'var(--accent)' : 'transparent',
    display:'flex', alignItems:'center', justifyContent:'center',
  }}>
    {done && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1 4.5 L 3.5 7 L 8 1.5" stroke="#0c0d0e" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
  </div>
);

const RecentRow = ({ skin, w, planted }) => {
  const isPage = skin.id==='page', isTerm = skin.id==='terminal';
  return (
    <div style={{
      display:'flex', alignItems:'baseline', justifyContent:'space-between',
      padding: '5px 0',
      borderBottom: isPage ? '0.5px dotted var(--rule-faint)' : 'none',
      gap: 8,
    }}>
      <div style={{display:'flex', alignItems:'baseline', gap: 6, minWidth: 0}}>
        {isTerm && <span style={{color:'var(--ink-faint)'}}>&gt;</span>}
        {planted && <span style={{color:'var(--accent)', fontFamily:'var(--font-mono)', fontSize: 10}}>★</span>}
        <span style={{
          fontFamily: isTerm?'var(--font-mono)':'var(--font-body)',
          fontSize: isTerm?12:14,
          fontVariant: isPage?'small-caps':'normal',
          letterSpacing: isPage?'0.08em':(isTerm?'0.04em':'0.04em'),
          color:'var(--ink)',
          fontWeight: skin.id==='fullbleed'?600:400,
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{isPage ? w.word.toLowerCase() : w.word}</span>
        {w.note && !isTerm && <span style={{fontSize: 9, fontStyle:'italic', color:'var(--ink-faint)', whiteSpace:'nowrap'}}>{w.note}</span>}
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: w.score >= 24 && isTerm ? 'var(--accent)' : 'var(--accent)',
        fontVariantNumeric:'tabular-nums', fontWeight: 600,
        flexShrink: 0,
      }}>+{w.score}</span>
    </div>
  );
};

// Current word + action bar (bottom strip)
const ActionBar = ({ skin, current, status, phone }) => {
  const isPage = skin.id==='page', isTerm = skin.id==='terminal', isFB = skin.id==='fullbleed';
  const valid = status === 'valid';
  return (
    <div style={{
      padding: phone ? '12px 14px 14px' : '16px 28px 18px',
      borderTop: `1px solid var(--rule-faint)`,
      background: isTerm ? 'var(--surface-deep)' : 'transparent',
      display:'flex', alignItems:'center', gap: phone?8:18,
    }}>
      <div style={{flex:1, minWidth: 0}}>
        <div style={{
          fontFamily:'var(--font-mono)', fontSize: phone?9:10, letterSpacing:'0.2em',
          color:'var(--ink-faint)', textTransform:'uppercase', marginBottom: 2,
        }}>{isPage ? 'Inscribed' : 'Tracing'}</div>
        <div style={{display:'flex', alignItems:'baseline', gap: phone?8:14}}>
          {isTerm && <span style={{color:'var(--ink-soft)'}}>&gt;</span>}
          <span style={{
            fontFamily: isPage?'var(--font-display)':'var(--font-display)',
            fontSize: phone?22:(isFB?32:28),
            fontWeight: 700,
            letterSpacing: isPage?'0.18em':'0.14em',
            color: status==='invalid' ? 'var(--ink-faint)' : (isFB?'var(--ink)':'var(--accent)'),
            lineHeight: 1,
            textShadow: isTerm && valid ? '0 0 8px var(--ink)' : 'none',
            transition: 'color .15s',
            animation: status==='invalid' ? 'shake .35s' : 'none',
          }}>{current.word ? (isPage ? current.word.split('').join('·') : current.word) : <span style={{color:'var(--ink-faint)', fontWeight:400, fontSize: phone?16:18, letterSpacing:0}}>{isTerm?'_':'—'}</span>}</span>
          {current.preview && <span style={{
            fontFamily:'var(--font-mono)', fontSize: phone?14:18,
            color: status==='invalid'?'var(--ink-faint)':'var(--accent)',
            fontVariantNumeric:'tabular-nums',
          }}>{status==='invalid'?'·':current.preview}</span>}
          {!phone && <span style={{fontSize: 11, color:'var(--ink-faint)', fontStyle: isPage?'italic':'normal', fontFamily: isTerm?'var(--font-mono)':'var(--font-body)'}}>
            {status==='valid' && (isTerm?'STRAIGHT · VALID':'straight · valid')}
            {status==='invalid' && (isTerm?'NOT IN LEXICON':'not in the lexicon')}
            {status==='planted' && (isTerm?'★ PLANTED · DISCOVERED':'★ a planted word')}
          </span>}
        </div>
      </div>
      <div style={{display:'flex', gap: phone?6:10, flexShrink: 0}}>
        <skin.ActionBtn label="Submit" kbd="↵" primary compact={phone}/>
        <skin.ActionBtn label="Clear" kbd="esc" compact={phone}/>
        <skin.ActionBtn label="Undo" kbd="⌫" compact={phone}/>
        <skin.ActionBtn label="Clue" kbd="?" warm compact={phone}/>
      </div>
    </div>
  );
};

// Phone objectives tab pill (bottom)
const PhoneObjTab = ({ skin, objectives }) => {
  const done = objectives.filter(o=>o.done).length;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 8,
      padding: '6px 14px',
      borderTop: `1px solid var(--rule-faint)`,
      borderBottom: `1px solid var(--rule-faint)`,
      fontSize: 11, color:'var(--ink-soft)',
      fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.15em',
    }}>
      <span>Objectives</span>
      <div style={{display:'flex', gap: 5}}>
        {objectives.map((o,i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius:'50%',
            background: o.done?'var(--accent)':'transparent',
            border: o.done?'none':'1px solid var(--ink-faint)',
          }}/>
        ))}
      </div>
      <span style={{color:'var(--ink-faint)'}}>{done}/{objectives.length}</span>
      <div style={{flex:1}}/>
      <span style={{color:'var(--ink-faint)'}}>tap to expand ›</span>
    </div>
  );
};

// ─── Top-level layout: Desktop ───
function GameLayoutDesktop({ skin, board=BOARD_ROWS, path=PATH, hud=HUD, current=CURRENT, status='valid', objectives=OBJECTIVES, recent=RECENT, foundPlanted=false, specialTiles={}, ringHead=true }) {
  const cellSize = 42;
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize*gridCols, gridH = cellSize*gridRows;
  const collapsed = !!skin.rightRailDefaultCollapsed;

  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: skin.id==='page'?20:0, display:'flex', flexDirection:'column'}}>
        <HUDStrip skin={skin} hud={hud}/>
        <div style={{flex:1, display:'flex', minHeight: 0}}>
          {/* Board area */}
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding: 16, minWidth: 0, position:'relative'}}>
            <div style={{position:'relative', width: gridW, height: gridH}}>
              {board.map((row,r) => (
                <div key={r} style={{display:'flex'}}>
                  {row.map((ch,c) => {
                    const pi = path.findIndex(p => p[0]===r && p[1]===c);
                    return <Tile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} isHead={pi===path.length-1 && ringHead} special={specialTiles[`${r},${c}`]} skin={skin} status={status}/>;
                  })}
                </div>
              ))}
              <PathOverlay cells={path} cellSize={cellSize} skin={skin} status={status}/>
            </div>
          </div>
          {/* Right rail */}
          <RightRail skin={skin} objectives={objectives} recent={recent} collapsed={collapsed} foundPlanted={foundPlanted}/>
        </div>
        <ActionBar skin={skin} current={current} status={status}/>
      </div>
    </div>
  );
}

// ─── Top-level layout: Phone ───
function GameLayoutPhone({ skin, board=BOARD_ROWS, path=PATH, hud=HUD, current=CURRENT, status='valid', objectives=OBJECTIVES, recent=RECENT, foundPlanted=false, specialTiles={} }) {
  const cellSize = Math.floor((390 - 16) / 14); // 26
  const gridCols = 14, gridRows = 10;
  const gridW = cellSize*gridCols, gridH = cellSize*gridRows;

  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: skin.id==='page'?12:0, display:'flex', flexDirection:'column'}}>
        <HUDStrip skin={skin} hud={hud} phone/>
        {/* board */}
        <div style={{flex: 1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: 0, padding: '8px 0'}}>
          <div style={{position:'relative', width: gridW, height: gridH}}>
            {board.map((row,r) => (
              <div key={r} style={{display:'flex'}}>
                {row.map((ch,c) => {
                  const pi = path.findIndex(p => p[0]===r && p[1]===c);
                  return <Tile key={c} ch={ch} r={r} c={c} size={cellSize} onPath={pi>=0} isHead={pi===path.length-1} special={specialTiles[`${r},${c}`]} skin={skin} status={status}/>;
                })}
              </div>
            ))}
            <PathOverlay cells={path} cellSize={cellSize} skin={skin} status={status}/>
          </div>
        </div>
        {/* objectives tab */}
        <PhoneObjTab skin={skin} objectives={objectives}/>
        <ActionBar skin={skin} current={current} status={status} phone/>
      </div>
    </div>
  );
}

Object.assign(window, { GameLayoutDesktop, GameLayoutPhone, Tile, PathOverlay, HUDStrip, RightRail, ActionBar });
