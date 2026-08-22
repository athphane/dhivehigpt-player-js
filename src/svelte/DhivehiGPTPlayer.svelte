<script>
  // NOTE: this import is rewritten to '@javaabu/dhivehigpt-player' (the
  // package's own name) by scripts/copy-svelte.mjs when copied into dist/ —
  // see that script for why. Keep this relative during development so the
  // component resolves correctly inside this repo (tests, examples).
  import { AudioPlayer } from '../AudioPlayer';
  import { onDestroy, onMount, createEventDispatcher } from 'svelte';

  export let src;
  export let dark = undefined;
  export let accent = undefined;
  export let shadow = undefined;
  export let flush = undefined;
  export let showTime = undefined;
  export let showSpeed = undefined;
  export let showVolume = undefined;
  export let speeds = undefined;
  export let sticky = undefined;
  export let loadFont = undefined;

  const dispatch = createEventDispatcher();

  let audioEl;
  let containerEl;
  let player;

  function buildOptions() {
    return { src, dark, accent, shadow, flush, showTime, showSpeed, showVolume, speeds, sticky, loadFont };
  }

  function optionsKey() {
    return JSON.stringify([src, dark, accent, shadow, flush, showTime, showSpeed, showVolume, speeds, sticky, loadFont]);
  }

  function create() {
    if (!audioEl) return;
    player = new AudioPlayer(audioEl, buildOptions());
    if (containerEl) player.attachTo(containerEl);
    dispatch('ready', player);
  }

  function teardown() {
    player?.destroy();
    player = undefined;
  }

  onMount(() => {
    lastOptionsKey = optionsKey();
    create();
  });
  onDestroy(teardown);

  // Recreate the player when a config prop actually changes after mount.
  // Compared explicitly (rather than gating on `player`, which this block
  // would then also be "reacting" to its own writes of) so mounting doesn't
  // spuriously trigger a second create() alongside onMount's.
  //
  // Svelte's `$:` dependency tracking is purely syntactic — it can't see
  // through the optionsKey() call to know it reads these props, so they're
  // referenced directly here too (duplicating optionsKey()'s body) for
  // Svelte to actually pick them up as dependencies.
  let lastOptionsKey;
  $: {
    src, dark, accent, shadow, flush, showTime, showSpeed, showVolume, speeds, sticky, loadFont;
    const key = optionsKey();
    if (key !== lastOptionsKey) {
      lastOptionsKey = key;
      if (player) {
        teardown();
        create();
      }
    }
  }
</script>

<div>
  <audio bind:this={audioEl}></audio>
  <div bind:this={containerEl}></div>
</div>
