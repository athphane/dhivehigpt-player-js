import { vi } from 'vitest';

// jsdom doesn't implement real media playback or matchMedia — stub both so
// components under test can drive play/pause/volume/rate and dark-mode
// changes deterministically.

HTMLMediaElement.prototype.play = vi.fn(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event('play'));
  return Promise.resolve();
});

HTMLMediaElement.prototype.pause = vi.fn(function (this: HTMLMediaElement) {
  this.dispatchEvent(new Event('pause'));
});

HTMLMediaElement.prototype.load = vi.fn();

type MediaQueryListenerMap = Map<string, Set<(e: MediaQueryListEvent) => void>>;

/** A minimal, controllable `matchMedia` stand-in. Tests can flip `.matches` via `setMatchMediaMatches`. */
class FakeMediaQueryList {
  matches: boolean;
  media: string;
  private listeners: MediaQueryListenerMap = new Map();

  constructor(media: string, matches: boolean) {
    this.media = media;
    this.matches = matches;
  }

  addEventListener(type: string, listener: (e: MediaQueryListEvent) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (e: MediaQueryListEvent) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(matches: boolean) {
    this.matches = matches;
    this.listeners.get('change')?.forEach((listener) => listener({ matches } as MediaQueryListEvent));
  }
}

const mediaQueryLists = new Map<string, FakeMediaQueryList>();

window.matchMedia = vi.fn((media: string) => {
  if (!mediaQueryLists.has(media)) {
    mediaQueryLists.set(media, new FakeMediaQueryList(media, false));
  }
  return mediaQueryLists.get(media) as unknown as MediaQueryList;
});

/** Test helper: flips the given media query's `.matches` and fires its `change` listeners. */
export function setMatchMediaMatches(media: string, matches: boolean): void {
  const list = mediaQueryLists.get(media) ?? new FakeMediaQueryList(media, matches);
  mediaQueryLists.set(media, list);
  list.dispatch(matches);
}

export function resetMatchMedia(): void {
  mediaQueryLists.clear();
}
