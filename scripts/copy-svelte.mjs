// Copies the raw Svelte component into dist/svelte/ as part of the build.
// Unlike React/Vue, Svelte components ship as uncompiled .svelte source —
// the consumer's own bundler (Vite/SvelteKit/webpack+svelte-loader)
// compiles it, since Svelte's compiled output isn't a stable public API to
// pin a published package to.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(rootDir, 'src', 'svelte', 'DhivehiGPTPlayer.svelte');
const destDir = join(rootDir, 'dist', 'svelte');
const dest = join(destDir, 'DhivehiGPTPlayer.svelte');

mkdirSync(destDir, { recursive: true });

// The source file imports the core player relatively (so it resolves
// correctly inside this repo, for tests/examples). The published copy
// needs to import the package's own name instead, so it resolves via the
// consumer's node_modules once installed.
const contents = readFileSync(src, 'utf8').replace(
  "import { AudioPlayer } from '../AudioPlayer';",
  "import { AudioPlayer } from '@javaabu/dhivehigpt-player';",
);
writeFileSync(dest, contents);

console.log(`Copied ${src} -> ${dest}`);
