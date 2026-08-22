---
title: Using via jsDelivr / CDN / Download
sidebar_position: 7
---

For sites with no JS build step, load the player directly from [jsDelivr](https://www.jsdelivr.com/):

```html
<script src="https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player/dist/dhivehigpt-player.umd.min.js"></script>

<audio data-dhivehigpt-player src="https://example.com/article.mp3"></audio>
```

The script is a self-contained UMD bundle (no other files are fetched) that:

1. Exposes everything under `window.DhivehiGPTPlayer` (e.g. `window.DhivehiGPTPlayer.AudioPlayer`).
2. Automatically converts every `audio[data-dhivehigpt-player]` element already on the page as soon as it loads, and keeps watching for new ones added later.

## Pinning a version

`@javaabu/dhivehigpt-player` (no version) always resolves to the latest release. Pin a specific version for production use:

```html
<script src="https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player@1.0.0/dist/dhivehigpt-player.umd.min.js"></script>
```

## Using the global programmatically

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    const player = new window.DhivehiGPTPlayer.AudioPlayer('#my-audio', { accent: true });
  });
</script>
```

## Downloading instead of using a CDN

If you'd rather self-host the file than depend on jsDelivr, the same self-contained build is committed in the GitHub repo at [`dist/dhivehigpt-player.umd.min.js`](https://github.com/Javaabu/dhivehigpt-player-js/blob/main/dist/dhivehigpt-player.umd.min.js) — download it directly, or link it straight from GitHub's raw file host:

```html
<script src="https://raw.githubusercontent.com/Javaabu/dhivehigpt-player-js/main/dist/dhivehigpt-player.umd.min.js"></script>
```

Swap `main` for a release tag (e.g. `v1.0.0`) to pin a version, the same way you'd pin a jsDelivr version above.
