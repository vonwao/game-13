// How to Play, Settings, and Game-state moments — all using the Page skin
// for canonical examples (per user request). Same canonical layout where applicable.

// ─── How to Play ─────────────────────────────────────────
function HowToPlayDesktop({ skin = SKIN_PAGE }) {
  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: 28, display:'flex', flexDirection:'column'}}>
        {/* Header */}
        <div style={{display:'flex', alignItems:'baseline', gap: 14, marginBottom: 14, paddingBottom: 12, borderBottom:'1px solid var(--rule-faint)'}}>
          <div style={{fontFamily:'var(--font-script)', fontSize: 44, color:'var(--accent-2)', lineHeight: 1}}>How to play</div>
          <div style={{fontStyle:'italic', fontSize: 13, color:'var(--ink-soft)'}}>— a word puzzle in the archive</div>
          <div style={{flex:1}}/>
          <div style={{fontStyle:'italic', fontSize: 12, color:'var(--ink-faint)'}}>‹ back to the archive</div>
        </div>

        <div style={{flex:1, display:'grid', gridTemplateColumns:'1.1fr 1fr', gap: 28, minHeight: 0}}>
          {/* LEFT — trace + scoring */}
          <div style={{display:'flex', flexDirection:'column', gap: 18, minHeight: 0}}>
            <Step n="i." title="Trace a word">
              <div style={{display:'flex', gap: 14, alignItems:'center'}}>
                <MiniBoard cells={[['L','A','N','T'],['I','E','R','E'],['G','H','N','S']]} path={[[0,0],[1,0],[1,1],[0,2],[1,2],[1,3]]} size={36}/>
                <div style={{flex:1}}>
                  <p style={{margin:0, fontSize: 14, lineHeight: 1.5}}>Drag through adjacent letters — orthogonal or diagonal — to spell a word of <b>four or more letters</b>. No tile may be used twice in the same word. Type on a keyboard if you prefer.</p>
                </div>
              </div>
            </Step>

            <Step n="ii." title="Scoring rewards">
              <div style={{display:'grid', gridTemplateColumns:'auto 1fr', columnGap: 12, rowGap: 6, fontSize: 13, lineHeight: 1.5}}>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight: 600}}>length</span>
                <span>longer words score more, non-linearly</span>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight: 600}}>shape</span>
                <span>straight paths × 1.5 ; corner-free × 2</span>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight: 600}}>combo</span>
                <span>chain words back-to-back to multiply</span>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight: 600}}>planted</span>
                <span>discover hidden words seeded into the page</span>
              </div>
            </Step>

            <Step n="iii." title="Special tiles">
              <div style={{display:'flex', gap: 16, alignItems:'flex-start'}}>
                <SpecialDemo skin={skin} kind="ember" letter="E" name="Ember" desc="adds points to the word it lights"/>
                <SpecialDemo skin={skin} kind="crystal" letter="K" name="Crystal" desc="doubles the word's score"/>
                <SpecialDemo skin={skin} kind="void" letter="?" name="Void" desc="a wildcard — any letter you need"/>
              </div>
            </Step>
          </div>

          {/* RIGHT — planted words + run structure */}
          <div style={{display:'flex', flexDirection:'column', gap: 18, paddingLeft: 24, borderLeft:'1px solid var(--rule-faint)'}}>
            <Step n="iv." title="Planted words">
              <p style={{margin:'0 0 8px', fontSize: 14, lineHeight: 1.5}}>Each page has <b>hidden words</b> set into the type — particular finds the archivist would like you to discover. Mark them off as you go.</p>
              <div style={{display:'flex', gap: 10, alignItems:'center', padding: 10, background:'var(--accent-soft)'}}>
                <span style={{color:'var(--accent)', fontSize: 18}}>★</span>
                <div style={{flex: 1}}>
                  <div style={{fontFamily:'var(--font-display)', fontSize: 16, fontWeight: 600, fontVariant:'small-caps', letterSpacing:'0.08em', color:'var(--accent)'}}>lantern <span style={{fontStyle:'italic', fontSize: 12, color:'var(--ink-soft)', fontVariant:'normal', letterSpacing:0}}>— a planted word</span></div>
                </div>
                <span style={{fontFamily:'var(--font-mono)', color:'var(--accent)', fontWeight: 700}}>+28</span>
              </div>
            </Step>

            <Step n="v." title="A run is three pages">
              <div style={{display:'flex', flexDirection:'column', gap: 6, fontSize: 13}}>
                <RoundLine n="I." name="The First Page" desc="objectives invite — the lexicon opens"/>
                <RoundLine n="II." name="Dust and Echoes" desc="paths grow longer — combos matter"/>
                <RoundLine n="III." name="The Black Index" desc="time tightens — the page resists"/>
              </div>
              <p style={{margin:'10px 0 0', fontSize: 12, fontStyle:'italic', color:'var(--ink-soft)', lineHeight: 1.5}}>Each page sets its own objectives. Complete them to advance.</p>
            </Step>

            <Step n="vi." title="Keys at hand">
              <div style={{display:'grid', gridTemplateColumns:'auto auto 1fr', columnGap: 12, rowGap: 4, fontSize: 12, fontFamily:'var(--font-mono)'}}>
                <Kbd>type</Kbd><span style={{color:'var(--ink-soft)'}}>→</span><span style={{fontFamily:'var(--font-body)'}}>build a word from your fingers</span>
                <Kbd>↵</Kbd><span style={{color:'var(--ink-soft)'}}>→</span><span style={{fontFamily:'var(--font-body)'}}>submit</span>
                <Kbd>esc</Kbd><span style={{color:'var(--ink-soft)'}}>→</span><span style={{fontFamily:'var(--font-body)'}}>clear the trace</span>
                <Kbd>?</Kbd><span style={{color:'var(--ink-soft)'}}>→</span><span style={{fontFamily:'var(--font-body)'}}>spend a clue</span>
              </div>
            </Step>
          </div>
        </div>
      </div>
    </div>
  );
}

