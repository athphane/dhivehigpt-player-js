import { useEffect, useRef } from 'react';
import type { AudioHTMLAttributes } from 'react';
import { AudioPlayer } from '../AudioPlayer';
import type { PlayerOptions } from '../core/types';

export interface DhivehiGPTPlayerProps extends Partial<PlayerOptions> {
  src: string;
  /** Called once the underlying AudioPlayer instance has been created. */
  onReady?: (player: AudioPlayer) => void;
  className?: string;
  audioProps?: Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'>;
}

/**
 * React wrapper around the framework-free `AudioPlayer`. Renders a hidden
 * `<audio>` element and mounts the player's control bar next to it.
 * The player instance is (re)created whenever `src` or a configuration
 * prop changes.
 */
export function DhivehiGPTPlayer({
  src,
  onReady,
  className,
  audioProps,
  dark,
  accent,
  shadow,
  flush,
  showTime,
  showSpeed,
  showVolume,
  speeds,
  sticky,
  loadFont,
}: DhivehiGPTPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // A caller passing an inline array literal (very common — e.g.
  // `speeds={[1, 1.5, 2]}`) gets a new array reference every render even
  // when the values don't change. Using `speeds` itself as a useEffect
  // dependency would then destroy and rebuild the whole player (losing
  // playback position) on every unrelated re-render; depending on this
  // derived string instead only reacts to the values actually changing.
  const speedsKey = speeds?.join(',');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const player = new AudioPlayer(audio, {
      src,
      dark,
      accent,
      shadow,
      flush,
      showTime,
      showSpeed,
      showVolume,
      speeds,
      sticky,
      loadFont,
    });
    containerRef.current?.appendChild(player.element);
    onReady?.(player);

    return () => player.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, dark, accent, shadow, flush, showTime, showSpeed, showVolume, speedsKey, sticky, loadFont]);

  return (
    <div className={className}>
      <audio ref={audioRef} {...audioProps} />
      <div ref={containerRef} />
    </div>
  );
}

export default DhivehiGPTPlayer;
