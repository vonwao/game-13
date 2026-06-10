import { notifyCoreReady } from './gameBridge.js';

const LEGACY_MODULES = [
  'dictionary',
  'common_words',
  'constants',
  'board',
  'pathfinder',
  'scoring',
  'solver',
  'challenges',
  'particles',
  'audio',
  'renderer',
  'settings',
  'touch',
  'input',
  'actions',
  'game',
];

let loadPromise = null;

function publishRuntimeFlags() {
  window.__LD_SHELL_MODE__ = true;
  window.__LD_DEV_MODE__ = import.meta.env.DEV;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load legacy script: ${src}`));
    document.body.appendChild(script);
  });
}

export function loadLegacyCore() {
  if (typeof window === 'undefined') return Promise.resolve();
  publishRuntimeFlags();
  if (window.LD && window.LD.Game) {
    notifyCoreReady();
    return Promise.resolve(window.LD.Game);
  }
  if (loadPromise) return loadPromise;

  window.__LD_DISABLE_AUTO_BOOT__ = true;
  window.LD = window.LD || {};

  loadPromise = LEGACY_MODULES.reduce((chain, name) => {
    return chain.then(() => loadScript(`/modules/${name}.js`));
  }, Promise.resolve()).then(() => {
    notifyCoreReady();
    return window.LD.Game || null;
  });

  return loadPromise;
}