const Step = ({ n, title, children }) => (
  <div>
    <div style={{display:'flex', alignItems:'baseline', gap: 8, marginBottom: 8}}>
      <span style={{fontFamily:'var(--font-display)', fontSize: 18, color:'var(--accent)', fontWeight: 600, fontStyle:'italic'}}>{n}</span>
      <span style={{fontFamily:'var(--font-script)', fontSize: 24, color:'var(--ink)', lineHeight: 1}}>{title}</span>
    </div>
    {children}
  </div>
);

const Kbd = ({ children }) => (
  <span style={{padding:'1px 6px', border:'1px solid var(--ink-soft)', fontSize: 11, color:'var(--ink)', textAlign:'center', minWidth: 28, display:'inline-block'}}>{children}</span>
);

const RoundLine = ({ n, name, desc }) => (
  <div style={{display:'flex', alignItems:'baseline', gap: 10}}>
    <span style={{fontFamily:'var(--font-display)', fontStyle:'italic', fontSize: 14, color:'var(--accent)', fontWeight: 600, minWidth: 24}}>{n}</span>
    <span style={{fontFamily:'var(--font-display)', fontSize: 14, fontWeight: 600}}>{name}</span>
    <span style={{fontStyle:'italic', fontSize: 12, color:'var(--ink-soft)'}}>— {desc}</span>
  </div>
);

const MiniBoard = ({ cells, path, size = 36 }) => (
  <div style={{position:'relative'}}>
    {cells.map((row,r) => (
      <div key={r} style={{display:'flex'}}>
        {row.map((ch,c) => {
          const pi = path.findIndex(p => p[0]===r && p[1]===c);
          const onPath = pi >= 0;
          return (
            <div key={c} style={{
              width: size, height: size, display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-display)', fontSize: size*0.5, fontWeight: 500,
              color: onPath?'var(--accent)':'var(--ink)',
              background: onPath?'var(--accent-soft)':'transparent',
            }}>{ch}</div>
          );
        })}
      </div>
    ))}
    <svg style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none'}}>
      <path d={path.map((p,i) => `${i?'L':'M'} ${p[1]*size+size/2} ${p[0]*size+size/2}`).join(' ')} stroke="var(--accent)" strokeWidth="2" fill="none" opacity=".7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const SpecialDemo = ({ skin, kind, letter, name, desc }) => (
  <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap: 4}}>
    <div style={{position:'relative', width: 56, height: 56, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize: 32, fontWeight: 600, color:'var(--ink)', border:'1px solid var(--rule-faint)'}}>
      {letter}
      <SpecialMark kind={kind} skin={skin} size={56}/>
    </div>
    <div style={{fontFamily:'var(--font-script)', fontSize: 18, color:'var(--accent-2)', lineHeight: 1}}>{name}</div>
    <div style={{fontSize: 11, fontStyle:'italic', color:'var(--ink-soft)', lineHeight: 1.3}}>{desc}</div>
  </div>
);

