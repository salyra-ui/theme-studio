<script setup lang="ts">
import { useTheme, useThemeStore } from './context';
withDefaults(defineProps<{ label?: string }>(), {
  label: 'Tint background with primary',
});
const theme = useTheme(),
  store = useThemeStore();
</script>
<template>
  <label class="tk-background"
    ><input
      type="checkbox"
      :checked="theme.background === 'tinted'"
      @change="
        store.setBackground(
          ($event.target as HTMLInputElement).checked ? 'tinted' : 'neutral',
        )
      "
    />{{ label }}</label
  >
</template>
