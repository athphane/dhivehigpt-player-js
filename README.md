# DhivehiGPT Player

[![npm version](https://img.shields.io/npm/v/%40javaabu%2Fdhivehigpt-player.svg)](https://www.npmjs.com/package/@javaabu/dhivehigpt-player)
[![Tests](https://github.com/Javaabu/dhivehigpt-player-js/actions/workflows/tests.yml/badge.svg)](https://github.com/Javaabu/dhivehigpt-player-js/actions/workflows/tests.yml)
[![Coverage](https://raw.githubusercontent.com/Javaabu/dhivehigpt-player-js/main/badges/coverage.svg)](https://github.com/Javaabu/dhivehigpt-player-js/actions/workflows/tests.yml)
[![License](https://img.shields.io/npm/l/%40javaabu%2Fdhivehigpt-player.svg)](LICENSE.md)

A lightweight, dependency-free audio player for [DhivehiGPT](https://dhivehigpt.com)-generated "read aloud" audio. Turns a plain `<audio>` tag into a branded control bar, embeddable on any website — no build step required.

## Documentation

Full documentation: **[docs.javaabu.com/docs/dhivehigpt-player-js](https://docs.javaabu.com/docs/dhivehigpt-player-js)**

Find yourself stuck using the package? Found a bug? Feel free to create an [issue](../../issues) on GitHub, we'll try to address it as soon as possible.

If you've found a bug regarding security please mail [info@javaabu.com](mailto:info@javaabu.com) instead of using the issue tracker.

## Install

```bash
npm install @javaabu/dhivehigpt-player --save
```

Or, with no build step at all, via jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/@javaabu/dhivehigpt-player/dist/dhivehigpt-player.umd.min.js"></script>
```

Or download it and self-host: the same file is committed at [`dist/dhivehigpt-player.umd.min.js`](dist/dhivehigpt-player.umd.min.js) in this repo.

## Basic usage

Add `data-dhivehigpt-player` to a standard `<audio>` tag — it's converted automatically:

```html
<audio data-dhivehigpt-player src="https://example.com/article.mp3"></audio>
```

Options are set via `data-*` attributes, e.g. `data-dark="true"`, `data-accent="true"`, `data-sticky="true"`. See the [data-attributes reference](https://docs.javaabu.com/docs/dhivehigpt-player-js/modules/data-attributes) for the full list.

Or initialize programmatically:

```javascript
import { AudioPlayer } from '@javaabu/dhivehigpt-player';

const player = new AudioPlayer('#my-audio', { accent: true, sticky: true });
player.on('play', () => console.log('playing'));
```

React, Vue, Svelte, and jQuery integrations are available at `@javaabu/dhivehigpt-player/react`, `/vue`, `/svelte`, and `/jquery` (each a separate entry, so the core bundle only ships what you actually use). Angular, Alpine.js, and Laravel Livewire are supported too — see the [framework guides](https://docs.javaabu.com/docs/dhivehigpt-player-js) for details.

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please email [info@javaabu.com](mailto:info@javaabu.com) instead of using the issue tracker.

## Credits

- [Javaabu Pvt. Ltd.](https://github.com/javaabu)
- [Arushad Ahmed (@dash8x)](http://arushad.com)
- [All Contributors](../../contributors)

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
