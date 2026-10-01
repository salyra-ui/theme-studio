<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import type { BorderKind, Target, ThemeFieldRegistration } from '../core';
import {
  bindBorderInput,
  borderControlLabel,
  borderControlUnit,
} from '../core/border-control';
import { useThemeStore } from './context';
const props = withDefaults(
  defineProps<{ kind?: BorderKind; target?: Target; label?: string }>(),
  {
    kind: 'width',
    target: 'DEFAULT',
  },
);
const store = useThemeStore();
const initial =
  store.getSnapshot().theme.structure.websitePreset.border[props.kind][
    props.target
  ];
const input = ref<HTMLInputElement>();
let fields: ThemeFieldRegistration | undefined;
let unbind: (() => void) | undefined;
function bind() {
  unbind?.();
  if (input.value)
    unbind = bindBorderInput(input.value, store, props.kind, props.target);
}
onMounted(() => {
  fields = store.registerFields({ roles: [], [props.kind]: [props.target] });
  bind();
});
watch(
  () => [props.kind, props.target],
  () => {
    fields?.update({ roles: [], [props.kind]: [props.target] });
    bind();
  },
);
onBeforeUnmount(() => {
  unbind?.();
  fields?.destroy();
});
</script>
<template>
  <label class="tk-border">
    <span>{{ label ?? borderControlLabel(kind, target) }}</span>
    <span class="tk-border-field">
      <input
        ref="input"
        type="number"
        min="0"
        max="1000"
        :step="kind === 'width' ? 1 : 0.125"
        :value="initial"
      />
      <span aria-hidden="true">{{ borderControlUnit(kind) }}</span>
    </span>
  </label>
</template>
