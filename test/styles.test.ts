import { afterEach, describe, expect, it } from 'vitest';
import { injectFontLink, injectStyles } from '../src/core/styles';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('injectStyles', () => {
  it('injects a single <style> tag even when called multiple times', () => {
    injectStyles();
    injectStyles();
    injectStyles();
    expect(document.head.querySelectorAll('#dhivehigpt-player-styles')).toHaveLength(1);
  });
});

describe('injectFontLink', () => {
  it('is opt-in: does nothing unless explicitly called', () => {
    expect(document.head.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('injects the Outfit font stylesheet + preconnect only once', () => {
    injectFontLink();
    injectFontLink();
    expect(document.head.querySelectorAll('#dhivehigpt-player-font')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="preconnect"]')).toBeTruthy();
  });
});
