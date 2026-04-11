(function() {
  window.LD = window.LD || {};

  let ctx = null;
  let noiseBuffer = null;
  let initialized = false;

  // Whole-tone scale frequencies for letter ticks
  const TICK_FREQS = [260, 292, 328, 368, 413, 463, 520];

  function init() {
    if (initialized) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Create reusable noise buffer (1 second)
      const sampleRate = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, sampleRate, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < sampleRate; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      initialized = true;
    } catch(e) {
      console.warn('Web Audio not available:', e);
    }
  }

  function ensureCtx() {
    if (!initialized || !ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function playSine(freq, gain, duration, delay, type) {
    if (!ensureCtx()) return;
    delay = delay || 0;
    type = type || 'sine';
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function playNoise(duration, gain, filterType, filterFreq, delay) {
    if (!ensureCtx()) return;
    delay = delay || 0;
    const now = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);

    if (filterType && filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(1, now);
      src.connect(filter);
      filter.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(ctx.destination);
    src.start(now);
    src.stop(now + duration + 0.01);
  }

  function playLetterTick(letterIndex) {
    if (!ensureCtx()) return;
    const freq = TICK_FREQS[letterIndex % TICK_FREQS.length];
    const now = ctx.currentTime;

    // Main tone
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.3, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // Shimmer overtone
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.frequency.setValueAtTime(freq * 2, now);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.05, now + 0.005);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.08);
  }

  const sounds = {
    word_valid: function(vol) {
      vol = vol || 1;
      playSine(523, 0.2 * vol, 0.3);
      playSine(659, 0.2 * vol, 0.3);
      playSine(784, 0.2 * vol, 0.3);
    },
    word_invalid: function(vol) {
      vol = vol || 1;
      playSine(80, 0.3 * vol, 0.1);
      playNoise(0.05, 0.1 * vol);
    },
    cleanse: function(vol) {
      vol = vol || 1;
      if (!ensureCtx()) return;
      const now = ctx.currentTime;
      // Shimmer with vibrato
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const g = ctx.createGain();
      lfo.frequency.setValueAtTime(8, now);
      lfoGain.gain.setValueAtTime(30, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.frequency.setValueAtTime(1200, now);
      g.gain.setValueAtTime(0.15 * vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.22);
      lfo.stop(now + 0.22);
      // Second tone
      playSine(1800, 0.08 * vol, 0.15);
    },
    corrupt_spread: function(vol) {
      vol = vol || 1;
      playSine(40, 0.08 * vol, 0.5);
    },
    seal_destroy: function(vol) {
      vol = vol || 1;
      // Thunder crack
      playNoise(0.1, 0.4 * vol, 'bandpass', 200);
      // Ascending chimes
      playSine(440, 0.2 * vol, 0.12, 0.12);
      playSine(554, 0.2 * vol, 0.12, 0.24);
      playSine(659, 0.2 * vol, 0.12, 0.36);
      playSine(880, 0.2 * vol, 0.12, 0.48);
    },
    bomb: function(vol) {
      vol = vol || 1;
      playSine(50, 0.4 * vol, 0.1);
      playNoise(0.2, 0.3 * vol, 'bandpass', 1000, 0.05);
      playSine(2000, 0.15 * vol, 0.3, 0.15);
    },
    scroll: function(vol) {
      vol = vol || 1;
      playNoise(0.01, 0.03 * vol, 'highpass', 2000);
    },
    game_over: function(vol) {
      vol = vol || 1;
      playSine(262, 0.15 * vol, 2.0);
      playSine(264, 0.12 * vol, 2.0); // slight detune
      playSine(311, 0.15 * vol, 2.0);
      playSine(313, 0.12 * vol, 2.0);
      playSine(392, 0.15 * vol, 2.0);
    },
    victory: function(vol) {
      vol = vol || 1;
      // Ascending arpeggio
      playSine(523, 0.2 * vol, 0.2, 0);
      playSine(659, 0.2 * vol, 0.2, 0.15);
      playSine(784, 0.2 * vol, 0.2, 0.3);
      playSine(1047, 0.2 * vol, 0.2, 0.45);
      // Sustained chord
      playSine(523, 0.15 * vol, 1.5, 0.6);
      playSine(659, 0.15 * vol, 1.5, 0.6);
      playSine(784, 0.15 * vol, 1.5, 0.6);
      playSine(1047, 0.15 * vol, 1.5, 0.6);
    }
  };

  function play(name, opts) {
    if (!ensureCtx()) return;
    opts = opts || {};
    const fn = sounds[name];
    if (fn) fn(opts.volume || 1);
  }

  window.LD.Audio = {
    init: init,
    play: play,
    playLetterTick: playLetterTick
  };
})();
