#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile as execFileCb } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CAPTURE_SCRIPT = path.join(ROOT, 'scripts', 'capture-board-snapshot.mjs');
const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readArg(flag, fallback = null) {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

function parsePositiveInt(value, fallback, max = Infinity) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function round(value) {
  return Number(value.toFixed(2));
}

function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function lengthMultiplier(len) {
  if (len <= 3) return 1.0;
  if (len === 4) return 1.5;
  if (len === 5) return 2.0;
  if (len === 6) return 3.0;
  if (len === 7) return 5.0;
  return 8.0;
}

function sortRankedEntries(a, b) {
  if (!!a.playable !== !!b.playable) return a.playable ? -1 : 1;
  if ((b.modelScore || 0) !== (a.modelScore || 0)) return (b.modelScore || 0) - (a.modelScore || 0);
  if ((b.length || 0) !== (a.length || 0)) return (b.length || 0) - (a.length || 0);
  if ((a.corners || 0) !== (b.corners || 0)) return (a.corners || 0) - (b.corners || 0);
  return String(a.word || '').localeCompare(String(b.word || ''));
}

function toShapeLabel(entry) {
  if (entry.isHorizontal) return 'horizontal';
  if (entry.isVertical) return 'vertical';
  if (entry.isDiagonal) return 'diagonal';
  if (entry.isStraight) return 'straight';
  return `corners:${entry.corners || 0}`;
}

function buildUsage() {
  return [
    'Usage:',
    '  node scripts/compare-scoring-models.mjs --snapshot tmp/snapshot.json',
    '  node scripts/compare-scoring-models.mjs --board-size small --difficulty easy',
    '',
    'Options:',
    '  --snapshot <file>     Read an existing board snapshot JSON file.',
    '  --out <file>          Write the report to a file instead of stdout.',
    '  --min-length <n>      Solver minimum word length. Default: 5.',
    '  --top <n>             Top entries to retain per model. Default: 10, max: 25.',
    '  --only-playable       Compare only playable entries.',
    '  --headed              Pass through to live capture.',
    '',
    'Live capture passthrough:',
    '  --url --board-size --difficulty --end-condition --special-tiles --viewport --timeout --settle',
  ].join('\n');
}

async function readSnapshotFile(snapshotPath) {
  const raw = await fs.readFile(snapshotPath, 'utf8');
  return JSON.parse(raw);
}

async function captureSnapshotLive(minLength) {
  const captureArgs = [];
  const passthroughFlags = [
    '--url',
    '--board-size',
    '--difficulty',
    '--end-condition',
    '--special-tiles',
    '--viewport',
    '--timeout',
    '--settle',
  ];

  for (const flag of passthroughFlags) {
    const value = readArg(flag, null);
    if (value !== null) captureArgs.push(flag, value);
  }

  captureArgs.push('--solver-min-length', String(minLength));
  captureArgs.push('--solver-limit', '1');
  captureArgs.push('--solver-entry-limit', '0');
  if (hasFlag('--headed')) captureArgs.push('--headed');

  const { stdout, stderr } = await execFile(
    process.execPath,
    [CAPTURE_SCRIPT, ...captureArgs],
    {
      cwd: ROOT,
      maxBuffer: 20 * 1024 * 1024,
    },
  );

  const snapshot = JSON.parse(stdout);
  if (stderr && stderr.trim()) {
    snapshot._captureStderr = stderr.trim();
  }
  return snapshot;
}

function validateSnapshot(snapshot) {
  const board = snapshot?.core?.board;
  if (!board || !Array.isArray(board.tiles) || !Number.isFinite(board.width) || !Number.isFinite(board.height)) {
    throw new Error('Snapshot is missing core.board tiles/size data');
  }
}

let solverReadyPromise = null;

async function ensureSolverReady() {
  if (solverReadyPromise) return solverReadyPromise;

  solverReadyPromise = (async () => {
    globalThis.window = globalThis;
    globalThis.window.LD = globalThis.window.LD || {};

    await import(pathToFileURL(path.join(ROOT, 'modules', 'dictionary.js')).href);
    await import(pathToFileURL(path.join(ROOT, 'modules', 'solver.js')).href);

    const solver = globalThis.window?.LD?.Solver;
    if (!solver || typeof solver.solveBoard !== 'function' || typeof solver.defaultScore !== 'function') {
      throw new Error('Failed to initialize modules/solver.js in Node');
    }
    return solver;
  })();

  return solverReadyPromise;
}

function scoreClassic(entry) {
  return Math.round((entry.tilePoints || 0) * lengthMultiplier(entry.length || 0));
}

function scoreLengthFirst(entry) {
  const lengthBase = (entry.length || 0) * 100;
  const tileBonus = (entry.tilePoints || 0) * 6;
  const shapeBonus = entry.isHorizontal || entry.isVertical
    ? 24
    : entry.isDiagonal
      ? 12
      : -((entry.corners || 0) * 8);
  const crystalBonus = (entry.crystalCount || 0) * 24;
  const emberBonus = entry.emberBonus || 0;
  const wildcardPenalty = (entry.wildcardCount || 0) * 18;
  return lengthBase + tileBonus + shapeBonus + crystalBonus + emberBonus - wildcardPenalty;
}

function describeTopEntry(entry, rank, currentRankByWord = null) {
  const out = {
    rank,
    word: entry.word,
    score: entry.modelScore,
    length: entry.length,
    shape: toShapeLabel(entry),
    playable: !!entry.playable,
    planted: !!entry.planted,
  };

  if (entry.wildcardCount) out.wildcards = entry.wildcardCount;
  if (entry.crystalCount) out.crystals = entry.crystalCount;
  if (entry.emberCount) out.embers = entry.emberCount;
  if (currentRankByWord && currentRankByWord.has(entry.word)) {
    out.currentRank = currentRankByWord.get(entry.word);
    out.rankDeltaFromCurrent = out.currentRank - rank;
  }

  return out;
}

function buildModelResult(model, entries, topN, currentRankByWord = null) {
  const ranked = entries
    .map((entry) => ({
      ...entry,
      modelScore: model.score(entry),
    }))
    .sort(sortRankedEntries);

  const top = ranked.slice(0, topN);
  const rankByWord = new Map(ranked.map((entry, index) => [entry.word, index + 1]));

  return {
    id: model.id,
    label: model.label,
    formula: model.formula,
    summary: {
      topWord: top[0]?.word || null,
      topScore: top[0]?.modelScore || 0,
      topScoreSpread: top.length > 1 ? (top[0].modelScore - top[top.length - 1].modelScore) : 0,
      avgTopLength: average(top.map((entry) => entry.length || 0)),
      avgTopCorners: average(top.map((entry) => entry.corners || 0)),
      playableTopCount: top.filter((entry) => entry.playable).length,
      plantedTopCount: top.filter((entry) => entry.planted).length,
      organicTopCount: top.filter((entry) => entry.organic).length,
    },
    top: top.map((entry, index) => describeTopEntry(entry, index + 1, currentRankByWord)),
    ranked,
    rankByWord,
  };
}

function buildTopOverlap(models, topN) {
  const overlaps = {};

  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      const left = models[i];
      const right = models[j];
      const leftWords = new Set(left.top.slice(0, topN).map((entry) => entry.word));
      const shared = right.top.filter((entry) => leftWords.has(entry.word)).length;
      overlaps[`${left.id}__${right.id}`] = shared;
    }
  }

  return overlaps;
}

