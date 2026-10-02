<script setup lang="ts">
import type { ThemeOptions, ThemeStore } from '../core';
import ThemeRoot from './ThemeRoot.vue';
import ThemeProviderContent from './ThemeProviderContent.vue';
defineOptions({ inheritAttrs: false });
defineProps<{ options?: ThemeOptions; store?: ThemeStore }>();
</script>
<template>
  <ThemeRoot :store="store" :options="options">
    <ThemeProviderContent v-bind="$attrs"><slot /></ThemeProviderContent>
  </ThemeRoot>
</template>
