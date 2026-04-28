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

function pickAllowed(value, allowed) {
  return allowed.includes(value) ? value : null;
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
  return page.evaluate(() => {
    const game = window.LD && window.LD.Game;
    const state = window.LD && window.LD.STATE;
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
      },
    };
  });
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