function buildRankMovers(currentModel, candidateModel, limit = 5, windowSize = 25) {
  const movers = [];
  const focusWords = candidateModel.ranked.slice(0, windowSize).map((entry) => entry.word);

  for (const word of focusWords) {
    const candidateRank = candidateModel.rankByWord.get(word);
    const currentRank = currentModel.rankByWord.get(word);
    if (!currentRank || !candidateRank) continue;
    const delta = currentRank - candidateRank;
    if (delta === 0) continue;
    movers.push({ word, currentRank, candidateRank, delta });
  }

  movers.sort((a, b) => {
    if (a.candidateRank !== b.candidateRank) return a.candidateRank - b.candidateRank;
    return b.delta - a.delta;
  });

  return movers.slice(0, limit);
}

function buildBoardMetrics(entries, board) {
  const usedCells = new Set();

  for (const entry of entries) {
    if (!Array.isArray(entry.path)) continue;
    for (const step of entry.path) {
      usedCells.add(`${step.col},${step.row}`);
    }
  }

  const tileCount = board.tileCount || ((board.width || 0) * (board.height || 0));

  return {
    totalEntries: entries.length,
    playableEntries: entries.filter((entry) => entry.playable).length,
    blockedEntries: entries.filter((entry) => !entry.playable).length,
    plantedEntries: entries.filter((entry) => entry.planted).length,
    organicEntries: entries.filter((entry) => entry.organic).length,
    playableFivePlusCount: entries.filter((entry) => entry.playable && (entry.length || 0) >= 5).length,
    cellsUsedByAnySolutionPct: tileCount > 0 ? round((usedCells.size / tileCount) * 100) : 0,
  };
}

