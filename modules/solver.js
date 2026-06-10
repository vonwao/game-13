(function () {
  'use strict';

  window.LD = window.LD || {};

  function getAdjacent(col, row, width, height) {
    var dirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];
    var result = [];
    for (var i = 0; i < dirs.length; i++) {
      var nc = col + dirs[i][0];
      var nr = row + dirs[i][1];
      if (nc >= 0 && nc < width && nr >= 0 && nr < height) {
        result.push([nc, nr]);
      }
    }
    return result;
  }

  function getBoard(source) {
    if (!source) return null;
    if (source.board && Array.isArray(source.board.tiles)) return source.board;
    if (Array.isArray(source.tiles)) return source;
    return null;
  }

  function getPlantedWordSet(source, options) {
    var set = new Set();
    var planted = [];

    if (options && Array.isArray(options.plantedWords)) {
      planted = options.plantedWords;
    } else if (source && source.hunt && Array.isArray(source.hunt.plantedWords)) {
      planted = source.hunt.plantedWords;
    } else if (source && Array.isArray(source.plantedWords)) {
      planted = source.plantedWords;
    }

    for (var i = 0; i < planted.length; i++) {
      var entry = planted[i];
      var word = entry && typeof entry === 'object' ? entry.word : entry;
      if (word) set.add(String(word).toUpperCase());
    }
    return set;
  }

  function getTile(board, col, row) {
    if (!board || col < 0 || row < 0 || col >= board.width || row >= board.height) return null;
    return board.tiles[row * board.width + col] || null;
  }

  function isTraversableTile(tile, respectWear) {
    if (!tile) return false;
    if (tile.isSeal || tile.corrupted) return false;
    if (respectWear && (tile.useCount || 0) >= 2) return false;
    return !!(tile.icon || tile.letter);
  }

  function computePathShape(path) {
    if (!Array.isArray(path) || path.length < 2) {
      return {
        isStraight: false,
        isHorizontal: false,
        isVertical: false,
        isDiagonal: false,
        corners: 0,
      };
    }

    var dc0 = path[1].col - path[0].col;
    var dr0 = path[1].row - path[0].row;
    var isStraight = true;
    var corners = 0;

    for (var i = 2; i < path.length; i++) {
      var dc = path[i].col - path[i - 1].col;
      var dr = path[i].row - path[i - 1].row;
      if (dc !== (path[i - 1].col - path[i - 2].col) || dr !== (path[i - 1].row - path[i - 2].row)) {
        isStraight = false;
        corners++;
      }
    }

    return {
      isStraight: isStraight,
      isHorizontal: isStraight && dr0 === 0,
      isVertical: isStraight && dc0 === 0,
      isDiagonal: isStraight && dc0 !== 0 && dr0 !== 0,
      corners: corners,
    };
  }

  function defaultScore(entry) {
    if (window.LD && window.LD.Scoring && typeof window.LD.Scoring.scoreEntry === 'function') {
      return window.LD.Scoring.scoreEntry(entry);
    }
    return entry.length * 10 + (entry.tilePoints || 0);
  }

  function compareEntries(a, b) {
    if (!!a.playable !== !!b.playable) return a.playable ? 1 : -1;
    if ((a.score || 0) !== (b.score || 0)) return (a.score || 0) > (b.score || 0) ? 1 : -1;
    if ((a.length || 0) !== (b.length || 0)) return (a.length || 0) > (b.length || 0) ? 1 : -1;
    if ((a.corners || 0) !== (b.corners || 0)) return (a.corners || 0) < (b.corners || 0) ? 1 : -1;
    if ((a.tilePoints || 0) !== (b.tilePoints || 0)) return (a.tilePoints || 0) > (b.tilePoints || 0) ? 1 : -1;
    return String(a.word || '').localeCompare(String(b.word || '')) <= 0 ? 1 : -1;
  }

  function finalizeEntry(word, path, tiles, plantedWordSet, options) {
    var shape = computePathShape(path);
    var tilePoints = 0;
    var liveBasePoints = 0;
    var wildcardCount = 0;
    var emberCount = 0;
    var crystalCount = 0;
    var spentTileCount = 0;
    var wornTileCount = 0;

    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i] || {};
      tilePoints += typeof tile.points === 'number' ? tile.points : 0;
      liveBasePoints += tile && typeof tile.points === 'number' ? (tile.points || 1) : 1;
      if ((tile.useCount || 0) >= 2) spentTileCount++;
      else if ((tile.useCount || 0) === 1) wornTileCount++;
      if (!tile.icon) continue;
      wildcardCount++;
      if (tile.icon === 'ember') emberCount++;
      if (tile.icon === 'crystal') crystalCount++;
    }

    var planted = plantedWordSet.has(word);
    var entry = {
      word: word,
      path: path.map(function(step) { return { col: step.col, row: step.row }; }),
      length: word.length,
      tilePoints: tilePoints,
      liveBasePoints: liveBasePoints,
      corners: shape.corners,
      isStraight: shape.isStraight,
      isHorizontal: shape.isHorizontal,
      isVertical: shape.isVertical,
      isDiagonal: shape.isDiagonal,
      shapeMult: 1,
      wildcardCount: wildcardCount,
      hasWildcard: wildcardCount > 0,
      crystalCount: crystalCount,
      hasCrystal: crystalCount > 0,
      crystalMult: 1,
      emberCount: emberCount,
      emberBonus: emberCount * 10,
      wildcardMult: 1,
      spentTileCount: spentTileCount,
      wornTileCount: wornTileCount,
      playable: spentTileCount === 0,
      planted: planted,
      organic: !planted,
      pathCount: 1,
      playablePathCount: spentTileCount === 0 ? 1 : 0,
      blockedPathCount: spentTileCount === 0 ? 0 : 1,
    };

    if (window.LD && window.LD.Scoring && typeof window.LD.Scoring.computeBreakdown === 'function') {
      var breakdown = window.LD.Scoring.computeBreakdown(entry);
      entry.scoreModel = breakdown.scoreModel;
      entry.lengthBase = breakdown.lengthBase;
      entry.tileBonus = breakdown.tileBonus;
      entry.shapeBonus = breakdown.shapeBonus;
      entry.shapeLabel = breakdown.shapeLabel;
      entry.crystalBonus = breakdown.crystalBonus;
      entry.emberBonus = breakdown.emberBonus;
      entry.wildcardPenalty = breakdown.wildcardPenalty;
    }

    entry.score = typeof options.scoreFn === 'function'
      ? options.scoreFn(entry)
      : defaultScore(entry);

    return entry;
  }

  function mergeWordEntry(existing, candidate) {
    var winner = compareEntries(existing, candidate) >= 0 ? existing : candidate;
    var loser = winner === existing ? candidate : existing;

    winner.pathCount = (existing.pathCount || 0) + 1;
    winner.playablePathCount = (existing.playablePathCount || 0) + (candidate.playable ? 1 : 0);
    winner.blockedPathCount = (existing.blockedPathCount || 0) + (candidate.playable ? 0 : 1);
    if (!winner.playable && candidate.playable) winner.playable = true;
    if (winner.playable && winner.spentTileCount > 0) winner.spentTileCount = 0;
    if (!winner.planted && loser.planted) winner.planted = true;
    winner.organic = !winner.planted;
    return winner;
  }

  function sortEntries(a, b) {
    if (!!a.playable !== !!b.playable) return a.playable ? -1 : 1;
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    if ((b.length || 0) !== (a.length || 0)) return (b.length || 0) - (a.length || 0);
    if ((a.corners || 0) !== (b.corners || 0)) return (a.corners || 0) - (b.corners || 0);
    return String(a.word || '').localeCompare(String(b.word || ''));
  }

  function solveBoard(source, options) {
    options = options || {};

    var board = getBoard(source);
    if (!board || !Array.isArray(board.tiles) || !window.LD || !window.LD.Dict || !window.LD.Dict.getTrieRoot) {
      return [];
    }

    var root = window.LD.Dict.getTrieRoot();
    var lexiconMeta = window.LD.Dict.getLexiconMeta ? window.LD.Dict.getLexiconMeta() : { minLength: 3, maxLength: 8 };
    var minLength = Math.max(1, options.minLength || 4);
    var maxLength = Math.max(minLength, Math.min(options.maxLength || lexiconMeta.maxLength || 8, lexiconMeta.maxLength || 8));
    var onlyPlayable = !!options.onlyPlayable;
    var respectWear = !!options.respectWear;
    var dedupeBy = options.dedupeBy || 'word';
    var plantedWordSet = getPlantedWordSet(source, options);
    var width = board.width;
    var height = board.height;
    var visited = new Uint8Array(width * height);
    var path = [];
    var pathTiles = [];
    var chars = [];
    var byWord = new Map();
    var results = [];

    function recordSolution() {
      if (chars.length < minLength) return;

      var entry = finalizeEntry(chars.join(''), path, pathTiles, plantedWordSet, options);
      if (onlyPlayable && !entry.playable) return;

      if (dedupeBy === 'word') {
        var existing = byWord.get(entry.word);
        if (!existing) {
          byWord.set(entry.word, entry);
        } else {
          byWord.set(entry.word, mergeWordEntry(existing, entry));
        }
        return;
      }

      results.push(entry);
    }

    function walk(node, col, row, tile, letter) {
      var idx = row * width + col;
      if (visited[idx]) return;
      if (!isTraversableTile(tile, respectWear)) return;

      visited[idx] = 1;
      path.push({ col: col, row: row });
      pathTiles.push(tile);
      chars.push(letter);

      if (node.terminal) recordSolution();

      if (chars.length < maxLength) {
        var neighbors = getAdjacent(col, row, width, height);
        for (var i = 0; i < neighbors.length; i++) {
          var nc = neighbors[i][0];
          var nr = neighbors[i][1];
          var nextIdx = nr * width + nc;
          if (visited[nextIdx]) continue;

          var nextTile = getTile(board, nc, nr);
          if (!isTraversableTile(nextTile, respectWear)) continue;

          if (nextTile.icon) {
            for (var ki = 0; ki < node.keys.length; ki++) {
              var key = node.keys[ki];
              walk(node.children[key], nc, nr, nextTile, key);
            }
          } else {
            var nextLetter = String(nextTile.letter || '').toUpperCase();
            var child = node.children[nextLetter];
            if (child) walk(child, nc, nr, nextTile, nextLetter);
          }
        }
      }

      chars.pop();
      pathTiles.pop();
      path.pop();
      visited[idx] = 0;
    }

    for (var row = 0; row < height; row++) {
      for (var col = 0; col < width; col++) {
        var tile = getTile(board, col, row);
        if (!isTraversableTile(tile, respectWear)) continue;

        if (tile.icon) {
          for (var i = 0; i < root.keys.length; i++) {
            var key = root.keys[i];
            walk(root.children[key], col, row, tile, key);
          }
        } else {
          var letter = String(tile.letter || '').toUpperCase();
          var child = root.children[letter];
          if (child) walk(child, col, row, tile, letter);
        }
      }
    }

    if (dedupeBy === 'word') {
      results = Array.from(byWord.values());
    }

    results.sort(sortEntries);
    return results;
  }

  function summarizeBoard(source, options) {
    var solutions = solveBoard(source, options);
    var summary = {
      total: solutions.length,
      playable: 0,
      blocked: 0,
      planted: 0,
      organic: 0,
      byLength: {},
    };

    for (var i = 0; i < solutions.length; i++) {
      var entry = solutions[i];
      if (entry.playable) summary.playable++;
      else summary.blocked++;
      if (entry.planted) summary.planted++;
      if (entry.organic) summary.organic++;
      summary.byLength[entry.length] = (summary.byLength[entry.length] || 0) + 1;
    }

    return summary;
  }

  window.LD.Solver = {
    solveBoard: solveBoard,
    summarizeBoard: summarizeBoard,
    defaultScore: defaultScore,
  };
})();
