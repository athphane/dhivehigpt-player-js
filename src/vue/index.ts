import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { AudioPlayer } from '../AudioPlayer';
import type { DarkMode, PlayerOptions, ShadowVariant } from '../core/types';

/**
 * Vue 3 wrapper around the framework-free `AudioPlayer`. Renders a hidden
 * `<audio>` element and mounts the player's control bar next to it. The
 * player instance is (re)created whenever `src` or a configuration prop
 * changes.
 */
export const DhivehiGPTPlayer = defineComponent({
  name: 'DhivehiGPTPlayer',
  props: {
    src: { type: String, required: true },
    dark: { type: [String, Boolean] as PropType<DarkMode>, default: undefined },
    accent: { type: Boolean, default: undefined },
    shadow: { type: String as PropType<ShadowVariant>, default: undefined },
    flush: { type: Boolean, default: undefined },
    showTime: { type: Boolean, default: undefined },
    showSpeed: { type: Boolean, default: undefined },
    showVolume: { type: Boolean, default: undefined },
    speeds: { type: Array as PropType<number[]>, default: undefined },
    sticky: { type: Boolean, default: undefined },
    loadFont: { type: Boolean, default: undefined },
  },
  emits: ['ready'],
  setup(props, { emit }) {
    const audioEl = ref<HTMLAudioElement | null>(null);
    const containerEl = ref<HTMLDivElement | null>(null);
    let player: AudioPlayer | null = null;

    function buildOptions(): Partial<PlayerOptions> {
      return {
        src: props.src,
        dark: props.dark,
        accent: props.accent,
        shadow: props.shadow,
        flush: props.flush,
        showTime: props.showTime,
        showSpeed: props.showSpeed,
        showVolume: props.showVolume,
        speeds: props.speeds,
        sticky: props.sticky,
        loadFont: props.loadFont,
      };
    }

    function create() {
      if (!audioEl.value) return;
      player = new AudioPlayer(audioEl.value, buildOptions());
      if (containerEl.value) player.attachTo(containerEl.value);
      emit('ready', player);
    }

    function destroy() {
      player?.destroy();
      player = null;
    }

    onMounted(create);
    onBeforeUnmount(destroy);

    const recreate = () => {
      destroy();
      create();
    };

    watch(
      () => [
        props.src,
        props.dark,
        props.accent,
        props.shadow,
        props.flush,
        props.showTime,
        props.showSpeed,
        props.showVolume,
        props.sticky,
        props.loadFont,
      ],
      recreate,
    );

    // Watched separately, as its own primitive (string) source, rather than
    // folded into the array above: Vue's watch decides whether to fire
    // based on the *tracked source* changing, and for a getter that always
    // returns a fresh array literal, that's always "changed" on every
    // re-run regardless of the array's contents. A caller writing
    // `:speeds="[1, 1.5, 2]"` inline in a template (common) gets a new
    // array reference on every parent re-render even when the values
    // don't change — watching `props.speeds` (directly, or joined *inside*
    // the array above) would destroy and rebuild the whole player (losing
    // playback position) on every unrelated re-render. A plain string
    // source doesn't have that problem: Vue compares primitives by value.
    watch(() => props.speeds?.join(','), recreate);

    return () =>
      h('div', [h('audio', { ref: audioEl }), h('div', { ref: containerEl })]);
  },
});

export default DhivehiGPTPlayer;
