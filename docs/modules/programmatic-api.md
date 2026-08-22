---
title: Programmatic API
sidebar_position: 2
---

For full control, skip auto-init and create an `AudioPlayer` yourself.

```javascript
import { AudioPlayer } from '@javaabu/dhivehigpt-player';

// target can be a CSS selector or an HTMLAudioElement
const player = new AudioPlayer('#my-audio', {
  src: 'https://example.com/article.mp3', // optional, overrides the element's src
  dark: 'auto',
  accent: false,
  shadow: 'hairline',
  flush: false,
  showTime: true,
  showSpeed: true,
  showVolume: true,
  speeds: [1, 1.25, 1.5, 2, 0.75],
  sticky: false,
  loadFont: false,
});
```

The second argument accepts the same options as the [data attributes](./data-attributes) (camelCase instead of kebab-case). Any option not passed falls back to the element's `data-*` attributes, then the library default.

## Methods

| Method | Description |
|---|---|
| `play()` | Start playback. |
| `pause()` | Pause playback. |
| `toggle()` | Play if paused, pause if playing. |
| `stop()` | Pause, reset to the start, and — if [sticky](./sticky-player) — dismiss a stuck bar. `pause()` alone does not dismiss it. |
| `seek(seconds)` | Seek to a time, clamped to `[0, duration]`. |
| `setVolume(0..1)` | Set the volume, clamped to `[0, 1]`. |
| `mute()` / `unmute()` | Mute, or restore the volume from before muting. |
| `setPlaybackRate(rate)` | Set the playback rate directly. |
| `cyclePlaybackRate()` | Advance to the next rate in `speeds`. |
| `attachTo(container)` | Move the inline bar into `container`. Prefer this over `container.appendChild(player.element)` — moving `element` alone leaves behind the plain wrapper element that gives the bar its [responsive](./styling-and-theming#responsive-layout) container-query context, silently breaking it in the new location. This is how the React/Vue/Svelte wrappers mount the bar inside their own component subtree. |
| `destroy()` | Remove the player and restore the original `<audio>` element. |

## Properties

`playing`, `currentTime`, `duration`, `volume`, `playbackRate`, `element` (the inline control-bar `HTMLDivElement`, which never moves), and `stickyElement` (the floating [sticky](./sticky-player) bar's element — `null` unless `sticky` is enabled) are all available as read-only getters.

## Events

```javascript
player.on('play', () => {});
player.on('pause', () => {});
player.on('stop', () => {});
player.on('ended', () => {});
player.on('timeupdate', ({ currentTime, duration }) => {});
player.on('ratechange', ({ rate }) => {});
player.on('volumechange', ({ volume, muted }) => {});
player.on('destroy', () => {});
```

Remove a listener with `player.off(event, listener)`.

## Auto-init helpers

```javascript
import { init, watch, unwatch, getInstance } from '@javaabu/dhivehigpt-player';

init(); // convert every audio[data-dhivehigpt-player] found in the document right now
watch(); // also auto-convert elements added to the DOM later (e.g. via client-side routing)
unwatch(); // stop watching

const player = getInstance(document.querySelector('audio')); // look up an auto-init'd player
```
