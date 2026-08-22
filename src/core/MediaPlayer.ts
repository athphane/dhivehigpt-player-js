import { computeThemeVars, resolveIsDark } from './theme';
import { injectFontLink, injectStyles } from './styles';
import { ICON_PAUSE, ICON_PLAY, ICON_STOP, iconVolume } from './icons';
import { LOGO_MARK_SVG } from './logo';
import {
  DEFAULT_OPTIONS,
  type MediaKind,
  type PlayerEventListener,
  type PlayerEventMap,
  type PlayerEventName,
  type PlayerOptions,
  type PlayerState,
} from './types';

const BRAND_URL = 'https://dhivehigpt.com';

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function ratioFromPointerEvent(event: PointerEvent, el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0) return 0;
  return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
}

interface BarEls {
  btn: HTMLButtonElement;
  stopBtn: HTMLButtonElement | null;
  seekFill: HTMLDivElement;
  time: HTMLSpanElement | null;
  speed: HTMLButtonElement | null;
  volumeBtn: HTMLButtonElement | null;
  volumeFill: HTMLDivElement | null;
}

interface Bar {
  root: HTMLDivElement;
  els: BarEls;
}

/**
 * Framework-free base class that owns the control-bar DOM, theming,
 * sticky-on-play behavior, and the public playback API. Subclasses (e.g.
 * `AudioPlayer`, and a future `VideoPlayer`) only need to implement how to
 * talk to their underlying media element.
 */
export abstract class MediaPlayer {
  readonly mediaKind: MediaKind;
  protected options: PlayerOptions;
  protected state: PlayerState = {
    playing: false,
    currentTime: 0,
    duration: 0,
    rate: 1,
    volume: 0.75,
    preMuteVolume: 0.75,
  };

  // Tracks the last play()/pause() the caller (or a real media event)
  // actually asked for, updated synchronously. `state.playing` only
  // updates once the media element's 'play'/'pause' event actually fires,
  // which is asynchronous for play() — using it to decide what a rapid
  // second click should do is racy (see toggle()).
  protected intendedPlaying = false;

  protected host: HTMLElement;
  /** The inline control bar — stays in the page's normal flow at all times. */
  private bar: Bar;
  /**
   * A second, independent control bar used only for the sticky-on-play
   * behavior: it's created but left undetached from the document until
   * playback starts, then appended and slid into view. The inline `bar`
   * above never moves or disappears. Only built when `sticky` is enabled.
   */
  private stickyBar: Bar | null = null;

  private listeners: Partial<Record<PlayerEventName, Set<(payload: unknown) => void>>> = {};
  private darkMediaQuery: MediaQueryList | null = null;
  private darkMediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
  private destroyed = false;

  protected constructor(host: HTMLElement, options: Partial<PlayerOptions>, mediaKind: MediaKind) {
    this.mediaKind = mediaKind;
    this.host = host;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state.volume = 0.75;

    injectStyles(host.ownerDocument ?? document);
    if (this.options.loadFont) injectFontLink(host.ownerDocument ?? document);

    this.bar = this.buildBar(false);
    this.host.insertAdjacentElement('afterend', this.bar.root);

    if (this.options.sticky) {
      this.stickyBar = this.buildBar(true);
    }

    this.setupAutoDarkMode();
    this.applyTheme();
    this.render();
  }

  // ---- abstract media hooks (implemented per media kind) ----------------
  protected abstract mediaPlay(): void;
  protected abstract mediaPause(): void;
  protected abstract mediaSeek(time: number): void;
  protected abstract mediaSetVolume(volume: number): void;
  protected abstract mediaSetRate(rate: number): void;

  private bars(): Bar[] {
    return this.stickyBar ? [this.bar, this.stickyBar] : [this.bar];
  }

