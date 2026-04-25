(function() {
  window.LD = window.LD || {};

  let canvas = null;
  let scrollX = 0, scrollY = 0;
  let targetScrollX = 0, targetScrollY = 0;
  let inputFlashTimer = 0;
  let inputFlashColor = null;
  let mouseX = 0, mouseY = 0;

  const COLORS = {
    bg: '#1a1714',
    tileFill: '#d4c4a0',
    tileBorder: '#b0a080',
    tileText: '#3a2a1a',
    tileTextEmboss: '#e8dcc0',
    highlight: '#c8a050',
    highlightBright: '#f0d070',
    corruption: '#2a0a30',
    corruptionDeep: '#0d0510',
    corruptionInk: '#1a0520',
    seal: '#3a0a40',
    sealPulse: '#6020a0',
    hud: '#d4c4a0',
    hudBg: '#0d0a08',
    inputBg: '#12100d',
    minimap: '#0a0808',
    ember: '#ff8030',
    crystal: '#80ffff',
    void_: '#a040ff',
    bomb: '#ff3030',
    green: '#40c040',
    yellow: '#c0c040',
    red: '#c04040',
    white: '#ffffff',
  };

  // ─── Skin token bridge ────────────────────────────────────
  // Default tokens match the legacy standalone appearance (close to SKIN_PAGE).
  var _skinTokensDefault = {
    bg: '#1a1714',
    ink: '#3a2a1a',
    accent: '#742818',
    tileOn: '#c8a050',
    tileOnColor: '#ffffff',
    pathColor: '#c8a050',
    pathStyle: 'ink',
    fontDisplay: '"Courier New", monospace',
    tileBg: '#d4c4a0',
    tileBorder: '#b0a080',
  };

  function getSkinTokens() {
    var vars = window.LD && window.LD.Theme && window.LD.Theme.vars;
    if (!vars) return _skinTokensDefault;
    return {
      bg:           vars['--bg']           || _skinTokensDefault.bg,
      ink:          vars['--ink']          || _skinTokensDefault.ink,
      accent:       vars['--accent']       || _skinTokensDefault.accent,
      tileOn:       vars['--tile-on']      || _skinTokensDefault.tileOn,
      tileOnColor:  vars['--tile-on-color']|| _skinTokensDefault.tileOnColor,
      pathColor:    vars['--path-color']   || _skinTokensDefault.pathColor,
      pathStyle:    vars['--path-style']   || _skinTokensDefault.pathStyle,
      fontDisplay:  vars['--font-display'] || _skinTokensDefault.fontDisplay,
      tileBg:       vars['--tile-bg']      || 'transparent',
      tileBorder:   vars['--tile-border']  || 'transparent',
    };
  }

  function subscribeSkinChange(cb) {
    window.addEventListener('ld:skin-change', function() { cb(); });
  }

  function init(cvs, state) {
    canvas = cvs;
    resize(canvas, state);
    // Track mouse for challenge sidebar tooltips
    cvs.addEventListener('mousemove', function(e) {
      var rect = cvs.getBoundingClientRect();
      var scaleX = cvs.width  / rect.width;
      var scaleY = cvs.height / rect.height;
      mouseX = (e.clientX - rect.left) * scaleX;
      mouseY = (e.clientY - rect.top)  * scaleY;
    }, { passive: true });
  }

  function resize(cvs, state) {
    canvas = cvs;
    const vp = state.viewport;
    const isWordHunt = state.gameMode === 'wordhunt';
    const compact = isCompactLayout();

    const shell = isShellMode();

    if (isWordHunt) {
      const hudH = shell ? 0 : (compact ? 68 : 56);
      const inputH = shell ? 0 : (compact ? 78 : 50);
      const sideW = shell ? 0 : (compact ? 0 : 236);
      const outerPadX = shell ? 0 : (compact ? 12 : 18);
      const outerPadY = shell ? 0 : (compact ? 8 : 12);
      const boardProfile = state.config && state.config.boardProfile;
      const tileTargets = boardProfile && boardProfile.tileTargets;
      const availW = canvas.width - outerPadX - sideW;
      const availH = canvas.height - hudH - inputH - outerPadY;
      const fullCols = Math.max(1, state.board.width || vp.cols || 1);
      const fullRows = Math.max(1, state.board.height || vp.rows || 1);
      const fitTile = Math.floor(Math.min(availW / fullCols, availH / fullRows));
      const minReadable = tileTargets && tileTargets.minimumReadable
        ? tileTargets.minimumReadable
        : (compact
          ? (state.settings && state.settings.boardSize === 'large' ? 14 : (state.settings && state.settings.boardSize === 'medium' ? 16 : 17))
          : (state.settings && state.settings.boardSize === 'large' ? 16 : 18));
      const preferredTile = tileTargets && tileTargets.preferred
        ? tileTargets.preferred
        : minReadable;
      const maxTile = tileTargets && tileTargets.maximum
        ? tileTargets.maximum
        : Math.max(minReadable, fitTile);
      const showWholeBoard = fitTile >= minReadable;

      if (showWholeBoard) {
        vp.cols = fullCols;
        vp.rows = fullRows;
        vp.col = 0;
        vp.row = 0;
        vp.tileSize = Math.min(maxTile, Math.max(minReadable, fitTile));
      } else {
        vp.tileSize = Math.min(maxTile, Math.max(minReadable, preferredTile));
        vp.cols = Math.max(1, Math.min(fullCols, Math.floor(availW / vp.tileSize)));
        vp.rows = Math.max(1, Math.min(fullRows, Math.floor(availH / vp.tileSize)));
        vp.col = Math.max(0, Math.min(fullCols - vp.cols, vp.col));
        vp.row = Math.max(0, Math.min(fullRows - vp.rows, vp.row));
      }

      const boardW = vp.cols * vp.tileSize;
      const boardH = vp.rows * vp.tileSize;
      vp.offsetX = Math.floor(outerPadX / 2) + Math.max(0, Math.floor((availW - boardW) / 2));
      vp.offsetY = hudH + Math.max(2, Math.floor((availH - boardH) / 2));
    } else {
      const hudH = shell ? 0 : 60;
      const inputH = shell ? 0 : 50;
      const minimapW = shell ? 0 : 130;
      const padX = shell ? 0 : 20;
      const padY = shell ? 0 : 10;
      const availW = canvas.width - padX - minimapW;
      const availH = canvas.height - hudH - inputH - padY;
      const tileW = Math.floor(availW / vp.cols);
      const tileH = Math.floor(availH / vp.rows);
      vp.tileSize = Math.min(tileW, tileH);
      vp.offsetX = shell ? Math.max(0, Math.floor((availW - vp.tileSize * vp.cols) / 2)) : 10;
      vp.offsetY = shell ? Math.max(0, Math.floor((availH - vp.tileSize * vp.rows) / 2)) : hudH;
    }
    targetScrollX = vp.col * vp.tileSize;
    targetScrollY = vp.row * vp.tileSize;
    scrollX = targetScrollX;
    scrollY = targetScrollY;
  }

  function shouldShowMinimap(state) {
    if (isShellMode()) return false;
    if (isCompactLayout()) return false;
    if (state.gameMode !== 'wordhunt') return true;
    return state.viewport.cols < state.board.width || state.viewport.rows < state.board.height;
  }

  function isCompactLayout() {
    return !!canvas && (canvas.width < 900 || canvas.height > canvas.width);
  }

  function isShellMode() {
    return !!window.__LD_SHELL_MODE__;
  }

  function getGameplayAdapter(state) {
    if (state && state.inputAdapter) return state.inputAdapter;
    if (window.LD && window.LD.PointerInput) return window.LD.PointerInput;
    if (window.LD && window.LD.Touch) return window.LD.Touch;
    return null;
  }

  function setViewportTarget(col, row) {
    targetScrollX = col;
    targetScrollY = row;
  }

  function updateScroll(dt, state) {
    const vp = state.viewport;
    targetScrollX = vp.col * vp.tileSize;
    targetScrollY = vp.row * vp.tileSize;
    const lerp = 1 - Math.pow(0.001, dt);
    scrollX += (targetScrollX - scrollX) * lerp;
    scrollY += (targetScrollY - scrollY) * lerp;
    if (Math.abs(scrollX - targetScrollX) < 0.5) scrollX = targetScrollX;
    if (Math.abs(scrollY - targetScrollY) < 0.5) scrollY = targetScrollY;

    if (inputFlashTimer > 0) inputFlashTimer -= dt;
  }

  function render(ctx, state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background — in shell mode leave canvas transparent so the skin's
    // HTML Background shows through. In standalone mode fill as before.
    if (!isShellMode()) {
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (state.phase === 'title') {
      drawTitleScreen(ctx, state);
      return;
    }
    if (state.phase === 'settings') {
      if (window.LD && window.LD.Settings) {
        window.LD.Settings.render(ctx, state);
      }
      return;
    }
    if (state.phase === 'gameover') {
      drawBoard(ctx, state);
      if (shouldShowMinimap(state)) drawMinimap(ctx, state);
      if (!isShellMode()) drawHUD(ctx, state);
      drawGameOverScreen(ctx, state);
      return;
    }
    if (state.phase === 'victory') {
      drawBoard(ctx, state);
      if (shouldShowMinimap(state)) drawMinimap(ctx, state);
      if (!isShellMode()) drawHUD(ctx, state);
      drawVictoryScreen(ctx, state);
      return;
    }

    // Playing phase
    const shake = (LD.Particles && LD.Particles.getShakeOffset) ? LD.Particles.getShakeOffset() : {x:0,y:0};
    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawBoard(ctx, state);

    // Particles rendered on top of board
    if (LD.Particles && LD.Particles.render) {
      LD.Particles.render(ctx);
    }

    ctx.restore();

    if (shouldShowMinimap(state)) drawMinimap(ctx, state);
    if (!isShellMode()) drawHUD(ctx, state);

    // Input bar: gameplay adapter action bar when available, keyboard bar otherwise.
    // The shell renders these as DOM components, so suppress them in shell mode.
    if (!isShellMode()) {
      const gameplayAdapter = getGameplayAdapter(state);
      if (gameplayAdapter && gameplayAdapter.renderActionBar) {
        gameplayAdapter.renderActionBar(ctx, state);
      } else {
        drawInputBar(ctx, state);
      }
    }

    // Challenge sidebar (Word Hunt only)
    if (state.gameMode === 'wordhunt') {
      if (!isShellMode() && window.LD && window.LD.Challenges) {
        LD.Challenges.renderSidebar(ctx, state, mouseX, mouseY);
      }
      if (!isShellMode()) {
        drawDiscoveryPanel(ctx, state);
        drawWordHistory(ctx, state);
      }
    }

    if (!isShellMode() && state.debug && state.debug.enabled) {
      drawDebugOverlay(ctx, state);
    }

    // Help overlay
    if (!isShellMode() && state.showHelp) {
      drawHelpScreen(ctx, state);
    }
  }

  function drawBoard(ctx, state) {
    const vp = state.viewport;
    const ts = vp.tileSize;
    const board = state.board;

    // Build sets for fast lookup
    const pathSet = new Set();
    if (state.input.path) {
      state.input.path.forEach(function(p) {
        pathSet.add(p.col + ',' + p.row);
      });
    }
    const matchSet = new Set();
    if (state.input.matchingTiles) {
      state.input.matchingTiles.forEach(function(p) {
        matchSet.add(p.col + ',' + p.row);
      });
    }
    const clueSet = new Set();
    if (state.gameMode === 'wordhunt' && state.hunt && state.hunt.clueTiles) {
      state.hunt.clueTiles.forEach(function(p) {
        clueSet.add(p.col + ',' + p.row);
      });
    }

    for (let vr = 0; vr < vp.rows; vr++) {
      for (let vc = 0; vc < vp.cols; vc++) {
        const gc = vp.col + vc;
        const gr = vp.row + vr;
        if (gc >= board.width || gr >= board.height) continue;
        const tile = board.tiles[gr * board.width + gc];
        const x = vp.offsetX + vc * ts;
        const y = vp.offsetY + vr * ts;
        const key = gc + ',' + gr;
        const inPath = pathSet.has(key);
        const isMatch = !inPath && matchSet.has(key);
        const isClue = clueSet.has(key);
        const pathIdx = inPath ? getPathIndex(state.input.path, gc, gr) : -1;

        drawTile(ctx, tile, x, y, ts, inPath, pathIdx, state, isMatch, isClue);
      }
    }
  }

  function getPathIndex(path, col, row) {
    for (let i = 0; i < path.length; i++) {
      if (path[i].col === col && path[i].row === row) return i;
    }
    return -1;
  }

  function drawTile(ctx, tile, x, y, ts, inPath, pathIdx, state, isMatch, isClue) {
    const pad = 1;
    const inner = ts - pad * 2;
    const time = state.time || 0;

    if (tile.isSeal) {
      // Active seal
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      const r = Math.floor(58 + pulse * 38);
      const g = Math.floor(10 + pulse * 22);
      const b = Math.floor(64 + pulse * 96);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(x + pad, y + pad, inner, inner);
      // Seal symbol (lock icon)
      ctx.strokeStyle = '#8040c0';
      ctx.lineWidth = 2;
      const cx = x + ts / 2;
      const cy = y + ts / 2;
      // Lock body
      ctx.fillStyle = '#4a1060';
      ctx.fillRect(cx - inner * 0.25, cy - inner * 0.05, inner * 0.5, inner * 0.35);
      // Lock shackle
      ctx.beginPath();
      ctx.arc(cx, cy - inner * 0.05, inner * 0.18, Math.PI, 0);
      ctx.stroke();
      // Keyhole
      ctx.fillStyle = '#1a0520';
      ctx.beginPath();
      ctx.arc(cx, cy + inner * 0.08, inner * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      return;
    }

    if (inPath) {
      // Highlighted tile — use skin tokens in shell mode
      if (isShellMode()) {
        var st = getSkinTokens();
        ctx.fillStyle = st.tileOn;
        ctx.fillRect(x + pad, y + pad, inner, inner);
        ctx.strokeStyle = st.tileOn;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + pad, y + pad, inner, inner);
        ctx.lineWidth = 1;
        if (tile.letter) {
          drawLetter(ctx, tile.letter, x, y, ts, st.tileOnColor, null, tile.points);
        } else if (tile.icon) {
          drawIcon(ctx, tile.icon, x, y, ts, true);
        }
      } else {
        const glowPhase = Math.max(0, Math.min(1, (time * 5 - pathIdx * 0.25) % 2));
        const brightness = 0.7 + 0.3 * Math.sin(glowPhase * Math.PI);
        const r = Math.floor(200 * brightness);
        const g2 = Math.floor(160 * brightness);
        const b = Math.floor(80 * brightness);
        ctx.fillStyle = 'rgb(' + r + ',' + g2 + ',' + b + ')';
        ctx.fillRect(x + pad, y + pad, inner, inner);
        // Glow border
        ctx.strokeStyle = COLORS.highlightBright;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + pad, y + pad, inner, inner);
        ctx.lineWidth = 1;
        // Letter in white
        if (tile.letter) {
          drawLetter(ctx, tile.letter, x, y, ts, '#ffffff', '#c8a050', tile.points);
        } else if (tile.icon) {
          drawIcon(ctx, tile.icon, x, y, ts, true);
        }
      }
      return;
    }

    if (tile.corrupted) {
      // Corrupted tile
      ctx.fillStyle = COLORS.corruption;
      ctx.fillRect(x + pad, y + pad, inner, inner);
      // Ink bleed splotches (deterministic from position)
      let seed = tile.col * 7 + tile.row * 13;
      for (let i = 0; i < 4; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const sx = x + pad + (seed % inner);
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const sy = y + pad + (seed % inner);
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const sr = 3 + (seed % (inner / 4));
        ctx.fillStyle = COLORS.corruptionDeep;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
      // Faint letter
      if (tile.letter) {
        ctx.globalAlpha = 0.15;
        drawLetter(ctx, tile.letter, x, y, ts, '#ffffff', null);
        ctx.globalAlpha = 1;
      }
      // Subtle border
      ctx.strokeStyle = '#0d0510';
      ctx.strokeRect(x + pad, y + pad, inner, inner);
      return;
    }

    if (tile.icon) {
      // Icon tile — clean background with colored glow
      ctx.fillStyle = COLORS.tileFill;
      ctx.fillRect(x + pad, y + pad, inner, inner);
      ctx.strokeStyle = COLORS.tileBorder;
      ctx.strokeRect(x + pad, y + pad, inner, inner);
      drawIcon(ctx, tile.icon, x, y, ts, false);
      return;
    }

    // Word Hunt: found planted word — golden tint
    const isFoundPlanted = tile.planted && tile.found;
    // Word Hunt: fully consumed tile (useCount >= 2) — dimmed
    const useCount = tile.useCount || 0;
    const isExhausted = useCount >= 2 && !isFoundPlanted;

    let tileFill = COLORS.tileFill;
    if (isFoundPlanted) tileFill = '#c8a840';
    else if (isExhausted) tileFill = '#6a6050';
    else if (isMatch)   tileFill = '#e0c880';

    ctx.fillStyle = tileFill;
    ctx.fillRect(x + pad, y + pad, inner, inner);

    if (isFoundPlanted) {
      ctx.strokeStyle = '#f0d070';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + pad, y + pad, inner, inner);
      ctx.lineWidth = 1;
    } else if (isExhausted) {
      ctx.strokeStyle = '#4a4038';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + pad, y + pad, inner, inner);
    } else if (isMatch) {
      ctx.strokeStyle = '#c8a050';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + pad, y + pad, inner, inner);
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = COLORS.tileBorder;
      ctx.strokeRect(x + pad, y + pad, inner, inner);
    }

    if (isClue && !tile.found) {
      var pulse = 0.5 + 0.5 * Math.sin(time * 8);
      ctx.strokeStyle = 'rgba(128,216,255,' + (0.45 + pulse * 0.35) + ')';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + pad + 1, y + pad + 1, inner - 2, inner - 2);
      ctx.lineWidth = 1;
    }

    // Word color stripe(s) at the bottom of each used tile
    const wc = tile.wordColors;
    if (wc && wc.length > 0 && !isFoundPlanted) {
      const stripeH = Math.max(3, Math.floor(ts * 0.08));
      const stripeY = y + ts - stripeH - 1;
      if (wc.length === 1) {
        ctx.fillStyle = wc[0];
        ctx.fillRect(x + 2, stripeY, ts - 4, stripeH);
      } else {
        // Two colors — split left/right
        const half = Math.floor((ts - 4) / 2);
        ctx.fillStyle = wc[0];
        ctx.fillRect(x + 2, stripeY, half, stripeH);
        ctx.fillStyle = wc[1];
        ctx.fillRect(x + 2 + half, stripeY, ts - 4 - half, stripeH);
      }
    }

    // Tile tint (for effects)
    if (tile.tint) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = tile.tint;
      ctx.fillRect(x + pad, y + pad, inner, inner);
      ctx.globalAlpha = 1;
    }

    if (tile.letter) {
      let letterColor  = COLORS.tileText;
      let embossColor  = COLORS.tileTextEmboss;
      if (isMatch)          { letterColor = '#5a3a10'; embossColor = '#f0d890'; }
      else if (isExhausted) { letterColor = '#9a8868'; embossColor = null; }
      drawLetter(ctx, tile.letter, x, y, ts, letterColor, embossColor, isExhausted ? 0 : tile.points);
    }
  }

  function drawLetter(ctx, letter, x, y, ts, color, embossColor, points) {
    const fontSize = Math.max(10, Math.floor(ts * 0.55));
    ctx.font = 'bold ' + fontSize + 'px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = x + ts / 2;
    const cy = y + ts / 2;

    if (embossColor) {
      ctx.fillStyle = embossColor;
      ctx.fillText(letter, cx + 1, cy + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(letter, cx, cy);

    // Point value in bottom-right corner
    if (points && points > 1 && ts >= 30) {
      const ptSize = Math.max(8, Math.floor(ts * 0.22));
      ctx.font = ptSize + 'px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = color;
      ctx.fillText(points, x + ts - 3, y + ts - 2);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    }
  }

  function drawIcon(ctx, icon, x, y, ts, highlighted) {
    const cx = x + ts / 2;
    const cy = y + ts / 2;
    const r = ts * 0.3;

    ctx.save();
    switch (icon) {
      case 'ember':
        // Glow
        ctx.fillStyle = highlighted ? '#ffaa50' : COLORS.ember;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Flame (3 overlapping triangles)
        ctx.fillStyle = '#ff6020';
        drawTriangle(ctx, cx, cy - r * 0.8, r * 0.4, r * 0.9);
        ctx.fillStyle = '#ffaa30';
        drawTriangle(ctx, cx - r * 0.2, cy - r * 0.4, r * 0.3, r * 0.7);
        ctx.fillStyle = '#ffdd60';
        drawTriangle(ctx, cx + r * 0.15, cy - r * 0.5, r * 0.25, r * 0.6);
        break;
      case 'crystal':
        ctx.fillStyle = highlighted ? '#aaffff' : COLORS.crystal;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Diamond shape
        ctx.fillStyle = '#60dddd';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.6, cy);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r * 0.6, cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#aaffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        break;
      case 'void':
        ctx.fillStyle = highlighted ? '#c060ff' : COLORS.void_;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Spiral
        ctx.strokeStyle = '#c080ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.2) {
          const sr = (a / (Math.PI * 4)) * r * 0.8;
          const sx = cx + Math.cos(a) * sr;
          const sy = cy + Math.sin(a) * sr;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.lineWidth = 1;
        break;
      case 'bomb':
        ctx.fillStyle = highlighted ? '#ff5050' : COLORS.bomb;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Bomb circle
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.1, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // Fuse
        ctx.strokeStyle = '#aa8844';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + r * 0.2, cy - r * 0.4);
        ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.8, cx + r * 0.1, cy - r * 0.9);
        ctx.stroke();
        // Spark at fuse tip
        ctx.fillStyle = '#ffdd30';
        ctx.beginPath();
        ctx.arc(cx + r * 0.1, cy - r * 0.9, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1;
        break;
    }
    if (!highlighted && ts >= 22) {
      var label = icon === 'ember' ? '+20'
        : icon === 'crystal' ? 'x2'
        : icon === 'void' ? '?'
        : icon === 'bomb' ? 'BOOM' : '';
      if (label) {
        ctx.font = Math.max(8, Math.floor(ts * 0.18)) + 'px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#3a2a1a';
        ctx.fillText(label, cx, y + ts - 3);
        ctx.textBaseline = 'middle';
      }
    }
    ctx.restore();
  }

  function drawTriangle(ctx, cx, tipY, halfW, h) {
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - halfW, tipY + h);
    ctx.lineTo(cx + halfW, tipY + h);
    ctx.closePath();
    ctx.fill();
  }

  function drawMinimap(ctx, state) {
    const board = state.board;
    const vp = state.viewport;
    const mmSize = 120;
    const dotSize = 3;
    const mmX = canvas.width - mmSize - 10;
    const mmY = canvas.height - mmSize - 60;

    // Background
    ctx.fillStyle = 'rgba(10, 8, 8, 0.85)';
    ctx.fillRect(mmX - 4, mmY - 4, mmSize + 8, mmSize + 8);

    for (let r = 0; r < board.height; r++) {
      for (let c = 0; c < board.width; c++) {
        const tile = board.tiles[r * board.width + c];
        const px = mmX + (c / board.width) * mmSize;
        const py = mmY + (r / board.height) * mmSize;

        if (tile.isSeal) {
          const seals = board.seals || board.seeds || [];
          const seal = seals.find(function(s) { return s.col === c && s.row === r; });
          if (seal && seal.alive) {
            ctx.fillStyle = '#ff3030';
          } else {
            ctx.fillStyle = '#555';
          }
          ctx.fillRect(px, py, dotSize, dotSize);
          continue;
        }
        if (tile.icon) {
          switch (tile.icon) {
            case 'ember': ctx.fillStyle = '#ff8030'; break;
            case 'crystal': ctx.fillStyle = '#80ffff'; break;
            case 'void': ctx.fillStyle = '#a040ff'; break;
            case 'bomb': ctx.fillStyle = '#ff3030'; break;
            default: ctx.fillStyle = COLORS.tileFill;
          }
          ctx.fillRect(px, py, dotSize, dotSize);
          continue;
        }
        if (tile.corrupted && state.gameMode !== 'wordhunt') {
          ctx.fillStyle = '#3a0a50';
          ctx.fillRect(px, py, dotSize, dotSize);
          continue;
        }
        // Word Hunt: amber dots for found planted tiles
        if (state.gameMode === 'wordhunt' && tile.planted && tile.found) {
          ctx.fillStyle = '#c8a050';
          ctx.fillRect(px, py, dotSize, dotSize);
          continue;
        }
        // Word Hunt: dim dots for used tiles (darker = more used)
        if (state.gameMode === 'wordhunt' && (tile.useCount || 0) >= 2) {
          ctx.fillStyle = '#3a3028';
          ctx.fillRect(px, py, 2, 2);
          continue;
        }
        if (state.gameMode === 'wordhunt' && (tile.useCount || 0) === 1) {
          ctx.fillStyle = '#7a6a50';
          ctx.fillRect(px, py, 2, 2);
          continue;
        }
        ctx.fillStyle = '#b0a080';
        ctx.fillRect(px, py, 2, 2);
      }
    }

    // Viewport rectangle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mmX + (vp.col / board.width) * mmSize,
      mmY + (vp.row / board.height) * mmSize,
      (vp.cols / board.width) * mmSize,
      (vp.rows / board.height) * mmSize
    );
  }

  function drawHUD(ctx, state) {
    if (state.gameMode === 'wordhunt') {
      drawHUDWordHunt(ctx, state);
    } else {
      drawHUDSiege(ctx, state);
    }
  }

  function drawHUDWordHunt(ctx, state) {
    const w = canvas.width;
    const compact = isCompactLayout();
    const h = compact ? 68 : 55;
    const hunt = state.hunt || {};
    const foundCount = (hunt.plantedWords || []).filter(function (p) { return p.found; }).length;
    const totalHidden = (hunt.plantedWords || []).length;
    const objectiveTotal = (hunt.challenges && hunt.challenges.length) || 0;
    const objectiveDone = hunt.completedCount || 0;

    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w, h); ctx.stroke();

    ctx.fillStyle = COLORS.hud;
    ctx.textBaseline = 'middle';

    if (compact) {
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('WORD HUNT', 10, 15);
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#8a7a60';
      ctx.fillText('Round ' + (hunt.round || 1) + '/' + (hunt.maxRounds || 3), 10, 31);

      ctx.fillStyle = COLORS.hud;
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), 10, 49);
      ctx.fillText('Words: ' + (state.wordsSpelled || 0), 170, 49);

      ctx.textAlign = 'right';
      ctx.fillText('Hidden: ' + foundCount + '/' + totalHidden, w - 10, 15);
      ctx.fillText('Clues: ' + (hunt.cluesRemaining || 0), w - 10, 31);

      const endCondCompact = (state.settings && state.settings.endCondition) || 'challenges';
      if (endCondCompact === 'challenges') {
        ctx.fillText('Obj: ' + objectiveDone + '/' + objectiveTotal, w - 10, 49);
      } else if (endCondCompact === 'timed') {
        const secsCompact = Math.max(0, Math.ceil(hunt.timeRemaining || 0));
        const mmCompact = Math.floor(secsCompact / 60);
        const ssCompact = String(secsCompact % 60).padStart(2, '0');
        ctx.fillStyle = secsCompact < 30 ? '#ff6040' : COLORS.hud;
        ctx.fillText(mmCompact + ':' + ssCompact, w - 10, 49);
      } else if (endCondCompact === 'turns') {
        ctx.fillText('Turns: ' + (hunt.turnsRemaining || 0), w - 10, 49);
      }

      if (hunt.combo > 1) {
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.fillStyle = '#f0d070';
        ctx.textAlign = 'center';
        ctx.fillText('× ' + hunt.combo + ' COMBO', w / 2, 15);
      }

      if (state.debug && state.debug.enabled) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.fillStyle = '#ff8080';
        ctx.fillText('DEBUG', w / 2, 31);
      }
      return;
    }

    // Title + round
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WORD HUNT', 12, 16);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText('Round ' + (hunt.round || 1) + '/' + (hunt.maxRounds || 3) + ' · ' + (hunt.roundTitle || 'The First Page'), 12, 32);

    // Score + words
    ctx.fillStyle = COLORS.hud;
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), 170, 22);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0), 170, 40);
    ctx.fillText('Hidden: ' + foundCount + '/' + totalHidden, 320, 22);
    ctx.fillText('Clues: ' + (hunt.cluesRemaining || 0), 320, 40);

    // Combo
    if (hunt.combo > 1) {
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = '#f0d070';
      ctx.textAlign = 'center';
      ctx.fillText('× ' + hunt.combo + ' COMBO', w / 2, 28);
    }

    if (state.debug && state.debug.enabled) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#ff8080';
      ctx.fillText('DEBUG', w / 2, 46);
    }

    // End condition indicator
    ctx.textAlign = 'right';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    const endCond = (state.settings && state.settings.endCondition) || 'challenges';
    if (endCond === 'challenges') {
      ctx.fillText('Objectives: ' + objectiveDone + '/' + objectiveTotal, w - 20, 22);
      // Mini progress bar
      const bw = 140, bh = 6, bx = w - bw - 20, by = 34;
      ctx.fillStyle = '#2a2420';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = COLORS.highlight;
      ctx.fillRect(bx, by, Math.round((objectiveDone / Math.max(objectiveTotal, 1)) * bw), bh);
      ctx.strokeStyle = '#444';
      ctx.strokeRect(bx, by, bw, bh);
    } else if (endCond === 'timed') {
      const secs = Math.max(0, Math.ceil(hunt.timeRemaining || 0));
      const mm = Math.floor(secs / 60);
      const ss = String(secs % 60).padStart(2, '0');
      ctx.fillStyle = secs < 30 ? '#ff6040' : COLORS.hud;
      ctx.fillText('Time: ' + mm + ':' + ss, w - 20, 22);
      ctx.fillStyle = '#8a7a60';
      ctx.fillText('Round score: ' + (hunt.roundScore || 0), w - 20, 40);
    } else if (endCond === 'turns') {
      ctx.fillText('Turns left: ' + (hunt.turnsRemaining || 0), w - 20, 22);
      ctx.fillStyle = '#8a7a60';
      ctx.fillText('Round score: ' + (hunt.roundScore || 0), w - 20, 40);
    }
  }

  function drawHUDSiege(ctx, state) {
    const w = canvas.width;
    const h = 55;

    // HUD background
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h);
    ctx.stroke();

    ctx.fillStyle = COLORS.hud;
    ctx.textBaseline = 'middle';

    // Title
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LEXICON DEEP', 12, 16);

    // Stats row 1
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), 12, 38);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0), 160, 38);
    ctx.fillText('Turn: ' + (state.turns || 0), 280, 38);

    // Seeds
    ctx.textAlign = 'center';
    ctx.fillText('Seeds: ' + (state.seedsDestroyed || 0) + '/' + state.totalSeeds + ' destroyed', w / 2 + 60, 16);

    // Seed dots
    const dotX = w / 2 + 20;
    for (let i = 0; i < state.totalSeeds; i++) {
      ctx.fillStyle = i < (state.seedsDestroyed || 0) ? '#c8a050' : '#3a3a3a';
      ctx.beginPath();
      ctx.arc(dotX + i * 16, 36, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corruption meter
    ctx.textAlign = 'right';
    const corr = LD.Board ? LD.Board.getCorruptionPercent(state.board || state) : 0;
    const corrStr = 'Corruption: ' + Math.floor(corr) + '%';
    ctx.fillStyle = COLORS.hud;
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(corrStr, w - 20, 16);

    // Corruption bar
    const barW = 140;
    const barH = 10;
    const barX = w - barW - 20;
    const barY = 30;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barW, barH);
    const fillW = Math.min(barW, (corr / 50) * barW);
    if (corr < 20) ctx.fillStyle = COLORS.green;
    else if (corr < 30) ctx.fillStyle = COLORS.yellow;
    else ctx.fillStyle = COLORS.red;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.strokeStyle = '#333';
    ctx.strokeRect(barX, barY, barW, barH);

    // Hard mode indicator
    if (state.settings && state.settings.difficulty === 'hard') {
      ctx.fillStyle = '#ff6040';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('HARD', w - 20, 48);
    }
  }

  function drawInputBar(ctx, state) {
    const w = canvas.width;
    const barH = 50;
    const barY = canvas.height - barH;

    // Background
    ctx.fillStyle = COLORS.inputBg;
    if (inputFlashTimer > 0 && inputFlashColor) {
      ctx.fillStyle = inputFlashColor;
    }
    ctx.fillRect(0, barY, w, barH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(w, barY);
    ctx.stroke();

    const typed = state.input.typed || '';
    const valid = state.input.valid;
    const hasPath = state.input.hasPath;

    // Typed word
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (typed.length > 0) {
      ctx.font = 'bold 22px "Courier New", monospace';
      // Draw each letter with spacing
      let lx = 20;
      for (let i = 0; i < typed.length; i++) {
        if (i > 0) {
          ctx.fillStyle = '#555';
          ctx.font = '14px "Courier New", monospace';
          ctx.fillText('-', lx, barY + 22);
          lx += 10;
        }
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillStyle = COLORS.hud;
        ctx.fillText(typed[i], lx, barY + 22);
        lx += 18;
      }

      // Validity indicator
      lx += 15;
      ctx.font = 'bold 16px "Courier New", monospace';
      if (valid && hasPath) {
        ctx.fillStyle = '#40c040';
        ctx.fillText('✓ valid', lx, barY + 22);
        // Enter hint
        ctx.fillStyle = '#888';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText('[Enter]', lx + 80, barY + 22);
      } else if (valid && !hasPath) {
        ctx.fillStyle = '#c0c040';
        ctx.fillText('? no path', lx, barY + 22);
      } else if (state.gameMode === 'wordhunt' && typed.length > 0 && typed.length < 4) {
        ctx.fillStyle = '#c08040';
        ctx.fillText('need 4+ letters', lx, barY + 22);
      } else if (typed.length >= 2) {
        ctx.fillStyle = '#c04040';
        ctx.fillText('✗ not a word', lx, barY + 22);
      }
    }

    // Second line: score breakdown (Word Hunt) or hint text
    const sp = state.input.scorePreview;
    if (state.gameMode === 'wordhunt' && sp && state.input.hasPath) {
      // Draw score formula: base × lenMult × shapeMult × comboMult = total
      ctx.font = '11px "Courier New", monospace';
      ctx.textBaseline = 'middle';
      let fx = 20;
      const fy = barY + 41;

      // base points
      ctx.fillStyle = '#a09080';
      ctx.fillText(sp.basePts + 'pts', fx, fy);
      fx += ctx.measureText(sp.basePts + 'pts').width + 4;

      // length multiplier
      if (sp.lenMult > 1.0) {
        ctx.fillStyle = '#555';
        ctx.fillText('×', fx, fy); fx += 12;
        ctx.fillStyle = '#80b0e0';
        ctx.fillText(sp.lenMult.toFixed(1) + ' (' + typed.length + 'L)', fx, fy);
        fx += ctx.measureText(sp.lenMult.toFixed(1) + ' (' + typed.length + 'L)').width + 4;
      }

      // shape multiplier
      if (sp.shapeMult !== 1.0) {
        ctx.fillStyle = '#555';
        ctx.fillText('×', fx, fy); fx += 12;
        const shapeColor = sp.shapeMult >= 2.0 ? '#60e060'
          : sp.shapeMult >= 1.5 ? '#90d060'
          : sp.shapeMult < 1.0  ? '#e08040' : '#a09080';
        ctx.fillStyle = shapeColor;
        ctx.fillText(sp.shapeMult.toFixed(1) + ' ' + sp.shapeLabel, fx, fy);
        fx += ctx.measureText(sp.shapeMult.toFixed(1) + ' ' + sp.shapeLabel).width + 4;
      }

      // combo multiplier
      if (sp.comboMult > 1.0) {
        ctx.fillStyle = '#555';
        ctx.fillText('×', fx, fy); fx += 12;
        ctx.fillStyle = '#f0d070';
        ctx.fillText(sp.comboMult.toFixed(1) + ' combo', fx, fy);
        fx += ctx.measureText(sp.comboMult.toFixed(1) + ' combo').width + 4;
      }

      if (sp.crystalMult > 1.0) {
        ctx.fillStyle = '#555';
        ctx.fillText('×', fx, fy); fx += 12;
        ctx.fillStyle = '#80ffff';
        ctx.fillText('2.0 crystal', fx, fy);
        fx += ctx.measureText('2.0 crystal').width + 4;
      }

      if (sp.emberBonus > 0) {
        ctx.fillStyle = '#555';
        ctx.fillText('+', fx, fy); fx += 10;
        ctx.fillStyle = '#ffb060';
        ctx.fillText(String(sp.emberBonus) + ' ember', fx, fy);
        fx += ctx.measureText(String(sp.emberBonus) + ' ember').width + 4;
      }

      // total
      ctx.fillStyle = '#555';
      ctx.fillText('=', fx, fy); fx += 16;
      ctx.fillStyle = valid ? '#ffd700' : '#888';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('~' + sp.total + ' pts', fx, fy);
    } else {
      ctx.fillStyle = '#555';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Type, click, or drag tiles · Enter submit · C clue · ` debug · ? help', 20, barY + 41);
    }
  }

  function getPathOrientationText(path, reversed) {
    if (!path || path.length < 2) return 'single';
    const dc = path[1].col - path[0].col;
    const dr = path[1].row - path[0].row;
    const axis = dr === 0 ? 'horizontal'
      : dc === 0 ? 'vertical'
      : 'diagonal';
    return axis + ' · ' + (reversed ? 'backward' : 'forward');
  }

  function drawDebugTabs(ctx, tabs, active, x, y) {
    for (var i = 0; i < tabs.length; i++) {
      var tx = x + i * 168;
      var isActive = tabs[i].key === active;
      ctx.fillStyle = isActive ? '#3a2810' : '#181410';
      ctx.strokeStyle = isActive ? '#c8a050' : '#2a2420';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.fillRect(tx, y, 156, 28);
      ctx.strokeRect(tx, y, 156, 28);
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = isActive ? '#f0d070' : '#8a7a60';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tabs[i].label, tx + 78, y + 14);
    }
  }

  function drawDebugOverlay(ctx, state) {
    if (isShellMode()) return;
    var hunt = state.hunt || {};
    ctx.fillStyle = 'rgba(7, 6, 5, 0.93)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = '#f0d070';
    ctx.fillText('DEBUG OVERLAY', 36, 34);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText('` close  ·  Tab switch  ·  1 planted  ·  2 history', 36, 58);

    drawDebugTabs(ctx, [
      { key: 'planted', label: '1  PLANTED WORDS' },
      { key: 'history', label: '2  WORD HISTORY' }
    ], (state.debug && state.debug.tab) || 'planted', 36, 78);

    if ((state.debug && state.debug.tab) === 'history') {
      drawDebugHistoryPanel(ctx, state);
    } else {
      drawDebugPlantedPanel(ctx, hunt);
    }
  }

  function drawDebugPlantedPanel(ctx, hunt) {
    var words = hunt.plantedWords || [];
    var x = 36;
    var y = 126;
    var colGap = 360;
    var rowH = 22;
    var perCol = Math.max(1, Math.floor((canvas.height - y - 36) / rowH));

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText('Word', x, y - 20);
    ctx.fillText('Orientation', x + 140, y - 20);
    ctx.fillText('Status', x + 290, y - 20);
    ctx.fillText('Word', x + colGap, y - 20);
    ctx.fillText('Orientation', x + colGap + 140, y - 20);
    ctx.fillText('Status', x + colGap + 290, y - 20);

    for (var i = 0; i < words.length; i++) {
      var col = Math.floor(i / perCol);
      var row = i % perCol;
      var px = x + col * colGap;
      var py = y + row * rowH;
      var entry = words[i];
      var found = !!entry.found;

      ctx.font = (found ? 'bold ' : '') + '12px "Courier New", monospace';
      ctx.fillStyle = found ? '#f0d070' : '#d4c4a0';
      ctx.fillText(entry.word, px, py);
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#8a7a60';
      ctx.fillText(getPathOrientationText(entry.path, entry.reversed), px + 140, py);
      ctx.fillStyle = found ? '#80d080' : '#805040';
      ctx.fillText(found ? 'FOUND' : 'hidden', px + 290, py);
    }
  }

  function drawDebugHistoryPanel(ctx, state) {
    var history = state.wordHistory || [];
    var x = 36;
    var y = 126;
    var rowH = 22;
    var maxRows = Math.max(1, Math.floor((canvas.height - y - 50) / rowH));
    var start = Math.max(0, history.length - maxRows);

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText('Word', x, y - 20);
    ctx.fillText('Score', x + 110, y - 20);
    ctx.fillText('Why', x + 190, y - 20);

    for (var i = start; i < history.length; i++) {
      var entry = history[i];
      var py = y + (i - start) * rowH;
      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = i === history.length - 1 ? '#f0d070' : '#d4c4a0';
      ctx.fillText(entry.word, x, py);
      ctx.fillStyle = '#c8a050';
      ctx.fillText('+' + entry.score, x + 110, py);
      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#8a7a60';
      ctx.fillText(entry.reasonText || '', x + 190, py);
    }

    ctx.textAlign = 'right';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText(
      history.length > maxRows
        ? 'showing latest ' + maxRows + ' of ' + history.length
        : String(history.length) + ' words total',
      canvas.width - 36,
      canvas.height - 24
    );
    ctx.textAlign = 'left';
  }

  /**
   * Shared measurements for the Word Hunt right column.
   */
  function getWordHuntSidebarMetrics(state) {
    if (isCompactLayout()) return null;
    const objectiveCount = (state.hunt && state.hunt.challenges) ? state.hunt.challenges.length : 0;
    const sideW = 220;
    const sideX = canvas.width - sideW - 8;
    const objectiveY = 60;
    const objectiveH = 28 + objectiveCount * 48 + 12;
    const discoveryY = objectiveY + objectiveH + 10;
    const minimapTop = shouldShowMinimap(state) ? (canvas.height - 120 - 60 - 8) : (canvas.height - 8);
    return {
      x: sideX,
      w: sideW,
      objectiveY: objectiveY,
      objectiveH: objectiveH,
      discoveryY: discoveryY,
      minimapTop: minimapTop,
    };
  }

  function drawDiscoveryPanel(ctx, state) {
    if (isShellMode()) return;
    const hunt = state.hunt;
    if (!hunt) return;

    const found = (hunt.plantedWords || []).filter(function (p) { return p.found; }).length;
    const total = (hunt.plantedWords || []).length;
    const recent = (hunt.discoveredWords || []).slice(-4).reverse();
    const m = getWordHuntSidebarMetrics(state);
    if (!m) return;
    const panelX = m.x;
    const panelY = m.discoveryY;
    const panelW = m.w;
    const panelH = 104;
    if (panelY + panelH > m.minimapTop) return;

    // Background
    ctx.fillStyle = 'rgba(10, 8, 6, 0.88)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#5a4a30';
    ctx.fillText('DISCOVERIES  ' + found + '/' + total, panelX + 8, panelY + 6);
    ctx.textAlign = 'right';
    ctx.fillText('CLUES ' + (hunt.cluesRemaining || 0), panelX + panelW - 8, panelY + 6);

    ctx.textAlign = 'left';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#7a6a50';
    if (recent.length === 0) {
      ctx.fillText('No hidden words found yet.', panelX + 8, panelY + 28);
      ctx.fillText('Use C or the clue button when stuck.', panelX + 8, panelY + 44);
      return;
    }

    for (let i = 0; i < recent.length; i++) {
      ctx.fillStyle = i === 0 ? '#f0d070' : '#8a7a60';
      ctx.font = (i === 0 ? 'bold ' : '') + '11px "Courier New", monospace';
      ctx.fillText(recent[i], panelX + 8, panelY + 28 + i * 16);
    }
  }

  function drawWordHistory(ctx, state) {
    if (isShellMode()) return;
    const hunt = state.hunt;
    if (!hunt || !hunt.wordsThisRound || hunt.wordsThisRound.length === 0) return;

    const history = hunt.wordsThisRound;
    const lineH = 18;
    const padX = 8;
    const padY = 6;
    const m = getWordHuntSidebarMetrics(state);
    if (!m) return;
    const panelX = m.x;
    const panelY = m.discoveryY + 114;
    const panelW = m.w;
    const maxAvailable = Math.floor((m.minimapTop - panelY - 24) / lineH);
    const maxShow = Math.max(0, Math.min(6, history.length, maxAvailable));
    if (maxShow <= 0) return;
    const panelH = maxShow * lineH + padY * 2 + 20;
    if (panelY + panelH > m.minimapTop) return;

    ctx.fillStyle = 'rgba(10, 8, 6, 0.88)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#5a4a30';
    ctx.fillText('RECENT WORDS  ' + history.length, panelX + padX, panelY + padY);

    const listTop = panelY + padY + 18;
    for (let i = 0; i < maxShow; i++) {
      const entry  = history[history.length - maxShow + i];
      const isLast = i === maxShow - 1;
      const ey     = listTop + i * lineH;

      // Word
      ctx.fillStyle = isLast ? '#f0d070' : '#7a6a50';
      ctx.font = (isLast ? 'bold ' : '') + '11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(entry.word, panelX + padX, ey);

      // Score + shape mult
      ctx.font = '10px "Courier New", monospace';
      ctx.textAlign = 'right';
      const smColor = entry.shapeMult >= 2.0 ? '#60b060'
        : entry.shapeMult >= 1.5 ? '#80a050'
        : entry.shapeMult < 1.0  ? '#884820' : '#5a4a30';
      ctx.fillStyle = isLast ? '#c8a050' : '#5a4a30';
      ctx.fillText('+' + entry.score, panelX + panelW - padX - 28, ey);
      ctx.fillStyle = smColor;
      ctx.fillText('×' + (entry.shapeMult || 1).toFixed(1), panelX + panelW - padX, ey);
    }

    ctx.textBaseline = 'middle';
  }

  function drawTitleScreen(ctx, state) {
    const w = canvas.width;
    const h = canvas.height;
    const time = state.time || 0;

    // Dark background with subtle pattern
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // Animated corruption tendrils
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const seed = i * 137;
      const bx = (seed * 7) % w;
      const by = (seed * 13) % h;
      const br = 30 + Math.sin(time * 0.5 + i) * 20;
      ctx.fillStyle = COLORS.corruption;
      ctx.beginPath();
      ctx.arc(bx + Math.sin(time * 0.3 + i * 0.7) * 20, by + Math.cos(time * 0.2 + i * 0.5) * 15, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Courier New", monospace';
    // Emboss
    ctx.fillStyle = '#2a1a0a';
    ctx.fillText('LEXICON DEEP', w / 2 + 2, h / 2 - 60 + 2);
    ctx.fillStyle = COLORS.highlight;
    ctx.fillText('LEXICON DEEP', w / 2, h / 2 - 60);

    // Subtitle
    ctx.font = '20px "Courier New", monospace';
    ctx.fillStyle = '#8a7a6a';
    ctx.fillText('Spell to Survive', w / 2, h / 2 - 10);

    // Pulsing start text
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 2.5);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    ctx.fillText('Press Enter to Begin', w / 2, h / 2 + 50);
    ctx.globalAlpha = 1;

    // Bottom flavor text
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('A scholar fights entropy in a crumbling archive...', w / 2, h - 40);
  }

  function drawGameOverScreen(ctx, state) {
    const w = canvas.width;
    const h = canvas.height;
    const isWH = state.gameMode === 'wordhunt';

    ctx.fillStyle = 'rgba(13, 5, 16, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillStyle = '#8a2040';
    ctx.fillText(isWH ? 'TIME IS UP' : 'THE INK CONSUMES', w / 2, h / 2 - 80);

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), w / 2, h / 2 - 20);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0), w / 2, h / 2 + 10);
    ctx.fillText('Longest: ' + (state.longestWord || 'none'), w / 2, h / 2 + 40);

    if (isWH && state.hunt) {
      const hunt = state.hunt;
      const done  = hunt.completedCount || 0;
      const total = (hunt.challenges && hunt.challenges.length) || 3;
      const pw = (hunt.plantedWords || []).filter(function(p) { return p.found; }).length;
      const pwT = (hunt.plantedWords || []).length;
      ctx.fillText('Objectives: ' + done + '/' + total, w / 2, h / 2 + 70);
      ctx.fillText('Hidden words found: ' + pw + '/' + pwT, w / 2, h / 2 + 96);
    } else {
      ctx.fillText('Seeds Destroyed: ' + (state.seedsDestroyed || 0) + '/' + state.totalSeeds, w / 2, h / 2 + 70);
    }

    ctx.globalAlpha = 0.5 + 0.5 * Math.sin((state.time || 0) * 2.5);
    ctx.fillText('Press Enter to Try Again', w / 2, h / 2 + 140);
    ctx.globalAlpha = 1;
  }

  function drawVictoryScreen(ctx, state) {
    const w = canvas.width;
    const h = canvas.height;
    const time = state.time || 0;
    const isWH = state.gameMode === 'wordhunt';

    ctx.fillStyle = 'rgba(20, 16, 8, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.fillStyle = COLORS.highlight;
    if (isWH) {
      ctx.fillText(state.hunt && state.hunt.advanceAvailable ? 'ROUND COMPLETE!' : 'ARCHIVE MASTERED', w / 2, h / 2 - 80);
    } else {
      ctx.fillText('THE ARCHIVE ENDURES', w / 2, h / 2 - 80);
    }

    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), w / 2, h / 2 - 20);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0), w / 2, h / 2 + 10);
    ctx.fillText('Longest: ' + (state.longestWord || 'none'), w / 2, h / 2 + 40);

    if (isWH && state.hunt) {
      const hunt = state.hunt;
      const pw  = (hunt.plantedWords || []).filter(function(p) { return p.found; }).length;
      const pwT = (hunt.plantedWords || []).length;
      ctx.fillText('Hidden words found: ' + pw + '/' + pwT, w / 2, h / 2 + 70);
      ctx.fillText('Best combo: ×' + (hunt.bestCombo || 0), w / 2, h / 2 + 96);
      if (hunt.advanceAvailable) {
        ctx.fillText('Next: Round ' + ((hunt.round || 1) + 1) + '/' + (hunt.maxRounds || 3), w / 2, h / 2 + 122);
      }
    } else {
      ctx.fillText('All ' + state.totalSeeds + ' seals destroyed!', w / 2, h / 2 + 70);
    }

    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 2.5);
    ctx.fillText(
      isWH && state.hunt && state.hunt.advanceAvailable
        ? 'Press Enter for the Next Round'
        : 'Press Enter to Play Again',
      w / 2,
      h / 2 + 140
    );
    ctx.globalAlpha = 1;
  }

  function drawHelpScreen(ctx, state) {
    if (isShellMode()) return;
    const w = canvas.width;
    const h = canvas.height;
    const isWH = state.gameMode === 'wordhunt';
    const helpTab = state.helpTab || 'basics';

    // Dark overlay
    ctx.fillStyle = 'rgba(10, 8, 6, 0.92)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Title
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillStyle = COLORS.highlight;
    ctx.fillText('LEXICON DEEP — Reference', 52, 42);
    drawDebugTabs(ctx, [
      { key: 'basics', label: '1  BASICS' },
      { key: 'scoring', label: '2  SCORING' },
      { key: 'tiles', label: '3  TILES' }
    ], helpTab, 52, 78);

    const panelX = 52;
    const panelY = 124;
    const panelW = w - 104;
    const panelH = h - 186;
    ctx.fillStyle = 'rgba(14, 12, 10, 0.82)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    const col1 = panelX + 24;
    const col2 = panelX + panelW / 2 + 8;
    const lineH = 22;
    let y1 = panelY + 24;
    let y2 = panelY + 24;

    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;

    if (helpTab === 'basics') {
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('CONTROLS', col1, y1);
      y1 += 30;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      [
        'A-Z: type a word',
        'Mouse / touch: click or drag tiles',
        'Bottom bar: clear, undo, submit, clue',
        'Enter: submit',
        'Backspace / Escape: edit or clear',
        'Arrow keys: scroll the board',
        'C: spend a clue in Word Hunt',
        '` : toggle debug overlay',
        '?: open or close help',
      ].forEach(function (line) {
        ctx.fillText(line, col1, y1);
        y1 += lineH;
      });

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('HOW WORD HUNT WORKS', col2, y2);
      y2 += 30;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      (isWH ? [
        'Type any 4+ letter dictionary word.',
        'The game searches the board and picks the',
        'highest-scoring valid path for that word.',
        '',
        'Find hidden planted words for bonus points.',
        'Clear the three current objectives to finish',
        'the round and advance deeper.',
        '',
        'Scrolling resets combo.',
        'Clues briefly pulse tiles from an unfound word.'
      ] : [
        'Type a word and press Enter to cast.',
        'Your word cleanses nearby corruption.',
        'Destroy all seals before corruption overwhelms',
        'the board.'
      ]).forEach(function (line) {
        ctx.fillText(line, col2, y2);
        y2 += line === '' ? 10 : lineH;
      });
    } else if (helpTab === 'scoring') {
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('FORMULA', col1, y1);
      y1 += 32;
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#f0d070';
      ctx.fillText('final = round(base × length × shape × combo × crystal) + ember', col1, y1);
      y1 += 34;

      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      [
        'base: sum of tile letter points',
        'length: 4=1.5x, 5=2x, 6=3x, 7=5x, 8+=8x',
        'shape: straight horizontal/vertical = 2.0x',
        'shape: straight diagonal = 1.5x',
        'shape: bent paths lose value by corners',
        'combo: +0.1x for each chained word before scrolling',
        'crystal: doubles the whole multiplied score',
        'ember: adds +20 flat per ember tile used',
        'discovery: +100 for a planted hidden word',
        'objective rewards: added after the word resolves'
      ].forEach(function (line) {
        ctx.fillText(line, col1, y1);
        y1 += lineH;
      });

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('LETTER POINTS', col2, y2);
      y2 += 30;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      [
        '1: E A I O N R T L S U',
        '2: D G',
        '3: B C M P',
        '4: F H V W Y',
        '5: K',
        '8: J X',
        '10: Q Z'
      ].forEach(function (line) {
        ctx.fillText(line, col2, y2);
        y2 += lineH;
      });
    } else {
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('WORD HUNT SPECIAL TILES', col1, y1);
      y1 += 30;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      [
        'Void (?)  : wildcard, can stand in for any letter.',
        'Crystal x2: include it in your path to double the word.',
        'Ember +20 : include it in your path for +20 points.',
        '',
        'You use special tiles by routing your word through them.',
        'If a path can reach one and still spell the word, the',
        'best-path picker will usually prefer the better score.',
        '',
        'They are optional. The default game starts with them off.'
      ].forEach(function (line) {
        ctx.fillText(line, col1, y1);
        y1 += line === '' ? 10 : lineH;
      });

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#c8a050';
      ctx.fillText('DEBUG MODE', col2, y2);
      y2 += 30;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = COLORS.hud;
      [
        'Press ` to open debug mode.',
        'Tab 1 shows every planted word with orientation',
        'and whether it has been found.',
        'Tab 2 shows full word history with score reasons.',
      ].forEach(function (line) {
        ctx.fillText(line, col2, y2);
        y2 += lineH;
      });
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Press ? or Escape to close · use 1 / 2 / 3 to switch tabs', w / 2, h - 30);
  }

  function screenToGrid(mx, my, state) {
    const vp = state.viewport;
    const ts = vp.tileSize;
    const lx = mx - vp.offsetX;
    const ly = my - vp.offsetY;
    if (lx < 0 || ly < 0) return null;
    const vc = Math.floor(lx / ts);
    const vr = Math.floor(ly / ts);
    if (vc >= vp.cols || vr >= vp.rows) return null;
    return { col: vp.col + vc, row: vp.row + vr };
  }

  function gridToScreen(col, row, state) {
    const vp = state.viewport;
    const ts = vp.tileSize;
    return {
      x: vp.offsetX + (col - vp.col) * ts + ts / 2,
      y: vp.offsetY + (row - vp.row) * ts + ts / 2
    };
  }

  function flashInput(color, duration) {
    inputFlashColor = color;
    inputFlashTimer = duration || 0.2;
  }

  window.LD.Renderer = {
    init: init,
    render: render,
    resize: resize,
    screenToGrid: screenToGrid,
    gridToScreen: gridToScreen,
    setViewportTarget: setViewportTarget,
    updateScroll: updateScroll,
    flashInput: flashInput
  };
})();