function HowToPlayPhone({ skin = SKIN_PAGE }) {
  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: 16, display:'flex', flexDirection:'column', gap: 10}}>
        <div style={{paddingBottom: 6, borderBottom:'1px solid var(--rule-faint)'}}>
          <div style={{fontFamily:'var(--font-script)', fontSize: 32, color:'var(--accent-2)', lineHeight: 1}}>How to play</div>
          <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)'}}>a word puzzle in the archive</div>
        </div>
        <Step n="i." title="Trace a word">
          <div style={{display:'flex', gap: 8, alignItems:'center'}}>
            <MiniBoard cells={[['L','A','N','T'],['I','E','R','E']]} path={[[0,0],[1,0],[1,1],[0,2],[1,2],[1,3]]} size={26}/>
            <p style={{margin:0, fontSize: 11, lineHeight: 1.4}}>Drag through adjacent letters. <b>Four or more.</b> No reuse.</p>
          </div>
        </Step>
        <Step n="ii." title="Scoring">
          <div style={{fontSize: 11, lineHeight: 1.5}}>
            <b>length</b> · <b>shape</b> (straight ×1.5, corner-free ×2) · <b>combo</b> (chain back-to-back) · <b>planted</b> (★ hidden words)
          </div>
        </Step>
        <Step n="iii." title="Special tiles">
          <div style={{display:'flex', gap: 8}}>
            <SpecialDemo skin={skin} kind="ember" letter="E" name="Ember" desc="+pts"/>
            <SpecialDemo skin={skin} kind="crystal" letter="K" name="Crystal" desc="× 2"/>
            <SpecialDemo skin={skin} kind="void" letter="?" name="Void" desc="any letter"/>
          </div>
        </Step>
        <Step n="iv." title="A run is three pages">
          <div style={{fontSize: 11}}>
            <RoundLine n="I." name="The First Page" desc="opens"/>
            <RoundLine n="II." name="Dust and Echoes" desc="combos"/>
            <RoundLine n="III." name="The Black Index" desc="resists"/>
          </div>
        </Step>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────
function SettingsDesktop({ skin = SKIN_PAGE, currentSkin = 'page' }) {
  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: 28, display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', alignItems:'baseline', gap: 14, marginBottom: 18, paddingBottom: 12, borderBottom:'1px solid var(--rule-faint)'}}>
          <div style={{fontFamily:'var(--font-script)', fontSize: 44, color:'var(--accent-2)', lineHeight: 1}}>Settings</div>
          <div style={{fontStyle:'italic', fontSize: 13, color:'var(--ink-soft)'}}>— preferences for the page</div>
          <div style={{flex:1}}/>
          <div style={{fontStyle:'italic', fontSize: 12, color:'var(--ink-faint)'}}>‹ back to the archive</div>
        </div>

        {/* Skin picker */}
        <div style={{marginBottom: 22}}>
          <SectionLabel>Skin</SectionLabel>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 16, marginTop: 12}}>
            {Object.values(SKINS).map(s => (
              <SkinThumb key={s.id} skin={s} selected={currentSkin === s.id}/>
            ))}
          </div>
        </div>

        {/* Two columns of toggles */}
        <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 32, minHeight: 0}}>
          <div>
            <SectionLabel>Board</SectionLabel>
            <SettingRow label="Board size" value={<Segmented options={['Small','Medium','Large']} selected="Medium"/>}/>
            <SettingRow label="Reduce motion" value={<Toggle on={false}/>} desc="Tone down the path trail and round transitions."/>
            <SettingRow label="Color-blind path" value={<Segmented options={['Default','Cyan','Yellow']} selected="Default"/>} desc="Path-trace color, for tiles that are easier to tell apart."/>
          </div>
          <div>
            <SectionLabel>Sound &amp; lexicon</SectionLabel>
            <SettingRow label="Sound" value={<Toggle on/>} desc="Pen-scratch on submit, soft chime on planted words."/>
            <SettingRow label="Dictionary" value={<Segmented options={['SOWPODS','TWL','OSPD']} selected="SOWPODS"/>} desc="Which lexicon counts as a valid word."/>
            <SettingRow label="Show keyboard hints" value={<Toggle on/>} desc="Display [S] [C] [U] [?] in the action bar."/>
          </div>
        </div>

        <div style={{borderTop:'1px solid var(--rule-faint)', paddingTop: 12, marginTop: 16, display:'flex', gap: 10, fontSize: 11, color:'var(--ink-faint)', fontStyle:'italic'}}>
          <span>Lexicon Deep · v0.1 — settings persist on this device only.</span>
        </div>
      </div>
    </div>
  );
}

