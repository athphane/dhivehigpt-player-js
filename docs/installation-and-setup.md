---
title: Installation & Setup
sidebar_position: 1.2
---

# Installation

## Via NPM

```bash
npm install @javaabu/dhivehigpt-player --save
```

Then import and initialize any of the player's [modules](./modules) as needed:

```javascript
import { AudioPlayer, init } from '@javaabu/dhivehigpt-player';

// Auto-convert every audio[data-dhivehigpt-player] element on the page
init();

// Or create a player instance directly
const player = new AudioPlayer('#my-audio', { accent: true });
```

## Via jsDelivr (no build step)

For sites without a JS build pipeline, include the UMD build directly from jsDelivr. It auto-converts every `audio[data-dhivehigpt-player]` element on the page as soon as it loads — no JS of your own required.

```html
<script src="https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player/dist/dhivehigpt-player.umd.min.js"></script>

<audio data-dhivehigpt-player src="https://example.com/article.mp3"></audio>
```

Prefer not to depend on a CDN? The same file is committed in the repo at `dist/dhivehigpt-player.umd.min.js` for direct download. See [Using via jsDelivr / CDN / Download](./modules/jsdelivr-cdn) for more.

## Framework usage

- [React](./modules/react)
- [Vue](./modules/vue)
- [Svelte](./modules/svelte)
- [Angular](./modules/angular)
- [jQuery](./modules/jquery)
- [Alpine.js](./modules/alpine)
- [Laravel Livewire](./modules/livewire)
