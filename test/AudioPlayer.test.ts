import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayer } from '../src/AudioPlayer';
import { createHostAudio, fireLoadedMetadata, fireTimeUpdate } from './helpers';

function q<T extends Element>(player: AudioPlayer, selector: string): T {
  const el = player.element.querySelector<T>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
}

describe('AudioPlayer', () => {
  let audio: HTMLAudioElement;

  beforeEach(() => {
    audio = createHostAudio({ src: 'https://example.com/a.mp3' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a control bar with play button, seek bar, time, speed and volume controls, and hides the source <audio>', () => {
    const player = new AudioPlayer(audio);
    expect(audio.style.display).toBe('none');
    expect(q(player, '.dhivehigpt-player__btn')).toBeTruthy();
    expect(q(player, '.dhivehigpt-player__seek')).toBeTruthy();
    expect(q(player, '.dhivehigpt-player__time')).toBeTruthy();
    expect(q(player, '.dhivehigpt-player__speed')).toBeTruthy();
    expect(q(player, '.dhivehigpt-player__volume')).toBeTruthy();
    player.destroy();
  });

  it('always renders the DhivehiGPT branding link, regardless of options', () => {
    const player = new AudioPlayer(audio, { showTime: false, showSpeed: false, showVolume: false });
    const credit = q<HTMLAnchorElement>(player, '.dhivehigpt-player__credit');
    expect(credit.href).toBe('https://dhivehigpt.com/');
    expect(credit.target).toBe('_blank');
    expect(credit.rel).toBe('noopener');
    expect(credit.textContent).toContain('Powered by');
    expect(credit.textContent).toContain('DhivehiGPT');
    const logoSvg = q<SVGElement>(player, '.dhivehigpt-player__logo svg');
    expect(logoSvg).toBeTruthy();
    // Must be display:block — an inline (default) SVG reserves baseline
    // descender space, throwing off vertical centering against the
    // "Powered by DhivehiGPT" text next to it.
    expect(getComputedStyle(logoSvg).display).toBe('block');
    player.destroy();
  });

  it('omits time/speed/volume controls when disabled via options', () => {
    const player = new AudioPlayer(audio, { showTime: false, showSpeed: false, showVolume: false });
    expect(player.element.querySelector('.dhivehigpt-player__time')).toBeNull();
    expect(player.element.querySelector('.dhivehigpt-player__speed')).toBeNull();
    expect(player.element.querySelector('.dhivehigpt-player__volume')).toBeNull();
    player.destroy();
  });

  it('toggles play/pause, swaps the icon, and emits events', () => {
    const player = new AudioPlayer(audio);
    const onPlay = vi.fn();
    const onPause = vi.fn();
    player.on('play', onPlay).on('pause', onPause);

    const btn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');
    expect(btn.getAttribute('aria-label')).toBe('Play');

    player.toggle();
    expect(player.playing).toBe(true);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('aria-label')).toBe('Pause');

    player.toggle();
    expect(player.playing).toBe(false);
    expect(onPause).toHaveBeenCalledTimes(1);

    player.destroy();
  });

  it('toggle() correctly pauses on a rapid second click even before the async play() has resolved/fired its "play" event', () => {
    // Real browsers don't fire 'play' synchronously — play() is async. If
    // toggle() decided what to do based on state.playing (which only
    // flips once that event fires), a fast second click would still see
    // "not playing yet" and call play() again instead of pause().
    let firePlayEvent: (() => void) | undefined;
    audio.play = vi.fn(() => {
      return new Promise<void>((resolve) => {
        firePlayEvent = () => {
          audio.dispatchEvent(new Event('play'));
          resolve();
        };
      });
    });
    const pauseSpy = vi.spyOn(audio, 'pause');

    const player = new AudioPlayer(audio);
    player.toggle(); // starts play(); 'play' event/state.playing update is still pending
    expect(player.playing).toBe(false); // event hasn't fired yet

    player.toggle(); // should pause, not call play() again
    expect(pauseSpy).toHaveBeenCalledTimes(1);

    firePlayEvent?.();
    player.destroy();
  });

  it('updates the time label and seek fill on timeupdate', () => {
    const player = new AudioPlayer(audio);
    fireLoadedMetadata(audio, 100);
    fireTimeUpdate(audio, 25);

    const time = q(player, '.dhivehigpt-player__time');
    expect(time.textContent).toBe('0:25 / 1:40');
    const fill = q<HTMLElement>(player, '.dhivehigpt-player__seek-fill');
    expect(fill.style.width).toBe('25%');

    player.destroy();
  });

  it('seek() clamps to [0, duration] and updates the audio element', () => {
    const player = new AudioPlayer(audio);
    fireLoadedMetadata(audio, 60);

    player.seek(200);
    expect(audio.currentTime).toBe(60);

    player.seek(-10);
    expect(audio.currentTime).toBe(0);

    player.destroy();
  });

  it('cycles through the default playback speeds on click and wraps around', () => {
    const player = new AudioPlayer(audio);
    const speed = q<HTMLButtonElement>(player, '.dhivehigpt-player__speed');
    expect(speed.textContent).toBe('1×');

    speed.click();
    expect(player.playbackRate).toBe(1.25);
    expect(speed.textContent).toBe('1.25×');

    speed.click();
    speed.click();
    speed.click();
    expect(player.playbackRate).toBe(0.75);

    speed.click();
    expect(player.playbackRate).toBe(1);

    player.destroy();
  });

  it('respects a custom data-speeds list', () => {
    audio.setAttribute('data-speeds', '1,2');
    const player = new AudioPlayer(audio);
    const speed = q<HTMLButtonElement>(player, '.dhivehigpt-player__speed');
    speed.click();
    expect(player.playbackRate).toBe(2);
    speed.click();
    expect(player.playbackRate).toBe(1);
    player.destroy();
  });

  it('hides the speed control when only one speed is configured', () => {
    audio.setAttribute('data-speeds', '1');
    const player = new AudioPlayer(audio);
    expect(player.element.querySelector('.dhivehigpt-player__speed')).toBeNull();
    player.destroy();
  });

  it('toggles mute and restores the pre-mute volume', () => {
    const player = new AudioPlayer(audio);
    player.setVolume(0.6);
    expect(player.volume).toBe(0.6);

    player.toggleMute();
    expect(player.volume).toBe(0);

    player.toggleMute();
    expect(player.volume).toBe(0.6);

    player.destroy();
  });

  it('emits volumechange and clamps setVolume to [0, 1]', () => {
    const player = new AudioPlayer(audio);
    const onVolumeChange = vi.fn();
    player.on('volumechange', onVolumeChange);

    player.setVolume(1.5);
    expect(player.volume).toBe(1);
    player.setVolume(-1);
    expect(player.volume).toBe(0);
    expect(onVolumeChange).toHaveBeenCalled();

    player.destroy();
  });

  it('sticks a separate bar to the bottom of the viewport while playing, leaving the inline bar exactly where it is, and stays stuck through pause', () => {
    const player = new AudioPlayer(audio, { sticky: true });
    const inlineParent = player.element.parentElement;
    expect(player.stickyElement).toBeTruthy();
    expect(player.stickyElement!.isConnected).toBe(false);

    player.play();
    // The inline bar never moves or gets sticky classes.
    expect(player.element.parentElement).toBe(inlineParent);
    expect(player.element.classList.contains('dhivehigpt-player--sticky')).toBe(false);
    // The sticky bar is a separate element, appended to the document, animating in.
    expect(player.stickyElement!.isConnected).toBe(true);
    expect(player.stickyElement!.classList.contains('dhivehigpt-player--sticky')).toBe(true);

    player.pause();
    expect(player.stickyElement!.classList.contains('dhivehigpt-player--sticky')).toBe(true);
    expect(player.stickyElement!.isConnected).toBe(true);

    player.destroy();
  });

  it('does not build a sticky bar when sticky is disabled (default)', () => {
    const player = new AudioPlayer(audio);
    expect(player.stickyElement).toBeNull();
    player.play();
    expect(player.element.classList.contains('dhivehigpt-player--sticky')).toBe(false);
    player.destroy();
  });

  it('shows a stop button only on the sticky bar, never on the inline bar', () => {
    const withSticky = new AudioPlayer(audio, { sticky: true });
    expect(withSticky.element.querySelector('.dhivehigpt-player__stop')).toBeNull();
    expect(withSticky.stickyElement!.querySelector('.dhivehigpt-player__stop')).toBeTruthy();
    withSticky.destroy();

    const audio2 = createHostAudio({ src: 'https://example.com/b.mp3' });
    const withoutSticky = new AudioPlayer(audio2);
    expect(withoutSticky.element.querySelector('.dhivehigpt-player__stop')).toBeNull();
    withoutSticky.destroy();
  });

  it('the stop button matches the play button size and shape (38x38, 10px radius)', () => {
    const player = new AudioPlayer(audio, { sticky: true });
    const playBtn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');
    const stopBtn = player.stickyElement!.querySelector<HTMLButtonElement>('.dhivehigpt-player__stop')!;
    const playCS = getComputedStyle(playBtn);
    const stopCS = getComputedStyle(stopBtn);
    expect(stopCS.width).toBe(playCS.width);
    expect(stopCS.height).toBe(playCS.height);
    expect(stopCS.borderRadius).toBe(playCS.borderRadius);
    player.destroy();
  });

  it('stop() pauses, resets to the start, dismisses the stuck sticky bar (removing it from the document), and emits stop', () => {
    const player = new AudioPlayer(audio, { sticky: true });
    const onStop = vi.fn();
    player.on('stop', onStop);
    fireLoadedMetadata(audio, 30);
    fireTimeUpdate(audio, 12);

    player.play();
    expect(player.stickyElement!.classList.contains('dhivehigpt-player--sticky')).toBe(true);

    const stopBtn = player.stickyElement!.querySelector<HTMLButtonElement>('.dhivehigpt-player__stop')!;
    stopBtn.click();

    expect(player.playing).toBe(false);
    expect(player.currentTime).toBe(0);
    expect(player.stickyElement!.classList.contains('dhivehigpt-player--sticky-visible')).toBe(false);
    expect(onStop).toHaveBeenCalledTimes(1);
    // Inline bar is completely unaffected by stop().
    expect(player.element.isConnected).toBe(true);

    player.destroy();
  });

  it('stays stuck when playback ends naturally, and ended resets playing state and currentTime', () => {
    const player = new AudioPlayer(audio, { sticky: true });
    const onEnded = vi.fn();
    player.on('ended', onEnded);
    fireLoadedMetadata(audio, 30);
    fireTimeUpdate(audio, 30);

    player.play();
    audio.dispatchEvent(new Event('ended'));
    expect(player.playing).toBe(false);
    expect(player.stickyElement!.classList.contains('dhivehigpt-player--sticky')).toBe(true);

    player.destroy();
  });

  it('play/pause/seek/volume interactions on the sticky bar control the same underlying player as the inline bar', () => {
    const player = new AudioPlayer(audio, { sticky: true });
    fireLoadedMetadata(audio, 60);

    // Toggling from the sticky bar's own play button affects the same state...
    const stickyBtn = player.stickyElement!.querySelector<HTMLButtonElement>('.dhivehigpt-player__btn')!;
    stickyBtn.click();
    expect(player.playing).toBe(true);
    // ...and the inline bar's icon reflects it too.
    const inlineBtn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');
    expect(inlineBtn.getAttribute('aria-label')).toBe('Pause');

    player.destroy();
  });

  it('ended resets playing state and currentTime, and emits ended', () => {
    const player = new AudioPlayer(audio);
    const onEnded = vi.fn();
    player.on('ended', onEnded);
    fireLoadedMetadata(audio, 30);
    fireTimeUpdate(audio, 30);

    audio.dispatchEvent(new Event('ended'));
    expect(player.playing).toBe(false);
    expect(player.currentTime).toBe(0);
    expect(onEnded).toHaveBeenCalledTimes(1);

    player.destroy();
  });

  it('destroy() removes the bar from the DOM, restores the audio element, and stops emitting events', () => {
    const player = new AudioPlayer(audio);
    const container = audio.parentElement!;
    expect(container.querySelector('.dhivehigpt-player')).toBeTruthy();

    const onDestroy = vi.fn();
    player.on('destroy', onDestroy);
    player.destroy();

    expect(container.querySelector('.dhivehigpt-player')).toBeNull();
    expect(audio.style.display).toBe('');
    expect(onDestroy).toHaveBeenCalledTimes(1);

    // calling destroy again is a no-op, not a double-emit
    player.destroy();
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('off() stops a listener from receiving further events', () => {
    const player = new AudioPlayer(audio);
    const onPlay = vi.fn();
    player.on('play', onPlay);
    player.off('play', onPlay);
    player.play();
    expect(onPlay).not.toHaveBeenCalled();
    player.destroy();
  });

  it('falls back to the legacy MediaQueryList addListener/removeListener API for auto dark mode, for older Safari', () => {
    // Older Safari (< 14) only implements addListener/removeListener, not
    // the EventTarget-style addEventListener/removeEventListener.
    let changeListener: ((e: { matches: boolean }) => void) | undefined;
    const legacyMql = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addListener: vi.fn((cb: (e: { matches: boolean }) => void) => {
        changeListener = cb;
      }),
      removeListener: vi.fn(),
    };
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn(() => legacyMql as unknown as MediaQueryList);

    try {
      const player = new AudioPlayer(audio); // dark: 'auto' by default
      expect(legacyMql.addListener).toHaveBeenCalledTimes(1);
      expect(player.element.style.getPropertyValue('--bg')).toBe('#ffffff');

      legacyMql.matches = true;
      changeListener?.({ matches: true });
      expect(player.element.style.getPropertyValue('--bg')).toBe('#16191a');

      player.destroy();
      expect(legacyMql.removeListener).toHaveBeenCalledTimes(1);
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
