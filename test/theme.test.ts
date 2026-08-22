import { describe, expect, it } from 'vitest';
import { computeThemeVars, resolveIsDark } from '../src/core/theme';
import { DEFAULT_OPTIONS } from '../src/core/types';
import { setMatchMediaMatches } from './setup';

describe('computeThemeVars', () => {
  it('produces the light theme by default', () => {
    const vars = computeThemeVars(DEFAULT_OPTIONS, false);
    expect(vars['--bg']).toBe('#ffffff');
    expect(vars['--fg']).toBe('#111414');
    expect(vars['--btn']).toBe('#39bbb0');
    expect(vars['--credit']).toBe('#9b9e9e');
    expect(vars['--logo']).toBe('#39bbb0');
  });

  it('produces the dark theme when isDarkActive is true', () => {
    const vars = computeThemeVars(DEFAULT_OPTIONS, true);
    expect(vars['--bg']).toBe('#16191a');
    expect(vars['--fg']).toBe('#f2f4f4');
    expect(vars['--credit']).toBe('rgba(255,255,255,.42)');
    // The brand mark stays teal in dark mode too — only accent swaps it to white.
    expect(vars['--logo']).toBe('#39bbb0');
  });

  it('produces the accent (solid brand) theme, overriding dark', () => {
    const vars = computeThemeVars({ ...DEFAULT_OPTIONS, accent: true }, true);
    expect(vars['--bg']).toBe('#39bbb0');
    expect(vars['--fg']).toBe('#ffffff');
    expect(vars['--btn']).toBe('#ffffff');
    expect(vars['--btnFg']).toBe('#2aa79c');
    expect(vars['--logo']).toBe('#ffffff');
  });

  it('zeroes the radius/border and applies an upward shadow when flush', () => {
    const vars = computeThemeVars({ ...DEFAULT_OPTIONS, flush: true }, false);
    expect(vars['--radius']).toBe('0px');
    expect(vars['--border']).toBe('0');
    expect(vars['--shadow']).toContain('-8px');
  });

  it('always computes a sticky-shadow (upward shadow + hairline), regardless of the shadow/flush options — the sticky bar needs its own separation from the page it floats over even when not flush', () => {
    const defaultOpts = computeThemeVars({ ...DEFAULT_OPTIONS, shadow: 'none', flush: false }, false);
    expect(defaultOpts['--sticky-shadow']).toContain('-8px');

    const dark = computeThemeVars({ ...DEFAULT_OPTIONS, shadow: 'none' }, true);
    expect(dark['--sticky-shadow']).toContain('-8px');
    expect(dark['--sticky-shadow']).not.toBe(defaultOpts['--sticky-shadow']);

    const accent = computeThemeVars({ ...DEFAULT_OPTIONS, accent: true, shadow: 'none' }, false);
    expect(accent['--sticky-shadow']).toContain('-8px');
    // Accent uses the same (dark-surface-appropriate) shadow as dark mode.
    expect(accent['--sticky-shadow']).toBe(dark['--sticky-shadow']);
  });

  it('supports all shadow variants', () => {
    for (const shadow of ['none', 'hairline', 'soft', 'lift'] as const) {
      const vars = computeThemeVars({ ...DEFAULT_OPTIONS, shadow }, false);
      expect(typeof vars['--shadow']).toBe('string');
    }
    const none = computeThemeVars({ ...DEFAULT_OPTIONS, shadow: 'none' }, false);
    expect(none['--border']).toBe('1px solid transparent');
    const soft = computeThemeVars({ ...DEFAULT_OPTIONS, shadow: 'soft' }, false);
    expect(soft['--shadow']).not.toBe('none');
  });
});

describe('resolveIsDark', () => {
  it('returns explicit boolean values as-is', () => {
    expect(resolveIsDark(true)).toBe(true);
    expect(resolveIsDark(false)).toBe(false);
  });

  it("follows the OS 'prefers-color-scheme' media query when 'auto'", () => {
    setMatchMediaMatches('(prefers-color-scheme: dark)', true);
    expect(resolveIsDark('auto')).toBe(true);

    setMatchMediaMatches('(prefers-color-scheme: dark)', false);
    expect(resolveIsDark('auto')).toBe(false);
  });
});
