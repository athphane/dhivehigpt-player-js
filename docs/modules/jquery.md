---
title: jQuery
sidebar_position: 10
---

`@javaabu/dhivehigpt-player/jquery` registers `$.fn.dhivehigptPlayer`, a thin wrapper around the [programmatic API](./programmatic-api). It's a separate entry point from the core player — kept out of the main [jsDelivr/CDN script](./jsdelivr-cdn) entirely — so sites that don't use jQuery aren't shipped its bytes.

## Via CDN

Register it with one extra `<script type="module">` after jQuery and the core player script:

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player/dist/dhivehigpt-player.umd.min.js"></script>
<script type="module">
  import { registerJQueryPlugin } from 'https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player/dist/jquery/dhivehigpt-player-jquery.js';
  registerJQueryPlugin(window.jQuery);
</script>

<audio id="my-audio" src="https://example.com/article.mp3"></audio>

<script>
  $('#my-audio').dhivehigptPlayer({ accent: true, sticky: true });
</script>
```

Don't also add `data-dhivehigpt-player` to an element you initialize this way — pick one initialization method per element, the same as with the [programmatic API](./programmatic-api).

## Via npm / a bundler

```javascript
import $ from 'jquery';
import { registerJQueryPlugin } from '@javaabu/dhivehigpt-player/jquery';

registerJQueryPlugin($);
```

If [`@types/jquery`](https://www.npmjs.com/package/@types/jquery) is installed, `$(...).dhivehigptPlayer(...)` is typed automatically once this module is imported.

## Usage

```javascript
// Initialize (options are the same as the programmatic API's)
$('#my-audio').dhivehigptPlayer({ accent: true });

// Call a method
$('#my-audio').dhivehigptPlayer('play');
$('#my-audio').dhivehigptPlayer('seek', 30);

// Read a property
$('#my-audio').dhivehigptPlayer('playing'); // => true/false

// Get the underlying AudioPlayer instance directly
const player = $('#my-audio').data('dhivehigptPlayer');
player.on('ended', () => console.log('done'));
```

Initializing is idempotent — calling `.dhivehigptPlayer(...)` again on an already-initialized element is a no-op rather than creating a second player. Method/property calls on an element that was never initialized are also a safe no-op.

Works on any jQuery collection, so it plays nicely with `$.each`/event delegation etc. like any other jQuery plugin.
