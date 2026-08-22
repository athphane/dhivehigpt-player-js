---
title: Sticky player
sidebar_position: 6
---

Articles are often long enough that the player scrolls out of view while it's still playing. Enable `data-sticky="true"` (or `sticky: true` programmatically) to have a second, floating bar appear at the bottom of the viewport for as long as it's playing:

```html
<audio data-dhivehigpt-player data-sticky="true" src="https://example.com/article.mp3"></audio>
```

- The original inline bar **stays exactly where it is on the page** — it's never repositioned or hidden.
- When playback starts, a **separate** full-width bar animates up from the bottom of the screen (an eased slide-up transition, [flush](./styling-and-theming#flush) styling: no radius/border) and stays in sync with the same playback state — pressing play/pause or dragging the seek bar on either bar controls the same audio.
- This floating bar has its own **stop button** (same size/shape as the play button) alongside play/pause — that's the only thing on it that dismisses it. **It stays put through pause and through the audio ending naturally**: a visitor who pauses to re-read a paragraph, or who reaches the end of the article, shouldn't lose it.
- Clicking stop pauses, resets to the start, and animates the floating bar back down before removing it from the page.
- The inline bar never has a stop button — pausing it is enough, since it doesn't go anywhere.

Programmatically, call `player.stop()` — it's the only thing (besides `destroy()`) that dismisses the floating bar. `pause()` and letting playback end do not.

```javascript
player.on('stop', () => console.log('sticky bar dismissed'));

// The floating bar's element, if you need it directly — null until sticky is enabled:
player.stickyElement;
```

Sticky is off (`false`) by default — only the inline bar is ever built, with no stop button, unless you opt in.
