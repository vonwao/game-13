import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadScoring() {
  vi.resetModules();
  window.LD = {};
  await import('./scoring.js');
  return window.LD.Scoring;
}

describe('Scoring', () => {
  let Scoring;

  beforeEach(async () => {
    Scoring = await loadScoring();
  });

  it('uses the length-first base table with safe numeric input', () => {
    expect(Scoring.lengthBasePoints(-4)).toBe(12);
    expect(Scoring.lengthBasePoints(3.9)).toBe(12);
    expect(Scoring.lengthBasePoints(4)).toBe(30);
    expect(Scoring.lengthBasePoints(5)).toBe(55);
    expect(Scoring.lengthBasePoints(6)).toBe(85);
    expect(Scoring.lengthBasePoints(7)).toBe(120);
    expect(Scoring.lengthBasePoints(8)).toBe(160);
    expect(Scoring.lengthBasePoints(Number.NaN)).toBe(12);
  });

  it('caps tile bonus and scores shape bonuses deterministically', () => {
    expect(Scoring.tileBonus(-5)).toBe(0);
    expect(Scoring.tileBonus(6)).toBe(12);
    expect(Scoring.tileBonus(40)).toBe(30);

    expect(Scoring.shapeBonus({ isHorizontal: true })).toBe(12);
    expect(Scoring.shapeBonus({ isVertical: true })).toBe(12);
    expect(Scoring.shapeBonus({ isDiagonal: true })).toBe(6);
    expect(Scoring.shapeBonus({ isStraight: true })).toBeCloseTo(0);
    expect(Scoring.shapeBonus({ corners: 2 })).toBe(-8);
    expect(Scoring.shapeBonus({ corners: 10 })).toBe(-24);

    expect(Scoring.shapeLabel({ isHorizontal: true })).toBe('horizontal');
    expect(Scoring.shapeLabel({ isVertical: true })).toBe('vertical');
    expect(Scoring.shapeLabel({ isDiagonal: true })).toBe('diagonal');
    expect(Scoring.shapeLabel({ isStraight: true })).toBe('straight');
    expect(Scoring.shapeLabel({ corners: 1 })).toBe('1 corner');
    expect(Scoring.shapeLabel({ corners: 3 })).toBe('3 corners');
  });

  it('computes full breakdowns for long words, bonuses, and wildcard penalties', () => {
    const breakdown = Scoring.computeBreakdown({
      word: 'QUESTION',
      tilePoints: 24,
      corners: 3,
      wildcardCount: 1,
      crystalCount: 2,
      emberCount: 1,
    });

    expect(breakdown).toMatchObject({
      scoreModel: 'length-first-v1',
      length: 8,
      lengthBase: 160,
      tilePoints: 24,
      tileBonus: 30,
      shapeBonus: -12,
      shapeLabel: '3 corners',
      wildcardCount: 1,
      wildcardPenalty: 10,
      crystalCount: 2,
      crystalBonus: 24,
      emberCount: 1,
      emberBonus: 10,
      total: 202,
    });
    expect(Scoring.scoreEntry({ word: 'QUESTION', tilePoints: 24, corners: 3, wildcardCount: 1, crystalCount: 2, emberCount: 1 })).toBe(202);
  });

  it('falls back to basePts, floors unsafe counters, and never returns below one point', () => {
    expect(Scoring.computeBreakdown({ length: 4, basePts: 7 }).tilePoints).toBe(7);
    expect(Scoring.computeBreakdown({
      length: 3,
      tilePoints: -10,
      corners: 100,
      wildcardCount: 10,
    }).total).toBe(1);
    expect(Scoring.computeBreakdown({
      word: 'CRANE',
      tilePoints: 5,
      wildcardCount: 1.9,
      crystalCount: 1.2,
      emberCount: Number.NaN,
    })).toMatchObject({
      length: 5,
      wildcardCount: 1,
      crystalCount: 1,
      emberCount: 0,
    });
  });

  it('formats score reasons with optional discovery and objective bonuses', () => {
    const reason = Scoring.formatReason({
      lengthBase: 85,
      tileBonus: 14,
      shapeBonus: -4,
      crystalBonus: 12,
      emberBonus: 10,
      wildcardPenalty: 10,
    }, {
      discoveryBonus: 25,
      objectiveBonus: 40,
    });

    expect(reason).toBe('len 85 +tile 14 -4 shape +12 crystal +10 ember -wild 10 +disc 25 +obj 40');
  });
});
