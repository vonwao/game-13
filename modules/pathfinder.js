/**
 * LEXICON DEEP — Pathfinder Module
 * window.LD.Pathfinder
 *
 * Handles DFS path-finding on the active search area of the letter grid.
 * Supports 8-directional adjacency, wildcard icon tiles, and prefix highlighting.
 */
(function () {
  'use strict';

  window.LD = window.LD || {};

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Return all in-bounds 8-directional neighbours for a given cell.
   * @param {number} col
   * @param {number} row
   * @param {number} width  - board width
   * @param {number} height - board height
   * @returns {Array<[number, number]>}
   */
  function getAdjacent(col, row, width, height) {
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    return dirs
      .map(([dc, dr]) => [col + dc, row + dr])
      .filter(([c, r]) => c >= 0 && c < width && r >= 0 && r < height);
  }

  function isShellMode() {
    return !!window.__LD_SHELL_MODE__;
  }

  /**
   * In shell mode, search the full board. Else search only the current viewport.
   */
  function getSearchBounds(state) {
    const { width, height } = state.board;
    if (isShellMode()) {
      return {
        startCol: 0,
        startRow: 0,
        endCol: width,
        endRow: height,
      };
    }

    const { col, row, cols, rows } = state.viewport;
    return {
      startCol: col,
      startRow: row,
      endCol: Math.min(width, col + cols),
      endRow: Math.min(height, row + rows),
    };
  }

  function isWithinSearchBounds(bounds, col, row) {
    return (
      col >= bounds.startCol &&
      col < bounds.endCol &&
      row >= bounds.startRow &&
      row < bounds.endRow
    );
  }

  /**
   * Retrieve a tile by (col, row). Returns null if out of range.
   */
  function getTile(state, col, row) {
    const { width, height, tiles } = state.board;
    if (col < 0 || col >= width || row < 0 || row >= height) return null;
    return tiles[row * width + col] || null;
  }

  /**
   * Whether a tile's letter matches the required character.
   * Icon tiles act as wildcards (match any letter).
   * Fully consumed tiles (useCount >= 2) are never available.
   */
  function tileMatchesChar(tile, ch) {
    if (!tile || tile.corrupted) return false;
    if ((tile.useCount || 0) >= 2) return false; // fully consumed
    if (tile.icon) return true; // wildcard
    return tile.letter === ch;
  }

  /**
   * Manhattan distance from (col, row) to nearest corrupted tile.
   * Scans the entire board — cached per findPath call via closure.
   */
  function buildCorruptionDistanceFn(state) {
    const { width, height, tiles } = state.board;
    // Pre-collect corrupted positions for fast scan
    const corrupted = [];
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] && tiles[i].corrupted) {
        corrupted.push({ col: tiles[i].col, row: tiles[i].row });
      }
    }
    if (corrupted.length === 0) {
      // No corruption (Word Hunt) — prefer higher letter-point tiles.
      // Return negative points so the minimum-score path = highest-point path.
      const { tiles, width } = state.board;
      return function(col, row) {
        const t = tiles[row * width + col];
        return -(t ? (t.points || 1) : 1);
      };
    }
    return function distToNearest(col, row) {
      let min = Infinity;
      for (let k = 0; k < corrupted.length; k++) {
        const d = Math.abs(col - corrupted[k].col) + Math.abs(row - corrupted[k].row);
        if (d < min) min = d;
      }
      return min;
    };
  }

  /**
   * Score a candidate path: lower mean distance to nearest corruption = better.
   * We negate so that a LOWER (closer) distance yields a HIGHER score.
   */
  function pathScore(path, distFn) {
    if (path.length === 0) return Infinity;
    let total = 0;
    for (let i = 0; i < path.length; i++) {
      total += distFn(path[i].col, path[i].row);
    }
    return total / path.length; // lower = closer to corruption = better
  }

  // ---------------------------------------------------------------------------
  // Word Hunt path ranking — picks highest-scoring path
  // ---------------------------------------------------------------------------

  /**
   * Compute the shape multiplier for a path (mirrors input.js logic).
   * Used to rank Word Hunt paths: straight > diagonal > zigzag.
   */
  function pathShapeMultiplier(path) {
    if (path.length < 2) return 1.0;
    const dc0 = path[1].col - path[0].col;
    const dr0 = path[1].row - path[0].row;
    let isStraight = true;
    let corners = 0;
    for (let i = 2; i < path.length; i++) {
      const dc = path[i].col - path[i-1].col;
      const dr = path[i].row - path[i-1].row;
      if (dc !== (path[i-1].col - path[i-2].col) || dr !== (path[i-1].row - path[i-2].row)) {
        isStraight = false;
        corners++;
      }
    }
    if (isStraight) {
      return (dr0 === 0 || dc0 === 0) ? 2.0 : 1.5;
    }
    return Math.max(0.4, 1.0 - corners * 0.2);
  }

  /**
   * Rank score for a Word Hunt path: higher is better.
   * Maximises sum(tile.points) × shapeMult.
   */
  function wordHuntRank(path, state) {
    let pts = 0;
    for (let i = 0; i < path.length; i++) {
      const t = getTile(state, path[i].col, path[i].row);
      pts += t ? (t.points || 1) : 1;
    }
    return pts * pathShapeMultiplier(path);
  }

  // ---------------------------------------------------------------------------
  // Core DFS
  // ---------------------------------------------------------------------------

  function traverseMatchingPaths(state, word, onPath) {
    if (!word || word.length === 0 || typeof onPath !== 'function') return;

    const upperWord = word.toUpperCase();
    const wordLen = upperWord.length;
    const { width, height } = state.board;
    const bounds = getSearchBounds(state);
    const visited = new Set();
    const currentPath = [];

    function dfs(col, row, depth) {
      if (!isWithinSearchBounds(bounds, col, row)) return;

      const tile = getTile(state, col, row);
      if (!tile) return;

      const idx = row * width + col;
      if (visited.has(idx)) return;
      if (!tileMatchesChar(tile, upperWord[depth])) return;

      visited.add(idx);
      currentPath.push({ col, row });

      if (depth === wordLen - 1) {
        onPath(currentPath);
      } else {
        const neighbours = getAdjacent(col, row, width, height);
        for (let i = 0; i < neighbours.length; i++) {
          dfs(neighbours[i][0], neighbours[i][1], depth + 1);
        }
      }

      currentPath.pop();
      visited.delete(idx);
    }

    for (let r = bounds.startRow; r < bounds.endRow; r++) {
      for (let c = bounds.startCol; c < bounds.endCol; c++) {
        dfs(c, r, 0);
      }
    }
  }

  /**
   * Find all path candidates for the current string while also ranking the
   * best one for auto-resolution/submission.
   */
  function findPathDetails(state, word) {
    if (!word || word.length === 0) {
      return {
        bestPath: [],
        resolvedPath: [],
        candidateCount: 0,
        ambiguous: false,
      };
    }

    const isWordHunt = state.gameMode === 'wordhunt';
    const distFn = isWordHunt ? null : buildCorruptionDistanceFn(state);

    let bestPath = [];
    let bestScore = isWordHunt ? -Infinity : Infinity;
    let firstPath = null;
    let candidateCount = 0; // capped at 2; 2 means "2+"
    let ambiguous = false;

    traverseMatchingPaths(state, word, function(path) {
      if (!firstPath) {
        firstPath = path.slice();
      } else {
        ambiguous = true;
      }
      if (candidateCount < 2) candidateCount++;

      if (isWordHunt) {
        const rank = wordHuntRank(path, state);
        if (rank > bestScore) {
          bestScore = rank;
          bestPath = path.slice();
        }
      } else {
        const score = pathScore(path, distFn);
        if (score < bestScore) {
          bestScore = score;
          bestPath = path.slice();
        }
      }
    });

    if (!firstPath) {
      return {
        bestPath: [],
        resolvedPath: [],
        candidateCount: 0,
        ambiguous: false,
      };
    }

    return {
      bestPath,
      resolvedPath: ambiguous ? [] : firstPath,
      candidateCount,
      ambiguous,
    };
  }

  /**
   * DFS with backtracking over the active search area.
   *
   * Word Hunt: keeps the path with the highest sum(points) × shapeMult.
   * Siege:     keeps the path closest (lowest avg distance) to corruption.
   *
   * @param {object}   state
   * @param {string}   word        - uppercase word to find
   * @returns {Array<{col, row}>}  - winning path, or [] if none
   */
  function findPath(state, word) {
    return findPathDetails(state, word).bestPath;
  }

  // ---------------------------------------------------------------------------
  // Prefix highlighting
  // ---------------------------------------------------------------------------

  /**
   * Return all tiles in the active search area that COULD start a word matching the
   * given prefix — i.e., tiles from which a valid connected prefix-path exists.
   *
   * @param {object} state
   * @param {string} prefix - uppercase prefix typed so far
   * @returns {Array<{col, row}>}
   */
  function findPrefixStarts(state, prefix) {
    if (!prefix || prefix.length === 0) return [];

    const { width } = state.board;
    const startSet = new Set();

    traverseMatchingPaths(state, prefix, function(path) {
      if (path.length === 0) return;
      const start = path[0];
      startSet.add(start.row * width + start.col);
    });

    const results = [];
    startSet.forEach((idx) => {
      const col = idx % width;
      const row = Math.floor(idx / width);
      results.push({ col, row });
    });
    return results;
  }

  /**
   * Return every cell that participates in at least one viable path matching
   * the current prefix.
   */
  function findPrefixCells(state, prefix) {
    if (!prefix || prefix.length === 0) return [];

    const { width } = state.board;
    const cellSet = new Set();

    traverseMatchingPaths(state, prefix, function(path) {
      for (let i = 0; i < path.length; i++) {
        cellSet.add(path[i].row * width + path[i].col);
      }
    });

    const results = [];
    cellSet.forEach((idx) => {
      const col = idx % width;
      const row = Math.floor(idx / width);
      results.push({ col, row });
    });
    return results;
  }

  /**
   * Validate an explicit board-selected path for the given string.
   */
  function isPathViable(state, word, path) {
    if (!word || !Array.isArray(path) || path.length !== word.length) return false;

    const upperWord = word.toUpperCase();
    const { width, height } = state.board;
    const visited = new Set();

    for (let i = 0; i < path.length; i++) {
      const step = path[i];
      if (!step || typeof step.col !== 'number' || typeof step.row !== 'number') return false;
      if (step.col < 0 || step.col >= width || step.row < 0 || step.row >= height) return false;

      const idx = step.row * width + step.col;
      if (visited.has(idx)) return false;
      visited.add(idx);

      const tile = getTile(state, step.col, step.row);
      if (!tileMatchesChar(tile, upperWord[i])) return false;

      if (i > 0) {
        const prev = path[i - 1];
        if (Math.abs(step.col - prev.col) > 1 || Math.abs(step.row - prev.row) > 1) {
          return false;
        }
      }
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.LD.Pathfinder = {
    /**
     * Find the best ranked path spelling `word` in the active search area.
     * Returns [] if none exists.
     */
    findPath,

    /**
     * Return the best path plus ambiguity metadata for the current string.
     */
    findPathDetails,

    /**
     * Return all search-area tile positions that can start a connected path
     * matching `prefix`.
     */
    findPrefixStarts,

    /**
     * Return all cells that belong to at least one viable prefix path.
     */
    findPrefixCells,

    /**
     * Validate an explicit board-selected path.
     */
    isPathViable,

    /**
     * Utility exposed for other modules that need adjacency information.
     */
    getAdjacent,
  };
})();
