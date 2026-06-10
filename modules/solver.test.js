import { describe, expect, it, vi } from 'vitest';

const LETTER_POINTS = {
  A: 1,
  B: 3,
  C: 3,
  D: 2,
  G: 2,
  O: 1,
  S: 1,
  T: 1,
};

function createTrieNode() {
  return {
    children: Object.create(null),
    keys: [],
    terminal: false,
  };
}

function makeTrie(words) {
  const root = createTrieNode();

  for (const rawWord of words) {
    const word = String(rawWord).toUpperCase();
    let node = root;
    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = createTrieNode();
        node.keys.push(ch);
      }
      node = node.children[ch];
    }
    node.terminal = true;
  }

  return root;
}

function tile(input) {
  if (typeof input === 'string') {
    return {
      letter: input,
      points: LETTER_POINTS[input] || 1,
    };
  }
  return {
    points: input.letter ? (LETTER_POINTS[input.letter] || 1) : 0,
    ...input,
  };
}

function makeBoard(rows) {
  const height = rows.length;
  const width = rows[0] ? rows[0].length : 0;
  const tiles = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = rows[row][col];
      tiles.push(cell ? { col, row, ...tile(cell) } : null);
    }
  }

  return { width, height, tiles };
}

function lexiconMeta(words) {
  const lengths = words.map((word) => String(word).length);
  return {
    minLength: lengths.length ? Math.min(...lengths) : 0,
    maxLength: lengths.length ? Math.max(...lengths) : 0,
  };
}

async function loadSolver(words, scoringOverrides = {}) {
  vi.resetModules();
  const trie = makeTrie(words);
  const meta = lexiconMeta(words);
  const scoring = {
    computeBreakdown: vi.fn((entry) => ({
      scoreModel: 'test-score',
      lengthBase: entry.length * 10,
      tileBonus: entry.tilePoints,
      shapeBonus: -entry.corners,
      shapeLabel: entry.isHorizontal ? 'horizontal' : `${entry.corners} corners`,
      crystalBonus: entry.crystalCount * 12,
      emberBonus: entry.emberCount * 10,
      wildcardPenalty: entry.wildcardCount * 10,
    })),
    scoreEntry: vi.fn((entry) => entry.length * 100 + entry.tilePoints - entry.corners),
    ...scoringOverrides,
  };

  window.LD = {
    Dict: {
      getTrieRoot: vi.fn(() => trie),
      getLexiconMeta: vi.fn(() => meta),
    },
    Scoring: scoring,
  };

  await import('./solver.js');
  return {
    Solver: window.LD.Solver,
    Dict: window.LD.Dict,
    Scoring: window.LD.Scoring,
  };
}

describe('Solver', () => {
  it('returns no solutions for missing or empty boards', async () => {
    const { Solver } = await loadSolver(['CAT']);

    expect(Solver.solveBoard(null)).toEqual([]);
    expect(Solver.solveBoard(makeBoard([]))).toEqual([]);
    expect(Solver.summarizeBoard(makeBoard([]))).toEqual({
      total: 0,
      playable: 0,
      blocked: 0,
      planted: 0,
      organic: 0,
      byLength: {},
    });
  });

  it('solves adjacent words, marks planted words, and applies the scoring global', async () => {
    const { Solver, Scoring } = await loadSolver(['CAT', 'CATS', 'CAST', 'DOG']);
    const board = makeBoard([
      ['C', 'A'],
      ['T', 'S'],
    ]);

    const results = Solver.solveBoard(board, {
      minLength: 3,
      maxLength: 4,
      plantedWords: ['CAT'],
    });

    expect(results.map((entry) => entry.word)).toEqual(expect.arrayContaining([
      'CAT',
      'CATS',
      'CAST',
    ]));
    expect(results.map((entry) => entry.word)).not.toContain('DOG');

    const cat = results.find((entry) => entry.word === 'CAT');
    expect(cat).toMatchObject({
      word: 'CAT',
      length: 3,
      tilePoints: 5,
      corners: 1,
      scoreModel: 'test-score',
      score: 304,
      planted: true,
      organic: false,
      playable: true,
      pathCount: 1,
    });
    expect(cat.path).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
    ]);
    expect(Scoring.computeBreakdown).toHaveBeenCalledWith(expect.objectContaining({
      word: 'CAT',
      tilePoints: 5,
      planted: true,
    }));
    expect(Scoring.scoreEntry).toHaveBeenCalledWith(expect.objectContaining({
      word: 'CAT',
      length: 3,
    }));
  });

  it('branches wildcard icons through trie keys and records wildcard metadata', async () => {
    const { Solver } = await loadSolver(['CAT']);
    const board = makeBoard([[
      { icon: 'crystal', points: 0 },
      'A',
      'T',
    ]]);

    const results = Solver.solveBoard(board, { minLength: 3, maxLength: 3 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      word: 'CAT',
      path: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
      ],
      tilePoints: 2,
      hasWildcard: true,
      wildcardCount: 1,
      hasCrystal: true,
      crystalCount: 1,
      playable: true,
    });
  });

  it('dedupes word entries while preserving playable paths over blocked paths', async () => {
    const { Solver } = await loadSolver(['CAT']);
    const board = makeBoard([
      ['C', { letter: 'A', useCount: 2 }, 'T'],
      [null, 'A', null],
    ]);

    const results = Solver.solveBoard(board, { minLength: 3, maxLength: 3 });
    const cat = results.find((entry) => entry.word === 'CAT');

    expect(cat).toMatchObject({
      word: 'CAT',
      playable: true,
      pathCount: 2,
      playablePathCount: 1,
      blockedPathCount: 1,
      spentTileCount: 0,
    });
    expect(cat.path).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 0 },
    ]);

    expect(Solver.solveBoard(board, {
      minLength: 3,
      maxLength: 3,
      respectWear: true,
    })[0]).toMatchObject({
      pathCount: 1,
      playablePathCount: 1,
      blockedPathCount: 0,
    });

    expect(Solver.solveBoard(makeBoard([[
      'C',
      { letter: 'A', useCount: 2 },
      'T',
    ]]), {
      minLength: 3,
      maxLength: 3,
      onlyPlayable: true,
    })).toEqual([]);
  });

  it('summarizes solved boards by playability, origin, and length', async () => {
    const { Solver } = await loadSolver(['CAT']);
    const summary = Solver.summarizeBoard(makeBoard([['C', 'A', 'T']]), {
      minLength: 3,
      maxLength: 3,
      plantedWords: ['CAT'],
    });

    expect(summary).toEqual({
      total: 1,
      playable: 1,
      blocked: 0,
      planted: 1,
      organic: 0,
      byLength: { 3: 1 },
    });
  });
});
