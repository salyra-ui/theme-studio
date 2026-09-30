<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import {
  createThemeStore,
  mountThemeStore,
  type ThemeStore,
  type ThemeOptions,
} from '../core';
import { provideTheme, watchTheme } from './context';
const props = defineProps<{ options?: ThemeOptions; store?: ThemeStore }>();
const store = provideTheme(props.store ?? createThemeStore(props.options)),
  theme = watchTheme(store);
let cleanup: (() => void) | undefined;
onMounted(() => {
  cleanup = mountThemeStore(store, props.options?.storage, props.options);
});
onBeforeUnmount(() => cleanup?.());
</script>
<template>
  <div
    class="tk-scope"
    :data-theme="theme.theme.id"
    :data-mode="theme.mode"
    :data-theme-status="theme.status"
    :style="theme.style"
  >
    <slot />
  </div>
</template>
