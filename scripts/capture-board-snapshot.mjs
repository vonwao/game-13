#!/usr/bin/env node

// Capture one structured runtime snapshot from a live Lexicon Deep shell.
// Run against a Vite dev server (default http://127.0.0.1:5173).
//
// Examples:
//   node scripts/capture-board-snapshot.mjs
//   node scripts/capture-board-snapshot.mjs --board-size small --difficulty easy
//   node scripts/capture-board-snapshot.mjs --out tmp/snapshot.json
//   node scripts/capture-board-snapshot.mjs --headed --viewport 390x844

import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readArg(flag, fallback = null) {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

function readArgs(flag) {
  const values = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && i + 1 < args.length) values.push(args[i + 1]);
  }
  return values;
}

function parseViewport(value) {
  const match = /^(\d+)x(\d+)$/i.exec(String(value || ''));
  if (!match) return { width: 1440, height: 900 };
  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function parseBool(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(value, fallback) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'all') return -1;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function pickAllowed(value, allowed) {
  return allowed.includes(value) ? value : null;
}

function parseOverrideValue(raw) {
  const trimmed = String(raw ?? '').trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseConfigOverrides(values) {
  const overrides = {};
  for (const value of values) {
    const eq = String(value).indexOf('=');
    if (eq <= 0) continue;
    const key = String(value).slice(0, eq).trim();
    const raw = String(value).slice(eq + 1);
    if (!key) continue;
    overrides[key] = parseOverrideValue(raw);
  }
  return overrides;
}

function clonePlain(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

const headed = hasFlag('--headed');
const URL = readArg('--url', 'http://127.0.0.1:5173/');
const outFile = readArg('--out', null);
const timeoutMs = parsePositiveInt(readArg('--timeout', '8000'), 8000);
const settleMs = parsePositiveInt(readArg('--settle', '120'), 120);
const viewport = parseViewport(readArg('--viewport', '1440x900'));
const solverMinLength = parsePositiveInt(readArg('--solver-min-length', '5'), 5);
const solverLimit = parsePositiveInt(readArg('--solver-limit', '25'), 25);
const solverEntryLimit = parseNonNegativeInt(readArg('--solver-entry-limit', '0'), 0);
const configOverrides = parseConfigOverrides(readArgs('--config-override'));

const settingsPatch = {};
const boardSize = pickAllowed(readArg('--board-size', ''), ['small', 'medium', 'large']);
const difficulty = pickAllowed(readArg('--difficulty', ''), ['easy', 'medium', 'hard']);
const endCondition = pickAllowed(readArg('--end-condition', ''), ['challenges', 'timed', 'turns']);
const specialTiles = parseBool(readArg('--special-tiles', ''));

if (boardSize) settingsPatch.boardSize = boardSize;
if (difficulty) settingsPatch.difficulty = difficulty;
if (endCondition) settingsPatch.endCondition = endCondition;
if (specialTiles !== null) settingsPatch.specialTiles = specialTiles;

async function captureSnapshot(page) {
  return page.evaluate(({ solverMinLength, solverLimit, solverEntryLimit }) => {
    const game = window.LD && window.LD.Game;
    const state = window.LD && window.LD.STATE;
    const solver = window.LD && window.LD.Solver;
    if (!game || typeof game.getShellState !== 'function' || !state) {
      throw new Error('Lexicon Deep runtime is not ready');
    }

    const shell = game.getShellState();
    const board = state.board || { width: 0, height: 0, tiles: [] };
    const tiles = Array.isArray(board.tiles) ? board.tiles : [];
    const width = board.width || 0;
    const height = board.height || 0;

    function tileToken(tile) {
      if (!tile) return '.';
      if (tile.icon) return '?';
      if (tile.isSeal) return '#';
      return tile.letter || '.';
    }

    function clonePlain(value) {
      return value == null ? value : JSON.parse(JSON.stringify(value));
    }

    const normalizedTiles = tiles.map((tile, index) => ({
      index,
      row: tile.row,
      col: tile.col,
      letter: tile.letter || null,
      points: tile.points || 0,
      icon: tile.icon || null,
      planted: !!tile.planted,
      found: !!tile.found,
      useCount: tile.useCount || 0,
      corrupted: !!tile.corrupted,
      isSeal: !!tile.isSeal,
    }));

    const rows = [];
    for (let row = 0; row < height; row++) {
      let line = '';
      for (let col = 0; col < width; col++) {
        line += tileToken(tiles[row * width + col]);
      }
      rows.push(line);
    }

    const plantedCellCount = normalizedTiles.filter((tile) => tile.planted).length;
    const usedCellCount = normalizedTiles.filter((tile) => tile.useCount > 0).length;
    const spentCellCount = normalizedTiles.filter((tile) => tile.useCount >= 2).length;
    const wildcardCount = normalizedTiles.filter((tile) => tile.icon === 'void').length;
    const iconCells = normalizedTiles.filter((tile) => tile.icon || tile.isSeal || tile.corrupted);
    const hunt = state.hunt || {};
    const plantedWords = Array.isArray(hunt.plantedWords) ? hunt.plantedWords : [];
    const discoveredWords = Array.isArray(hunt.discoveredWords) ? hunt.discoveredWords : [];
    const solverOptions = {
      minLength: solverMinLength,
      dedupeBy: 'word',
    };
    const solverSolutions = solver && typeof solver.solveBoard === 'function'
      ? solver.solveBoard(state, solverOptions)
      : [];
    const solverSummary = solver && typeof solver.summarizeBoard === 'function'
      ? solver.summarizeBoard(state, solverOptions)
      : null;
    const detailedEntries = solverEntryLimit !== 0
      ? (solverSolutions.slice(
          0,
          solverEntryLimit < 0 ? undefined : solverEntryLimit,
        ).map((entry) => ({
          word: entry.word,
          score: entry.score,
          length: entry.length,
          playable: !!entry.playable,
          planted: !!entry.planted,
          organic: !!entry.organic,
          corners: entry.corners || 0,
          isStraight: !!entry.isStraight,
          isHorizontal: !!entry.isHorizontal,
          isVertical: !!entry.isVertical,
          isDiagonal: !!entry.isDiagonal,
          shapeMult: entry.shapeMult || 1,
          tilePoints: entry.tilePoints || 0,
          lengthBase: entry.lengthBase || 0,
          tileBonus: entry.tileBonus || 0,
          shapeBonus: entry.shapeBonus || 0,
          liveBasePoints: entry.liveBasePoints || 0,
          wildcardCount: entry.wildcardCount || 0,
          wildcardPenalty: entry.wildcardPenalty || 0,
          wildcardMult: entry.wildcardMult || 1,
          crystalCount: entry.crystalCount || 0,
          crystalBonus: entry.crystalBonus || 0,
          crystalMult: entry.crystalMult || 1,
          emberCount: entry.emberCount || 0,
          emberBonus: entry.emberBonus || 0,
          scoreModel: entry.scoreModel || '',
          spentTileCount: entry.spentTileCount || 0,
          wornTileCount: entry.wornTileCount || 0,
          pathCount: entry.pathCount || 0,
          playablePathCount: entry.playablePathCount || 0,
          blockedPathCount: entry.blockedPathCount || 0,
        })))
      : [];

    return {
      meta: {
        capturedAt: new Date().toISOString(),
        source: 'scripts/capture-board-snapshot.mjs',
        userAgent: navigator.userAgent,
      },
      shell: shell,
      core: {
        phase: state.phase,
        gameMode: state.gameMode,
        score: state.score || 0,
        turns: state.turns || 0,
        wordsSpelled: state.wordsSpelled || 0,
        settings: clonePlain(state.settings || {}),
        config: clonePlain(state.config || {}),
        viewport: clonePlain(state.viewport || {}),
        shellLayout: clonePlain(state.shellLayout || null),
        board: {
          width,
          height,
          tileCount: normalizedTiles.length,
          rows,
          tiles: normalizedTiles,
          plantedCellCount,
          plantedCoveragePct: normalizedTiles.length
            ? Number(((plantedCellCount / normalizedTiles.length) * 100).toFixed(2))
            : 0,
          usedCellCount,
          spentCellCount,
          wildcardCount,
          iconCellCount: iconCells.length,
        },
        hunt: {
          round: hunt.round || 0,
          maxRounds: hunt.maxRounds || 0,
          roundTitle: hunt.roundTitle || '',
          cluesRemaining: hunt.cluesRemaining || 0,
          timeRemaining: hunt.timeRemaining || 0,
          turnsRemaining: hunt.turnsRemaining || 0,
          plantedWords: plantedWords.map((entry, index) => ({
            index,
            word: entry && entry.word ? entry.word : '',
            found: !!(entry && entry.found),
          })),
          discoveredWords: discoveredWords.map((entry, index) => ({
            index: typeof entry?.index === 'number' ? entry.index : index,
            word: entry && entry.word ? entry.word : String(entry || ''),
            found: entry && typeof entry === 'object' ? entry.found !== false : true,
          })),
        },
        solver: {
          options: solverOptions,
          summary: solverSummary,
          topSolutions: solverSolutions.slice(0, solverLimit).map((entry) => ({
            word: entry.word,
            score: entry.score,
            length: entry.length,
            playable: !!entry.playable,
            planted: !!entry.planted,
            organic: !!entry.organic,
            corners: entry.corners || 0,
            shapeBonus: entry.shapeBonus || 0,
            wildcardCount: entry.wildcardCount || 0,
            wildcardPenalty: entry.wildcardPenalty || 0,
            pathCount: entry.pathCount || 0,
            playablePathCount: entry.playablePathCount || 0,
            blockedPathCount: entry.blockedPathCount || 0,
          })),
          entryLimit: solverEntryLimit,
          entries: detailedEntries,
        },
      },
    };
  }, { solverMinLength, solverLimit, solverEntryLimit });
}

async function main() {
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
  } catch (err) {
    throw new Error(
      `Failed to load ${URL}. Start the Vite dev server first with "npm run dev". ${err.message}`,
    );
  }

  await page.waitForFunction(
    () => !!(window.LD && window.LD.Game && typeof window.LD.Game.getShellState === 'function' && window.LD.STATE),
    { timeout: timeoutMs },
  );

  if (Object.keys(settingsPatch).length > 0) {
    await page.evaluate((patch) => {
      window.LD.Game.setSettings(patch);
    }, settingsPatch);
  }

  if (Object.keys(configOverrides).length > 0) {
    await page.evaluate((overrides) => {
      if (!window.LD || !window.LD.Constants || typeof window.LD.Constants.resolve !== 'function') {
        throw new Error('LD.Constants.resolve is not available for config overrides');
      }
      if (window.__LD_CAPTURE_RESOLVE_PATCHED__) return;

      const originalResolve = window.LD.Constants.resolve.bind(window.LD.Constants);
      window.LD.Constants.resolve = function patchedResolve(gameMode, settings, layout) {
        const resolved = originalResolve(gameMode, settings, layout);
        if (gameMode !== 'wordhunt') return resolved;
        return { ...resolved, ...overrides };
      };
      window.__LD_CAPTURE_RESOLVE_PATCHED__ = true;
    }, configOverrides);
  }

  await page.evaluate(() => {
    const game = window.LD && window.LD.Game;
    if (!game || typeof game.getShellState !== 'function' || typeof game.startGame !== 'function') return;
    const shell = game.getShellState();
    if (shell && shell.phase === 'settings') {
      game.startGame();
    }
  });

  await page.waitForFunction(
    () => {
      const game = window.LD && window.LD.Game;
      const state = window.LD && window.LD.STATE;
      return !!(
        game &&
        state &&
        game.getShellState &&
        game.getShellState().phase === 'playing' &&
        state.board &&
        Array.isArray(state.board.tiles) &&
        state.board.tiles.length > 0
      );
    },
    { timeout: timeoutMs },
  );

  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }

  const snapshot = await captureSnapshot(page);
  snapshot.runtime = {
    url: URL,
    viewport,
    requestedSettings: clonePlain(settingsPatch),
    requestedConfigOverrides: clonePlain(configOverrides),
    consoleTail: consoleMessages.slice(-20),
    pageErrors,
  };

  const payload = JSON.stringify(snapshot, null, 2);
  if (outFile) {
    await fs.writeFile(outFile, payload);
    console.error(`wrote snapshot to ${outFile}`);
  } else {
    process.stdout.write(`${payload}\n`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
