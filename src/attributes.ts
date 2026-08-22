import { DEFAULT_OPTIONS, type DarkMode, type PlayerOptions, type ShadowVariant } from './core/types';

/** Marker attribute used both to opt an `<audio>` element into auto-init and to read its config. */
export const PLAYER_ATTR = 'data-dhivehigpt-player';

const SHADOW_VARIANTS: ShadowVariant[] = ['none', 'hairline', 'soft', 'lift'];

function parseBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  if (value === '' || value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseDark(value: string | null, fallback: DarkMode): DarkMode {
  if (value === null) return fallback;
  if (value === 'auto') return 'auto';
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseShadow(value: string | null, fallback: ShadowVariant): ShadowVariant {
  if (value && (SHADOW_VARIANTS as string[]).includes(value)) return value as ShadowVariant;
  return fallback;
}

function parseSpeeds(value: string | null, fallback: number[]): number[] {
  if (!value) return fallback;
  const parsed = value
    .split(',')
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parsed.length ? parsed : fallback;
}

/**
 * Reads `data-*` attributes off a host element into a full PlayerOptions
 * object. This is the single source of truth for the data-attribute API —
 * both auto-init and manual `new AudioPlayer(el)` calls go through it.
 */
export function readOptionsFromElement(el: Element, overrides: Partial<PlayerOptions> = {}): PlayerOptions {
  const get = (name: string) => el.getAttribute(name);

  const options: PlayerOptions = {
    src: get('data-src') ?? undefined,
    dark: parseDark(get('data-dark'), DEFAULT_OPTIONS.dark),
    accent: parseBoolean(get('data-accent'), DEFAULT_OPTIONS.accent),
    shadow: parseShadow(get('data-shadow'), DEFAULT_OPTIONS.shadow),
    flush: parseBoolean(get('data-flush'), DEFAULT_OPTIONS.flush),
    showTime: parseBoolean(get('data-show-time'), DEFAULT_OPTIONS.showTime),
    showSpeed: parseBoolean(get('data-show-speed'), DEFAULT_OPTIONS.showSpeed),
    showVolume: parseBoolean(get('data-show-volume'), DEFAULT_OPTIONS.showVolume),
    speeds: parseSpeeds(get('data-speeds'), DEFAULT_OPTIONS.speeds),
    sticky: parseBoolean(get('data-sticky'), DEFAULT_OPTIONS.sticky),
    loadFont: parseBoolean(get('data-load-font'), DEFAULT_OPTIONS.loadFont),
  };

  return { ...options, ...overrides };
}
