# Changelog

All notable changes to `@javaabu/dhivehigpt-player` will be documented in this file.

## 1.0.0

Initial release.

- Converts a standard `<audio>` tag into a branded control bar via a `data-dhivehigpt-player` attribute, or programmatically with `new AudioPlayer(...)`.
- Light, dark (`auto` by default, following the OS preference live), and solid-accent themes; configurable shadow/elevation and edge-to-edge "flush" styling.
- Optional sticky-to-bottom playback bar: a second floating bar animates in while playing and stays stuck through pause/end, dismissed only by its own stop button — the inline bar it's attached to never moves.
- Time, playback-speed, and volume controls, each independently toggleable; configurable speed list.
- "Powered by DhivehiGPT" branding, linked to dhivehigpt.com, on every player.
- Zero runtime dependencies; targets modern evergreen browsers (Safari 10.1+/Chrome 58+/Firefox 52+/Edge 15+ — see [requirements](https://docs.javaabu.com/docs/dhivehigpt-player-js/requirements)).
- Distributed as an npm package (ESM + CJS), a self-contained UMD build for `<script>`/jsDelivr use, and committed directly in the repo (`dist/dhivehigpt-player.umd.min.js`) as a download-and-self-host alternative.
- Framework integrations: React and Vue components, a Svelte component, a jQuery plugin, and direct data-attribute support for Alpine.js and Laravel Livewire.
