---
title: Data Attributes
sidebar_position: 1
---

The easiest way to use the player is to add `data-dhivehigpt-player` to a standard `<audio>` element. All configuration is read from `data-*` attributes on that same element.

```html
<audio
  data-dhivehigpt-player
  src="https://example.com/article.mp3"
  data-accent="true"
  data-sticky="true"
></audio>
```

This works both with the npm package (call `init()`, or let the UMD build auto-init) and the [jsDelivr CDN build](./jsdelivr-cdn).

## Reference

| Attribute | Values | Default | Description |
|---|---|---|---|
| `data-dhivehigpt-player` | *(presence only)* | — | Marks the element for auto-conversion. Required. |
| `data-src` | URL | — | Overrides the audio source. If omitted, the element's own `src`/`<source>` is used. |
| `data-dark` | `auto` \| `true` \| `false` | `auto` | `auto` follows the visitor's OS/browser dark mode preference live. |
| `data-accent` | `true` \| `false` | `false` | Solid brand-color (`#39bbb0`) skin. Takes priority over `data-dark`. |
| `data-shadow` | `none` \| `hairline` \| `soft` \| `lift` | `hairline` | Controls the bar's box-shadow / elevation. |
| `data-flush` | `true` \| `false` | `false` | Edge-to-edge styling: no border-radius, no border. |
| `data-show-time` | `true` \| `false` | `true` | Show/hide the elapsed / total time label. |
| `data-show-speed` | `true` \| `false` | `true` | Show/hide the playback-speed control. |
| `data-show-volume` | `true` \| `false` | `true` | Show/hide the volume control. |
| `data-speeds` | comma-separated numbers | `1,1.25,1.5,2,0.75` | The list of rates the speed button cycles through, in order. |
| `data-sticky` | `true` \| `false` | `false` | Stick the bar to the bottom of the viewport while playing. See [Sticky player](./sticky-player). |
| `data-load-font` | `true` \| `false` | `false` | Opt-in to loading the "Outfit" font from Google Fonts. See [Styling & Theming](./styling-and-theming#fonts). |

A boolean attribute is also considered `true` when present with an empty value, e.g. `data-accent` alone is the same as `data-accent="true"`.

The "Powered by DhivehiGPT" branding link is always shown and cannot be disabled via attributes.
