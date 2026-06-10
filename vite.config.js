import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function copyLegacyModules() {
  return {
    name: 'copy-legacy-modules',
    closeBundle() {
      const sourceDir = path.resolve(__dirname, 'modules');
      const targetDir = path.resolve(__dirname, 'dist/modules');
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.cpSync(sourceDir, targetDir, { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyLegacyModules()],
  test: {
    environment: 'jsdom',
    include: ['modules/**/*.test.js'],
    restoreMocks: true,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
