import { AudioPlayer } from '../AudioPlayer';
import type { PlayerOptions } from '../core/types';

const DATA_KEY = 'dhivehigptPlayer';

/**
 * A thin jQuery plugin wrapper around `AudioPlayer`, for sites that already
 * load jQuery and would rather use its idioms than the vanilla JS API.
 * jQuery itself is never imported or bundled here — callers pass their own
 * `jQuery`/`$` in, so this stays a zero-dependency addition.
 *
 * Usage:
 *   $('audio').dhivehigptPlayer({ accent: true });   // initialize
 *   $('audio').dhivehigptPlayer('play');             // call a method
 *   $('audio').data('dhivehigptPlayer');             // get the AudioPlayer instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerJQueryPlugin(jq: any): void {
  if (!jq || !jq.fn || jq.fn.dhivehigptPlayer) return;

  jq.fn.dhivehigptPlayer = function dhivehigptPlayer(
    this: /* JQuery */ any,
    optionsOrMethod?: Partial<PlayerOptions> | keyof AudioPlayer,
    ...args: unknown[]
  ) {
    if (typeof optionsOrMethod === 'string') {
      const method = optionsOrMethod;
      let result: unknown;
      this.each(function (this: HTMLElement) {
        const player = jq(this).data(DATA_KEY) as AudioPlayer | undefined;
        if (!player) return;
        const member = player[method as keyof AudioPlayer];
        // Methods (play, pause, seek, ...) are invoked; getters (playing,
        // currentTime, ...) are read directly, both accessed the same way:
        // $('audio').dhivehigptPlayer('play') / .dhivehigptPlayer('playing')
        result = typeof member === 'function' ? (member as (...a: unknown[]) => unknown).apply(player, args) : member;
      });
      // A getter-style call (e.g. 'playing', 'currentTime') returns the
      // value from the last matched element instead of the jQuery object,
      // matching common jQuery plugin conventions (c.f. .val(), .html()).
      return result !== undefined ? result : this;
    }

    return this.each(function (this: HTMLElement) {
      if (jq(this).data(DATA_KEY)) return; // already initialized
      const player = new AudioPlayer(this as unknown as HTMLAudioElement, optionsOrMethod ?? {});
      jq(this).data(DATA_KEY, player);
    });
  };
}

// Merges into @types/jquery's ambient `JQuery` interface, if present in the
// consuming project, so `$(...).dhivehigptPlayer(...)` type-checks. Harmless
// no-op if @types/jquery isn't installed.
declare global {
  interface JQuery {
    dhivehigptPlayer(options?: Partial<PlayerOptions>): JQuery;
    dhivehigptPlayer(method: keyof AudioPlayer, ...args: unknown[]): unknown;
  }
}
