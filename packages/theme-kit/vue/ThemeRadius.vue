<script setup lang="ts">
import type { Target } from '../core';
import ThemeBorder from './ThemeBorder.vue';
defineProps<{ target?: Target; label?: string }>();
</script>
<template>
  <ThemeBorder :target="target" :label="label" kind="radius" />
</template>
