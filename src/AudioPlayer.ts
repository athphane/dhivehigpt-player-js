import { MediaPlayer } from './core/MediaPlayer';
import { readOptionsFromElement } from './attributes';
import type { PlayerOptions } from './core/types';

function resolveHost(target: HTMLAudioElement | string): HTMLAudioElement {
  const el = typeof target === 'string' ? document.querySelector<HTMLAudioElement>(target) : target;
  if (!el) {
    throw new Error(`DhivehiGPT AudioPlayer: element "${target}" not found`);
  }
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error('DhivehiGPT AudioPlayer: host element must be an <audio> element');
  }
  return el;
}

function resolveSrc(host: HTMLAudioElement, options: PlayerOptions): string {
  if (options.src) return options.src;
  if (host.currentSrc) return host.currentSrc;
  if (host.src) return host.src;
  const source = host.querySelector('source');
  return source?.src ?? '';
}

/**
 * Converts a standard `<audio>` element into the branded DhivehiGPT control
 * bar. The original `<audio>` element is kept (hidden) in the DOM and used
 * as the actual playback engine, so any attributes/behavior the host page
 * already relies on (e.g. `preload`) keep working.
 */
export class AudioPlayer extends MediaPlayer {
  private audio: HTMLAudioElement;

  constructor(target: HTMLAudioElement | string, options: Partial<PlayerOptions> = {}) {
    const host = resolveHost(target);
    const mergedOptions = readOptionsFromElement(host, options);
    super(host, mergedOptions, 'audio');

    this.audio = host;
    this.audio.removeAttribute('controls');
    this.audio.style.display = 'none';
    this.audio.preload = this.audio.preload || 'metadata';

    const src = resolveSrc(host, mergedOptions);
    if (src && this.audio.getAttribute('src') !== src) {
      this.audio.src = src;
    }
    this.audio.volume = this.volume;

    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('durationchange', this.handleDurationChange);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);
    this.audio.addEventListener('playing', this.handlePlaying);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('volumechange', this.handleVolumeChange);
    this.audio.addEventListener('ratechange', this.handleRateChange);
  }

  private handleLoadedMetadata = (): void => {
    this.onDurationChange(this.audio.duration || 0);
  };

  private handleDurationChange = (): void => {
    this.onDurationChange(this.audio.duration || 0);
  };

  private handleTimeUpdate = (): void => {
    this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
    // Continuous safety net, on top of handlePlaying(): 'timeupdate' fires
    // roughly every 250ms for as long as audio is actually advancing, so
    // this catches (and corrects) intent/reality drift within a fraction
    // of a second no matter the exact cause — belt and suspenders against
    // browser play()/pause() race conditions that don't fit the specific
    // pattern handlePlaying() targets.
    if (!this.intendedPlaying && !this.audio.paused) this.audio.pause();
  };

  private handlePlay = (): void => {
    this.onPlay();
  };

  private handlePause = (): void => {
    this.onPause();
  };

  /**
   * 'playing' fires exactly when the browser actually starts rendering
   * audio — unlike 'play' (just the request being accepted), or resolving
   * the play() promise (which doesn't reliably line up with playback
   * really starting either). Browsers don't always honor a pause() called
   * while a play() request was still buffering/pending, so this is the
   * one signal that reliably catches "it started playing anyway despite
   * being told to pause" regardless of exactly when/why that happens, and
   * lets us immediately correct it.
   */
  private handlePlaying = (): void => {
    if (!this.intendedPlaying) this.audio.pause();
  };

  private handleEnded = (): void => {
    this.onEnded();
  };

  private handleVolumeChange = (): void => {
    this.onVolumeChange(this.audio.volume);
  };

  private handleRateChange = (): void => {
    this.onRateChange(this.audio.playbackRate);
  };

  protected mediaPlay(): void {
    this.audio.playbackRate = this.playbackRate;
    // A rejection here just means playback was prevented (autoplay policy,
    // no user gesture yet, a pause() that raced it, etc.) — nothing to do,
    // state stays paused. If it wasn't actually prevented and starts
    // playing anyway, handlePlaying() catches and corrects that.
    void this.audio.play().catch(() => {});
  }

  protected mediaPause(): void {
    this.audio.pause();
  }

  protected mediaSeek(time: number): void {
    this.audio.currentTime = time;
    this.onTimeUpdate(time, this.audio.duration || this.duration);
  }

  protected mediaSetVolume(volume: number): void {
    this.audio.volume = volume;
    this.onVolumeChange(volume);
  }

  protected mediaSetRate(rate: number): void {
    this.audio.playbackRate = rate;
    this.onRateChange(rate);
  }

  /** The underlying HTMLAudioElement doing the actual playback. */
  get mediaElement(): HTMLAudioElement {
    return this.audio;
  }

  override destroy(): void {
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.removeEventListener('durationchange', this.handleDurationChange);
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('play', this.handlePlay);
    this.audio.removeEventListener('pause', this.handlePause);
    this.audio.removeEventListener('playing', this.handlePlaying);
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('volumechange', this.handleVolumeChange);
    this.audio.removeEventListener('ratechange', this.handleRateChange);
    this.audio.pause();
    this.audio.style.display = '';
    super.destroy();
  }
}
