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
    const btn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');

    player.toggle(); // starts play(); 'play' event/state.playing update is still pending
    expect(player.playing).toBe(false); // event hasn't fired yet
    // The icon updates immediately regardless — this is what stops a user
    // from thinking their click didn't register and clicking again.
    expect(btn.getAttribute('aria-label')).toBe('Pause');

    player.toggle(); // should pause, not call play() again
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(btn.getAttribute('aria-label')).toBe('Play');

    firePlayEvent?.();
    player.destroy();
  });

  it('the play/pause icon updates synchronously on click, without waiting for the confirming media event', () => {
    // Unlike the mock's play()/pause() (which happen to fire their events
    // synchronously), real browsers queue those events as an async task —
    // this test only relies on the icon reflecting the call itself, not on
    // state.playing, so it holds regardless of that timing.
    const player = new AudioPlayer(audio);
    const btn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');
    expect(btn.getAttribute('aria-label')).toBe('Play');

    player.play();
    expect(btn.getAttribute('aria-label')).toBe('Pause');

    player.pause();
    expect(btn.getAttribute('aria-label')).toBe('Play');

    player.destroy();
  });

  it('re-asserts pause() if the browser fires "playing" (actual playback starting) after intent was already set back to paused', () => {
    // Real browsers don't reliably honor pause() called while a play()
    // request is still buffering/pending — 'playing' (which fires exactly
    // when playback actually starts rendering) can still land after intent
    // was already flipped back to paused. Simulate that directly: dispatch
    // 'playing' as the browser would, independent of any promise timing.
    const setPaused = (value: boolean) => Object.defineProperty(audio, 'paused', { value, configurable: true });
    setPaused(true);
    const pauseSpy = vi.spyOn(audio, 'pause').mockImplementation(() => setPaused(true));

    const player = new AudioPlayer(audio);
    player.play();
    player.pause(); // intent is now "paused"
    pauseSpy.mockClear(); // ignore the direct mediaPause() call from pause() itself

    // The browser starts actual playback anyway, despite the pause() above.
    setPaused(false);
    audio.dispatchEvent(new Event('playing'));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    player.destroy();
  });

  it('does not fight a genuine, currently-intended play when "playing" fires normally', () => {
    const pauseSpy = vi.spyOn(audio, 'pause');
    const player = new AudioPlayer(audio);

    player.play();
    audio.dispatchEvent(new Event('playing'));

    expect(pauseSpy).not.toHaveBeenCalled();
    player.destroy();
  });

  it('a stale "play" event arriving after a newer pause() does not clobber the pause intent (which would silently defeat the "playing" safety net)', () => {
    // 'play' just means the request was accepted, not that audio is
    // actually rendering yet (that's 'playing') — it can fire late,
    // possibly after a subsequent pause() already changed what's wanted.
    const pauseSpy = vi.spyOn(audio, 'pause');
    const player = new AudioPlayer(audio);

    player.play(); // request #1
    player.pause(); // user changed their mind before request #1's 'play' event arrived
    pauseSpy.mockClear();

    audio.dispatchEvent(new Event('play')); // late event from request #1
    // Intent must still read "paused" — otherwise a later 'playing' event
    // (the browser actually starting playback anyway) would be treated as
    // expected and never get corrected.
    audio.dispatchEvent(new Event('playing'));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    player.destroy();
  });

  it('timeupdate also re-asserts pause() as a continuous safety net, independent of the "playing" event', () => {
    const setPaused = (value: boolean) => Object.defineProperty(audio, 'paused', { value, configurable: true });
    const pauseSpy = vi.spyOn(audio, 'pause').mockImplementation(() => setPaused(true));

    const player = new AudioPlayer(audio);
    player.play();
    player.pause();
    pauseSpy.mockClear();

    // Audio is actually still advancing/playing despite pause() above —
    // 'timeupdate' fires as it does during real playback, without a
    // 'playing' event in between.
    setPaused(false);
    audio.dispatchEvent(new Event('timeupdate'));

    expect(pauseSpy).toHaveBeenCalledTimes(1);
    player.destroy();
  });

  it('does not rewrite the play/pause icon or speed label on timeupdate when they have not changed (avoids needless work on every tick)', () => {
    const player = new AudioPlayer(audio);
    fireLoadedMetadata(audio, 100);
    fireTimeUpdate(audio, 10);

    const btn = q<HTMLButtonElement>(player, '.dhivehigpt-player__btn');
    const speed = q<HTMLButtonElement>(player, '.dhivehigpt-player__speed');
    const btnInnerHTMLSetter = vi.spyOn(btn, 'innerHTML', 'set');
    const speedTextContentSetter = vi.spyOn(speed, 'textContent', 'set');

    // Only currentTime changes here — play state and rate are unchanged.
    fireTimeUpdate(audio, 11);
    fireTimeUpdate(audio, 12);

    expect(btnInnerHTMLSetter).not.toHaveBeenCalled();
    expect(speedTextContentSetter).not.toHaveBeenCalled();

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

  it('the sticky bar always has a visible shadow, even with default (non-flush, hairline) options — it floats over the page and needs separation regardless of the inline bar\'s configured shadow', () => {
    const player = new AudioPlayer(audio, { sticky: true }); // shadow/flush left at their defaults
    player.play();

    const shadow = getComputedStyle(player.stickyElement!).boxShadow;
    expect(shadow).not.toBe('none');
    expect(shadow).not.toBe('');

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

  describe('attachTo', () => {
    it('moves the container-query wrapper (not just the bar) into the target container', () => {
      // Moving `player.element` (the `.dhivehigpt-player` bar) alone would
      // leave the plain wrapper that carries `container-type: inline-size`
      // behind in its original spot — silently breaking the bar's
      // responsive layout once it's re-parented, since a @container query
      // needs an ancestor that's actually still wrapping it. attachTo()
      // must move that ancestor along with the bar.
      const player = new AudioPlayer(audio);
      const container = document.createElement('div');
      document.body.appendChild(container);

      player.attachTo(container);

      expect(container.contains(player.element)).toBe(true);
      // The immediate parent moved into `container` must be the wrapper,
      // not the bar itself directly under `container`.
      expect(player.element.parentElement).not.toBe(container);
      expect(container.contains(player.element.parentElement)).toBe(true);

      player.destroy();
    });
  });

  describe('narrow-width grid layout (--narrow-areas / --narrow-columns)', () => {
    // The narrow (<=430px) layout is CSS Grid, with grid-template-areas/
    // columns computed per instance (via these two custom properties) since
    // which of time/speed/volume exist varies independently per config —
    // reserving a fixed area for an absent control would waste gap space.
    // Row 1 (top, aligned with the play button's top) is [seek, time?];
    // row 2 (bottom, aligned with the play button's bottom) is
    // [speed?, volume?, credit]. Row-2's left controls get content-sized
    // columns, then one flexible filler column, then a content-sized column
    // for time — seek spans the left-control columns plus the filler so it
    // takes all the slack, and credit spans filler + time, right-aligned.

    it('full controls: seek spans the speed/volume/filler columns, time gets its own column at the far right', () => {
      const player = new AudioPlayer(audio); // time, speed, volume all default on
      const style = player.element.getAttribute('style') ?? '';
      expect(style).toContain('--narrow-areas: "btn seek seek seek time" "btn speed volume credit credit";');
      expect(style).toContain('--narrow-columns: auto auto auto minmax(0,1fr) auto;');
      player.destroy();
    });

    it('minimal controls (no time/speed/volume): a single filler column holds seek over credit — no reserved empty tracks', () => {
      const player = new AudioPlayer(audio, { showTime: false, showSpeed: false, showVolume: false });
      const style = player.element.getAttribute('style') ?? '';
      expect(style).toContain('--narrow-areas: "btn seek" "btn credit";');
      expect(style).toContain('--narrow-columns: auto minmax(0,1fr);');
      player.destroy();
    });

    it('time shown but speed/volume hidden: seek keeps the filler column, credit spans filler + time', () => {
      const player = new AudioPlayer(audio, { showSpeed: false, showVolume: false });
      const style = player.element.getAttribute('style') ?? '';
      expect(style).toContain('--narrow-areas: "btn seek time" "btn credit credit";');
      expect(style).toContain('--narrow-columns: auto minmax(0,1fr) auto;');
      player.destroy();
    });

    it('sticky bar reserves a stop column, prefixed on both rows', () => {
      const player = new AudioPlayer(audio, { sticky: true });
      const style = player.stickyElement!.getAttribute('style') ?? '';
      expect(style).toContain(
        '--narrow-areas: "btn stop seek seek seek time" "btn stop speed volume credit credit";',
      );
      expect(style).toContain('--narrow-columns: auto auto auto auto minmax(0,1fr) auto;');
      player.destroy();
    });
  });
});
