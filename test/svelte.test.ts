import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import DhivehiGPTPlayer from '../src/svelte/DhivehiGPTPlayer.svelte';
import SvelteReadyWrapper from './SvelteReadyWrapper.svelte';

afterEach(() => cleanup());

describe('DhivehiGPTPlayer (Svelte)', () => {
  it('mounts an AudioPlayer control bar and dispatches ready (via declarative on:ready)', async () => {
    const onReady = vi.fn();
    const { container } = render(SvelteReadyWrapper, {
      props: { src: 'https://example.com/a.mp3', onReady },
    });
    await tick();

    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('passes configuration props through to the player options', async () => {
    const { container } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3', showSpeed: false, showVolume: false },
    });
    await tick();

    expect(container.querySelector('.dhivehigpt-player__speed')).toBeNull();
    expect(container.querySelector('.dhivehigpt-player__volume')).toBeNull();
  });

  it('destroys the player on unmount', async () => {
    const { container, unmount } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3' },
    });
    await tick();

    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    unmount();
    expect(document.querySelector('.dhivehigpt-player')).toBeNull();
  });

  it('recreates the player when a config prop changes after mount', async () => {
    const { component, container } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3', accent: false },
    });
    await tick();
    expect(container.querySelector<HTMLElement>('.dhivehigpt-player')?.style.getPropertyValue('--bg')).toBe('#ffffff');

    component.$set({ accent: true });
    await tick();

    expect(container.querySelector<HTMLElement>('.dhivehigpt-player')?.style.getPropertyValue('--bg')).toBe('#39bbb0');
  });
});
