<script setup lang="ts">
import { useThemeMode } from './context';
import type { ModePreference } from '../core';
const props = withDefaults(
  defineProps<{
    value?: ModePreference;
    labels?: Record<ModePreference, string>;
  }>(),
  {
    labels: () => ({
      system: 'System',
      light: 'Light mode',
      dark: 'Dark mode',
    }),
  },
);
const mode = useThemeMode();
</script>
<template>
  <button
    type="button"
    :aria-pressed="value ? mode.preference.value === value : undefined"
    @click="value ? mode.setMode(value) : mode.cycle()"
  >
    <slot
      :preference="mode.preference.value"
      :resolvedMode="mode.resolvedMode.value"
      :setMode="mode.setMode"
      :cycle="mode.cycle"
      >{{ props.labels[value ?? mode.preference.value] }}</slot
    >
  </button>
</template>
