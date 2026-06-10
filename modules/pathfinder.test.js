import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const LETTER_POINTS = {
  A: 1,
  B: 3,
  C: 3,
  S: 1,
  T: 1,
  X: 8,
};

function tile(letter, extras = {}) {
  return {
    letter,
    points: LETTER_POINTS[letter] || 1,
    ...extras,
  };
}

function makeState(rows, options = {}) {
  const height = rows.length;
  const width = rows[0] ? rows[0].length : 0;
  const tiles = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = rows[row][col];
      tiles.push(cell ? { col, row, ...cell } : null);
    }
  }

  return {
    gameMode: options.gameMode || 'wordhunt',
    board: { width, height, tiles },
    viewport: options.viewport || { col: 0, row: 0, cols: width, rows: height },
  };
}

async function loadPathfinder(scoring) {
  vi.resetModules();
  delete window.__LD_SHELL_MODE__;
  window.LD = scoring ? { Scoring: scoring } : {};
  await import('./pathfinder.js');
  return window.LD.Pathfinder;
}

describe('Pathfinder', () => {
  let Pathfinder;

  beforeEach(async () => {
    Pathfinder = await loadPathfinder();
  });

  afterEach(() => {
    delete window.__LD_SHELL_MODE__;
    vi.restoreAllMocks();
  });

  it('returns in-bounds 8-directional adjacency', () => {
    expect(Pathfinder.getAdjacent(0, 0, 2, 2)).toEqual([
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
    expect(Pathfinder.getAdjacent(1, 1, 3, 3)).toHaveLength(8);
  });

  it('handles empty boards, single-letter paths, and no-reuse failures', () => {
    expect(Pathfinder.findPath(makeState([]), 'A')).toEqual([]);

    const single = makeState([[tile('A')]]);
    expect(Pathfinder.findPath(single, 'A')).toEqual([{ col: 0, row: 0 }]);
    expect(Pathfinder.findPath(single, 'B')).toEqual([]);
    expect(Pathfinder.findPath(single, 'AA')).toEqual([]);
  });

  it('finds connected word paths and validates explicit paths', () => {
    const state = makeState([
      [tile('C'), tile('A')],
      [tile('T'), tile('S')],
    ]);
    const path = [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
    ];

    expect(Pathfinder.findPath(state, 'CAT')).toEqual(path);
    expect(Pathfinder.findPathDetails(state, 'CAT')).toMatchObject({
      bestPath: path,
      resolvedPath: path,
      candidateCount: 1,
      ambiguous: false,
    });
    expect(Pathfinder.isPathViable(state, 'CAT', path)).toBe(true);
    expect(Pathfinder.isPathViable(state, 'CAT', [
      { col: 0, row: 0 },
      { col: 0, row: 0 },
      { col: 0, row: 1 },
    ])).toBe(false);
    expect(Pathfinder.isPathViable(state, 'CAT', [
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 0 },
    ])).toBe(false);
  });

  it('returns prefix starts and participating prefix cells', () => {
    const state = makeState([
      [tile('C'), tile('A')],
      [tile('T'), tile('S')],
    ]);

    expect(Pathfinder.findPrefixStarts(state, 'CA')).toEqual([{ col: 0, row: 0 }]);
    expect(Pathfinder.findPrefixCells(state, 'CA')).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
  });

  it('honors viewport bounds unless shell mode is enabled', () => {
    const state = makeState([[tile('A'), tile('B'), tile('C')]], {
      viewport: { col: 1, row: 0, cols: 2, rows: 1 },
    });

    expect(Pathfinder.findPath(state, 'A')).toEqual([]);
    expect(Pathfinder.findPath(state, 'BC')).toEqual([
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);

    window.__LD_SHELL_MODE__ = true;
    expect(Pathfinder.findPath(state, 'A')).toEqual([{ col: 0, row: 0 }]);
  });

  it('allows wildcard icons and blocks fully consumed tiles', () => {
    const wildcardState = makeState([[
      { icon: 'crystal', points: 0 },
      tile('T'),
    ]]);
    expect(Pathfinder.findPath(wildcardState, 'AT')).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
    expect(Pathfinder.isPathViable(wildcardState, 'AT', [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ])).toBe(true);

    const spentState = makeState([[tile('A', { useCount: 2 })]]);
    expect(Pathfinder.findPath(spentState, 'A')).toEqual([]);
  });

  it('uses the scoring global to rank Word Hunt paths', async () => {
    const scoreEntry = vi.fn((entry) => entry.tilePoints);
    Pathfinder = await loadPathfinder({ scoreEntry });
    const state = makeState([
      [tile('A', { points: 1 }), tile('B', { points: 1 })],
      [tile('A', { points: 5 }), tile('B', { points: 10 })],
    ]);

    const details = Pathfinder.findPathDetails(state, 'AB');

    expect(details.bestPath).toEqual([
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ]);
    expect(details.resolvedPath).toEqual([]);
    expect(details.candidateCount).toBe(2);
    expect(details.ambiguous).toBe(true);
    expect(scoreEntry).toHaveBeenCalledWith(expect.objectContaining({
      word: 'AB',
      length: 2,
      tilePoints: 15,
      isHorizontal: true,
    }));
  });

  it('ranks siege paths by proximity to corruption', () => {
    const state = makeState([
      [tile('A'), tile('B'), tile('X', { corrupted: true })],
      [tile('A'), tile('B'), tile('S')],
    ], { gameMode: 'siege' });

    expect(Pathfinder.findPathDetails(state, 'AB').bestPath).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
    ]);
  });
});
