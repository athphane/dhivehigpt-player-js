import { describe, expect, it, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { DhivehiGPTPlayer } from '../src/react';
import type { AudioPlayer } from '../src/AudioPlayer';

afterEach(() => cleanup());

describe('DhivehiGPTPlayer (React)', () => {
  it('mounts an AudioPlayer control bar and calls onReady', () => {
    const onReady = vi.fn<(player: AudioPlayer) => void>();
    const { container } = render(<DhivehiGPTPlayer src="https://example.com/a.mp3" onReady={onReady} />);

    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('passes configuration props through to the player options', () => {
    const { container } = render(
      <DhivehiGPTPlayer src="https://example.com/a.mp3" showSpeed={false} showVolume={false} />,
    );
    expect(container.querySelector('.dhivehigpt-player__speed')).toBeNull();
    expect(container.querySelector('.dhivehigpt-player__volume')).toBeNull();
  });

  it('destroys the player on unmount', () => {
    const { container, unmount } = render(<DhivehiGPTPlayer src="https://example.com/a.mp3" />);
    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();
    unmount();
    expect(document.querySelector('.dhivehigpt-player')).toBeNull();
  });

  it('recreates the player when src changes', () => {
    const onReady = vi.fn<(player: AudioPlayer) => void>();
    const { rerender } = render(<DhivehiGPTPlayer src="https://example.com/a.mp3" onReady={onReady} />);
    rerender(<DhivehiGPTPlayer src="https://example.com/b.mp3" onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(2);
  });

  it('does not recreate the player when an inline `speeds` array literal is passed and the parent re-renders with the same values', () => {
    // A new array reference every render (e.g. `speeds={[1, 1.5, 2]}`
    // written inline in JSX, which is extremely common) must not be
    // mistaken for an actual config change — that would tear down and
    // rebuild the player (losing playback position) on every unrelated
    // parent re-render.
    const onReady = vi.fn<(player: AudioPlayer) => void>();
    const { rerender } = render(
      <DhivehiGPTPlayer src="https://example.com/a.mp3" speeds={[1, 1.5, 2]} onReady={onReady} />,
    );
    rerender(<DhivehiGPTPlayer src="https://example.com/a.mp3" speeds={[1, 1.5, 2]} onReady={onReady} />);

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('does recreate the player when the `speeds` values actually change', () => {
    const onReady = vi.fn<(player: AudioPlayer) => void>();
    const { rerender } = render(
      <DhivehiGPTPlayer src="https://example.com/a.mp3" speeds={[1, 1.5, 2]} onReady={onReady} />,
    );
    rerender(<DhivehiGPTPlayer src="https://example.com/a.mp3" speeds={[1, 2, 3]} onReady={onReady} />);

    expect(onReady).toHaveBeenCalledTimes(2);
  });
});
