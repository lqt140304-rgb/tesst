import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import base from './vite.config';

// Fallback deliverable: one self-contained HTML that opens from file:// (like the owner's earlier hero demo).
export default mergeConfig(
  base,
  defineConfig({
    plugins: [viteSingleFile()],
    build: { outDir: 'dist-single', assetsInlineLimit: () => true },
  }),
);
