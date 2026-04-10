// LEXICON DEEP — Particle System
// Attaches to window.LD.Particles
(function () {
  'use strict';

  window.LD = window.LD || {};

  // ── Constants ──────────────────────────────────────────────────────────────
  const MAX_PARTICLES = 500;
  const GRAVITY = 300; // px/s²

  // Particle types that use additive blending
  const ADDITIVE_TYPES = new Set(['spark', 'glow', 'burst', 'shockwave']);

  // ── State ───────────────────────────────────────────────────────────────────
  let particles = [];
  let pendingSpawns = []; // { time, fn } — delayed effects queue

  // Screen shake state
  let shakeIntensity = 0;
  let shakeDuration = 0;
  let shakeRemaining = 0;
  let shakeX = 0;
  let shakeY = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function tileCenter(tile, tileSize) {
    // tile can be { x, y } in pixel coords or { col, row } in grid coords
    if (tile.x !== undefined && tile.y !== undefined) {
      return { x: tile.x + tileSize / 2, y: tile.y + tileSize / 2 };
    }
    // grid coords
    return {
      x: tile.col * tileSize + tileSize / 2,
      y: tile.row * tileSize + tileSize / 2,
    };
  }

  // ── Particle factory ─────────────────────────────────────────────────────────

  function createParticle(type, x, y, opts) {
    opts = opts || {};
    const p = {
      type,
      x,
      y,
      vx: opts.vx !== undefined ? opts.vx : 0,
      vy: opts.vy !== undefined ? opts.vy : 0,
      life: 0,
      maxLife: 0,
      color: opts.color || '#ffffff',
      size: opts.size || 4,
      text: opts.text || '',
      radius: 0,
      maxRadius: opts.maxRadius || 200,
      alpha: 1,
    };

    switch (type) {
      case 'spark':
        p.size = opts.size || rand(2, 4);
        p.maxLife = opts.life || rand(0.3, 0.6);
        p.color = opts.color || (Math.random() > 0.5 ? '#ffd700' : '#ffaa22');
        if (opts.vx === undefined) p.vx = rand(-120, 120);
        if (opts.vy === undefined) p.vy = rand(-180, -60);
        break;

      case 'ink':
        p.size = opts.size || rand(4, 8);
        p.maxLife = opts.life || rand(0.5, 1.0);
        p.color = opts.color || '#2a0a30';
        if (opts.vx === undefined) p.vx = rand(-20, 20);
        if (opts.vy === undefined) p.vy = rand(10, 40);
        break;

      case 'glow':
        p.size = opts.size || rand(8, 15);
        p.maxLife = opts.life || rand(0.3, 0.8);
        p.color = opts.color || '#ffffff';
        p.vx = 0;
        p.vy = 0;
        break;

      case 'burst':
        p.size = opts.size || rand(2, 5);
        p.maxLife = opts.life || rand(0.5, 1.0);
        p.color = opts.color || '#ffd700';
        // vx/vy expected to be set by caller (radial)
        break;

      case 'text':
        p.size = opts.size || 16;
        p.maxLife = opts.life || rand(1.0, 2.0);
        p.color = opts.color || '#ffffff';
        p.text = opts.text || '';
        p.vx = opts.vx !== undefined ? opts.vx : rand(-10, 10);
        p.vy = opts.vy !== undefined ? opts.vy : 0;
        break;

      case 'dust':
        p.size = opts.size || rand(1, 2);
        p.maxLife = opts.life || rand(3.0, 5.0);
        p.color = opts.color || '#c8a87a';
        p.vx = opts.vx !== undefined ? opts.vx : rand(-8, 8);
        p.vy = opts.vy !== undefined ? opts.vy : rand(-4, 4);
        break;

      case 'shockwave':
        p.size = opts.size || 2; // stroke width
        p.maxLife = opts.life || rand(0.5, 1.0);
        p.color = opts.color || '#ffffff';
        p.radius = 0;
        p.maxRadius = opts.maxRadius || 200;
        p.vx = 0;
        p.vy = 0;
        break;

      case 'cascade':
        // Cascade treated like spark internally
        p.type = 'spark';
        p.size = opts.size || rand(2, 4);
        p.maxLife = opts.life || rand(0.3, 0.6);
        p.color = opts.color || '#ffd700';
        if (opts.vx === undefined) p.vx = rand(-80, 80);
        if (opts.vy === undefined) p.vy = rand(-140, -40);
        break;

      default:
        p.maxLife = opts.life || 1.0;
        break;
    }

    p.life = p.maxLife;
    p.alpha = 1;
    return p;
  }

  // ── Capacity check ───────────────────────────────────────────────────────────

  function canSpawn(type) {
    if (particles.length < MAX_PARTICLES) return true;
    // Over cap: drop dust first, then ink
    if (type === 'dust') return false;
    if (type === 'ink') return false;
    // Try to evict a dust particle
    const dustIdx = particles.findIndex(p => p.type === 'dust');
    if (dustIdx !== -1) {
      particles.splice(dustIdx, 1);
      return true;
    }
    // Try to evict an ink particle
    const inkIdx = particles.findIndex(p => p.type === 'ink');
    if (inkIdx !== -1) {
      particles.splice(inkIdx, 1);
      return true;
    }
    return false;
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  const Particles = {
    // ── Core spawn ─────────────────────────────────────────────────────────────
    spawn(type, x, y, opts) {
      if (!canSpawn(type)) return null;
      const p = createParticle(type, x, y, opts);
      particles.push(p);
      return p;
    },

    // ── Radial burst shorthand ──────────────────────────────────────────────────
    burst(x, y, color, count) {
      count = count || 12;
      for (let i = 0; i < count; i++) {
        if (!canSpawn('burst')) break;
        const angle = (i / count) * Math.PI * 2 + rand(0, 0.3);
        const speed = rand(80, 220);
        const p = createParticle('burst', x, y, {
          color: color || '#ffd700',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
        particles.push(p);
      }
    },

    // ── Floating text popup ─────────────────────────────────────────────────────
    text(x, y, str, color, size) {
      return this.spawn('text', x, y, {
        text: str,
        color: color || '#ffffff',
        size: size || 16,
      });
    },

    // ── Screen shake ────────────────────────────────────────────────────────────
    shake(intensity, duration) {
      shakeIntensity = intensity;
      shakeDuration = duration / 1000; // convert ms → seconds
      shakeRemaining = shakeDuration;
    },

    getShakeOffset() {
      return { x: shakeX, y: shakeY };
    },

    // ── Cascade chain ────────────────────────────────────────────────────────────
    cascade(startX, startY, tiles, color, delayPerTile) {
      delayPerTile = delayPerTile !== undefined ? delayPerTile : 50;
      const now = performance.now();

      // First burst at origin
      const schedule = (fn, ms) => {
        pendingSpawns.push({ time: now + ms, fn });
      };

      schedule(() => {
        for (let s = 0; s < 6; s++) {
          if (!canSpawn('spark')) break;
          const angle = rand(0, Math.PI * 2);
          const speed = rand(60, 160);
          const p = createParticle('spark', startX, startY, {
            color: color || '#ffd700',
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          });
          particles.push(p);
        }
      }, 0);

      if (tiles) {
        tiles.forEach((tile, idx) => {
          const tx = tile.x !== undefined ? tile.x : tile.col * 64;
          const ty = tile.y !== undefined ? tile.y : tile.row * 64;
          schedule(() => {
            for (let s = 0; s < 5; s++) {
              if (!canSpawn('spark')) break;
              const angle = rand(0, Math.PI * 2);
              const speed = rand(50, 130);
              const p = createParticle('spark', tx, ty, {
                color: color || '#ffd700',
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
              });
              particles.push(p);
            }
          }, (idx + 1) * delayPerTile);
        });
      }
    },

    // ── Word activation ──────────────────────────────────────────────────────────
    wordActivation(pathTiles, tileSize) {
      const now = performance.now();
      pathTiles.forEach((tile, idx) => {
        const center = tileCenter(tile, tileSize);
        pendingSpawns.push({
          time: now + idx * 80,
          fn: () => {
            const count = randInt(8, 12);
            for (let i = 0; i < count; i++) {
              if (!canSpawn('spark')) break;
              const angle = rand(0, Math.PI * 2);
              const speed = rand(60, 180);
              const p = createParticle('spark', center.x, center.y, {
                color: Math.random() > 0.5 ? '#ffd700' : '#ffcc44',
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
              });
              particles.push(p);
            }
          },
        });
      });
    },

    // ── Cleanse tiles ─────────────────────────────────────────────────────────────
    cleanseTiles(tiles, tileSize) {
      const now = performance.now();
      tiles.forEach((tile, idx) => {
        const center = tileCenter(tile, tileSize);
        pendingSpawns.push({
          time: now + idx * 30,
          fn: () => {
            // Purple ink rising up
            const inkCount = randInt(5, 8);
            for (let i = 0; i < inkCount; i++) {
              if (!canSpawn('ink')) break;
              const p = createParticle('ink', center.x + rand(-tileSize / 3, tileSize / 3), center.y, {
                color: '#4a1060',
                vx: rand(-15, 15),
                vy: rand(-60, -20),
                life: rand(0.4, 0.8),
              });
              particles.push(p);
            }
            // Golden dust falling in
            const dustCount = randInt(5, 8);
            for (let i = 0; i < dustCount; i++) {
              if (!canSpawn('spark')) break;
              const p = createParticle('spark', center.x + rand(-tileSize / 3, tileSize / 3), center.y - rand(10, 30), {
                color: '#ffd700',
                vx: rand(-20, 20),
                vy: rand(30, 80),
                life: rand(0.4, 0.7),
                size: rand(1.5, 3),
              });
              particles.push(p);
            }
          },
        });
      });
    },

    // ── Seal destroyed ────────────────────────────────────────────────────────────
    sealDestroyed(x, y, cleansedTiles, tileSize) {
      const now = performance.now();

      // 1. Big shockwave
      if (canSpawn('shockwave')) {
        const sw = createParticle('shockwave', x, y, {
          color: '#9933cc',
          maxRadius: 200,
          life: 0.8,
          size: 3,
        });
        particles.push(sw);
      }

      // 2. Screen shake
      this.shake(8, 500);

      // 3. Burst particles
      const burstCount = randInt(40, 60);
      const colors = ['#ffd700', '#ffaa22', '#ffdd66', '#ff9900'];
      for (let i = 0; i < burstCount; i++) {
        if (!canSpawn('burst')) break;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(60, 280);
        const p = createParticle('burst', x, y, {
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(2, 6),
          life: rand(0.5, 1.0),
        });
        particles.push(p);
      }

      // 4. Cascade through cleansedTiles
      if (cleansedTiles && cleansedTiles.length > 0) {
        cleansedTiles.forEach((tile, idx) => {
          const center = tileCenter(tile, tileSize);
          pendingSpawns.push({
            time: now + idx * 50,
            fn: () => {
              for (let s = 0; s < 6; s++) {
                if (!canSpawn('spark')) break;
                const angle = rand(0, Math.PI * 2);
                const speed = rand(50, 140);
                const p = createParticle('spark', center.x, center.y, {
                  color: '#ffd700',
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                });
                particles.push(p);
              }
            },
          });
        });
      }
    },

    // ── Bomb effect ───────────────────────────────────────────────────────────────
    bombEffect(x, y) {
      // 1. White flash glow
      if (canSpawn('glow')) {
        const flash = createParticle('glow', x, y, {
          color: '#ffffff',
          size: 120,
          life: 0.2,
          alpha: 0.8,
        });
        // Override alpha manually so it doesn't fully fade — starts bright
        flash.alpha = 0.8;
        particles.push(flash);
      }

      // 2. Huge multi-color burst
      const bombColors = ['#ff2200', '#ff6600', '#ffcc00', '#ffffff', '#ff4400'];
      const burstCount = randInt(60, 80);
      for (let i = 0; i < burstCount; i++) {
        if (!canSpawn('burst')) break;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(80, 350);
        const p = createParticle('burst', x, y, {
          color: bombColors[Math.floor(Math.random() * bombColors.length)],
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(2, 7),
          life: rand(0.6, 1.2),
        });
        particles.push(p);
      }

      // 3. Shockwave
      if (canSpawn('shockwave')) {
        const sw = createParticle('shockwave', x, y, {
          color: '#ff6600',
          maxRadius: 300,
          life: 0.7,
          size: 4,
        });
        particles.push(sw);
      }

      // 4. Screen shake
      this.shake(12, 400);
    },

    // ── Corruption spread ──────────────────────────────────────────────────────────
    corruptionSpread(tiles, tileSize) {
      const now = performance.now();
      tiles.forEach((tile, idx) => {
        const center = tileCenter(tile, tileSize);
        pendingSpawns.push({
          time: now + idx * 30,
          fn: () => {
            const count = randInt(3, 5);
            // Pick a random adjacent direction to seep from
            const dirs = [
              { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
              { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            ];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const originX = center.x + dir.dx * (tileSize * 0.5);
            const originY = center.y + dir.dy * (tileSize * 0.5);

            for (let i = 0; i < count; i++) {
              if (!canSpawn('ink')) break;
              const p = createParticle('ink', originX + rand(-6, 6), originY + rand(-6, 6), {
                color: '#2a0a30',
                vx: rand(-25, 25),
                vy: rand(15, 50),
                size: rand(4, 8),
                life: rand(0.5, 1.0),
              });
              particles.push(p);
            }
          },
        });
      });
    },

    // ── Update ─────────────────────────────────────────────────────────────────────
    update(dt) {
      const now = performance.now();

      // Process pending delayed spawns
      let i = 0;
      while (i < pendingSpawns.length) {
        if (pendingSpawns[i].time <= now) {
          pendingSpawns[i].fn();
          pendingSpawns.splice(i, 1);
        } else {
          i++;
        }
      }

      // Update screen shake
      if (shakeRemaining > 0) {
        shakeRemaining -= dt;
        if (shakeRemaining <= 0) {
          shakeRemaining = 0;
          shakeX = 0;
          shakeY = 0;
        } else {
          const decay = shakeRemaining / shakeDuration;
          shakeX = rand(-shakeIntensity, shakeIntensity) * decay;
          shakeY = rand(-shakeIntensity, shakeIntensity) * decay;
        }
      }

      // Update particles
      const live = [];
      for (let j = 0; j < particles.length; j++) {
        const p = particles[j];

        // Movement
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Gravity for spark and burst
        if (p.type === 'spark' || p.type === 'burst') {
          p.vy += GRAVITY * dt;
        }

        // Text floats upward
        if (p.type === 'text') {
          p.y -= 30 * dt;
        }

        // Shockwave expansion
        if (p.type === 'shockwave') {
          p.radius = p.maxRadius * (1 - p.life / p.maxLife);
        }

        // Decay life
        p.life -= dt;

        // Fade alpha
        p.alpha = Math.max(0, p.life / p.maxLife);

        if (p.life > 0) {
          live.push(p);
        }
      }
      particles = live;
    },

    // ── Render ──────────────────────────────────────────────────────────────────────
    render(ctx) {
      if (particles.length === 0) return;

      // Separate into additive and normal blending groups
      const additive = [];
      const normal = [];
      for (let i = 0; i < particles.length; i++) {
        if (ADDITIVE_TYPES.has(particles[i].type)) {
          additive.push(particles[i]);
        } else {
          normal.push(particles[i]);
        }
      }

      // Draw normal blend first (ink, dust, text)
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < normal.length; i++) {
        _drawParticle(ctx, normal[i]);
      }

      // Draw additive blend (spark, glow, burst, shockwave)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < additive.length; i++) {
        _drawParticle(ctx, additive[i]);
      }

      // Always reset blending mode
      ctx.globalCompositeOperation = 'source-over';
    },

    // ── Accessors (for debugging/diagnostics) ──────────────────────────────────────
    getCount() {
      return particles.length;
    },

    clear() {
      particles = [];
      pendingSpawns = [];
      shakeX = 0;
      shakeY = 0;
      shakeRemaining = 0;
    },
  };

  // ── Internal draw function ───────────────────────────────────────────────────────

  function _drawParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

    if (p.type === 'text') {
      ctx.fillStyle = p.color;
      ctx.font = `bold ${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.type === 'shockwave') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0, p.radius), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'glow') {
      // Radial gradient for soft glow
      const r = p.size;
      try {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      } catch (e) {
        // Fallback plain circle if gradient fails (e.g., r=0)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Default: filled circle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size / 2), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Attach to namespace ──────────────────────────────────────────────────────────
  window.LD.Particles = Particles;
})();