  // ---- DOM construction ---------------------------------------------------
  private buildBar(withStop: boolean): Bar {
    const root = document.createElement('div');
    root.className = 'dhivehigpt-player';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dhivehigpt-player__btn';
    btn.setAttribute('aria-label', 'Play');
    btn.addEventListener('click', () => this.toggle());
    root.appendChild(btn);

    // The stop button only exists on the sticky bar: it's the only way to
    // dismiss it once stuck, since it otherwise stays put through
    // pause/ended. The inline bar never has one.
    let stopBtn: HTMLButtonElement | null = null;
    if (withStop) {
      stopBtn = document.createElement('button');
      stopBtn.type = 'button';
      stopBtn.className = 'dhivehigpt-player__stop';
      stopBtn.setAttribute('aria-label', 'Stop');
      stopBtn.innerHTML = ICON_STOP;
      stopBtn.addEventListener('click', () => this.stop());
      root.appendChild(stopBtn);
    }

    const seek = document.createElement('div');
    seek.className = 'dhivehigpt-player__seek';
    const seekTrack = document.createElement('div');
    seekTrack.className = 'dhivehigpt-player__seek-track';
    const seekFill = document.createElement('div');
    seekFill.className = 'dhivehigpt-player__seek-fill';
    seekTrack.appendChild(seekFill);
    seek.appendChild(seekTrack);
    seek.addEventListener('pointerdown', (e) =>
      this.drag(e, seek, (ratio) => this.seek(ratio * this.state.duration)),
    );
    root.appendChild(seek);

    let time: HTMLSpanElement | null = null;
    if (this.options.showTime) {
      time = document.createElement('span');
      time.className = 'dhivehigpt-player__time';
      root.appendChild(time);
    }

    let speed: HTMLButtonElement | null = null;
    if (this.options.showSpeed && this.options.speeds.length > 1) {
      speed = document.createElement('button');
      speed.type = 'button';
      speed.className = 'dhivehigpt-player__speed';
      speed.setAttribute('aria-label', 'Playback speed');
      speed.addEventListener('click', () => this.cyclePlaybackRate());
      root.appendChild(speed);
    }

    let volumeBtn: HTMLButtonElement | null = null;
    let volumeSlider: HTMLDivElement | null = null;
    let volumeFill: HTMLDivElement | null = null;
    if (this.options.showVolume) {
      const volume = document.createElement('div');
      volume.className = 'dhivehigpt-player__volume';

      volumeBtn = document.createElement('button');
      volumeBtn.type = 'button';
      volumeBtn.className = 'dhivehigpt-player__volume-btn';
      volumeBtn.setAttribute('aria-label', 'Mute');
      volumeBtn.addEventListener('click', () => this.toggleMute());
      volume.appendChild(volumeBtn);

      volumeSlider = document.createElement('div');
      volumeSlider.className = 'dhivehigpt-player__volume-slider';
      const volumeTrack = document.createElement('div');
      volumeTrack.className = 'dhivehigpt-player__volume-track';
      volumeFill = document.createElement('div');
      volumeFill.className = 'dhivehigpt-player__volume-fill';
      volumeTrack.appendChild(volumeFill);
      volumeSlider.appendChild(volumeTrack);
      const slider = volumeSlider;
      volumeSlider.addEventListener('pointerdown', (e) => this.drag(e, slider, (ratio) => this.setVolume(ratio)));
      volume.appendChild(volumeSlider);

      root.appendChild(volume);
    }

    const credit = document.createElement('a');
    credit.className = 'dhivehigpt-player__credit';
    credit.href = BRAND_URL;
    credit.target = '_blank';
    credit.rel = 'noopener';
    const creditText = document.createElement('span');
    creditText.className = 'dhivehigpt-player__credit-text';
    const line1 = document.createElement('span');
    line1.textContent = 'Powered by';
    const line2 = document.createElement('span');
    line2.textContent = 'DhivehiGPT';
    creditText.appendChild(line1);
    creditText.appendChild(line2);
    const logo = document.createElement('span');
    logo.className = 'dhivehigpt-player__logo';
    logo.innerHTML = LOGO_MARK_SVG;
    credit.appendChild(creditText);
    credit.appendChild(logo);
    root.appendChild(credit);

    return { root, els: { btn, stopBtn, seekFill, time, speed, volumeBtn, volumeFill } };
  }

