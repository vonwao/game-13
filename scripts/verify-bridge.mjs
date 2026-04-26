// One-shot verification of the React shell <-> legacy core bridge.
// Run against a live Vite dev server (default http://127.0.0.1:5173).
//   node scripts/verify-bridge.mjs
//   node scripts/verify-bridge.mjs --headed
//   node scripts/verify-bridge.mjs --url http://127.0.0.1:5174

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const urlArg = args.indexOf('--url');
const URL = urlArg >= 0 ? args[urlArg + 1] : 'http://127.0.0.1:5173/';

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const tag = pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`${tag}  ${name}${detail ? '  —  ' + detail : ''}`);
}

async function main() {
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // ---- A1: bridge attaches to the real core ----
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // Wait for the bridge to attach. Structural attachment is the real signal:
  // after Start, the shell snapshot must contain real objectives populated by
  // the core (the fallback has 0). The console message is a dev convenience
  // and not load-bearing.
  await page.waitForFunction(
    () => !!(window.LD && window.LD.Game && typeof window.LD.Game.getShellState === 'function'),
    { timeout: 5000 },
  );
  const preStartState = await page.evaluate(() => window.LD.Game.getShellState());
  record(
    'A1 getShellState reports phase=settings before Start',
    preStartState.phase === 'settings',
    `phase=${preStartState.phase}`,
  );
  record(
    'A1 huntSummary.roundTitle present from real core',
    typeof preStartState.huntSummary?.roundTitle === 'string',
    `roundTitle=${preStartState.huntSummary?.roundTitle}`,
  );

  // No page errors during boot.
  record(
    'boot has no uncaught page errors',
    pageErrors.length === 0,
    pageErrors.length ? pageErrors.join(' | ') : '',
  );

  // ---- A1b: pre-start shell overlays are usable ----
  await page.locator('button:has-text("How")').first().click();
  await page.waitForSelector('[data-testid="help-overlay"]', { timeout: 3000 });
  record(
    'A1 pre-start Help opens the help overlay',
    await page.locator('[data-testid="help-overlay"]').count() > 0,
    'help overlay visible',
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="help-overlay"]'),
    { timeout: 3000 },
  );
  record(
    'A1 pre-start Escape closes the help overlay',
    await page.locator('[data-testid="help-overlay"]').count() === 0,
    'help overlay closed',
  );

  await page.locator('button:has-text("Settings")').first().click();
  await page.waitForSelector('[data-testid="settings-overlay"]', { timeout: 3000 });
  record(
    'A1 pre-start Settings opens the settings overlay',
    await page.locator('[data-testid="settings-overlay"]').count() > 0,
    'settings overlay visible',
  );
  await page.locator('[data-testid="settings-overlay"] button:has-text("Large")').first().click();
  await page.waitForTimeout(50);
  const boardSizeAfterSettings = await page.evaluate(() => window.LD.Game.getShellState().settings?.boardSize);
  record(
    'A1 board size setting writes through the shell bridge',
    boardSizeAfterSettings === 'large',
    `boardSize=${boardSizeAfterSettings}`,
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="settings-overlay"]'),
    { timeout: 3000 },
  );
  record(
    'A1 settings overlay closes on Escape',
    await page.locator('[data-testid="settings-overlay"]').count() === 0,
    'settings overlay closed',
  );

  // ---- Click Start Game (the CTA inside the canvas placeholder) ----
  // There are two Start Game buttons: the placeholder one and the title-panel one.
  // Clicking either should transition to phase=playing.
  const startBtn = await page.locator('button:has-text("Start Game")').first();
  await startBtn.click();
  await page.waitForFunction(() => window.LD.Game.getShellState().phase === 'playing', {
    timeout: 5000,
  });
  const playingState = await page.evaluate(() => window.LD.Game.getShellState());
  record(
    'startGame transitions phase to playing',
    playingState.phase === 'playing',
    `phase=${playingState.phase}`,
  );
  record(
    'play state has objectives.items populated',
    Array.isArray(playingState.objectives?.items) && playingState.objectives.items.length > 0,
    `${playingState.objectives?.items?.length || 0} objective(s)`,
  );

  // ---- A2: typing a letter updates inputSummary.typed immediately (no throttle starvation) ----
  // Force-emit on input changes is important; throttle should only gate per-frame snapshots.
  await page.keyboard.press('e');
  await page.waitForTimeout(20);
  const afterE = await page.evaluate(() => window.LD.Game.getShellState().inputSummary?.typed);
  await page.keyboard.press('m');
  await page.keyboard.press('b');
  await page.keyboard.press('e');
  await page.keyboard.press('r');
  await page.waitForTimeout(50);
  const afterEmber = await page.evaluate(
    () => window.LD.Game.getShellState().inputSummary?.typed,
  );

  // Wait for React to flush — the bridge throttles per-frame snapshots to 100ms.
  await page.waitForTimeout(180);
  record(
    'A2 typed letter reflected in inputSummary.typed within 20ms',
    typeof afterE === 'string' && afterE.toLowerCase().startsWith('e'),
    `typed="${afterE}"`,
  );
  record(
    'A2 multi-letter input reflected in inputSummary.typed',
    typeof afterEmber === 'string' && afterEmber.toLowerCase() === 'ember',
    `typed="${afterEmber}"`,
  );

  // ---- A2 (cont): the React DOM action bar shows the typed word ----
  // The shell ActionBar renders state.inputSummary.typed. If throttling were swallowing it,
  // the DOM would lag behind LD.Game.getShellState. They should agree.
  const domTyped = await page
    .locator('[data-testid="action-bar-word"]')
    .first()
    .textContent()
    .catch(() => null);
  // The Page skin renders the word with middots between letters (E·M·B·E·R).
  // Strip them before comparing — the DOM is reflecting the same data, just styled.
  const domTypedNormalized = typeof domTyped === 'string' ? domTyped.replace(/[·\s]/g, '') : '';
  record(
    'A2 React DOM action bar matches inputSummary.typed',
    domTypedNormalized.toLowerCase() === (afterEmber || '').toLowerCase(),
    `dom="${domTyped?.trim()}" → "${domTypedNormalized}" core="${afterEmber}"`,
  );

  // Clear typed word so next assertions don't depend on stale input.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(30);

  // ---- A3: canvas pixel buffer matches mount rect, not window size ----
  async function readSizes() {
    return page.evaluate(() => {
      const canvas = document.getElementById('game');
      const mount = document.querySelector('[data-testid="canvas-mount"]');
      const mountRect = mount ? mount.getBoundingClientRect() : null;
      return {
        canvas: canvas ? { width: canvas.width, height: canvas.height } : null,
        mount: mountRect ? { width: Math.round(mountRect.width), height: Math.round(mountRect.height) } : null,
        window: { width: window.innerWidth, height: window.innerHeight },
      };
    });
  }

  const sizes1440 = await readSizes();
  const tol = 4;
  const matches1440 =
    sizes1440.canvas &&
    sizes1440.mount &&
    Math.abs(sizes1440.canvas.width - sizes1440.mount.width) <= tol &&
    Math.abs(sizes1440.canvas.height - sizes1440.mount.height) <= tol;
  record(
    'A3 canvas pixel buffer matches mount rect at 1440×900',
    matches1440,
    `canvas=${sizes1440.canvas?.width}×${sizes1440.canvas?.height} mount=${sizes1440.mount?.width}×${sizes1440.mount?.height} window=${sizes1440.window.width}×${sizes1440.window.height}`,
  );

  // Resize to a narrower viewport and verify the canvas tracks the mount.
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(150);
  const sizes1100 = await readSizes();
  const matches1100 =
    sizes1100.canvas &&
    sizes1100.mount &&
    Math.abs(sizes1100.canvas.width - sizes1100.mount.width) <= tol &&
    Math.abs(sizes1100.canvas.height - sizes1100.mount.height) <= tol;
  record(
    'A3 canvas resizes with mount when viewport narrows to 1100',
    matches1100,
    `canvas=${sizes1100.canvas?.width}×${sizes1100.canvas?.height} mount=${sizes1100.mount?.width}×${sizes1100.mount?.height}`,
  );

  // Resize to a phone portrait viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const sizes390 = await readSizes();
  const matches390 =
    sizes390.canvas &&
    sizes390.mount &&
    Math.abs(sizes390.canvas.width - sizes390.mount.width) <= tol &&
    Math.abs(sizes390.canvas.height - sizes390.mount.height) <= tol;
  record(
    'A3 canvas resizes with mount at 390×844 portrait',
    matches390,
    `canvas=${sizes390.canvas?.width}×${sizes390.canvas?.height} mount=${sizes390.mount?.width}×${sizes390.mount?.height}`,
  );

  // Confirm canvas is NOT just sized to the window (the old broken behavior).
  record(
    'A3 canvas is NOT window-sized (would indicate the broken pre-fix path)',
    sizes390.canvas &&
      !(sizes390.canvas.width === sizes390.window.width &&
        sizes390.canvas.height === sizes390.window.height),
    `canvas=${sizes390.canvas?.width}×${sizes390.canvas?.height} window=${sizes390.window.width}×${sizes390.window.height}`,
  );

  // ---- A4: phone objectives sheet opens and closes cleanly ----
  await page.locator('[data-testid="phone-objectives-tab"]').click();
  await page.waitForSelector('[data-testid="phone-objectives-sheet"]', { timeout: 3000 });
  record(
    'A4 phone objectives tab opens the bottom sheet',
    await page.locator('[data-testid="phone-objectives-sheet"]').count() > 0,
    'sheet visible',
  );
  await page.locator('[data-testid="phone-objectives-backdrop"]').click({
    position: { x: 20, y: 20 },
  });
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="phone-objectives-sheet"]'),
    { timeout: 3000 },
  );
  record(
    'A4 backdrop tap closes the phone objectives sheet',
    await page.locator('[data-testid="phone-objectives-sheet"]').count() === 0,
    'sheet closed',
  );

  // ---- summary ----
  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  console.log('');
  console.log(`\x1b[1m${passed}/${results.length} checks passed.\x1b[0m`);
  if (failed > 0) {
    console.log('\nFailures:');
    results.filter((r) => !r.pass).forEach((r) => {
      console.log(`  - ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    });
  }
  if (consoleMessages.some((m) => m.type === 'error')) {
    console.log('\nConsole errors during run:');
    consoleMessages.filter((m) => m.type === 'error').forEach((m) => {
      console.log('  ' + m.text);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('verify-bridge crashed:', err);
  process.exit(2);
});
