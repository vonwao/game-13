(function () {
  'use strict';

  window.LD = window.LD || {};

  var BOARD_SIZES = {
    small:  { width: 20, height: 16 },
    medium: { width: 30, height: 25 },
    large:  { width: 40, height: 40 },
  };

  // Orientation-aware board profile hints.
  //
  // These are pure lookup data for future callers that want to pick a board
  // presentation profile based on both size tier and aspect/orientation.
  // Nothing in the current runtime uses them yet, so existing behavior stays
  // unchanged until a caller opts in.
  var BOARD_PROFILES = {
    landscape: {
      small: {
        boardSize: 'small',
        orientation: 'landscape',
        boardWidth: 20,
        boardHeight: 16,
        tileTargets: {
          preferred: 28,
          minimumReadable: 22,
          maximum: 34,
        },
      },
      medium: {
        boardSize: 'medium',
        orientation: 'landscape',
        boardWidth: 30,
        boardHeight: 25,
        tileTargets: {
          preferred: 22,
          minimumReadable: 18,
          maximum: 28,
        },
      },
      large: {
        boardSize: 'large',
        orientation: 'landscape',
        boardWidth: 40,
        boardHeight: 40,
        tileTargets: {
          preferred: 16,
          minimumReadable: 14,
          maximum: 20,
        },
      },
    },
    portrait: {
      small: {
        boardSize: 'small',
        orientation: 'portrait',
        boardWidth: 13,
        boardHeight: 18,
        tileTargets: {
          preferred: 24,
          minimumReadable: 19,
          maximum: 30,
        },
      },
      medium: {
        boardSize: 'medium',
        orientation: 'portrait',
        boardWidth: 16,
        boardHeight: 22,
        tileTargets: {
          preferred: 20,
          minimumReadable: 16,
          maximum: 24,
        },
      },
      large: {
        boardSize: 'large',
        orientation: 'portrait',
        boardWidth: 18,
        boardHeight: 26,
        tileTargets: {
          preferred: 16,
          minimumReadable: 13,
          maximum: 20,
        },
      },
    },
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
        commonWordRankLimit:{ easy: 1800, medium: 2600, hard: 3400 }[diff],
        commonWordRankStep: 700,
        // Fragments
        fragmentCount: { easy: 18, medium: 12, hard: 6 }[diff],
        // Special tiles
        crystalCount: settings.specialTiles ? 6 : 0,
        voidCount:    settings.specialTiles ? 5 : 0,
        emberCount:   settings.specialTiles ? 4 : 0,
        bombCount:    0,
        // Discovery / progression
        clueCount:   { easy: 3, medium: 2, hard: 1 }[diff],
        roundsToWin: 3,
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

  function normalizeBoardSizeKey(sizeKey) {
    return BOARD_SIZES[sizeKey] ? sizeKey : 'medium';
  }

  function resolveBoardOrientation(layout) {
    if (typeof layout === 'string') {
      return layout === 'portrait' ? 'portrait' : 'landscape';
    }

    if (layout && typeof layout.orientation === 'string') {
      return layout.orientation === 'portrait' ? 'portrait' : 'landscape';
    }

    if (layout && typeof layout.aspect === 'string') {
      return layout.aspect === 'tall' || layout.aspect === 'portrait' ? 'portrait' : 'landscape';
    }

    if (layout && typeof layout.aspect === 'number') {
      return layout.aspect < 1 ? 'portrait' : 'landscape';
    }

    if (layout && typeof layout.width === 'number' && typeof layout.height === 'number') {
      return layout.width < layout.height ? 'portrait' : 'landscape';
    }

    if (layout && typeof layout.orientationHint === 'string') {
      return layout.orientationHint === 'portrait' ? 'portrait' : 'landscape';
    }

    return 'landscape';
  }

  function cloneBoardProfile(profile, sizeKey, orientation) {
    if (!profile) return null;
    var tileTargets = profile.tileTargets || {};
    return {
      sizeKey: sizeKey,
      orientation: orientation,
      boardSize: profile.boardSize,
      boardWidth: profile.boardWidth,
      boardHeight: profile.boardHeight,
      tileTargets: {
        preferred: tileTargets.preferred,
        minimumReadable: tileTargets.minimumReadable,
        maximum: tileTargets.maximum,
      },
      tileTarget: tileTargets.preferred,
      tileTargetMin: tileTargets.minimumReadable,
      tileTargetMax: tileTargets.maximum,
      aspectHint: profile.orientation === 'portrait' ? 'tall' : 'wide',
    };
  }

  function resolveBoardProfile(sizeKey, layout) {
    var normalizedSizeKey = normalizeBoardSizeKey(sizeKey);
    var orientation = resolveBoardOrientation(layout);
    var profile = BOARD_PROFILES[orientation] && BOARD_PROFILES[orientation][normalizedSizeKey];
    if (!profile) {
      profile = BOARD_PROFILES.landscape.medium;
      normalizedSizeKey = 'medium';
      orientation = 'landscape';
    }
    return cloneBoardProfile(profile, normalizedSizeKey, orientation);
  }

  function getBoardTileTargets(sizeKey, layout) {
    var profile = resolveBoardProfile(sizeKey, layout);
    return profile ? profile.tileTargets : null;
  }

  window.LD.Constants = {
    BOARD_SIZES:        BOARD_SIZES,
    BOARD_PROFILES:      BOARD_PROFILES,
    FRAGMENTS:           FRAGMENTS,
    resolve:             resolve,
    resolveBoardProfile: resolveBoardProfile,
    getBoardTileTargets: getBoardTileTargets,
  };

})();
