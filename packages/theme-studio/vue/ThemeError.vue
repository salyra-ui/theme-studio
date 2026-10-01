<script setup lang="ts">
import { useTheme, useThemeStore } from './context';
const theme = useTheme(),
  store = useThemeStore();
</script>
<template>
  <slot v-if="theme.error" :error="theme.error" :retry="store.reload" />
</template>
