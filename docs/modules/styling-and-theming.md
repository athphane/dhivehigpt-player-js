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

## Fonts

The design uses the "Outfit" Google Font. To avoid making a third-party network request on every page the player is embedded on, this is **off by default** — the player falls back to a system font stack. Opt in with `data-load-font="true"` (or `loadFont: true` programmatically) if you're comfortable loading it.

## What can't be customized

The "Powered by DhivehiGPT" branding, its link to [dhivehigpt.com](https://dhivehigpt.com), and the core layout/sizing of the control bar are fixed and not configurable — this keeps the player recognizable across every site it appears on.
