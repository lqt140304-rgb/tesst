import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',                       // relative URLs: dist works under any path (Artifact, sub-folder, static server)
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 250 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
