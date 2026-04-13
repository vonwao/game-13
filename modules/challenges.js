(function () {
  'use strict';

  window.LD = window.LD || {};

  var ROUND_TEMPLATES = {
    1: [
      {
        id: 'discover_two',
        type: 'discover',
        title: 'Find 2 Hidden Words',
        description: 'Discover two planted words on the board.',
        target: 2,
        reward: 120,
      },
      {
        id: 'round_score',
        type: 'round_score',
        title: 'Build Momentum',
        description: 'Score 160 points this round.',
        target: 160,
        reward: 90,
      },
      {
        id: 'long_word',
        type: 'long_word',
        title: 'Stretch Out',
        description: 'Submit one 6+ letter word.',
        target: 1,
        reward: 80,
      }
    ],
    2: [
      {
        id: 'discover_three',
        type: 'discover',
        title: 'Treasure Hunter',
        description: 'Discover three planted words this round.',
        target: 3,
        reward: 140,
      },
      {
        id: 'straight_two',
        type: 'straight_words',
        title: 'Line Drive',
        description: 'Play two straight-line words.',
        target: 2,
        reward: 100,
      },
      {
        id: 'combo_three',
        type: 'combo',
        title: 'Chain Cast',
        description: 'Reach a 3-word combo.',
        target: 3,
        reward: 100,
      }
    ],
    3: [
      {
        id: 'discover_four',
        type: 'discover',
        title: 'Deep Archive',
        description: 'Discover four planted words this round.',
        target: 4,
        reward: 160,
      },
      {
        id: 'big_hit',
        type: 'high_word',
        title: 'Big Hit',
        description: 'Score 90+ points on a single word.',
        target: 90,
        reward: 120,
      },
      {
        id: 'long_two',
        type: 'long_word_count',
        title: 'Scholar\'s Run',
        description: 'Submit two 7+ letter words.',
        target: 2,
        reward: 140,
      }
    ]
  };

  function cloneObjective(def) {
    return {
      id:          def.id,
      type:        def.type,
      title:       def.title,
      description: def.description,
      target:      def.target,
      reward:      def.reward,
      completed:   false,
      progress:    0,
    };
  }

  function getTemplate(round) {
    return ROUND_TEMPLATES[round] || ROUND_TEMPLATES[3];
  }

  function generate(round, config) {
    var defs = getTemplate(round || 1);
    var out = [];
    var diff = config && config.clueCount === 1 ? 'hard' : (config && config.clueCount === 3 ? 'easy' : 'medium');

    for (var i = 0; i < defs.length; i++) {
      var def = cloneObjective(defs[i]);

      // Light difficulty tuning without changing the shape of the round.
      if (diff === 'easy') {
        if (def.type === 'round_score') def.target = Math.max(120, def.target - 30);
        if (def.type === 'high_word')   def.target = Math.max(70, def.target - 15);
      } else if (diff === 'hard') {
        if (def.type === 'round_score') def.target += 30;
        if (def.type === 'high_word')   def.target += 15;
      }

      out.push(def);
    }

    return out;
  }

  function completeObjective(objective, newlyCompleted) {
    if (!objective.completed) {
      objective.completed = true;
      newlyCompleted.push(objective.id);
    }
  }

  function updateProgress(objective, state, wordData, newlyCompleted) {
    var hunt = state.hunt || {};

    switch (objective.type) {
      case 'discover':
        objective.progress = (hunt.discoveredWords || []).length;
        break;
      case 'round_score':
        objective.progress = hunt.roundScore || 0;
        break;
      case 'long_word':
        if (wordData.word.length >= 6) {
          objective.progress = 1;
        }
        break;
      case 'straight_words':
        if (wordData.isStraight) {
          objective.progress = Math.min(objective.target, (objective.progress || 0) + 1);
        }
        break;
      case 'combo':
        objective.progress = Math.max(objective.progress || 0, hunt.combo || 0);
        break;
      case 'high_word':
        objective.progress = Math.max(objective.progress || 0, wordData.score || 0);
        break;
      case 'long_word_count':
        if (wordData.word.length >= 7) {
          objective.progress = Math.min(objective.target, (objective.progress || 0) + 1);
        }
        break;
      default:
        break;
    }

    if ((objective.progress || 0) >= objective.target) {
      objective.progress = objective.target;
      completeObjective(objective, newlyCompleted);
    }
  }

  function checkAll(state, wordData) {
    var hunt = state.hunt || {};
    var objectives = hunt.challenges || [];
    var newlyCompleted = [];

    for (var i = 0; i < objectives.length; i++) {
      if (objectives[i].completed) continue;
      updateProgress(objectives[i], state, wordData, newlyCompleted);
    }

    return newlyCompleted;
  }

  function progressText(objective) {
    if (objective.type === 'round_score' || objective.type === 'high_word') {
      return String(objective.progress || 0) + '/' + objective.target + ' pts';
    }
    return String(objective.progress || 0) + '/' + objective.target;
  }

  function renderSidebar(ctx, state) {
    var hunt = state.hunt || {};
    var objectives = hunt.challenges || [];
    if (objectives.length === 0) return;

    var canvasW = ctx.canvas ? ctx.canvas.width  : 1280;
    var canvasH = ctx.canvas ? ctx.canvas.height : 720;
    if (canvasW < 900 || canvasH > canvasW) return;
    var sideW = 220;
    var sideX = canvasW - sideW - 8;
    var sideY = 60;
    var rowH = 48;
    var headerH = 28;
    var totalH = headerH + objectives.length * rowH + 12;

    ctx.fillStyle = 'rgba(12, 10, 8, 0.90)';
    ctx.fillRect(sideX, sideY, sideW, totalH);
    ctx.strokeStyle = '#2a2420';
    ctx.lineWidth = 1;
    ctx.strokeRect(sideX, sideY, sideW, totalH);

    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#c8a050';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('OBJECTIVES  ' + (hunt.completedCount || 0) + '/' + objectives.length, sideX + 8, sideY + headerH / 2);

    for (var i = 0; i < objectives.length; i++) {
      var obj = objectives[i];
      var rowY = sideY + headerH + i * rowH;

      ctx.fillStyle = obj.completed ? 'rgba(200,160,80,0.12)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(sideX + 4, rowY + 2, sideW - 8, rowH - 4);

      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = obj.completed ? '#f0d070' : '#d4c4a0';
      ctx.fillText((obj.completed ? '✓ ' : '○ ') + obj.title, sideX + 10, rowY + 14);

      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#7a6a50';
      ctx.fillText(obj.description, sideX + 10, rowY + 28);

      var barX = sideX + 10;
      var barY = rowY + 35;
      var barW = sideW - 20;
      var barH = 7;
      var pct = Math.max(0, Math.min(1, (obj.progress || 0) / Math.max(1, obj.target)));

      ctx.fillStyle = '#1e1a16';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = obj.completed ? '#c8a050' : '#806040';
      ctx.fillRect(barX, barY, Math.round(barW * pct), barH);
      ctx.strokeStyle = '#312a22';
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#9a8668';
      ctx.textAlign = 'right';
      ctx.fillText(progressText(obj), sideX + sideW - 10, rowY + 14);
      ctx.textAlign = 'left';
    }
  }

  window.LD.Challenges = {
    generate: generate,
    checkAll: checkAll,
    renderSidebar: renderSidebar,
  };
})();
