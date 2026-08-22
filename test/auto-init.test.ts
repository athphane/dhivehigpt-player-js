import { afterEach, describe, expect, it } from 'vitest';
import { getInstance, init, unwatch, watch } from '../src/auto-init';
import { PLAYER_ATTR } from '../src/attributes';

function addMarkedAudio(id: string): HTMLAudioElement {
  const audio = document.createElement('audio');
  audio.id = id;
  audio.setAttribute(PLAYER_ATTR, '');
  audio.src = 'https://example.com/a.mp3';
  document.body.appendChild(audio);
  return audio;
}

describe('auto-init', () => {
  afterEach(() => {
    unwatch();
    document.body.innerHTML = '';
  });

  it('converts every marked <audio> element found in the document', () => {
    const a = addMarkedAudio('a');
    const b = addMarkedAudio('b');
    const players = init();

    expect(players).toHaveLength(2);
    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(2);
    expect(getInstance(a)).toBeTruthy();
    expect(getInstance(b)).toBeTruthy();
  });

  it('does not re-initialize an already-converted element on a second init() call', () => {
    addMarkedAudio('a');
    const first = init();
    const second = init();

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);
  });

  it('ignores <audio> elements without the marker attribute', () => {
    const audio = document.createElement('audio');
    document.body.appendChild(audio);
    const players = init();
    expect(players).toHaveLength(0);
  });

  it('watch() auto-converts elements added to the DOM afterwards', async () => {
    watch(document.body);
    addMarkedAudio('late');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);
  });

  it('unwatch() stops converting newly-added elements', async () => {
    watch(document.body);
    unwatch();
    addMarkedAudio('late');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(0);
  });

  it('destroys the player when its host element is removed outright (e.g. Alpine x-if)', async () => {
    watch(document.body);
    const audio = addMarkedAudio('a');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);

    audio.remove();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(0);
    expect(getInstance(audio)).toBeUndefined();
  });

  it('re-converts a host element whose injected sibling DOM was stripped out from under it while the element itself was reused (e.g. Livewire morph without wire:ignore)', async () => {
    watch(document.body);
    const audio = addMarkedAudio('a');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);

    // Simulate a morph that keeps the <audio> node itself but wipes out the
    // sibling bar this library injected next to it, without removing or
    // re-adding the <audio> element.
    document.querySelectorAll('.dhivehigpt-player').forEach((el) => el.remove());
    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(0);

    // Trigger the observer with an unrelated mutation so reconcile() runs.
    document.body.appendChild(document.createElement('div'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.body.querySelectorAll('.dhivehigpt-player')).toHaveLength(1);
    expect(audio.hasAttribute('data-dhivehigpt-player-initialized')).toBe(true);
    expect(getInstance(audio)).toBeTruthy();
  });
});
