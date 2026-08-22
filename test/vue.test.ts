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
});
