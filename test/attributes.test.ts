import { describe, expect, it } from 'vitest';
import { readOptionsFromElement } from '../src/attributes';
import { createHostAudio } from './helpers';

describe('readOptionsFromElement', () => {
  it('returns library defaults when no data attributes are present', () => {
    const el = createHostAudio();
    const options = readOptionsFromElement(el);
    expect(options.dark).toBe('auto');
    expect(options.accent).toBe(false);
    expect(options.shadow).toBe('hairline');
    expect(options.flush).toBe(false);
    expect(options.showTime).toBe(true);
    expect(options.showSpeed).toBe(true);
    expect(options.showVolume).toBe(true);
    expect(options.speeds).toEqual([1, 1.25, 1.5, 2, 0.75]);
    expect(options.sticky).toBe(false);
    expect(options.loadFont).toBe(false);
  });

  it('parses every documented data attribute', () => {
    const el = createHostAudio({
      'data-src': 'https://example.com/a.mp3',
      'data-dark': 'true',
      'data-accent': 'true',
      'data-shadow': 'lift',
      'data-flush': 'true',
      'data-show-time': 'false',
      'data-show-speed': 'false',
      'data-show-volume': 'false',
      'data-speeds': '1, 1.5, 2',
      'data-sticky': 'true',
      'data-load-font': 'true',
    });
    const options = readOptionsFromElement(el);
    expect(options.src).toBe('https://example.com/a.mp3');
    expect(options.dark).toBe(true);
    expect(options.accent).toBe(true);
    expect(options.shadow).toBe('lift');
    expect(options.flush).toBe(true);
    expect(options.showTime).toBe(false);
    expect(options.showSpeed).toBe(false);
    expect(options.showVolume).toBe(false);
    expect(options.speeds).toEqual([1, 1.5, 2]);
    expect(options.sticky).toBe(true);
    expect(options.loadFont).toBe(true);
  });

  it('treats a boolean data attribute present with an empty value as true', () => {
    const el = createHostAudio({ 'data-accent': '' });
    expect(readOptionsFromElement(el).accent).toBe(true);
  });

  it('falls back to defaults for unrecognized enum values', () => {
    const el = createHostAudio({ 'data-shadow': 'bogus', 'data-dark': 'bogus' });
    const options = readOptionsFromElement(el);
    expect(options.shadow).toBe('hairline');
    expect(options.dark).toBe('auto');
  });

  it('ignores non-numeric entries in data-speeds and falls back to defaults if none are valid', () => {
    const el = createHostAudio({ 'data-speeds': 'fast, slow' });
    expect(readOptionsFromElement(el).speeds).toEqual([1, 1.25, 1.5, 2, 0.75]);
  });

  it('lets explicit overrides win over data attributes', () => {
    const el = createHostAudio({ 'data-accent': 'true' });
    const options = readOptionsFromElement(el, { accent: false });
    expect(options.accent).toBe(false);
  });
});
