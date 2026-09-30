<script setup lang="ts">
import type { BorderKind, Target } from '../core';
import { useTheme, useThemeStore } from './context';
const props = withDefaults(
  defineProps<{ kind?: BorderKind; target?: Target; label?: string }>(),
  { kind: 'width', target: 'DEFAULT' },
);
const state = useTheme(),
  store = useThemeStore();
function change(e: Event) {
  const n = (e.target as HTMLInputElement).valueAsNumber;
  if (Number.isFinite(n) && n >= 0 && n <= 1000)
    store.setBorder(props.kind, props.target, n);
}
</script>
<template>
  <label class="tk-border"
    >{{ label ?? `${target} border ${kind}`
    }}<input
      type="number"
      min="0"
      max="1000"
      :step="kind === 'width' ? 1 : 0.125"
      :value="state.theme.structure.websitePreset.border[kind][target]"
      @input="change"
    />{{ kind === 'width' ? 'px' : 'rem' }}</label
  >
</template>
