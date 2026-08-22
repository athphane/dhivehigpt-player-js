---
title: Laravel Livewire
sidebar_position: 9
---

Livewire re-renders components by diffing/morphing the existing DOM against newly-rendered server HTML (via `morphdom`). Because it doesn't know about the player DOM this library injects next to your `<audio>` element, an unguarded Livewire update can strip that injected DOM out from under an active player during a re-render.

## Recommended: `wire:ignore`

Wrap the `<audio>` element in a container marked `wire:ignore` (or `wire:ignore.self` on a parent that Livewire still needs to update) so Livewire's morph never touches that subtree at all:

```html
<div wire:ignore>
  <audio data-dhivehigpt-player src="https://example.com/article.mp3"></audio>
</div>
```

With `wire:ignore`, the player is initialized once (auto-init, or your own `init()`/`new AudioPlayer(...)` call) and Livewire re-renders around it without disturbing it — the standard pattern for any third-party JS widget (Select2, video.js, chart libraries, etc.) inside a Livewire component.

## If you can't use `wire:ignore`

The library is still safe to use without it. `watch()` (which the [jsDelivr build](./jsdelivr-cdn) enables automatically, and which you can call yourself with the npm package) reconciles players against DOM changes after every mutation batch:

- If Livewire swaps in a brand new `<audio data-dhivehigpt-player>` element, it gets auto-converted like any other newly-added element.
- If Livewire's morph reuses the same `<audio>` node but strips the player's injected sibling DOM (since that DOM wasn't part of the server-rendered HTML being morphed to), `watch()` detects the orphaned player, tears it down cleanly (no leaked listeners or a stranded sticky bar), and re-converts the `<audio>` element fresh.

```javascript
import { watch } from '@javaabu/dhivehigpt-player';

watch();
```

This makes updates resilient, but the player briefly disappears and re-mounts on every Livewire update that touches that DOM region (losing in-progress playback state), which is why `wire:ignore` is the better option whenever the player doesn't need to be part of what Livewire re-renders.

## Re-initializing after `wire:navigate`

If you use Livewire's SPA-style navigation (`wire:navigate`), a fresh page swap replaces the whole `<body>`. Call `init()` again on the `livewire:navigated` event so any `data-dhivehigpt-player` elements on the new page get converted:

```javascript
document.addEventListener('livewire:navigated', () => {
  window.DhivehiGPTPlayer.init();
});
```
