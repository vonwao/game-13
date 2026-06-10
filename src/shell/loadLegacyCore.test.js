import { describe, expect, it } from 'vitest';

import { resolveLegacyModuleSrc } from './loadLegacyCore.js';

describe('resolveLegacyModuleSrc', () => {
  it('resolves modules beside a relative production build at a subpath', () => {
    expect(resolveLegacyModuleSrc(
      'game',
      './',
      'https://example.test/lexicon-deep/index.html',
    )).toBe('https://example.test/lexicon-deep/modules/game.js');
  });

  it('resolves modules beside a relative production build at the root', () => {
    expect(resolveLegacyModuleSrc(
      'game',
      './',
      'https://example.test/index.html',
    )).toBe('https://example.test/modules/game.js');
  });

  it('honors an absolute Vite base path when one is configured', () => {
    expect(resolveLegacyModuleSrc(
      'renderer',
      '/lexicon-deep/',
      'https://example.test/other/index.html',
    )).toBe('https://example.test/lexicon-deep/modules/renderer.js');
  });
});
