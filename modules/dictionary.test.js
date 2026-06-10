import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('Dict', () => {
  let Dict;

  beforeAll(async () => {
    vi.resetModules();
    window.LD = {};
    await import('./dictionary.js');
    Dict = window.LD.Dict;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates words case-insensitively and rejects invalid inputs', () => {
    expect(Dict.isValid('cat')).toBe(true);
    expect(Dict.isValid('CAT')).toBe(true);
    expect(Dict.isValid('question')).toBe(true);
    expect(Dict.isValid('notawordzz')).toBe(false);
    expect(Dict.isValid('')).toBe(false);
    expect(Dict.isValid(null)).toBe(false);
  });

  it('returns Scrabble-style letter points for letters only', () => {
    expect(Dict.getLetterPoints('a')).toBe(1);
    expect(Dict.getLetterPoints('C')).toBe(3);
    expect(Dict.getLetterPoints('q')).toBe(10);
    expect(Dict.getLetterPoints('')).toBe(0);
    expect(Dict.getLetterPoints(7)).toBe(0);
  });

  it('scores words from tile points, fallback letter points, and length multipliers', () => {
    expect(Dict.score('CAT', [
      { points: 3 },
      { points: 1 },
      { points: 1 },
    ])).toBe(5);

    expect(Dict.score('CATS', [{}, {}, {}, {}])).toBe(9);

    expect(Dict.score('QUIZ', [
      { points: 10 },
      { points: 0, isIcon: true },
      { points: 1 },
      { points: 10 },
    ])).toBe(32);

    expect(Dict.score('QUESTION', Array.from({ length: 8 }, () => ({})))).toBe(136);
  });

  it('returns zero for missing words or missing tile paths', () => {
    expect(Dict.score('', [{ points: 1 }])).toBe(0);
    expect(Dict.score('CAT', [])).toBe(0);
    expect(Dict.score('CAT', null)).toBe(0);
  });

  it('builds an uppercase trie with useful lexicon metadata', () => {
    const root = Dict.getTrieRoot();
    let node = root;
    for (const ch of 'CAT') {
      expect(node.keys).toContain(ch);
      node = node.children[ch];
      expect(node).toBeTruthy();
    }
    expect(node.terminal).toBe(true);

    const meta = Dict.getLexiconMeta();
    expect(meta.count).toBeGreaterThan(100000);
    expect(meta.minLength).toBe(3);
    expect(meta.maxLength).toBe(8);
  });

  it('can make random letters deterministic when Math.random is stubbed', () => {
    const random = vi.spyOn(Math, 'random');

    random.mockReturnValue(0);
    expect(Dict.getRandomLetter()).toBe('A');

    random.mockReturnValue(0.999999);
    expect(Dict.getRandomLetter()).toBe('Z');
  });
});
