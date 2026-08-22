---
title: Alpine.js
sidebar_position: 8
---

The player works with [Alpine.js](https://alpinejs.dev/) out of the box — no special integration needed for the common case.

## Static / data-attribute usage

If the `<audio>` element is present in the initial page HTML, `data-dhivehigpt-player` + `data-*` attributes work exactly as in the [data attributes guide](./data-attributes), whether or not Alpine is also managing other parts of the page.

## Elements Alpine adds or removes (`x-if`, `x-for`, `x-show`)

Call `watch()` once (the [jsDelivr build](./jsdelivr-cdn) does this automatically) and it keeps working as Alpine adds, removes, or re-creates elements:

```javascript
import { watch } from '@javaabu/dhivehigpt-player';

watch(); // observes the whole document for audio[data-dhivehigpt-player] elements
```

- **`x-show`** just toggles CSS `display` — the underlying `<audio>` element and its player are untouched, so playback state is preserved.
- **`x-if` / `x-for`** actually add/remove the element from the DOM. `watch()` picks up newly-added matching elements automatically, and automatically tears down (`destroy()`s) the player for any that get removed — no leaked event listeners or orphaned sticky bars.

## Driving the player from Alpine state

For anything beyond `data-*` config, use `x-init`/`x-ref` with the [programmatic API](./programmatic-api) — the player instance behaves like any other imperatively-created JS object inside an Alpine component:

```html
<div x-data="{ player: null }">
  <audio x-ref="audio" src="https://example.com/article.mp3"></audio>

  <button
    x-init="player = new DhivehiGPTPlayer.AudioPlayer($refs.audio, { accent: true, sticky: true })"
    @click="player.toggle()"
  >
    Toggle
  </button>
</div>
```

(`DhivehiGPTPlayer` here refers to the [jsDelivr/UMD global](./jsdelivr-cdn); swap for a normal `import` if you're using Alpine via a bundler.)
