#!/usr/bin/env node

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);
const args = process.argv.slice(2);

function hasFlag(flag) {
  return args.includes(flag);
}

function readArg(flag, fallback = null) {
  const index = args.indexOf(flag);
  if (index < 0 || index + 1 >= args.length) return fallback;
  return args[index + 1];
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const runs = parsePositiveInt(readArg('--runs', '5'), 5);
const solverMinLength = parsePositiveInt(readArg('--solver-min-length', '5'), 5);
const snapshotArgs = [];
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
  if (value !== null) snapshotArgs.push(flag, value);
}

snapshotArgs.push('--solver-min-length', String(solverMinLength));
snapshotArgs.push('--solver-limit', '10');
if (hasFlag('--headed')) snapshotArgs.push('--headed');

function round(value) {
  return Number(value.toFixed(2));
}

function safeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function mergeByLength(target, source) {
  const out = { ...target };
  for (const [key, value] of Object.entries(source || {})) {
    out[key] = safeNumber(out[key]) + safeNumber(value);
  }
  return out;
}

async function captureOne(runIndex) {
  const { stdout, stderr } = await execFile(process.execPath, ['scripts/capture-board-snapshot.mjs', ...snapshotArgs], {
    cwd: process.cwd(),
    maxBuffer: 20 * 1024 * 1024,
  });

  const snapshot = JSON.parse(stdout);
  if (stderr && stderr.trim()) {
    snapshot._stderr = stderr.trim();
  }
  snapshot._run = runIndex;
  return snapshot;
}

function summarize(runsData) {
  const totals = {
    plantedCoveragePct: 0,
    solverTotal: 0,
    solverPlayable: 0,
    solverBlocked: 0,
    solverPlanted: 0,
    solverOrganic: 0,
    topScore: 0,
  };
  let combinedByLength = {};

  const perRun = runsData.map((data) => {
    const board = data?.core?.board || {};
    const solver = data?.core?.solver || {};
    const summary = solver.summary || {};
    const top = Array.isArray(solver.topSolutions) ? solver.topSolutions[0] || null : null;

    totals.plantedCoveragePct += safeNumber(board.plantedCoveragePct);
    totals.solverTotal += safeNumber(summary.total);
    totals.solverPlayable += safeNumber(summary.playable);
    totals.solverBlocked += safeNumber(summary.blocked);
    totals.solverPlanted += safeNumber(summary.planted);
    totals.solverOrganic += safeNumber(summary.organic);
    totals.topScore += top ? safeNumber(top.score) : 0;
    combinedByLength = mergeByLength(combinedByLength, summary.byLength || {});

    return {
      run: data._run,
      score: safeNumber(data?.core?.score),
      plantedCoveragePct: safeNumber(board.plantedCoveragePct),
      solverSummary: summary,
      topSolution: top,
    };
  });

  const count = runsData.length || 1;
  const avgByLength = {};
  for (const [key, value] of Object.entries(combinedByLength)) {
    avgByLength[key] = round(safeNumber(value) / count);
  }

  return {
    runs: runsData.length,
    solverMinLength,
    averages: {
      plantedCoveragePct: round(totals.plantedCoveragePct / count),
      solverTotal: round(totals.solverTotal / count),
      solverPlayable: round(totals.solverPlayable / count),
      solverBlocked: round(totals.solverBlocked / count),
      solverPlanted: round(totals.solverPlanted / count),
      solverOrganic: round(totals.solverOrganic / count),
      topScore: round(totals.topScore / count),
      byLength: avgByLength,
    },
    perRun,
  };
}

async function main() {
  const runsData = [];
  for (let i = 0; i < runs; i++) {
    runsData.push(await captureOne(i + 1));
  }

  process.stdout.write(`${JSON.stringify(summarize(runsData), null, 2)}\n`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
