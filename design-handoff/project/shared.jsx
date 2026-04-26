// Shared content for all four directions of Lexicon Deep.
// Same data everywhere so the comparison is purely stylistic.

const BOARD_ROWS = [
  ['T','R','E','A','S','U','R','E','B','I','N','D','E','R'],
  ['S','P','A','R','C','H','M','E','N','T','D','U','S','T'],
  ['O','F','F','I','R','E','E','M','B','E','R','G','L','A'],
  ['S','S','H','W','I','N','D','L','A','N','T','E','R','N'],
  ['A','R','C','H','S','H','A','D','O','W','I','N','K','W'],
  ['E','L','L','S','A','B','O','O','K','E','N','D','S','C'],
  ['R','I','B','E','S','T','A','R','C','H','I','V','E','F'],
  ['R','A','G','M','E','N','T','V','O','I','D','L','E','X'],
  ['I','C','O','N','S','E','A','L','M','A','R','G','I','N'],
  ['A','L','I','A','H','A','N','D','S','I','L','E','N','C'],
];
// Path tracing E-M-B-E-R on row 3 (0-indexed row 2): cols 6,7,8,9 plus row3 col0... 
// Row 2 = "OFFIREEMBERGLA"; E at col 5, M at col 7, B at col 8, E at col 9, R at col 10
// But we want consecutive adjacent (orthogonal+diagonal). 
// Cells: (2,5)E (2,6)E (2,7)M (2,8)B (2,9)E (2,10)R — but EE needs distinct;
// path E-M-B-E-R uses (2,6)E -> (2,7)M -> (2,8)B -> (2,9)E -> (2,10)R. All horizontally adjacent. Good.
const PATH = [
  [2,6],[2,7],[2,8],[2,9],[2,10]
];

const HUD = {
  round: 1,
  totalRounds: 3,
  roundName: 'The First Page',
  score: 240,
  combo: 2,
  clues: 3,
  time: '4:13',
  wordsSpelled: 7,
};

const CURRENT = {
  word: 'EMBER',
  preview: '+18',
  status: 'valid',
};

const OBJECTIVES = [
  { text: 'Spell 5 words', cur: 5, max: 5, done: true },
  { text: 'Find 3 hidden words', cur: 1, max: 3, done: false },
  { text: 'Score 500 points', cur: 240, max: 500, done: false },
];

const RECENT = [
  { word: 'ARCHIVE', score: 42, note: 'length × shape × combo' },
  { word: 'LANTERN', score: 28, note: 'shape ×1.5' },
  { word: 'SHADOW',  score: 18, note: '' },
  { word: 'INKWELL', score: 24, note: '×2 crystal' },
];

// Helper: is cell on path? returns index in path or -1
function pathIndex(r, c) {
  for (let i = 0; i < PATH.length; i++) if (PATH[i][0] === r && PATH[i][1] === c) return i;
  return -1;
}

Object.assign(window, { BOARD_ROWS, PATH, HUD, CURRENT, OBJECTIVES, RECENT, pathIndex });
