# Changelog

All notable changes to `@javaabu/dhivehigpt-player` will be documented in this file.

## 1.1.0

- Responsive layout: the bar reflows based on its own container width (CSS container queries, with a viewport `@media` fallback for browsers without support) rather than the page viewport, so it works correctly in narrow sidebars/cards too. Below 430px it switches to a two-row layout — seek + time on top, speed/volume/credit on the bottom, both aligned to the play button; below 260px the credit text and volume slider drop to icon-only. The bar stays the same height at every width.
- New `attachTo(container)` method for moving the inline bar into a container — the correct way to do it from framework wrappers, since a plain `container.appendChild(player.element)` leaves behind the wrapper element the responsive layout depends on. The React, Vue, and Svelte integrations now use it internally.
- The sticky bar's stop button is now a hollow (outlined, transparent) button, matching the design.

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
