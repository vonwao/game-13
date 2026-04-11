(function () {
  'use strict';

  window.LD = window.LD || {};

  var BOARD_SIZES = {
    small:  { width: 20, height: 16 },
    medium: { width: 30, height: 25 },
    large:  { width: 40, height: 40 },
  };

  var FRAGMENTS = [
    'ING', 'TION', 'COM', 'PRE', 'OUT', 'STR', 'IGHT', 'MENT',
    'ABLE', 'NESS', 'OVER', 'UNDER', 'ENCE', 'OUGH', 'ANCE'
  ];

  function resolve(gameMode, settings) {
    var diff = settings.difficulty || 'medium';
    var sizeKey = settings.boardSize || 'medium';
    var size = BOARD_SIZES[sizeKey] || BOARD_SIZES.medium;

    if (gameMode === 'wordhunt') {
      return {
        boardWidth:  size.width,
        boardHeight: size.height,
        // Planted words
        plantedWordCount:    { easy: 20, medium: 15, hard: 10 }[diff],
        plantedWordMinLen:   { easy: 4,  medium: 5,  hard: 6  }[diff],
        plantedWordMaxLen:   { easy: 6,  medium: 7,  hard: 8  }[diff],
        plantedDiagonalPct: { easy: 0,  medium: 0.2, hard: 0.5 }[diff],
        plantedReversePct:  { easy: 0,  medium: 0.15, hard: 0.4 }[diff],
        // Fragments
        fragmentCount: { easy: 18, medium: 12, hard: 6 }[diff],
        // Special tiles
        crystalCount: settings.specialTiles ? 6 : 0,
        voidCount:    settings.specialTiles ? 5 : 0,
        emberCount:   settings.specialTiles ? 4 : 0,
        bombCount:    0,
        // Scoring
        pathBonuses:  true,
        comboBonuses: true,
        // Timing
        timeLimit:  { easy: 420, medium: 300, hard: 180 }[diff],
        turnLimit:  { easy: 60,  medium: 50,  hard: 35  }[diff],
      };
    }

    if (gameMode === 'siege') {
      return {
        boardWidth:  size.width,
        boardHeight: size.height,
        // Corruption
        sealCount:                { easy: 4, medium: 6, hard: 8 }[diff],
        corruptionSpreadChance:   { easy: 0.2, medium: 0.3, hard: 0.45 }[diff],
        corruptionLossThreshold:  { easy: 50, medium: 40, hard: 30 }[diff],
        initialCorruptionRadius:  { easy: 1, medium: 1, hard: 2 }[diff],
        hardModeLetters:          diff === 'hard',
        // Special tiles
        crystalCount: settings.specialTiles ? 8 : 0,
        voidCount:    settings.specialTiles ? 5 : 0,
        emberCount:   settings.specialTiles ? 6 : 0,
        bombCount:    settings.specialTiles ? 2 : 0,
        // Scoring
        pathBonuses:  false,
        comboBonuses: false,
      };
    }

    // Fallback (should not happen)
    return { boardWidth: size.width, boardHeight: size.height };
  }

  window.LD.Constants = {
    BOARD_SIZES: BOARD_SIZES,
    FRAGMENTS:   FRAGMENTS,
    resolve:     resolve,
  };

})();
