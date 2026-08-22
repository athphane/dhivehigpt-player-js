import { autoInit } from './auto-init';

// Note: jQuery support (`registerJQueryPlugin`) deliberately isn't
// imported/re-exported here. It's only reachable via the separate
// `@javaabu/dhivehigpt-player/jquery` entry, so this core bundle — the one
// every embedder pays for, including the CDN/UMD build — never carries its
// bytes unless something actually imports that subpath.
export { AudioPlayer } from './AudioPlayer';
export { MediaPlayer } from './core/MediaPlayer';
export { init, watch, unwatch, getInstance } from './auto-init';
export type {
  PlayerOptions,
  PlayerState,
  DarkMode,
  ShadowVariant,
  MediaKind,
  PlayerEventName,
  PlayerEventMap,
} from './core/types';

// Only the UMD/IIFE (browser <script>) build should auto-run — ESM/CJS
// consumers (bundlers, SSR frameworks) opt in explicitly via `init()`.
declare const __DHIVEHIGPT_PLAYER_AUTO_INIT__: boolean | undefined;
if (typeof __DHIVEHIGPT_PLAYER_AUTO_INIT__ !== 'undefined' && __DHIVEHIGPT_PLAYER_AUTO_INIT__) {
  autoInit();
}
