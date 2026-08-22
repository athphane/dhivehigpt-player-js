---
title: Svelte
sidebar_position: 11
---

`@javaabu/dhivehigpt-player/svelte` exports a `DhivehiGPTPlayer.svelte` component wrapping `AudioPlayer`.

Unlike the React/Vue wrappers, this ships as **uncompiled Svelte source** rather than pre-built JS — your own bundler (Vite/SvelteKit, webpack+svelte-loader, etc.) compiles it, since Svelte's compiled output isn't a stable public API to publish a package against. This also means it isn't a stable Svelte-version target beyond what's documented below.

```svelte
<script>
  import DhivehiGPTPlayer from '@javaabu/dhivehigpt-player/svelte';
</script>

<DhivehiGPTPlayer
  src="https://example.com/article.mp3"
  accent
  sticky
  on:ready={(e) => console.log('ready', e.detail)}
/>
```

## Props

All [player options](./programmatic-api#methods) (`dark`, `accent`, `shadow`, `flush`, `showTime`, `showSpeed`, `showVolume`, `speeds`, `sticky`, `loadFont`) are accepted as props, plus `src` (required).

## Events

`on:ready` fires once with the underlying `AudioPlayer` instance (`event.detail`).

Changing `src` or any option prop destroys and recreates the underlying player. The player is destroyed automatically when the component unmounts.

## Version compatibility

The component is written with Svelte's classic `export let` props / `onMount`/`onDestroy` API (not Svelte 5 runes), which works unmodified on Svelte 3, 4, and 5 — Svelte 5 keeps full backwards compatibility with components written this way.
