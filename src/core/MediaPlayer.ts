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
  /**
   * A plain wrapper that establishes the CSS container-query context
   * (`container-type: inline-size`) around `root`. This can't live on
   * `root` itself: a `@container` rule that changes `root`'s own `display`
   * (flex -> grid, for the narrow layout) in response to `root`'s own
   * size is exactly the self-referential case browsers guard against —
   * verified empirically, not just theoretically: with container-type on
   * `root` directly, the volume-slider-hiding rule (an unrelated child,
   * `display:none`) applied fine, but the flex->grid switch on `root`
   * itself silently never took effect. A separate, stable wrapper avoids
   * the circularity entirely.
   */
  wrapper: HTMLDivElement;
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
    this.host.insertAdjacentElement('afterend', this.bar.wrapper);

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
    // See the `Bar.wrapper` doc comment for why this exists as a separate
    // element from `root` rather than putting container-type on `root`
    // itself.
    const wrapper = document.createElement('div');
    wrapper.className = 'dhivehigpt-player-wrap';

    const root = document.createElement('div');
    root.className = 'dhivehigpt-player';
    wrapper.appendChild(root);

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
      root.classList.add('dhivehigpt-player--has-stop');
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

    // The narrow (<=430px) layout switches to a 2-row CSS grid — see the
    // `@container`/`@media` rules in styles.ts. Play (and stop, if present)
    // stay anchored on the left spanning both rows; the seek bar and time
    // sit on row 1, speed/volume/credit on row 2. --narrow-areas and
    // --narrow-columns are computed per instance because which of
    // time/speed/volume exist varies independently, so a single static
    // grid-template-areas can't cover every combination without reserving
    // empty, gap-wasting tracks for whichever are absent.
    //
    // Column scheme (after btn/stop): one content-sized column per row-2
    // left control (speed, volume), then a single flexible filler column,
    // then a content-sized column for time if it's shown. Rows then map on:
    //
    //   row 1:  seek ......................... spans every left-control
    //           column plus the filler, so it soaks up all the slack | time
    //   row 2:  speed | volume | credit ...... spans filler + time column,
    //           right-aligned so its edge lands on time's
    //
    // Sizing the left-control columns to their content (rather than making
    // them all `1fr`) is what keeps the seek bar long and stops a dead gap
    // opening between the seek bar's end and the time label: time gets a
    // column of exactly its own width at the far right, instead of sharing
    // an `auto` column sized to the much wider credit block.
    const leftCtrls = [speed && 'speed', volumeBtn && 'volume'].filter((x): x is string => !!x);
    const prefix = withStop ? ['btn', 'stop'] : ['btn'];

    const row1 = [...leftCtrls.map(() => 'seek'), 'seek', ...(time ? ['time'] : [])];
    const row2 = [...leftCtrls, 'credit', ...(time ? ['credit'] : [])];

    root.style.setProperty('--narrow-areas', `"${[...prefix, ...row1].join(' ')}" "${[...prefix, ...row2].join(' ')}"`);
    // minmax(0,1fr), not bare 1fr: a bare `fr` track's automatic minimum
    // size is content-based, so the filler column would refuse to shrink
    // below the seek bar's min-content width and overflow the container at
    // very narrow widths. minmax(0,1fr) lets it actually go to 0.
    root.style.setProperty(
      '--narrow-columns',
      [
        ...prefix.map(() => 'auto'),
        ...leftCtrls.map(() => 'auto'),
        'minmax(0,1fr)',
        ...(time ? ['auto'] : []),
      ].join(' '),
    );

    return { wrapper, root, els: { btn, stopBtn, seekFill, time, speed, volumeBtn, volumeFill } };
  }

  private drag(event: PointerEvent, el: HTMLElement, apply: (ratio: number) => void): void {
    const move = (e: PointerEvent) => apply(ratioFromPointerEvent(e, el));
    move(event);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    // A drag can be interrupted without a pointerup (e.g. a mobile OS
    // system dialog stealing the gesture) — without this, the window
    // listeners above would never be cleaned up.
    window.addEventListener('pointercancel', up);
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
  // Cache of what's currently reflected in the DOM, so render() — called on
  // every 'timeupdate' (roughly 4x/second during playback) — only touches
  // the handful of properties (seek/volume fill) that legitimately change
  // every tick, instead of re-parsing icon markup and rewriting text nodes
  // that are almost always identical to last time.
  private lastRender: {
    icon: string;
    ariaLabel: string;
    timeText: string;
    speedText: string;
    volumeIcon: string;
    volumeAriaLabel: string;
    seekPct: string;
    volumePct: string;
  } | null = null;

  private render(): void {
    // Computed once per render() call, not once per bar — with a sticky
    // bar both mirror the same state, so there's no reason to format the
    // same strings/markup twice.
    const icon = this.intendedPlaying ? ICON_PAUSE : ICON_PLAY;
    // The icon reflects `intendedPlaying` (updated synchronously the
    // instant play()/pause() is called), not `state.playing` (which only
    // updates once the media element's event actually fires). Otherwise
    // the icon can lag behind a click by however long that event takes,
    // making a real click look like it didn't register and inviting a
    // confused second click that flips the intent right back.
    const ariaLabel = this.intendedPlaying ? 'Pause' : 'Play';
    const timeText = `${formatTime(this.state.currentTime)} / ${formatTime(this.state.duration)}`;
    const speedText = `${this.state.rate}×`;
    const volumeIcon = iconVolume(this.state.volume);
    const volumeAriaLabel = this.state.volume > 0 ? 'Mute' : 'Unmute';
    const seekRatio = this.state.duration ? (100 * this.state.currentTime) / this.state.duration : 0;
    const seekPct = `${seekRatio.toFixed(2)}%`;
    const volumePct = `${(100 * this.state.volume).toFixed(0)}%`;

    const prev = this.lastRender;

    for (const bar of this.bars()) {
      const { btn, seekFill, time, speed, volumeBtn, volumeFill } = bar.els;

      if (!prev || prev.icon !== icon) btn.innerHTML = icon;
      if (!prev || prev.ariaLabel !== ariaLabel) btn.setAttribute('aria-label', ariaLabel);
      if (!prev || prev.seekPct !== seekPct) seekFill.style.width = seekPct;
      if (time && (!prev || prev.timeText !== timeText)) time.textContent = timeText;
      if (speed && (!prev || prev.speedText !== speedText)) speed.textContent = speedText;
      if (volumeBtn) {
        if (!prev || prev.volumeIcon !== volumeIcon) volumeBtn.innerHTML = volumeIcon;
        if (!prev || prev.volumeAriaLabel !== volumeAriaLabel) volumeBtn.setAttribute('aria-label', volumeAriaLabel);
      }
      if (volumeFill && (!prev || prev.volumePct !== volumePct)) volumeFill.style.width = volumePct;
    }

    this.lastRender = { icon, ariaLabel, timeText, speedText, volumeIcon, volumeAriaLabel, seekPct, volumePct };
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

    const { wrapper, root } = this.stickyBar;
    if (!wrapper.isConnected) {
      (this.host.ownerDocument ?? document).body.appendChild(wrapper);
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
    const { wrapper, root } = this.stickyBar;
    if (!root.classList.contains('dhivehigpt-player--sticky')) return;
    this.clearStickyCleanup();

    root.classList.remove('dhivehigpt-player--sticky-visible');

    const finish = () => {
      root.classList.remove('dhivehigpt-player--sticky');
      wrapper.remove();
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

  /**
   * Moves the inline bar into `container` (e.g. so it renders inside a
   * framework component's own subtree instead of as a stray sibling of the
   * host `<audio>` element — used by the React/Vue/Svelte wrappers).
   *
   * Prefer this over `container.appendChild(player.element)`: `element` is
   * the actual `.dhivehigpt-player` bar, but moving *that* alone would
   * leave behind the plain wrapper element around it that establishes the
   * bar's CSS container-query context (how the [responsive
   * layout](../docs/modules/styling-and-theming.md#responsive-layout)
   * knows the bar's own width, not the viewport's) — breaking it silently
   * in its new location. This moves the pair together.
   */
  attachTo(container: HTMLElement): void {
    container.appendChild(this.bar.wrapper);
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

    this.bar.wrapper.remove();
    this.stickyBar?.wrapper.remove();
    this.emit('destroy', undefined);
    this.listeners = {};
  }
}
