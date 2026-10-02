<script setup lang="ts">
import { onMounted, onScopeDispose } from 'vue';
import {
  createThemeStore,
  mountThemeStore,
  type ThemeStore,
  type ThemeOptions,
} from '../core';
import { provideTheme } from './context';
defineOptions({ inheritAttrs: false });
const props = defineProps<{ store?: ThemeStore; options?: ThemeOptions }>(),
  store = provideTheme(props.store ?? createThemeStore(props.options));
let stop: (() => void) | undefined;
onMounted(
  () => (stop = mountThemeStore(store, props.options?.storage, props.options)),
);
onScopeDispose(() => stop?.());
defineExpose({ store });
</script>
<template><slot /></template>
