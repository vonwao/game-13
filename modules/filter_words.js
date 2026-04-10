const fs = require('fs');
const path = require('path');

const rawPath = path.join(__dirname, 'words_raw.txt');
const outPath = path.join(__dirname, 'dictionary.js');

// Profanity blocklist
const BLOCKLIST = new Set([
  'ass','asses','asshole','assholes','bastard','bastards','bitch','bitches',
  'bollocks','brothel','bugger','butt','cock','cocks','crap','craps','cum',
  'cunt','cunts','damn','damnit','dick','dicks','dyke','fag','fags','faggot',
  'faggots','fuck','fucked','fucker','fuckers','fucking','fucks','goddamn',
  'hell','homo','horny','jerk','jerks','jizz','kike','nigger','niggers',
  'piss','pisses','porn','prick','pricks','pussy','pussies','queer','rape',
  'rapes','shit','shits','shitty','slut','sluts','spic','tits','twat','twats',
  'wank','wanker','whore','whores'
]);

const raw = fs.readFileSync(rawPath, 'utf8');
const lines = raw.split('\n');

const seen = new Set();
const words = [];

for (let line of lines) {
  const w = line.trim().toLowerCase();
  if (!w) continue;
  if (w.length < 3 || w.length > 8) continue;
  if (!/^[a-z]+$/.test(w)) continue;
  if (BLOCKLIST.has(w)) continue;
  if (seen.has(w)) continue;
  seen.add(w);
  words.push(w);
}

words.sort();

console.log(`Filtered to ${words.length} words`);

// Verify must-have words
const mustHave = [
  'cat','dog','the','and','storm','quest','fire','magic','thunder','crystal',
  'wizard','spell','ancient','dragon','power','sword','shield','light','dark',
  'ember','void','deep','stone','rune','archive','corrupt','cleanse','purge',
  'library','scroll','tome','page','ink','quill','scholar','entropy','decay',
  'dust','ash','bone','crypt','vault','seal','ward','charm','curse','hex',
  'bane','blight','rot','bloom','grow','root','vine','thorn','maze','path',
  'gate','door','wall','floor','tower','keep','moat','bridge','crown','throne',
  'king','queen','knight','rook','bishop','pawn','chess','game','play','word',
  'text','book','read','write','speak','voice','song','hymn','chant','pray',
  'holy','sacred','divine','demon','angel','ghost','spirit','soul','mind',
  'body','heart','blood','flesh','death','life','birth','fate','doom','hope',
  'fear','rage','calm','peace','war','battle','fight','strike','slash','stab',
  'crush','smash','break','crack','split','tear','burn','freeze','melt','flow',
  'pour','rain','snow','hail','wind','gust','gale','bolt','flash','spark',
  'flame','blaze','smoke','mist','fog','cloud','sky','star','moon','sun',
  'dawn','dusk','night','day','time','hour','year','age','era','world','earth',
  'land','sea','lake','river','creek','pond','ocean','wave','tide','shore',
  'beach','sand','rock','cliff','cave','mine','ore','gold','iron','steel',
  'bronze','copper','silver','gem','ruby','pearl'
];

const wordSet = new Set(words);
const missing = mustHave.filter(w => !wordSet.has(w));
if (missing.length > 0) {
  console.log('Adding missing must-have words:', missing);
  for (const w of missing) {
    words.push(w);
  }
  words.sort();
}

const dictStr = words.join('|');

const js = `(function() {
  'use strict';
  window.LD = window.LD || {};

  // Word list: ${words.length} words (3-8 letters, a-z only)
  const DICT = new Set(${JSON.stringify(dictStr)}.split('|'));

  // Letter point values (Scrabble-style)
  const LETTER_POINTS = {
    E:1, A:1, I:1, O:1, N:1, R:1, T:1, L:1, S:1, U:1,
    D:2, G:2,
    B:3, C:3, M:3, P:3,
    F:4, H:4, V:4, W:4, Y:4,
    K:5,
    J:8, X:8,
    Q:10, Z:10
  };

  // Length multipliers
  const LENGTH_MULT = { 3:1, 4:1.5, 5:2, 6:3, 7:5 };

  // Weighted letter frequency for random generation
  const LETTER_WEIGHTS = [
    ['A',10],['B',2],['C',3],['D',4],['E',14],['F',2],['G',3],['H',3],
    ['I',10],['J',1],['K',1],['L',5],['M',3],['N',7],['O',9],['P',2],
    ['Q',1],['R',7],['S',6],['T',8],['U',5],['V',2],['W',2],['X',1],
    ['Y',3],['Z',1]
  ];

  // Build cumulative weight table once
  const WEIGHT_TABLE = [];
  let total = 0;
  for (const [letter, weight] of LETTER_WEIGHTS) {
    total += weight;
    WEIGHT_TABLE.push([letter, total]);
  }
  const WEIGHT_TOTAL = total;

  /**
   * Check if a word is valid (case-insensitive).
   * @param {string} word
   * @returns {boolean}
   */
  function isValid(word) {
    if (typeof word !== 'string') return false;
    return DICT.has(word.toLowerCase());
  }

  /**
   * Get point value for a single letter.
   * @param {string} letter - single character (case-insensitive)
   * @returns {number}
   */
  function getLetterPoints(letter) {
    if (typeof letter !== 'string') return 0;
    return LETTER_POINTS[letter.toUpperCase()] || 0;
  }

  /**
   * Score a word given the tile path used to form it.
   * Icon/wildcard tiles (tile.points === 0 or tile.isIcon) score 0 for that letter.
   * @param {string} word
   * @param {Array<{points: number}>} tiles
   * @returns {number}
   */
  function score(word, tiles) {
    if (!word || !Array.isArray(tiles) || tiles.length === 0) return 0;
    const len = word.length;
    let baseScore = 0;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      // Icon tiles used as wildcards contribute 0 points
      baseScore += (tile && typeof tile.points === 'number') ? tile.points : getLetterPoints(word[i] || '');
    }
    const mult = LENGTH_MULT[len] || 8; // 8+ letters = 8x
    return Math.round(baseScore * mult);
  }

  /**
   * Get a random uppercase letter weighted by English frequency.
   * @returns {string}
   */
  function getRandomLetter() {
    const r = Math.random() * WEIGHT_TOTAL;
    for (const [letter, cumWeight] of WEIGHT_TABLE) {
      if (r < cumWeight) return letter;
    }
    return 'E'; // fallback
  }

  window.LD.Dict = { isValid, score, getLetterPoints, getRandomLetter };
})();
`;

fs.writeFileSync(outPath, js, 'utf8');
console.log(`Wrote ${outPath} (${Math.round(js.length / 1024)}KB)`);