const SectionLabel = ({ children }) => (
  <div style={{fontFamily:'var(--font-script)', fontSize: 24, color:'var(--accent-2)', lineHeight: 1, borderBottom: '0.5px dotted var(--rule-faint)', paddingBottom: 6}}>{children}</div>
);

const SettingRow = ({ label, value, desc }) => (
  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 14, padding: '12px 0', borderBottom: '0.5px dotted var(--rule-faint)'}}>
    <div style={{flex:1}}>
      <div style={{fontFamily:'var(--font-display)', fontSize: 15, fontWeight: 500}}>{label}</div>
      {desc && <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)', marginTop: 2, lineHeight: 1.4}}>{desc}</div>}
    </div>
    <div style={{flexShrink: 0, paddingTop: 2}}>{value}</div>
  </div>
);

const Toggle = ({ on }) => (
  <div style={{
    width: 40, height: 22, borderRadius: 11, position:'relative',
    background: on ? 'var(--accent)' : 'var(--rule-faint)',
    border: '1px solid var(--rule-faint)',
  }}>
    <div style={{
      position:'absolute', top: 2, left: on?20:2, width: 16, height: 16, borderRadius:'50%',
      background:'var(--surface)', transition:'left .15s',
    }}/>
  </div>
);

const Segmented = ({ options, selected }) => (
  <div style={{display:'flex', border:'1px solid var(--rule-faint)'}}>
    {options.map(o => (
      <div key={o} style={{
        padding:'4px 10px', fontSize: 12, cursor:'pointer',
        background: o===selected?'var(--accent)':'transparent',
        color: o===selected?'var(--surface)':'var(--ink-soft)',
        fontFamily:'var(--font-display)', fontWeight: o===selected?600:400,
      }}>{o}</div>
    ))}
  </div>
);

