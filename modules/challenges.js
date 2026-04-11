(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Round 1 challenge definitions
  // ---------------------------------------------------------------------------

  var ROUND_1_CHALLENGES = [
    {
      id: 'first_word',
      type: 'basic',
      title: 'First Steps',
      description: 'Submit any valid word',
      icon: '★',
      reward: 50,
      target: 1,
    },
    {
      id: 'long_word',
      type: 'length',
      title: 'Linguist',
      description: 'Find a 6+ letter word',
      icon: '▶',
      reward: 100,
      target: 1,
    },
    {
      id: 'straight_h',
      type: 'path',
      title: "Ruler's Path",
      description: 'Submit a word in a perfect horizontal line',
      icon: '─',
      reward: 100,
      target: 1,
    },
    {
      id: 'high_score',
      type: 'score',
      title: 'High Roller',
      description: 'Score 50+ points in a single word',
      icon: '◆',
      reward: 150,
      target: 1,
    },
    {
      id: 'discovery',
      type: 'hunt',
      title: 'Discovery',
      description: 'Find a hidden planted word',
      icon: '◎',
      reward: 200,
      target: 1,
    },
    {
      id: 'combo_3',
      type: 'combo',
      title: 'Chain Caster',
      description: 'Reach a 3-word combo',
      icon: '⚡',
      reward: 100,
      target: 1,
    },
    {
      id: 'cross',
      type: 'cross',
      title: 'Crossroads',
      description: 'Spell two words that share a tile',
      icon: '✚',
      reward: 100,
      target: 1,
    },
    {
      id: 'rare_letter',
      type: 'rare',
      title: 'Rare Find',
      description: 'Use Q, Z, X, or J in a word',
      icon: '♦',
      reward: 100,
      target: 1,
    },
    {
      id: 'five_words',
      type: 'count',
      title: 'Prolific',
      description: 'Submit 5 valid words',
      icon: '⬡',
      reward: 100,
      target: 5,
    },
    {
      id: 'straight_long',
      type: 'path',
      title: 'Laser Focus',
      description: '5+ letter word in a straight line',
      icon: '◥',
      reward: 150,
      target: 1,
    },
  ];

  // ---------------------------------------------------------------------------
  // Check functions (per challenge ID)
  // ---------------------------------------------------------------------------

  var CHECKS = {
    first_word: function (state, wordData) {
      return true; // any valid word
    },
    long_word: function (state, wordData) {
      return wordData.word.length >= 6;
    },
    straight_h: function (state, wordData) {
      return wordData.isStraight && wordData.isHorizontal;
    },
    high_score: function (state, wordData) {
      return wordData.score >= 50;
    },
    discovery: function (state, wordData) {
      return wordData.isPlantedWord === true;
    },
    combo_3: function (state, wordData) {
      return (state.hunt && state.hunt.combo >= 3);
    },
    cross: function (state, wordData) {
      // Check if any tile in this path was already in usedTileKeys
      if (!state.hunt || !state.hunt.usedTileKeys) return false;
      var path = wordData.tilesUsed || wordData.path;
      for (var i = 0; i < path.length; i++) {
        var key = path[i].col + ',' + path[i].row;
        if (state.hunt.usedTileKeys.has(key)) return true;
      }
      return false;
    },
    rare_letter: function (state, wordData) {
      return /[QZXJ]/.test(wordData.word.toUpperCase());
    },
    five_words: function (state, wordData) {
      return (state.wordsSpelled || 0) >= 5;
    },
    straight_long: function (state, wordData) {
      return wordData.isStraight && wordData.word.length >= 5;
    },
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function generate(round) {
    // Only Round 1 defined for now
    return ROUND_1_CHALLENGES.map(function (def) {
      return {
        id:          def.id,
        type:        def.type,
        title:       def.title,
        description: def.description,
        icon:        def.icon,
        reward:      def.reward,
        target:      def.target,
        completed:   false,
        progress:    0,
      };
    });
  }

  /**
   * checkAll(state, wordData) — called after every word in Word Hunt.
   * Returns array of challenge IDs that JUST completed this turn.
   */
  function checkAll(state, wordData) {
    var hunt = state.hunt;
    if (!hunt || !hunt.challenges) return [];

    var newlyCompleted = [];

    for (var i = 0; i < hunt.challenges.length; i++) {
      var c = hunt.challenges[i];
      if (c.completed) continue;

      var checkFn = CHECKS[c.id];
      if (!checkFn) continue;

      if (c.target > 1) {
        // Progress-based challenge
        if (checkFn(state, wordData)) {
          c.progress = Math.min(c.target, (c.progress || 0) + 1);
          if (c.progress >= c.target) {
            c.completed = true;
            newlyCompleted.push(c.id);
          }
        }
      } else {
        // Single-shot challenge
        if (checkFn(state, wordData)) {
          c.completed = true;
          c.progress  = 1;
          newlyCompleted.push(c.id);
        }
      }
    }

    return newlyCompleted;
  }

  // ---------------------------------------------------------------------------
  // Sidebar rendering
  // ---------------------------------------------------------------------------

  function renderSidebar(ctx, state, mouseX, mouseY) {
    var hunt = state.hunt || {};
    var challenges = hunt.challenges || [];
    if (challenges.length === 0) return;

    var vp = state.viewport || {};
    var canvasH = ctx.canvas ? ctx.canvas.height : 720;
    var canvasW = ctx.canvas ? ctx.canvas.width  : 1280;

    var sideW = 160;
    var sideX = canvasW - sideW - 4;
    var sideY = 66;
    var rowH  = 22;
    var headerH = 28;
    var totalH  = headerH + challenges.length * rowH + 12;

    // Panel background
    ctx.fillStyle = 'rgba(12, 10, 8, 0.88)';
    ctx.fillRect(sideX, sideY, sideW, totalH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.strokeRect(sideX, sideY, sideW, totalH);

    // Header
    var done = hunt.completedCount || 0;
    var total = challenges.length;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#c8a050';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('CHALLENGES  ' + done + '/' + total, sideX + 8, sideY + headerH / 2);

    // Challenge rows
    var hoveredChallenge = null;
    for (var i = 0; i < challenges.length; i++) {
      var c   = challenges[i];
      var cy  = sideY + headerH + i * rowH;
      var cMid = cy + rowH / 2;

      // Hover detection
      var isHov = mouseX >= sideX && mouseX <= sideX + sideW &&
                  mouseY >= cy     && mouseY <= cy + rowH;
      if (isHov) hoveredChallenge = c;

      if (isHov) {
        ctx.fillStyle = 'rgba(200,160,80,0.12)';
        ctx.fillRect(sideX, cy, sideW, rowH);
      }

      // Bullet: ✓ or ○
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = c.completed ? '#c8a050' : '#5a4a30';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.completed ? '✓' : '○', sideX + 6, cMid);

      // Icon
      ctx.fillStyle = c.completed ? '#c8a050' : '#5a4a30';
      ctx.fillText(c.icon, sideX + 20, cMid);

      // Title
      ctx.fillStyle = c.completed ? '#d4c4a0' : '#8a7a60';
      ctx.fillText(c.title, sideX + 34, cMid);

      // Progress for multi-step challenges
      if (c.target > 1 && !c.completed) {
        ctx.fillStyle = '#6a5a40';
        ctx.textAlign = 'right';
        ctx.fillText((c.progress || 0) + '/' + c.target, sideX + sideW - 6, cMid);
        ctx.textAlign = 'left';
      }
    }

    // Tooltip for hovered challenge
    if (hoveredChallenge) {
      drawTooltip(ctx, hoveredChallenge, mouseX, mouseY, canvasW, canvasH);
    }

    // Footer hint
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = '#4a3a20';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('hover for details', sideX + sideW / 2, sideY + totalH - 7);
  }

  function drawTooltip(ctx, c, mouseX, mouseY, canvasW, canvasH) {
    var ttW = 200;
    var ttH = 52;
    var ttX = mouseX - ttW - 8;
    var ttY = mouseY - 8;
    if (ttX < 4) ttX = mouseX + 8;
    if (ttY + ttH > canvasH - 4) ttY = canvasH - ttH - 4;

    ctx.fillStyle = 'rgba(20, 16, 12, 0.95)';
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(ttX, ttY, ttW, ttH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c8a050';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(c.title, ttX + 8, ttY + 8);

    ctx.fillStyle = '#a09080';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText(c.description, ttX + 8, ttY + 24);

    ctx.fillStyle = '#c8a050';
    ctx.fillText('+' + c.reward + ' pts', ttX + 8, ttY + 38);
  }

  // ---------------------------------------------------------------------------
  // Expose
  // ---------------------------------------------------------------------------

  window.LD.Challenges = {
    generate:       generate,
    checkAll:       checkAll,
    renderSidebar:  renderSidebar,
  };

})();
