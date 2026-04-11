(function() {
  window.LD = window.LD || {};

  let canvas = null;
  let scrollX = 0, scrollY = 0;
  let targetScrollX = 0, targetScrollY = 0;
  let inputFlashTimer = 0;
  let inputFlashColor = null;

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

  function init(cvs, state) {
    canvas = cvs;
    resize(canvas, state);
  }

  function resize(cvs, state) {
    canvas = cvs;
    const vp = state.viewport;
    const hudH = 60;
    const inputH = 50;
    const minimapW = 130;
    const availW = canvas.width - 20 - minimapW;
    const availH = canvas.height - hudH - inputH - 10;
    const tileW = Math.floor(availW / vp.cols);
    const tileH = Math.floor(availH / vp.rows);
    vp.tileSize = Math.min(tileW, tileH);
    vp.offsetX = 10;
    vp.offsetY = hudH;
    targetScrollX = vp.col * vp.tileSize;
    targetScrollY = vp.row * vp.tileSize;
    scrollX = targetScrollX;
    scrollY = targetScrollY;
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

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.phase === 'title') {
      drawTitleScreen(ctx, state);
      return;
    }
    if (state.phase === 'gameover') {
      drawBoard(ctx, state);
      drawMinimap(ctx, state);
      drawHUD(ctx, state);
      drawGameOverScreen(ctx, state);
      return;
    }
    if (state.phase === 'victory') {
      drawBoard(ctx, state);
      drawMinimap(ctx, state);
      drawHUD(ctx, state);
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

    drawMinimap(ctx, state);
    drawHUD(ctx, state);
    drawInputBar(ctx, state);
  }

  function drawBoard(ctx, state) {
    const vp = state.viewport;
    const ts = vp.tileSize;
    const board = state.board;
    const pathSet = new Set();
    if (state.input.path) {
      state.input.path.forEach(function(p, i) {
        pathSet.set ? pathSet.add(p.col + ',' + p.row) : pathSet.add(p.col + ',' + p.row);
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
        const inPath = pathSet.has(gc + ',' + gr);
        const pathIdx = inPath ? getPathIndex(state.input.path, gc, gr) : -1;

        drawTile(ctx, tile, x, y, ts, inPath, pathIdx, state);
      }
    }
  }

  function getPathIndex(path, col, row) {
    for (let i = 0; i < path.length; i++) {
      if (path[i].col === col && path[i].row === row) return i;
    }
    return -1;
  }

  function drawTile(ctx, tile, x, y, ts, inPath, pathIdx, state) {
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
      // Highlighted tile
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
        drawLetter(ctx, tile.letter, x, y, ts, '#ffffff', '#c8a050');
      } else if (tile.icon) {
        drawIcon(ctx, tile.icon, x, y, ts, true);
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

    // Clean letter tile
    ctx.fillStyle = COLORS.tileFill;
    ctx.fillRect(x + pad, y + pad, inner, inner);
    ctx.strokeStyle = COLORS.tileBorder;
    ctx.strokeRect(x + pad, y + pad, inner, inner);

    // Tile tint (for effects)
    if (tile.tint) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = tile.tint;
      ctx.fillRect(x + pad, y + pad, inner, inner);
      ctx.globalAlpha = 1;
    }

    if (tile.letter) {
      drawLetter(ctx, tile.letter, x, y, ts, COLORS.tileText, COLORS.tileTextEmboss);
    }
  }

  function drawLetter(ctx, letter, x, y, ts, color, embossColor) {
    const fontSize = Math.max(12, Math.floor(ts * 0.55));
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
        if (tile.corrupted) {
          ctx.fillStyle = '#3a0a50';
          ctx.fillRect(px, py, dotSize, dotSize);
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
    if (state.settings && state.settings.hardMode) {
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
        ctx.fillText('[Enter to cast]', lx + 80, barY + 22);
      } else if (valid && !hasPath) {
        ctx.fillStyle = '#c0c040';
        ctx.fillText('? no path', lx, barY + 22);
      } else if (typed.length >= 3) {
        ctx.fillStyle = '#c04040';
        ctx.fillText('✗ invalid', lx, barY + 22);
      }
    }

    // Hint text
    ctx.fillStyle = '#555';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Type a word, press Enter to cast. Arrow keys to scroll. H for hard mode.', 20, barY + 42);
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

    // Dark overlay
    ctx.fillStyle = 'rgba(13, 5, 16, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.font = 'bold 48px "Courier New", monospace';
    ctx.fillStyle = '#8a2040';
    ctx.fillText('THE INK CONSUMES', w / 2, h / 2 - 80);

    // Stats
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), w / 2, h / 2 - 20);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0) + '   Turns: ' + (state.turns || 0), w / 2, h / 2 + 10);
    ctx.fillText('Longest: ' + (state.longestWord || 'none'), w / 2, h / 2 + 40);
    ctx.fillText('Seeds Destroyed: ' + (state.seedsDestroyed || 0) + '/' + state.totalSeeds, w / 2, h / 2 + 70);

    // Restart
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin((state.time || 0) * 2.5);
    ctx.fillText('Press Enter to Try Again', w / 2, h / 2 + 120);
    ctx.globalAlpha = 1;
  }

  function drawVictoryScreen(ctx, state) {
    const w = canvas.width;
    const h = canvas.height;
    const time = state.time || 0;

    // Golden overlay
    ctx.fillStyle = 'rgba(20, 16, 8, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.font = 'bold 44px "Courier New", monospace';
    ctx.fillStyle = COLORS.highlight;
    ctx.fillText('THE ARCHIVE ENDURES', w / 2, h / 2 - 80);

    // Stats
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = COLORS.hud;
    ctx.fillText('Score: ' + (state.score || 0).toLocaleString(), w / 2, h / 2 - 20);
    ctx.fillText('Words: ' + (state.wordsSpelled || 0) + '   Turns: ' + (state.turns || 0), w / 2, h / 2 + 10);
    ctx.fillText('Longest: ' + (state.longestWord || 'none'), w / 2, h / 2 + 40);
    ctx.fillText('All ' + state.totalSeeds + ' seals destroyed!', w / 2, h / 2 + 70);

    // Restart
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 2.5);
    ctx.fillText('Press Enter to Play Again', w / 2, h / 2 + 120);
    ctx.globalAlpha = 1;
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
