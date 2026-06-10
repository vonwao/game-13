(function () {
  'use strict';

  window.LD = window.LD || {};

  var SCORE_MODEL_ID = 'length-first-v1';

  function safeNumber(value) {
    return typeof value === 'number' && isFinite(value) ? value : 0;
  }

  function lengthBasePoints(len) {
    len = Math.max(0, Math.floor(safeNumber(len)));
    if (len <= 3) return 12;
    if (len === 4) return 30;
    if (len === 5) return 55;
    if (len === 6) return 85;
    if (len === 7) return 120;
    return 160;
  }

  function tileBonus(tilePoints) {
    return Math.min(30, Math.max(0, safeNumber(tilePoints) * 2));
  }

  function shapeLabel(entry) {
    if (entry && entry.isHorizontal) return 'horizontal';
    if (entry && entry.isVertical) return 'vertical';
    if (entry && entry.isDiagonal) return 'diagonal';
    if (entry && entry.isStraight) return 'straight';
    var corners = Math.max(0, Math.floor(safeNumber(entry && entry.corners)));
    return corners + (corners === 1 ? ' corner' : ' corners');
  }

  function shapeBonus(entry) {
    if (entry && (entry.isHorizontal || entry.isVertical)) return 12;
    if (entry && entry.isDiagonal) return 6;
    return -(Math.min(6, Math.max(0, Math.floor(safeNumber(entry && entry.corners)))) * 4);
  }

  function computeBreakdown(entry) {
    entry = entry || {};
    var length = Math.max(0, Math.floor(safeNumber(entry.length || (entry.word ? String(entry.word).length : 0))));
    var tilePoints = safeNumber(
      typeof entry.tilePoints === 'number' ? entry.tilePoints : entry.basePts
    );
    var wildcardCount = Math.max(0, Math.floor(safeNumber(entry.wildcardCount)));
    var crystalCount = Math.max(0, Math.floor(safeNumber(entry.crystalCount)));
    var emberCount = Math.max(0, Math.floor(safeNumber(entry.emberCount)));
    var lengthBase = lengthBasePoints(length);
    var tile = tileBonus(tilePoints);
    var shape = shapeBonus(entry);
    var crystal = crystalCount * 12;
    var ember = emberCount * 10;
    var wildcard = wildcardCount * 10;
    var total = Math.max(1, Math.round(lengthBase + tile + shape + crystal + ember - wildcard));

    return {
      scoreModel: SCORE_MODEL_ID,
      length: length,
      lengthBase: lengthBase,
      tilePoints: tilePoints,
      tileBonus: tile,
      shapeBonus: shape,
      shapeLabel: shapeLabel(entry),
      wildcardCount: wildcardCount,
      wildcardPenalty: wildcard,
      crystalCount: crystalCount,
      crystalBonus: crystal,
      emberCount: emberCount,
      emberBonus: ember,
      total: total,
    };
  }

  function scoreEntry(entry) {
    return computeBreakdown(entry).total;
  }

  function signedPart(label, value) {
    if (!value) return '';
    return (value > 0 ? '+' : '-') + Math.abs(value) + ' ' + label;
  }

  function formatReason(breakdown, extras) {
    breakdown = breakdown || {};
    extras = extras || {};

    var parts = [
      'len ' + safeNumber(breakdown.lengthBase),
      '+tile ' + safeNumber(breakdown.tileBonus),
    ];
    var shape = signedPart('shape', safeNumber(breakdown.shapeBonus));
    if (shape) parts.push(shape);
    var crystal = signedPart('crystal', safeNumber(breakdown.crystalBonus));
    if (crystal) parts.push(crystal);
    var ember = signedPart('ember', safeNumber(breakdown.emberBonus));
    if (ember) parts.push(ember);
    var wildcard = safeNumber(breakdown.wildcardPenalty);
    if (wildcard) parts.push('-wild ' + wildcard);
    if (extras.discoveryBonus) parts.push('+disc ' + safeNumber(extras.discoveryBonus));
    if (extras.objectiveBonus) parts.push('+obj ' + safeNumber(extras.objectiveBonus));
    return parts.join(' ');
  }

  window.LD.Scoring = {
    SCORE_MODEL_ID: SCORE_MODEL_ID,
    lengthBasePoints: lengthBasePoints,
    tileBonus: tileBonus,
    shapeBonus: shapeBonus,
    shapeLabel: shapeLabel,
    computeBreakdown: computeBreakdown,
    scoreEntry: scoreEntry,
    formatReason: formatReason,
  };
})();
