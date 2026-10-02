<script setup lang="ts">
import { onMounted, onScopeDispose, watch } from 'vue';
import { ColorRoot } from '@salyra-ui/color-picker/vue';
import {
  createThemePickerStore,
  type ThemePickerStore,
  type ThemePickerOptions,
} from '../core';
import { useThemeStore } from './context';
import { provideThemePicker } from './picker-context';
defineOptions({ inheritAttrs: false });
const props = defineProps<ThemePickerOptions & { picker?: ThemePickerStore }>();
const picker = provideThemePicker(
  props.picker ?? createThemePickerStore(useThemeStore(), props),
);
watch(
  () => props.disabled,
  (value) => {
    if (value !== undefined) picker.setDisabled(value);
  },
);
watch(
  () => props.activeRole,
  (value) => {
    if (value) picker.selectRole(value);
  },
);
watch(
  () => props.roles,
  (value) => {
    if (value) picker.setRoles(value);
  },
);
watch(
  () => props.view,
  (value) => {
    if (value) picker.setView(value);
  },
);
let stop: (() => void) | undefined;
onMounted(() => (stop = picker.mount()));
onScopeDispose(() => stop?.());
defineExpose({ picker });
</script>
<template>
  <ColorRoot :store="picker.activeColor"><slot /></ColorRoot>
</template>
