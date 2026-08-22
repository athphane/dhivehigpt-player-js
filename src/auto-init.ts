import { AudioPlayer } from './AudioPlayer';
import { PLAYER_ATTR } from './attributes';

const INITIALIZED_ATTR = 'data-dhivehigpt-player-initialized';

// A regular Map, not a WeakMap: `watch()` needs to iterate live instances to
// reconcile them against DOM churn from libraries (Alpine, Livewire) that
// mutate the page outside of this library's control. Entries are removed
// explicitly on destroy/reconcile, so this doesn't leak.
const instances = new Map<HTMLAudioElement, AudioPlayer>();

// Built once rather than on every call — this is re-evaluated for every
// node in every MutationObserver batch while watch() is active, so it's
// worth not re-concatenating the same string each time.
const SELECTOR = `audio[${PLAYER_ATTR}]:not([${INITIALIZED_ATTR}])`;

function initElement(el: HTMLAudioElement): AudioPlayer {
  el.setAttribute(INITIALIZED_ATTR, '');
  const player = new AudioPlayer(el);
  instances.set(el, player);
  return player;
}

/**
 * Converts every not-yet-initialized `audio[data-dhivehigpt-player]`
 * element found in `root` into a DhivehiGPT player. Safe to call more than
 * once (e.g. after injecting new HTML) — already-converted elements are
 * skipped. Returns the players created by this call.
 */
export function init(root: ParentNode = document): AudioPlayer[] {
  const elements = Array.from(root.querySelectorAll<HTMLAudioElement>(SELECTOR));
  return elements.map(initElement);
}

/** Returns the player instance for a given host `<audio>` element, if it was converted. */
export function getInstance(el: HTMLAudioElement): AudioPlayer | undefined {
  return instances.get(el);
}

/**
 * Cleans up or re-converts players whose DOM has been disturbed by
 * something outside this library's control.
 *
 * Two distinct cases, both left behind by frameworks that add/remove or
 * diff-patch the DOM themselves (Alpine, Livewire):
 *
 * 1. The host `<audio>` element itself was removed (e.g. Alpine's
 *    `x-if`/`x-for` unmounting it). The player's bar is a *sibling* of the
 *    host, not a descendant, so it's never auto-removed with it — without
 *    this check it'd be orphaned, still visible and still listening. The
 *    instance is torn down (which removes that DOM too) and dropped.
 * 2. The host survives, but the sibling bar this library injected next to
 *    it was stripped out — e.g. Livewire's morphdom-based updates
 *    can reuse the same `<audio>` node across a re-render (so it keeps its
 *    "initialized" marker) while still removing DOM around it that wasn't
 *    part of the server-rendered HTML being morphed to. The stale instance
 *    is torn down and the host is converted again from scratch.
 */
function reconcile(): void {
  // Nothing to reconcile — skip the snapshot/iteration below entirely so
  // an unrelated MutationObserver batch (e.g. from some other widget on
  // the page constantly touching the DOM) doesn't do pointless work here
  // once there are no players left to check.
  if (instances.size === 0) return;

  // Snapshot first: reconciling an entry can insert a fresh replacement
  // back into `instances`, which would otherwise be visible to this same
  // iteration since we're mutating the map we're iterating over.
  for (const [hostEl, player] of Array.from(instances)) {
    if (!hostEl.isConnected) {
      player.destroy();
      instances.delete(hostEl);
      continue;
    }

    if (!player.element.isConnected) {
      player.destroy();
      instances.delete(hostEl);
      hostEl.removeAttribute(INITIALIZED_ATTR);
      initElement(hostEl);
    }
  }
}

let observer: MutationObserver | null = null;

/**
 * Starts observing the DOM for `audio[data-dhivehigpt-player]` elements
 * added after the initial page load (e.g. content injected by client-side
 * routing, or rendered by Alpine/Livewire) and auto-converts them. Also
 * reconciles existing players against DOM churn — see `reconcile()`. Call
 * `unwatch()` to stop.
 */
export function watch(root: Node = document.body): void {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(SELECTOR)) initElement(node as HTMLAudioElement);
        node.querySelectorAll?.(SELECTOR).forEach((el) => initElement(el as HTMLAudioElement));
      });
    }
    reconcile();
  });
  observer.observe(root, { childList: true, subtree: true });
}

export function unwatch(): void {
  observer?.disconnect();
  observer = null;
}

function autoRun(): void {
  if (typeof document === 'undefined') return;
  const run = () => {
    init();
    watch();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

/** Runs auto-init immediately when this module is used from the UMD/browser build. */
export function autoInit(): void {
  autoRun();
}
