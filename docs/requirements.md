---
title: Requirements
sidebar_position: 1.1
---

The core player has **no runtime dependencies** — it works with a plain `<script>` tag or any bundler.

The optional framework/library integrations require the matching library as a peer dependency, only if you import that subpath:

- `@javaabu/dhivehigpt-player/react` requires [React 17+](https://react.dev/) and `react-dom`.
- `@javaabu/dhivehigpt-player/vue` requires [Vue 3+](https://vuejs.org/).
- `@javaabu/dhivehigpt-player/svelte` requires [Svelte 3+](https://svelte.dev/) (works unmodified on Svelte 5 too — see [Svelte](./modules/svelte#version-compatibility)).
- `@javaabu/dhivehigpt-player/jquery` requires [jQuery 3+](https://jquery.com/).

None of these are required (or installed) if you only use the core `@javaabu/dhivehigpt-player` entry point.

## Browser support

Built for modern evergreen browsers — **Safari 10.1+, Chrome 58+, Firefox 52+, Edge 15+** (roughly 2017 onward), which covers the overwhelming majority of real-world traffic. Internet Explorer isn't supported.

This is a deliberate target, not an oversight: it lets the player use CSS custom properties, flexbox, `MutationObserver`, and Pointer Events directly — all broadly supported in that range — rather than working around their absence, which would mean a meaningfully heavier, more complex library for browsers with negligible remaining usage. Published builds are compiled down to that target (`es2017`) so consumers don't need to transpile `node_modules` themselves to support it.

A few specific compatibility notes:

- Flexbox `gap` isn't used (Safari < 14.1 lacks it) — spacing is done with margins instead.
- Auto dark mode falls back from `MediaQueryList.addEventListener` to the legacy `addListener`/`removeListener` pair on browsers that only support the older API (older Safari).
- `-webkit-user-select` is included alongside the unprefixed `user-select` for older Safari.