  private drag(event: PointerEvent, el: HTMLElement, apply: (ratio: number) => void): void {
    const move = (e: PointerEvent) => apply(ratioFromPointerEvent(e, el));
    move(event);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  // ---- theming --------------------------------------------------------------
  private setupAutoDarkMode(): void {
    if (this.options.dark !== 'auto') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    this.darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkMediaQueryListener = () => {
      this.applyTheme();
    };
    // Older Safari (< 14) and some other browsers only support the legacy
    // addListener/removeListener pair, not the EventTarget-style API.
    if (typeof this.darkMediaQuery.addEventListener === 'function') {
      this.darkMediaQuery.addEventListener('change', this.darkMediaQueryListener);
    } else if (typeof this.darkMediaQuery.addListener === 'function') {
      this.darkMediaQuery.addListener(this.darkMediaQueryListener);
    }
  }

  private applyTheme(): void {
    const isDarkActive = resolveIsDark(this.options.dark);
    const vars = computeThemeVars(this.options, isDarkActive);
    for (const bar of this.bars()) {
      for (const [key, value] of Object.entries(vars)) {
        bar.root.style.setProperty(key, value);
      }
    }
  }

  // ---- rendering --------------------------------------------------------------
  private render(): void {
    for (const bar of this.bars()) this.renderBar(bar);
  }

  private renderBar(bar: Bar): void {
    const { btn, seekFill, time, speed, volumeBtn, volumeFill } = bar.els;

    // The icon reflects `intendedPlaying` (updated synchronously the
    // instant play()/pause() is called), not `state.playing` (which only
    // updates once the media element's event actually fires). Otherwise
    // the icon can lag behind a click by however long that event takes,
    // making a real click look like it didn't register and inviting a
    // confused second click that flips the intent right back.
    btn.innerHTML = this.intendedPlaying ? ICON_PAUSE : ICON_PLAY;
    btn.setAttribute('aria-label', this.intendedPlaying ? 'Pause' : 'Play');

    const pct = this.state.duration ? (100 * this.state.currentTime) / this.state.duration : 0;
    seekFill.style.width = `${pct.toFixed(2)}%`;

    if (time) {
      time.textContent = `${formatTime(this.state.currentTime)} / ${formatTime(this.state.duration)}`;
    }

    if (speed) {
      speed.textContent = `${this.state.rate}×`;
    }

    if (volumeBtn) {
      volumeBtn.innerHTML = iconVolume(this.state.volume);
      volumeBtn.setAttribute('aria-label', this.state.volume > 0 ? 'Mute' : 'Unmute');
    }
    if (volumeFill) {
      volumeFill.style.width = `${(100 * this.state.volume).toFixed(0)}%`;
    }
  }

  // ---- sticky-on-play (animated slide up/down) -------------------------------
  private stickyCleanupTimer: ReturnType<typeof setTimeout> | null = null;
  private stickyTransitionListener: ((e: TransitionEvent) => void) | null = null;

  private clearStickyCleanup(): void {
    if (this.stickyCleanupTimer !== null) {
      clearTimeout(this.stickyCleanupTimer);
      this.stickyCleanupTimer = null;
    }
    if (this.stickyTransitionListener && this.stickyBar) {
      this.stickyBar.root.removeEventListener('transitionend', this.stickyTransitionListener);
      this.stickyTransitionListener = null;
    }
  }

  /**
   * Appends the sticky bar to the document (if not already) and slides it
   * up into view. The inline bar is untouched — it stays exactly where it
   * is in the page.
   */
  private enterSticky(): void {
    if (!this.stickyBar) return;
    this.clearStickyCleanup();

    const { root } = this.stickyBar;
    if (!root.isConnected) {
      (this.host.ownerDocument ?? document).body.appendChild(root);
    }
    root.classList.add('dhivehigpt-player--sticky');
    // Force a layout flush so the browser registers the off-screen starting
    // position before we add the class that transitions it into view.
    void root.offsetHeight;
    root.classList.add('dhivehigpt-player--sticky-visible');
  }

  /** Slides the sticky bar back down out of view, then removes it from the document entirely. */
  private exitSticky(): void {
    if (!this.stickyBar) return;
    const { root } = this.stickyBar;
    if (!root.classList.contains('dhivehigpt-player--sticky')) return;
    this.clearStickyCleanup();

    root.classList.remove('dhivehigpt-player--sticky-visible');

    const finish = () => {
      root.classList.remove('dhivehigpt-player--sticky');
      root.remove();
      this.clearStickyCleanup();
    };
    this.stickyTransitionListener = (e: TransitionEvent) => {
      if (e.target === root && e.propertyName === 'transform') finish();
    };
    root.addEventListener('transitionend', this.stickyTransitionListener);
    // Fallback in case transitionend doesn't fire (e.g. prefers-reduced-motion).
    this.stickyCleanupTimer = setTimeout(finish, 450);
  }

  // ---- events --------------------------------------------------------------
  on<K extends PlayerEventName>(event: K, listener: PlayerEventListener<K>): this {
    (this.listeners[event] ??= new Set()).add(listener as (payload: unknown) => void);
    return this;
  }

  off<K extends PlayerEventName>(event: K, listener: PlayerEventListener<K>): this {
    this.listeners[event]?.delete(listener as (payload: unknown) => void);
    return this;
  }

  protected emit<K extends PlayerEventName>(event: K, payload: PlayerEventMap[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }

  // ---- public playback API --------------------------------------------------
  play(): void {
    this.intendedPlaying = true;
    this.render(); // update the icon immediately — don't wait for the 'play' event
    this.mediaPlay();
  }

  pause(): void {
    this.intendedPlaying = false;
    this.render(); // update the icon immediately — don't wait for the 'pause' event
    this.mediaPause();
  }

  /**
   * Toggles based on the last play()/pause() actually requested, not
   * `state.playing` — that only flips once the media element's 'play'
   * event fires, which is asynchronous, so a fast second click (before it
   * fires) would otherwise be misread as "still paused" and call play()
   * again instead of pause().
   */
  toggle(): void {
    if (this.intendedPlaying) this.pause();
    else this.play();
  }

  /**
   * Pauses, resets to the start, and — unlike `pause()` — dismisses a
   * sticky bar (slides it back down). This is the only thing that hides a
   * sticky player once it's stuck; pausing or letting playback end on its
   * own both leave it in place.
   */
  stop(): void {
    this.pause();
    this.mediaSeek(0);
    this.exitSticky();
    this.emit('stop', undefined);
  }

  seek(time: number): void {
    const clamped = Math.min(this.state.duration, Math.max(0, time));
    this.mediaSeek(clamped);
  }

  setVolume(volume: number): void {
    const clamped = Math.min(1, Math.max(0, volume));
    this.mediaSetVolume(clamped);
  }

  mute(): void {
    if (this.state.volume === 0) return;
    this.setVolume(0);
  }

  unmute(): void {
    this.setVolume(this.state.preMuteVolume || 0.75);
  }

  toggleMute(): void {
    if (this.state.volume > 0) {
      this.setVolume(0);
    } else {
      this.setVolume(this.state.preMuteVolume || 0.75);
    }
  }

  setPlaybackRate(rate: number): void {
    this.mediaSetRate(rate);
  }

  cyclePlaybackRate(): void {
    const { speeds } = this.options;
    const index = speeds.indexOf(this.state.rate);
    const next = speeds[(index + 1) % speeds.length];
    this.setPlaybackRate(next);
  }

  get playing(): boolean {
    return this.state.playing;
  }

  get currentTime(): number {
    return this.state.currentTime;
  }

  get duration(): number {
    return this.state.duration;
  }

  get volume(): number {
    return this.state.volume;
  }

  get playbackRate(): number {
    return this.state.rate;
  }

  /** The inline control-bar root element (stays in the page's normal flow). */
  get element(): HTMLDivElement {
    return this.bar.root;
  }

  /** The sticky control-bar root element, if `sticky` is enabled. Only attached to the document while stuck. */
  get stickyElement(): HTMLDivElement | null {
    return this.stickyBar?.root ?? null;
  }

  // ---- state hooks for subclasses to report media events --------------------
  protected onPlay(): void {
    // Deliberately does NOT set `intendedPlaying = true` here. 'play' can
    // fire well after the request that triggered it — if a pause() issued
    // in between already set intent back to false, a late 'play' event
    // from the *earlier* request clobbering it back to true would
    // permanently defeat the "did it actually start playing anyway"
    // safety net (it checks intendedPlaying to decide whether to correct
    // course). pause()/toggle() calls are the only things allowed to set
    // it true, since they're synchronous with the actual user action.
    this.state.playing = true;
    this.render();
    this.enterSticky();
    this.emit('play', undefined);
  }

  protected onPause(): void {
    this.intendedPlaying = false;
    this.state.playing = false;
    this.render();
    // A sticky bar deliberately stays put through pause — only stop()
    // dismisses it.
    this.emit('pause', undefined);
  }

  protected onEnded(): void {
    this.intendedPlaying = false;
    this.state.playing = false;
    this.state.currentTime = 0;
    this.render();
    // Same as pause — a sticky bar stays visible after natural end too.
    this.emit('ended', undefined);
  }

  protected onTimeUpdate(currentTime: number, duration: number): void {
    this.state.currentTime = currentTime;
    this.state.duration = duration;
    this.render();
    this.emit('timeupdate', { currentTime, duration });
  }

  protected onDurationChange(duration: number): void {
    this.state.duration = duration;
    this.render();
  }

  protected onVolumeChange(volume: number): void {
    if (volume > 0) this.state.preMuteVolume = volume;
    this.state.volume = volume;
    this.render();
    this.emit('volumechange', { volume, muted: volume === 0 });
  }

  protected onRateChange(rate: number): void {
    this.state.rate = rate;
    this.render();
    this.emit('ratechange', { rate });
  }

  // ---- lifecycle --------------------------------------------------------------
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.darkMediaQuery && this.darkMediaQueryListener) {
      if (typeof this.darkMediaQuery.removeEventListener === 'function') {
        this.darkMediaQuery.removeEventListener('change', this.darkMediaQueryListener);
      } else if (typeof this.darkMediaQuery.removeListener === 'function') {
        this.darkMediaQuery.removeListener(this.darkMediaQueryListener);
      }
    }
    this.darkMediaQuery = null;
    this.darkMediaQueryListener = null;
    this.clearStickyCleanup();

    this.bar.root.remove();
    this.stickyBar?.root.remove();
    this.emit('destroy', undefined);
    this.listeners = {};
  }
}
