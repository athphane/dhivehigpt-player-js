import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Builds a single global (window.DhivehiGPTPlayer) UMD/IIFE bundle of the
// core (framework-free) player for direct <script> / jsDelivr use.
export default defineConfig({
  define: {
    __DHIVEHIGPT_PLAYER_AUTO_INIT__: 'true',
  },
  build: {
    emptyOutDir: false,
    // This is the file embedded directly via <script src="..."> on
    // third-party sites with no further transpilation — keep it running on
    // as wide a browser range as reasonably possible. es2017 covers Safari
    // 10.1+/Chrome 58+/Firefox 52+/Edge 15+ while keeping native
    // async/await (no generator downleveling).
    target: 'es2017',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DhivehiGPTPlayer',
      formats: ['umd'],
      fileName: () => 'dhivehigpt-player.umd.min.js',
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    minify: 'esbuild',
  },
});
