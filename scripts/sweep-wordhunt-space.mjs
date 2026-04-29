#!/usr/bin/env node

import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);
const args = process.argv.slice(2);

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

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsv(value, fallback) {
  if (!value) return fallback.slice();
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const runs = parsePositiveInt(readArg('--runs', '3'), 3);
const solverMinLength = parsePositiveInt(readArg('--solver-min-length', '5'), 5);
const boardSizes = parseCsv(readArg('--board-sizes', ''), ['small', 'medium', 'large']);
const difficulties = parseCsv(readArg('--difficulties', ''), ['easy', 'medium', 'hard']);
const specialTilesModes = parseCsv(readArg('--special-tiles', ''), ['off', 'on']);
const url = readArg('--url', null);
const viewport = readArg('--viewport', null);
const timeout = readArg('--timeout', null);
const settle = readArg('--settle', null);
const configOverrides = readArgs('--config-override');

function buildArgs(config) {
  const childArgs = [
    'scripts/simulate-board-yield.mjs',
    '--runs', String(runs),
    '--solver-min-length', String(solverMinLength),
    '--board-size', config.boardSize,
    '--difficulty', config.difficulty,
    '--special-tiles', config.specialTiles,
  ];

  if (url) childArgs.push('--url', url);
  if (viewport) childArgs.push('--viewport', viewport);
  if (timeout) childArgs.push('--timeout', timeout);
  if (settle) childArgs.push('--settle', settle);
  for (const override of configOverrides) {
    childArgs.push('--config-override', override);
  }

  return childArgs;
}

async function runOne(config) {
  const childArgs = buildArgs(config);
  const { stdout } = await execFile(process.execPath, childArgs, {
    cwd: process.cwd(),
    maxBuffer: 40 * 1024 * 1024,
  });

  const result = JSON.parse(stdout);
  return {
    boardSize: config.boardSize,
    difficulty: config.difficulty,
    specialTiles: config.specialTiles === 'on',
    runs: result.runs,
    solverMinLength: result.solverMinLength,
    averages: result.averages,
    perRun: result.perRun,
  };
}

async function main() {
  const configs = [];
  for (const boardSize of boardSizes) {
    for (const difficulty of difficulties) {
      for (const specialTiles of specialTilesModes) {
        configs.push({ boardSize, difficulty, specialTiles });
      }
    }
  }

  const results = [];
  for (const config of configs) {
    results.push(await runOne(config));
  }

  process.stdout.write(`${JSON.stringify({
    runsPerConfig: runs,
    solverMinLength,
    configsTested: results.length,
    results,
  }, null, 2)}\n`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
