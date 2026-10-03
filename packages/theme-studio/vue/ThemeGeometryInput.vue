<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { ref, watch } from 'vue';
import { bindBorderInput, type Target, type BorderKind } from '../core';
import { useTheme, useThemeStore } from './context';
const props = withDefaults(
  defineProps<{ kind?: BorderKind; target?: Target; disabled?: boolean }>(),
  { kind: 'radius', target: 'DEFAULT' },
);
const store = useThemeStore(),
  state = useTheme(),
  element = ref<HTMLInputElement>();
const vInitialValue = {
  getSSRProps: (binding: { value: number }) => ({ value: binding.value }),
};
const initial =
  store.getSnapshot().theme.structure.websitePreset.border[props.kind][
    props.target
  ];
watch(
  [element, () => props.kind, () => props.target],
  ([node], _old, cleanup) => {
    if (!node) return;
    const fields = store.registerFields({
        roles: [],
        [props.kind]: [props.target],
      }),
      stop = bindBorderInput(node, store, props.kind, props.target);
    cleanup(() => {
      stop();
      fields.destroy();
    });
  },
  { flush: 'post' },
);
defineExpose({ element });
</script>
<template>
  <input
    type="number"
    min="0"
    max="1000"
    :step="kind === 'radius' ? 0.125 : 1"
    :aria-label="`${target} ${kind}`"
    v-initial-value="initial"
    v-bind="$attrs"
    ref="element"
    :disabled="disabled || state.disabled"
    data-tk-part="geometry-input"
  />
</template>
