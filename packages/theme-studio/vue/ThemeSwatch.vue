<script setup lang="ts">
import type { Theme } from '../core';
import { useTheme, useThemeStore } from './context';
defineProps<{ theme: Theme }>();
const state = useTheme(),
  store = useThemeStore();
</script>
<template>
  <button
    type="button"
    :aria-pressed="state.theme.id === theme.id"
    @click="store.setTheme(theme)"
  >
    <slot>{{ theme.name }}</slot>
  </button>
</template>
