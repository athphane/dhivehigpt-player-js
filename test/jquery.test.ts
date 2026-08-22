import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import $ from 'jquery';
import { registerJQueryPlugin } from '../src/jquery';
import { AudioPlayer } from '../src/AudioPlayer';
import { createHostAudio, fireLoadedMetadata, fireTimeUpdate } from './helpers';

describe('registerJQueryPlugin', () => {
  let audio: HTMLAudioElement;

  beforeEach(() => {
    registerJQueryPlugin($);
    audio = createHostAudio({ src: 'https://example.com/a.mp3' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds $.fn.dhivehigptPlayer', () => {
    expect(typeof $.fn.dhivehigptPlayer).toBe('function');
  });

  it('is safe to register twice — does not overwrite an already-registered plugin', () => {
    const original = $.fn.dhivehigptPlayer;
    registerJQueryPlugin($);
    expect($.fn.dhivehigptPlayer).toBe(original);
  });

  it('initializes an AudioPlayer, cached via .data(), and stays chainable', () => {
    const result = $(audio).dhivehigptPlayer({ accent: true });
    expect(result[0]).toBe(audio); // chainable — still the jQuery collection

    const player = $(audio).data('dhivehigptPlayer') as AudioPlayer;
    expect(player).toBeInstanceOf(AudioPlayer);
    expect($(audio).find('.dhivehigpt-player').length + $('.dhivehigpt-player').length).toBeGreaterThan(0);
  });

  it('does not create a second player if initialized twice on the same element', () => {
    $(audio).dhivehigptPlayer();
    const first = $(audio).data('dhivehigptPlayer');
    $(audio).dhivehigptPlayer({ accent: true });
    expect($(audio).data('dhivehigptPlayer')).toBe(first);
    expect(document.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);
  });

  it('forwards string calls to methods on the underlying player, and stays chainable', () => {
    $(audio).dhivehigptPlayer();
    const player = $(audio).data('dhivehigptPlayer') as AudioPlayer;
    const onPlay = vi.fn();
    player.on('play', onPlay);

    const result = $(audio).dhivehigptPlayer('play') as JQuery<HTMLElement>;
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(player.playing).toBe(true);
    expect(result[0]).toBe(audio);
  });

  it('forwards string calls with arguments (e.g. seek)', () => {
    $(audio).dhivehigptPlayer();
    const player = $(audio).data('dhivehigptPlayer') as AudioPlayer;
    fireLoadedMetadata(audio, 60);
    fireTimeUpdate(audio, 0);

    $(audio).dhivehigptPlayer('seek', 30);
    expect(player.currentTime).toBe(30);
  });

  it('reads a getter-style property and returns its value instead of the jQuery object', () => {
    $(audio).dhivehigptPlayer();
    const result = $(audio).dhivehigptPlayer('playing');
    expect(result).toBe(false);
  });

  it('is a no-op when calling a method on an element that was never initialized', () => {
    expect(() => $(audio).dhivehigptPlayer('play')).not.toThrow();
  });
});
