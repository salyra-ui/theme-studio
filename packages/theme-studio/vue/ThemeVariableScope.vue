<script setup lang="ts">
import { ref } from 'vue';
import { themeScopeStyle } from '../core';
import { useTheme } from './context';
const state = useTheme(),
  element = ref<HTMLDivElement>();
defineOptions({ inheritAttrs: false });
defineExpose({ element });
</script>
<template>
  <div
    :style="themeScopeStyle(state)"
    v-bind="$attrs"
    ref="element"
    data-tk-part="scope"
    :data-theme="state.theme.id"
    :data-mode="state.mode"
    :data-mode-preference="state.modePreference"
    :data-theme-status="state.status"
    :data-disabled="state.disabled"
  >
    <slot />
  </div>
</template>
