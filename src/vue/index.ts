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
      containerEl.value?.appendChild(player.element);
      emit('ready', player);
    }

    function destroy() {
      player?.destroy();
      player = null;
    }

    onMounted(create);
    onBeforeUnmount(destroy);

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
        props.speeds,
        props.sticky,
        props.loadFont,
      ],
      () => {
        destroy();
        create();
      },
    );

    return () =>
      h('div', [h('audio', { ref: audioEl }), h('div', { ref: containerEl })]);
  },
});

export default DhivehiGPTPlayer;
