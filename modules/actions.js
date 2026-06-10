(function () {
  'use strict';

  window.LD = window.LD || {};

  var _state = null;

  function safeCall(fn) {
    if (typeof fn === 'function') {
      var args = Array.prototype.slice.call(arguments, 1);
      return fn.apply(null, args);
    }
    return undefined;
  }

  function ensureSelectionState() {
    if (!_state) return;
    _state.touch = _state.touch || {};
    _state.touch.selectedTiles = _state.touch.selectedTiles || [];
    _state.touch._scrollBufX = _state.touch._scrollBufX || 0;
    _state.touch._scrollBufY = _state.touch._scrollBufY || 0;
  }

  function getBoardTile(col, row) {
    if (!_state || !_state.board) return null;
    if (col < 0 || row < 0 || col >= _state.board.width || row >= _state.board.height) return null;
    return _state.board.tiles[row * _state.board.width + col] || null;
  }

  function buildWordFromTiles(path) {
    var word = '';
    for (var i = 0; i < path.length; i++) {
      var tile = getBoardTile(path[i].col, path[i].row);
      word += (tile && tile.letter) ? tile.letter : '?';
    }
    return word;
  }

  function isAdjacent(a, b) {
    return Math.abs(a.col - b.col) <= 1 && Math.abs(a.row - b.row) <= 1;
  }

  function syncSelectionToInput() {
    ensureSelectionState();
    var path = _state.touch.selectedTiles;
    if (!path || path.length === 0) {
      safeCall(window.LD?.Input?.clearCurrentWord);
      return;
    }
    safeCall(
      window.LD?.Input?.setCurrentWordPath,
      buildWordFromTiles(path),
      path.slice()
    );
  }

  function clearTileSelection() {
    ensureSelectionState();
    _state.touch.selectedTiles = [];
  }

  function startPath(tile) {
    ensureSelectionState();
    _state.touch.selectedTiles = [{ col: tile.col, row: tile.row }];
    syncSelectionToInput();
  }

  function extendPath(tile) {
    ensureSelectionState();
    _state.touch.selectedTiles.push({ col: tile.col, row: tile.row });
    syncSelectionToInput();
  }

  function trimPathTo(tile) {
    ensureSelectionState();
    var path = _state.touch.selectedTiles;
    for (var i = 0; i < path.length; i++) {
      if (path[i].col === tile.col && path[i].row === tile.row) {
        _state.touch.selectedTiles = path.slice(0, i + 1);
        syncSelectionToInput();
        return true;
      }
    }
    return false;
  }

  function restartPath(tile) {
    startPath(tile);
  }

  function tapTile(col, row) {
    if (!_state || _state.phase !== 'playing') return false;

    var tile = getBoardTile(col, row);
    if (!tile || tile.corrupted || tile.isSeal) return false;

    safeCall(window.LD?.Audio?.play, 'tap');
    ensureSelectionState();

    var path = _state.touch.selectedTiles;
    if (path.length === 0) {
      startPath({ col: col, row: row });
      return true;
    }

    var last = path[path.length - 1];
    if (last.col === col && last.row === row) {
      undoTileSelection();
      return true;
    }

    if (trimPathTo({ col: col, row: row })) {
      return true;
    }

    if (isAdjacent(last, { col: col, row: row })) {
      extendPath({ col: col, row: row });
      return true;
    }

    restartPath({ col: col, row: row });
    return true;
  }

  function undoTileSelection() {
    ensureSelectionState();
    if (_state.touch.selectedTiles.length > 0) {
      _state.touch.selectedTiles.pop();
      syncSelectionToInput();
      return true;
    }
    return false;
  }

  function getSelectedTiles() {
    ensureSelectionState();
    return _state.touch.selectedTiles.slice();
  }

  function clearCurrentWord() {
    clearTileSelection();
    safeCall(window.LD?.Input?.clearCurrentWord);
  }

  function submitCurrentWord() {
    if (!_state || _state.phase !== 'playing') return false;
    if (_state.input && _state.input.valid && _state.input.hasPath) {
      safeCall(window.LD?.Input?.submitCurrentWord);
      clearTileSelection();
      return true;
    }
    safeCall(window.LD?.Input?.rejectCurrentWord);
    return false;
  }

  function rejectCurrentWord() {
    safeCall(window.LD?.Input?.rejectCurrentWord);
  }

  function useClue() {
    return !!safeCall(window.LD?.Input?.useClue);
  }

  function appendLetter(letter) {
    clearTileSelection();
    safeCall(window.LD?.Input?.appendLetter, letter);
  }

  function backspaceLetter() {
    ensureSelectionState();
    if (_state.touch.selectedTiles.length > 0) {
      undoTileSelection();
      return;
    }
    safeCall(window.LD?.Input?.backspaceLetter);
  }

  function scrollBoard(dx, dy) {
    ensureSelectionState();
    clearTileSelection();

    if (
      Number.isInteger(dx) &&
      Number.isInteger(dy) &&
      Math.abs(dx) <= 2 &&
      Math.abs(dy) <= 2
    ) {
      safeCall(window.LD?.Input?.scrollBoard, dx, dy);
      return;
    }

    var ts = (_state && _state.viewport && _state.viewport.tileSize) || 32;
    var colDelta = Math.round((dx || 0) / ts);
    var rowDelta = Math.round((dy || 0) / ts);
    if (colDelta !== 0 || rowDelta !== 0) {
      safeCall(window.LD?.Input?.scrollBoard, colDelta, rowDelta);
    }
  }

  function init(state) {
    _state = state;
    ensureSelectionState();
  }

  window.LD.Actions = {
    init: init,
    startPath: startPath,
    extendPath: extendPath,
    trimPathTo: trimPathTo,
    restartPath: restartPath,
    tapTile: tapTile,
    undoTileSelection: undoTileSelection,
    getSelectedTiles: getSelectedTiles,
    clearCurrentWord: clearCurrentWord,
    submitCurrentWord: submitCurrentWord,
    rejectCurrentWord: rejectCurrentWord,
    useClue: useClue,
    appendLetter: appendLetter,
    backspaceLetter: backspaceLetter,
    scrollBoard: scrollBoard,
  };
})();
