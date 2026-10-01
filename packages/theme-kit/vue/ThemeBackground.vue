<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
import { useTheme, useThemeStore } from './context';
withDefaults(defineProps<{ label?: string }>(), {
  label: 'Tint background with primary',
});
const theme = useTheme(),
  store = useThemeStore();
let fields: import('../core').ThemeFieldRegistration | undefined;
onMounted(() => {
  fields = store.registerFields({ roles: [], background: true });
});

onBeforeUnmount(() => fields?.destroy());
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
