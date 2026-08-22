import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dts from 'vite-plugin-dts';

// Builds the ES + CJS outputs for the main entry and the optional
// React / Vue framework wrappers as separate subpath entry points.
//
// Note: the svelte() plugin here is only exercised by the test suite (it
// compiles src/svelte/DhivehiGPTPlayer.svelte for @testing-library/svelte).
// The actual build never imports that file from a JS entry, so it's never
// compiled into dist/ — it's copied as raw source instead (see
// scripts/copy-svelte.mjs), since Svelte's compiled output isn't a stable
// public API to publish against.
export default defineConfig({
  plugins: [
    react(),
    svelte(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      include: ['src'],
      exclude: ['src/**/*.test.*'],
      insertTypesEntry: true,
    }),
  ],
  define: {
    __DHIVEHIGPT_PLAYER_AUTO_INIT__: 'false',
  },
  build: {
    // This is the *first* of the two build steps in `npm run build` — it
    // should start from a clean dist/, otherwise every rebuild leaves
    // behind the previous run's hashed chunk files (Vite's chunk names
    // include a content hash, so they never get overwritten, only
    // accumulated) and that cruft ends up published to npm. The second
    // step (vite.umd.config.ts) sets this to false instead, since it
    // needs to add its single file to what this step just produced
    // without wiping it.
    emptyOutDir: true,
    // Most bundlers don't transpile node_modules by default, so a published
    // package shipping untranspiled modern syntax can still break consumers
    // on older browsers. es2017 covers Safari 10.1+/Chrome 58+/Firefox 52+/
    // Edge 15+ while keeping native async/await (no generator downleveling).
    target: 'es2017',
    lib: {
      entry: {
        'dhivehigpt-player': resolve(__dirname, 'src/index.ts'),
        'react/dhivehigpt-player-react': resolve(__dirname, 'src/react/index.tsx'),
        'vue/dhivehigpt-player-vue': resolve(__dirname, 'src/vue/index.ts'),
        'jquery/dhivehigpt-player-jquery': resolve(__dirname, 'src/jquery/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      // Note: no 'jquery' entry needed here — the jquery subpath never
      // imports jquery itself, callers pass their own instance in. 'svelte'
      // is listed defensively even though no JS entry imports the .svelte
      // file (see the note above) — it's copied as raw source, not bundled.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'vue', 'svelte'],
      output: {
        exports: 'named',
      },
    },
  },
  // Under Vitest, Vite's module resolution otherwise picks svelte's "ssr"
  // export condition (Node-target internals with no-op lifecycle hooks)
  // instead of the "browser" one — silently breaking onMount/reactivity
  // while still rendering static markup, which is a well-known Vitest +
  // Svelte gotcha. Forcing the browser condition (test-only, so it doesn't
  // affect the real build's own resolution) fixes it.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
});
