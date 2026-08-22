import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/vue';
import { DhivehiGPTPlayer } from '../src/vue';

describe('DhivehiGPTPlayer (Vue)', () => {
  it('mounts an AudioPlayer control bar and emits ready', () => {
    const { container, emitted } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3' },
    });

    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    expect(emitted().ready).toBeTruthy();
  });

  it('passes configuration props through to the player options', () => {
    const { container } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3', showSpeed: false, showVolume: false },
    });
    expect(container.querySelector('.dhivehigpt-player__speed')).toBeNull();
    expect(container.querySelector('.dhivehigpt-player__volume')).toBeNull();
  });

  it('destroys the player on unmount', () => {
    const { container, unmount } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3' },
    });
    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    unmount();
    expect(document.querySelector('.dhivehigpt-player')).toBeNull();
  });

  it('does not recreate the player when a new `speeds` array with the same values is passed', async () => {
    // A template writing `:speeds="[1, 1.5, 2]"` inline (common) produces a
    // new array on every parent re-render even when the values don't
    // change. Watching props.speeds by reference would destroy and rebuild
    // the whole player (losing playback position) on every unrelated
    // re-render.
    const { rerender, emitted } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3', speeds: [1, 1.5, 2] },
    });
    await rerender({ src: 'https://example.com/a.mp3', speeds: [1, 1.5, 2] });

    expect(emitted().ready).toHaveLength(1);
  });

  it('recreates the player when the `speeds` values actually change', async () => {
    const { rerender, emitted } = render(DhivehiGPTPlayer, {
      props: { src: 'https://example.com/a.mp3', speeds: [1, 1.5, 2] },
    });
    await rerender({ src: 'https://example.com/a.mp3', speeds: [1, 2, 3] });

    expect(emitted().ready).toHaveLength(2);
  });
});