async function solveSnapshotEntries(snapshot, minLength, onlyPlayable) {
  const solver = await ensureSolverReady();
  const options = {
    minLength,
    dedupeBy: 'word',
  };
  const solved = solver.solveBoard(snapshot.core, options) || [];
  const entries = onlyPlayable ? solved.filter((entry) => entry.playable) : solved;
  return { solver, entries, options };
}

function buildReport(snapshot, sourceMode, snapshotInput, options, solved, models) {
  const board = snapshot.core.board;
  const settings = snapshot.core.settings || {};
  const currentModel = models[0];

  return {
    source: {
      mode: sourceMode,
      snapshot: snapshotInput,
      capturedAt: snapshot.meta?.capturedAt || null,
      url: snapshot.runtime?.url || null,
      settings: {
        boardSize: settings.boardSize || null,
        difficulty: settings.difficulty || null,
        endCondition: settings.endCondition || null,
        specialTiles: typeof settings.specialTiles === 'boolean' ? settings.specialTiles : null,
      },
    },
    board: {
      size: `${board.width}x${board.height}`,
      rows: Array.isArray(board.rows) ? board.rows : [],
      plantedCoveragePct: board.plantedCoveragePct || 0,
      usedCellCount: board.usedCellCount || 0,
      spentCellCount: board.spentCellCount || 0,
      wildcardCount: board.wildcardCount || 0,
      iconCellCount: board.iconCellCount || 0,
    },
    solver: {
      minLength: options.minLength,
      onlyPlayable: options.onlyPlayable,
      metrics: buildBoardMetrics(solved.entries, board),
    },
    models: Object.fromEntries(models.map((model) => [
      model.id,
      {
        label: model.label,
        formula: model.formula,
        summary: model.summary,
        top: model.top,
      },
    ])),
    comparisons: {
      topOverlap: buildTopOverlap(models, options.topN),
      topWordByModel: Object.fromEntries(models.map((model) => [model.id, model.summary.topWord])),
      rankMoversFromCurrent: Object.fromEntries(models
        .filter((model) => model.id !== currentModel.id)
        .map((model) => [model.id, buildRankMovers(currentModel, model, 5, Math.max(options.topN * 4, 20))])),
    },
  };
}

async function writeReport(report, outFile) {
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  if (!outFile) {
    process.stdout.write(payload);
    return;
  }

  await fs.writeFile(outFile, payload);
  console.error(`wrote report to ${outFile}`);
}

async function main() {
  if (hasFlag('--help')) {
    process.stdout.write(`${buildUsage()}\n`);
    return;
  }

  const snapshotArg = readArg('--snapshot', null);
  const outFile = readArg('--out', null);
  const minLength = parsePositiveInt(readArg('--min-length', readArg('--solver-min-length', '5')), 5, 12);
  const topN = parsePositiveInt(readArg('--top', '10'), 10, 25);
  const onlyPlayable = hasFlag('--only-playable');

  const sourceMode = snapshotArg ? 'snapshot-file' : 'live-capture';
  const snapshot = snapshotArg
    ? await readSnapshotFile(path.resolve(process.cwd(), snapshotArg))
    : await captureSnapshotLive(minLength);

  validateSnapshot(snapshot);

  const solved = await solveSnapshotEntries(snapshot, minLength, onlyPlayable);
  const modelDefs = [
    {
      id: 'current',
      label: 'Current live scoring',
      formula: 'liveBasePoints * lenMult * shape * crystal * wildcard + ember',
      score: (entry) => solved.solver.defaultScore(entry),
    },
    {
      id: 'classic',
      label: 'Tile points x length only',
      formula: 'tilePoints * lenMult',
      score: scoreClassic,
    },
    {
      id: 'lengthFirst',
      label: 'Length-first, lighter modifiers',
      formula: 'length*100 + tile*6 + shape +/- specials',
      score: scoreLengthFirst,
    },
  ];

  const currentModel = buildModelResult(modelDefs[0], solved.entries, topN);
  const otherModels = modelDefs
    .slice(1)
    .map((model) => buildModelResult(model, solved.entries, topN, currentModel.rankByWord));
  const models = [currentModel, ...otherModels];

  const report = buildReport(
    snapshot,
    sourceMode,
    snapshotArg ? path.resolve(process.cwd(), snapshotArg) : null,
    { minLength, onlyPlayable, topN },
    solved,
    models,
  );

  await writeReport(report, outFile);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
