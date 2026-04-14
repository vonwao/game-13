const LEGACY_MODULES = [
  'dictionary',
  'common_words',
  'constants',
  'board',
  'pathfinder',
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
  window.__LD_SHELL_MODE__ = true;
  if (window.LD && window.LD.Game) return Promise.resolve(window.LD.Game);
  if (loadPromise) return loadPromise;

  window.__LD_DISABLE_AUTO_BOOT__ = true;
  window.LD = window.LD || {};

  loadPromise = LEGACY_MODULES.reduce((chain, name) => {
    return chain.then(() => loadScript(`/modules/${name}.js`));
  }, Promise.resolve()).then(() => window.LD.Game || null);

  return loadPromise;
}
