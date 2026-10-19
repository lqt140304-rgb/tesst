import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const target = process.env.VITE_TARGET ?? 'web';

export default defineConfig({
  // Relative URLs: the build works under any path (Artifact host, sub-folder, static server).
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  define: { __TARGET__: JSON.stringify(target) },
  build: { outDir: 'dist', assetsInlineLimit: target === 'artifact' ? 4096 : 0, chunkSizeWarningLimit: 400 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