// Mini preview thumbnail of each skin
const SkinThumb = ({ skin, selected }) => {
  const previewBoard = [['A','R','C','H','I','V','E'],['F','R','A','G','M','E','N']];
  return (
    <div style={{
      ...skin.vars,
      border: selected ? '2px solid var(--accent)' : '1px solid var(--rule-faint)',
      cursor: 'pointer', position:'relative',
    }}>
      <div style={{position:'relative', width:'100%', height: 140, overflow:'hidden', background:'var(--bg)'}}>
        <skin.Background/>
        <div style={{position:'absolute', inset: 12, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', gap: 6}}>
          <div style={{display:'flex', alignItems:'center', gap: 8}}>
            <skin.RoundBadge round="I"/>
            <div style={{fontFamily: skin.HeadingFont, fontSize: 13, color: skin.id==='page'?'#7a4a28':'var(--ink)', fontWeight: 600}}>{skin.HeadingTransform('The First Page')}</div>
          </div>
          <div style={{position:'relative', display:'flex', flexDirection:'column'}}>
            {previewBoard.map((row,r) => (
              <div key={r} style={{display:'flex'}}>
                {row.map((ch,c) => {
                  const onPath = (r===0 && c>=2 && c<=6);
                  return <Tile key={c} ch={ch} r={r} c={c} size={22} onPath={onPath} skin={skin}/>;
                })}
              </div>
            ))}
            <svg style={{position:'absolute', inset:0, pointerEvents:'none'}}>
              <path d={`M ${2*22+11} ${11} L ${6*22+11} ${11}`} stroke="var(--path-color)" strokeWidth={skin.PathRender==='ink'?3.5:2} opacity={skin.PathRender==='ink'?0.85:0.9} strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        </div>
      </div>
      <div style={{padding: '10px 12px', background:'var(--surface)', color: 'var(--ink)', borderTop:'1px solid var(--rule-faint)', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily: skin.HeadingFont, fontSize: 14, fontWeight: 600, color: skin.id==='page'?'#2a1a10':(skin.id==='terminal'?'#7fdb6a':'#f1ece2')}}>{skin.name}</div>
          <div style={{fontSize: 10, color: skin.id==='page'?'#5a4030':(skin.id==='terminal'?'rgba(127,219,106,.55)':'rgba(241,236,226,.55)'), fontStyle: skin.id==='page'?'italic':'normal', marginTop: 2}}>{skin.blurb}</div>
        </div>
        {selected && (
          <div style={{width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 13, fontWeight: 700}}>✓</div>
        )}
      </div>
    </div>
  );
};

function SettingsPhone({ skin = SKIN_PAGE, currentSkin = 'page' }) {
  return (
    <div style={{...skin.vars, position:'relative', width:'100%', height:'100%', overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)'}}>
      <skin.Background/>
      <div style={{position:'absolute', inset: 16, display:'flex', flexDirection:'column'}}>
        <div style={{paddingBottom: 8, borderBottom:'1px solid var(--rule-faint)', marginBottom: 12}}>
          <div style={{fontFamily:'var(--font-script)', fontSize: 32, color:'var(--accent-2)', lineHeight: 1}}>Settings</div>
        </div>
        <div style={{marginBottom: 16}}>
          <SectionLabel>Skin</SectionLabel>
          <div style={{display:'flex', flexDirection:'column', gap: 8, marginTop: 8}}>
            {Object.values(SKINS).map(s => (
              <SkinThumbCompact key={s.id} skin={s} selected={currentSkin === s.id}/>
            ))}
          </div>
        </div>
        <div style={{flex:1, overflow:'hidden'}}>
          <SectionLabel>Game</SectionLabel>
          <SettingRow label="Board size" value={<Segmented options={['S','M','L']} selected="M"/>}/>
          <SettingRow label="Sound" value={<Toggle on/>}/>
          <SettingRow label="Reduce motion" value={<Toggle on={false}/>}/>
          <SettingRow label="Color-blind path" value={<Segmented options={['def','cy','y']} selected="def"/>}/>
          <SettingRow label="Dictionary" value={<Segmented options={['SOW','TWL','OSPD']} selected="SOW"/>}/>
        </div>
      </div>
    </div>
  );
}

const SkinThumbCompact = ({ skin, selected }) => (
  <div style={{
    ...skin.vars,
    border: selected ? '2px solid var(--accent)' : '1px solid var(--rule-faint)',
    display:'flex', alignItems:'center', gap: 12, padding: 8,
    background: 'var(--surface)',
  }}>
    <div style={{position:'relative', width: 56, height: 40, overflow:'hidden', background:'var(--bg)', flexShrink: 0}}>
      <skin.Background/>
      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontFamily: skin.HeadingFont, fontSize: 20, fontWeight: 700, color: skin.id==='page'?'#742818':(skin.id==='terminal'?'#7fdb6a':'#d4a84a')}}>Aa</div>
    </div>
    <div style={{flex:1}}>
      <div style={{fontFamily: skin.HeadingFont, fontSize: 14, fontWeight: 600, color: skin.id==='page'?'#2a1a10':(skin.id==='terminal'?'#7fdb6a':'#f1ece2')}}>{skin.name}</div>
      <div style={{fontSize: 10, color: skin.id==='page'?'#5a4030':(skin.id==='terminal'?'rgba(127,219,106,.55)':'rgba(241,236,226,.55)'), fontStyle: skin.id==='page'?'italic':'normal'}}>{skin.blurb}</div>
    </div>
    {selected && <div style={{width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 13, fontWeight: 700}}>✓</div>}
  </div>
);

// ─── Game-state moments ────────────────────────────────
// Six small frames showing key in-game moments in the Page skin.
function StateFrame({ title, desc, children }) {
  return (
    <div style={{...SKIN_PAGE.vars, position:'relative', width: 480, height: 320, overflow:'hidden', background:'var(--bg)', color:'var(--ink)', fontFamily:'var(--font-body)', flexShrink: 0}}>
      <SKIN_PAGE.Background/>
      <div style={{position:'absolute', inset: 12, display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', alignItems:'baseline', gap: 8, paddingBottom: 6, borderBottom: '0.5px dotted var(--rule-faint)'}}>
          <span style={{fontFamily:'var(--font-script)', fontSize: 22, color:'var(--accent-2)', lineHeight: 1}}>{title}</span>
          <span style={{fontStyle:'italic', fontSize: 10, color:'var(--ink-soft)'}}>{desc}</span>
        </div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
          {children}
        </div>
      </div>
    </div>
  );
}

function GameStates() {
  const cs = 26;
  // Build a small EMBER trace board (rows 2-3 of full board)
  const smallBoard = BOARD_ROWS.slice(1,5).map(row => row.slice(3,11));
  const smallPath = [[1,3],[1,4],[1,5],[1,6],[1,7]]; // EMBER region remapped

  return (
    <div style={{display:'flex', flexWrap:'wrap', gap: 16, padding: 16, background: '#3a2a18'}}>
      {/* 1. INVALID */}
      <StateFrame title="Invalid word" desc="— soft shake, dimmed letters, no red flash">
        <div style={{position:'relative'}}>
          <MiniBoard cells={smallBoard.map(r=>r.slice(0,8))} path={smallPath} size={cs}/>
          <div style={{position:'absolute', bottom:-50, left:0, right:0, textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing:'0.18em', color:'var(--ink-faint)', textDecoration:'line-through wavy var(--ink-soft)'}}>EMBRX</div>
            <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)', marginTop: 4}}>not in the lexicon — try again</div>
          </div>
        </div>
      </StateFrame>

      {/* 2. PLANTED REVEAL */}
      <StateFrame title="A planted word found" desc="— the page warms; a ★ blooms in the margin">
        <div style={{position:'relative'}}>
          <MiniBoard cells={smallBoard.map(r=>r.slice(0,8))} path={smallPath} size={cs}/>
          {/* glow ring around path */}
          <div style={{position:'absolute', inset:-8, pointerEvents:'none', boxShadow:'0 0 32px 4px rgba(245,200,96,.6), inset 0 0 24px rgba(245,200,96,.4)'}}/>
          <div style={{position:'absolute', bottom:-50, left:0, right:0, textAlign:'center'}}>
            <div style={{display:'inline-flex', alignItems:'center', gap: 8, padding:'4px 12px', background:'rgba(245,200,96,.2)', border:'1px solid var(--warm)'}}>
              <span style={{color:'var(--warm)', fontSize: 16}}>★</span>
              <span style={{fontFamily:'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing:'0.18em', color:'var(--accent)'}}>EMBER</span>
              <span style={{fontFamily:'var(--font-mono)', fontSize: 14, color:'var(--accent)', fontWeight:700}}>+38</span>
            </div>
            <div style={{fontStyle:'italic', fontSize: 11, color:'var(--accent-2)', marginTop: 4}}>a planted word — discovered</div>
          </div>
        </div>
      </StateFrame>

      {/* 3. COMBO BREAK */}
      <StateFrame title="Combo broken" desc="— wax flakes; the multiplier sighs back to ×1">
        <div style={{display:'flex', alignItems:'center', gap: 18}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)', fontSize: 64, fontWeight: 700, color:'var(--ink-faint)', lineHeight: 1, textDecoration:'line-through', textDecorationColor:'var(--accent)'}}>×4</div>
            <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)'}}>chain ended</div>
          </div>
          <div style={{fontSize: 24, color:'var(--ink-soft)'}}>→</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:'var(--font-display)', fontSize: 64, fontWeight: 700, color:'var(--ink)', lineHeight: 1}}>×1</div>
            <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)'}}>start a new chain</div>
          </div>
        </div>
      </StateFrame>

      {/* 4. TIME WARNING */}
      <StateFrame title="The glass narrows" desc="— last 30 seconds, candle gutters">
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-display)', fontSize: 80, fontWeight: 700, color:'var(--accent)', lineHeight: 1, fontVariantNumeric:'tabular-nums', animation:'pulse 1s infinite'}}>0:24</div>
          <div style={{display:'flex', gap: 4, justifyContent:'center', marginTop: 8}}>
            {[...Array(8)].map((_,i) => (
              <div key={i} style={{width: 12, height: 4, background: i < 3 ? 'var(--accent)' : 'var(--rule-faint)'}}/>
            ))}
          </div>
          <div style={{fontStyle:'italic', fontSize: 12, color:'var(--accent)', marginTop: 8}}>quickly — the page closes</div>
        </div>
      </StateFrame>

      {/* 5. ROUND COMPLETE */}
      <StateFrame title="The first page is set" desc="— round complete, objectives sealed">
        <div style={{textAlign:'center', position:'relative'}}>
          <div style={{position:'absolute', top:-20, left:'50%', transform:'translateX(-50%) rotate(-8deg)'}}>
            <SKIN_PAGE.RoundBadge round="I"/>
          </div>
          <div style={{marginTop: 40, fontFamily:'var(--font-script)', fontSize: 36, color:'var(--accent-2)', lineHeight: 1}}>The First Page</div>
          <div style={{fontStyle:'italic', fontSize: 11, color:'var(--ink-soft)'}}>set in ink and dust</div>
          <div style={{marginTop: 12, display:'flex', gap: 16, justifyContent:'center', alignItems:'baseline'}}>
            <Stat skin={SKIN_PAGE} label="Score" value="612"/>
            <Stat skin={SKIN_PAGE} label="Words" value="14"/>
            <Stat skin={SKIN_PAGE} label="Best" value="ARCHIVE"/>
          </div>
          <div style={{marginTop: 12, fontFamily:'var(--font-display)', fontSize: 13, fontStyle:'italic', color:'var(--accent)', cursor:'pointer'}}>turn the page →</div>
        </div>
      </StateFrame>

      {/* 6. END OF RUN */}
      <StateFrame title="A run completed" desc="— three pages bound, indexed, archived">
        <div style={{textAlign:'center', width:'100%'}}>
          <div style={{fontFamily:'var(--font-script)', fontSize: 28, color:'var(--accent-2)', lineHeight: 1, marginBottom: 6}}>Volume i, complete</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginTop: 8, padding:'0 12px'}}>
            <div><div style={{fontFamily:'var(--font-display)', fontSize: 24, fontWeight: 700, color:'var(--accent)', fontVariantNumeric:'tabular-nums'}}>1,847</div><div style={{fontSize: 9, fontStyle:'italic', color:'var(--ink-soft)'}}>total score</div></div>
            <div><div style={{fontFamily:'var(--font-display)', fontSize: 24, fontWeight: 700, color:'var(--accent)', fontVariantNumeric:'tabular-nums'}}>38</div><div style={{fontSize: 9, fontStyle:'italic', color:'var(--ink-soft)'}}>words found</div></div>
            <div><div style={{fontFamily:'var(--font-display)', fontSize: 24, fontWeight: 700, color:'var(--accent)', fontVariantNumeric:'tabular-nums'}}>7/9</div><div style={{fontSize: 9, fontStyle:'italic', color:'var(--ink-soft)'}}>★ planted</div></div>
          </div>
          <div style={{marginTop: 10, fontSize: 11, fontStyle:'italic', color:'var(--ink-soft)', borderTop:'0.5px dotted var(--rule-faint)', paddingTop: 6}}>
            longest: <span style={{fontFamily:'var(--font-display)', fontVariant:'small-caps', letterSpacing:'0.08em', fontStyle:'normal', color:'var(--ink)'}}>parchment</span> · best: <span style={{fontFamily:'var(--font-display)', fontVariant:'small-caps', letterSpacing:'0.08em', fontStyle:'normal', color:'var(--ink)'}}>archive</span>
          </div>
          <div style={{marginTop: 8, display:'flex', gap: 10, justifyContent:'center'}}>
            <div style={{padding:'5px 14px', background:'var(--accent)', color:'var(--surface)', fontFamily:'var(--font-display)', fontSize: 12, fontWeight: 600}}>begin a new run</div>
            <div style={{padding:'5px 14px', border:'1px solid var(--ink-soft)', fontFamily:'var(--font-display)', fontSize: 12, color:'var(--ink)'}}>review the volume</div>
          </div>
        </div>
      </StateFrame>
    </div>
  );
}

Object.assign(window, { HowToPlayDesktop, HowToPlayPhone, SettingsDesktop, SettingsPhone, GameStates });
