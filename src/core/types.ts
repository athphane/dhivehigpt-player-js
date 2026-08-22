/** What kind of media a player instance controls. Only 'audio' ships today; 'video' is reserved for a future MediaPlayer subclass. */
export type MediaKind = 'audio' | 'video';

export type DarkMode = 'auto' | boolean;

export type ShadowVariant = 'none' | 'hairline' | 'soft' | 'lift';

export interface PlayerOptions {
  /** Source media URL. Falls back to the host element's own `src`/`<source>`. */
  src?: string;
  /** 'auto' follows the OS/browser `prefers-color-scheme`. Default: 'auto'. */
  dark: DarkMode;
  /** Solid brand-color skin, overrides dark. Default: false. */
  accent: boolean;
  shadow: ShadowVariant;
  /** Edge-to-edge bar: no radius, no border, upward shadow. Default: false. */
  flush: boolean;
  showTime: boolean;
  showSpeed: boolean;
  showVolume: boolean;
  /** Playback rates the speed control cycles through, in order. */
  speeds: number[];
  /** Stick the bar to the bottom of the viewport while playing. Default: false. */
  sticky: boolean;
  /** Opt-in to loading the "Outfit" font from Google Fonts. Default: false. */
  loadFont: boolean;
}

export const DEFAULT_OPTIONS: PlayerOptions = {
  dark: 'auto',
  accent: false,
  shadow: 'hairline',
  flush: false,
  showTime: true,
  showSpeed: true,
  showVolume: true,
  speeds: [1, 1.25, 1.5, 2, 0.75],
  sticky: false,
  loadFont: false,
};

export interface PlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  volume: number;
  /** Volume to restore to when unmuting. */
  preMuteVolume: number;
}

export type PlayerEventMap = {
  play: void;
  pause: void;
  stop: void;
  ended: void;
  timeupdate: { currentTime: number; duration: number };
  ratechange: { rate: number };
  volumechange: { volume: number; muted: boolean };
  destroy: void;
};

export type PlayerEventName = keyof PlayerEventMap;

export type PlayerEventListener<K extends PlayerEventName> = (payload: PlayerEventMap[K]) => void;
