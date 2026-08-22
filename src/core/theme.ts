import type { PlayerOptions, ShadowVariant } from './types';

export interface ThemeVars {
  '--bg': string;
  '--fg': string;
  '--mute': string;
  '--btn': string;
  '--btnFg': string;
  '--fill': string;
  '--chipHover': string;
  '--credit': string;
  '--creditHover': string;
  '--logo': string;
  '--line': string;
  '--track': string;
  '--radius': string;
  '--border': string;
  '--shadow': string;
  '--sticky-shadow': string;
}

function shadowValue(variant: ShadowVariant, dark: boolean, line: string): string {
  const shadows = dark
    ? {
        none: 'none',
        hairline: 'none',
        soft: '0 4px 14px -6px rgba(0,0,0,.7)',
        lift: '0 14px 34px -12px rgba(0,0,0,.85)',
      }
    : {
        none: 'none',
        hairline: 'none',
        soft: '0 3px 10px -4px rgba(17,20,20,.16)',
        lift: '0 14px 30px -12px rgba(17,20,20,.3)',
      };
  return shadows[variant];
}

/**
 * Resolves the effective (light | dark | accent) theme + shadow/flush
 * options into the CSS custom properties the control bar renders with.
 * Ported 1:1 from the Claude Design export's `renderVals()`.
 */
export function computeThemeVars(options: PlayerOptions, isDarkActive: boolean): ThemeVars {
  const accent = !!options.accent;
  const dark = !accent && isDarkActive;
  const flush = !!options.flush;
  const mute = dark ? 'rgba(255,255,255,.6)' : 'rgba(17,20,20,.7)';
  const line = accent ? 'rgba(255,255,255,.34)' : dark ? 'rgba(255,255,255,.14)' : 'rgba(17,20,20,.12)';
  // The same upward shadow + top hairline used for `flush`, but applied to
  // the sticky bar unconditionally: it needs *some* visual separation from
  // the page it's floating over regardless of the developer's chosen
  // `shadow`/`flush` option for the inline bar — otherwise it's invisible
  // against a same-colored background, which is exactly the "hairline"
  // (the default) + non-flush case.
  const stickyShadow =
    dark || accent
      ? '0 -8px 24px -12px rgba(0,0,0,.8), 0 -1px 0 rgba(255,255,255,.12)'
      : '0 -8px 24px -14px rgba(17,20,20,.35), 0 -1px 0 rgba(17,20,20,.1)';

  return {
    '--bg': accent ? '#39bbb0' : dark ? '#16191a' : '#ffffff',
    '--fg': accent ? '#ffffff' : dark ? '#f2f4f4' : '#111414',
    '--mute': accent ? 'rgba(255,255,255,.85)' : mute,
    '--btn': accent ? '#ffffff' : '#39bbb0',
    '--btnFg': accent ? '#2aa79c' : '#ffffff',
    '--fill': accent ? '#ffffff' : '#39bbb0',
    '--chipHover': accent ? '#ffffff' : '#39bbb0',
    '--credit': accent ? 'rgba(255,255,255,.8)' : dark ? 'rgba(255,255,255,.42)' : '#9b9e9e',
    '--creditHover': accent ? '#ffffff' : dark ? 'rgba(255,255,255,.82)' : '#4d5252',
    // The brand mark keeps its own teal/white color regardless of the
    // (grayscale, muted) "Powered by DhivehiGPT" text color around it.
    '--logo': accent ? '#ffffff' : '#39bbb0',
    '--line': line,
    '--track': accent ? 'rgba(255,255,255,.32)' : dark ? 'rgba(255,255,255,.16)' : 'rgba(17,20,20,.11)',
    '--radius': flush ? '0px' : '10px',
    '--border': flush ? '0' : options.shadow === 'none' ? '1px solid transparent' : `1px solid ${line}`,
    '--shadow': flush ? stickyShadow : shadowValue(options.shadow, dark, line),
    '--sticky-shadow': stickyShadow,
  };
}

/** Resolves the 'auto' | boolean dark option against the OS/browser preference. */
export function resolveIsDark(dark: PlayerOptions['dark']): boolean {
  if (typeof dark === 'boolean') return dark;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
