---
title: Vue
sidebar_position: 4
---

`@javaabu/dhivehigpt-player/vue` provides a `<DhivehiGPTPlayer>` component wrapping `AudioPlayer`. Requires Vue 3+ as a peer dependency (not installed unless you import this subpath).

```vue
<script setup>
import { DhivehiGPTPlayer } from '@javaabu/dhivehigpt-player/vue';
</script>

<template>
  <DhivehiGPTPlayer
    src="https://example.com/article.mp3"
    :accent="true"
    :sticky="true"
    @ready="(player) => console.log('ready', player)"
  />
</template>
```

## Props

All [player options](./programmatic-api#methods) (`dark`, `accent`, `shadow`, `flush`, `showTime`, `showSpeed`, `showVolume`, `speeds`, `sticky`, `loadFont`) are accepted as props, plus `src` (required).

## Events

`@ready` is emitted once with the underlying `AudioPlayer` instance.

Changing `src` or any option prop destroys and recreates the underlying player. The player is destroyed automatically when the component unmounts.
