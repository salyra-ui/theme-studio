<script setup lang="ts">
import { computed, watch, onMounted } from 'vue';
import {
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
} from '../core';
import { useTheme } from './context';
const props = withDefaults(
    defineProps<{ format?: ThemeExportFormat; selection?: TokenSelection }>(),
    { format: 'json' },
  ),
  emit = defineEmits<{ change: [value: ThemeConfiguration] }>();
const state = useTheme(),
  configuration = computed(() =>
    themeConfiguration(state.value, props.selection),
  );
onMounted(() => emit('change', configuration.value));
watch(
  [
    () => state.value.theme,
    () => state.value.mode,
    () => state.value.modePreference,
    () => state.value.systemMode,
    () => JSON.stringify(props.selection),
  ],
  () => emit('change', configuration.value),
);
</script>
<template>
  <slot :configuration="configuration">
    <pre class="tk-export" aria-label="Theme configuration">{{
      configuration[format]
    }}</pre>
  </slot>
</template>
