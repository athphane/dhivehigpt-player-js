---
title: Styling & Theming
sidebar_position: 5
---

The player is intentionally neutral so it can sit on any site, with `#39bbb0` (DhivehiGPT teal) as the only accent color. Styling options are deliberately limited to a handful of variants rather than an open-ended theming API, since this is a shared brand element embedded on third-party pages.

## Light / dark / accent

- **Light** (default) — white background, dark text.
- **Dark** — set with `data-dark="true"`, or leave `data-dark="auto"` (the default) to follow the visitor's OS/browser `prefers-color-scheme` automatically, live.
- **Accent** — `data-accent="true"` gives a solid `#39bbb0` background. Takes priority over dark mode.

## Shadow / elevation

`data-shadow` accepts `none`, `hairline` (default, a subtle border only), `soft`, or `lift` (a more pronounced elevated shadow).

## Flush

`data-flush="true"` removes the border-radius and border, for an edge-to-edge look — useful when the player sits flush against the top of a page or another element. This is applied automatically while a [sticky](./sticky-player) player is stuck to the bottom of the viewport.

## Responsive layout

The bar measures **itself**, not the browser viewport — a player embedded in a narrow sidebar or card reflows the same way a player on a phone screen does, even on an otherwise-wide desktop page. Height always stays 56px; nothing is ever hidden, only rearranged:

- Below **520px** wide, the volume slider collapses to a mute-only toggle (the track/handle disappear, the speaker icon stays).
- Below **430px** wide, the bar switches to two rows: the play button (and, on the [sticky](./sticky-player) bar, the stop button next to it) stays anchored on the left spanning both rows; the seek bar and time sit on the first row; speed, volume, and the "Powered by DhivehiGPT" credit sit on the second. Whichever of time/speed/volume are actually enabled is accounted for — there's never a reserved-but-empty gap for a control you've turned off.

This is implemented with [CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) (`@container`, checking the bar's own width) as the primary mechanism, layered as a progressive enhancement over a `@media` (viewport-width) fallback with the same two breakpoints — container queries aren't supported across the full [browser range](../requirements#browser-support) this library targets, so browsers without support still get the same reflow, just keyed to the viewport instead of the bar's actual width.

## Fonts

The design uses the "Outfit" Google Font. To avoid making a third-party network request on every page the player is embedded on, this is **off by default** — the player falls back to a system font stack. Opt in with `data-load-font="true"` (or `loadFont: true` programmatically) if you're comfortable loading it.

## What can't be customized

The "Powered by DhivehiGPT" branding, its link to [dhivehigpt.com](https://dhivehigpt.com), and the core layout/sizing of the control bar are fixed and not configurable — this keeps the player recognizable across every site it appears on.
