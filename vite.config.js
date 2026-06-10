import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const EXCLUDED_LEGACY_MODULE_ARTIFACTS = new Set([
  'filter_words.js',
  'lexicon-deep.html',
  'words_raw.txt',
]);

function copyDirectory(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (EXCLUDED_LEGACY_MODULE_ARTIFACTS.has(entry.name) || entry.name.endsWith('.map')) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyLegacyModules() {
  return {
    name: 'copy-legacy-modules',
    closeBundle() {
      const sourceDir = path.resolve(__dirname, 'modules');
      const targetDir = path.resolve(__dirname, 'dist/modules');
      fs.rmSync(targetDir, { recursive: true, force: true });
      copyDirectory(sourceDir, targetDir);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), copyLegacyModules()],
  test: {
    environment: 'jsdom',
    include: ['modules/**/*.test.js', 'src/**/*.test.js'],
    restoreMocks: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
