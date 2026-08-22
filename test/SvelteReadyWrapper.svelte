<script>
  // Test-only wrapper. `component.$on('ready', ...)` attached *after*
  // render() races against onMount, which can already have fired by then —
  // the same race a real consumer would face using the imperative
  // `new Component()` + `.$on()` API. The declarative `on:ready={...}`
  // syntax below is how the component is meant to be used, and Svelte
  // wires it up before the child mounts, so it isn't racy.
  import DhivehiGPTPlayer from '../src/svelte/DhivehiGPTPlayer.svelte';

  export let src;
  export let onReady;
</script>

<DhivehiGPTPlayer {src} on:ready={(e) => onReady(e.detail)} />
