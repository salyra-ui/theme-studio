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
  initial = props.options,
  store = provideTheme(props.store ?? createThemeStore(initial));
let stop: (() => void) | undefined;
onMounted(() => (stop = mountThemeStore(store, initial?.storage, initial)));
onScopeDispose(() => stop?.());
defineExpose({ store });
</script>
<template><slot /></template>
