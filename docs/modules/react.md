---
title: React
sidebar_position: 3
---

`@javaabu/dhivehigpt-player/react` provides a `<DhivehiGPTPlayer>` component wrapping `AudioPlayer`. Requires React 17+ as a peer dependency (not installed unless you import this subpath).

```jsx
import { DhivehiGPTPlayer } from '@javaabu/dhivehigpt-player/react';

function Article() {
  return (
    <DhivehiGPTPlayer
      src="https://example.com/article.mp3"
      accent
      sticky
      onReady={(player) => console.log('ready', player)}
    />
  );
}
```

## Props

All [player options](./programmatic-api#methods) (`dark`, `accent`, `shadow`, `flush`, `showTime`, `showSpeed`, `showVolume`, `speeds`, `sticky`, `loadFont`) are accepted as props, plus:

| Prop | Description |
|---|---|
| `src` | Required. The audio URL. |
| `onReady` | Called once with the underlying `AudioPlayer` instance. |
| `className` | Applied to the wrapping `<div>`. |
| `audioProps` | Extra props forwarded to the hidden `<audio>` element (e.g. `preload`, `crossOrigin`). |

Changing `src` or any option prop destroys and recreates the underlying player. The player is destroyed automatically on unmount.
