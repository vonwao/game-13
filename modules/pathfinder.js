/**
 * LEXICON DEEP — Pathfinder Module
 * window.LD.Pathfinder
 *
 * Handles DFS path-finding on the visible viewport of a 40×40 letter grid.
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

  /**
   * Collect the set of tiles visible in the current viewport.
   * Returns a Set of flat indices for O(1) membership tests.
   */
  function getViewportIndexSet(state) {
    const { col: vpCol, row: vpRow, cols: vpCols, rows: vpRows } = state.viewport;
    const { width } = state.board;
    const set = new Set();
    const endRow = vpRow + vpRows;
    const endCol = vpCol + vpCols;
    for (let r = vpRow; r < endRow; r++) {
      for (let c = vpCol; c < endCol; c++) {
        set.add(r * width + c);
      }
    }
    return set;
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
   */
  function tileMatchesChar(tile, ch) {
    if (!tile || tile.corrupted) return false;
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
      return () => Infinity; // no corruption — distance irrelevant
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
  // Core DFS
  // ---------------------------------------------------------------------------

  /**
   * DFS with backtracking over the visible viewport.
   *
   * When multiple complete paths are found, keeps the one with the lowest
   * average Manhattan distance to the nearest corrupted tile.
   *
   * @param {object}   state
   * @param {string}   word        - uppercase word to find
   * @returns {Array<{col, row}>}  - winning path, or [] if none
   */
  function findPath(state, word) {
    if (!word || word.length === 0) return [];

    const { width, height } = state.board;
    const viewportSet = getViewportIndexSet(state);
    const distFn = buildCorruptionDistanceFn(state);
    const upperWord = word.toUpperCase();
    const wordLen = upperWord.length;

    let bestPath = null;
    let bestScore = Infinity;

    // visited: flat index → boolean (reused across DFS branches via add/delete)
    const visited = new Set();

    function dfs(col, row, depth, currentPath) {
      const tile = getTile(state, col, row);
      if (!tile) return;

      const idx = row * width + col;

      // Must be in viewport, not visited, not corrupted, and match current char
      if (!viewportSet.has(idx)) return;
      if (visited.has(idx)) return;
      if (!tileMatchesChar(tile, upperWord[depth])) return;

      visited.add(idx);
      currentPath.push({ col, row });

      if (depth === wordLen - 1) {
        // Complete path found — score it
        const score = pathScore(currentPath, distFn);
        if (score < bestScore) {
          bestScore = score;
          bestPath = currentPath.slice(); // copy
        }
      } else {
        // Recurse into all 8 neighbours
        const neighbours = getAdjacent(col, row, width, height);
        for (let i = 0; i < neighbours.length; i++) {
          dfs(neighbours[i][0], neighbours[i][1], depth + 1, currentPath);
        }
      }

      currentPath.pop();
      visited.delete(idx);
    }

    // Try every viewport tile as a potential start
    const { col: vpCol, row: vpRow, cols: vpCols, rows: vpRows } = state.viewport;
    const endRow = vpRow + vpRows;
    const endCol = vpCol + vpCols;

    for (let r = vpRow; r < endRow; r++) {
      for (let c = vpCol; c < endCol; c++) {
        dfs(c, r, 0, []);
      }
    }

    return bestPath || [];
  }

  // ---------------------------------------------------------------------------
  // Prefix highlighting
  // ---------------------------------------------------------------------------

  /**
   * Return all tiles in the viewport that COULD start a word matching the
   * given prefix — i.e., tiles from which a valid connected prefix-path exists.
   *
   * @param {object} state
   * @param {string} prefix - uppercase prefix typed so far
   * @returns {Array<{col, row}>}
   */
  function findPrefixStarts(state, prefix) {
    if (!prefix || prefix.length === 0) return [];

    const { width, height } = state.board;
    const viewportSet = getViewportIndexSet(state);
    const upperPrefix = prefix.toUpperCase();
    const prefixLen = upperPrefix.length;

    const startSet = new Set(); // flat indices of valid start tiles

    const visited = new Set();

    // Returns true if any prefix-path of `remainingDepth` more steps exists
    // starting at (col, row) for character index `depth`.
    function dfsPrefix(col, row, depth) {
      const tile = getTile(state, col, row);
      if (!tile) return false;
      const idx = row * width + col;
      if (!viewportSet.has(idx)) return false;
      if (visited.has(idx)) return false;
      if (!tileMatchesChar(tile, upperPrefix[depth])) return false;

      if (depth === prefixLen - 1) return true; // matched full prefix

      visited.add(idx);
      const neighbours = getAdjacent(col, row, width, height);
      let found = false;
      for (let i = 0; i < neighbours.length && !found; i++) {
        found = dfsPrefix(neighbours[i][0], neighbours[i][1], depth + 1);
      }
      visited.delete(idx);
      return found;
    }

    const { col: vpCol, row: vpRow, cols: vpCols, rows: vpRows } = state.viewport;
    const endRow = vpRow + vpRows;
    const endCol = vpCol + vpCols;

    for (let r = vpRow; r < endRow; r++) {
      for (let c = vpCol; c < endCol; c++) {
        const tile = getTile(state, c, r);
        if (!tile || tile.corrupted) continue;
        if (!tileMatchesChar(tile, upperPrefix[0])) continue;
        if (dfsPrefix(c, r, 0)) {
          startSet.add(r * width + c);
        }
      }
    }

    const results = [];
    startSet.forEach((idx) => {
      const col = idx % width;
      const row = Math.floor(idx / width);
      results.push({ col, row });
    });
    return results;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.LD.Pathfinder = {
    /**
     * Find the best (closest-to-corruption) path spelling `word` in the
     * current viewport. Returns [] if none exists.
     */
    findPath,

    /**
     * Return all viewport tile positions that can start a connected path
     * matching `prefix`.
     */
    findPrefixStarts,

    /**
     * Utility exposed for other modules that need adjacency information.
     */
    getAdjacent,
  };
})();
