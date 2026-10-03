<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { ref } from 'vue';
import type { Role } from '../core';
import { useTheme } from './context';
import { useThemePicker, useThemePickerStore } from './picker-context';
const props = defineProps<{ role: Role; disabled?: boolean }>(),
  theme = useTheme(),
  state = useThemePicker(),
  picker = useThemePickerStore(),
  element = ref<HTMLButtonElement>();
defineExpose({ element });
</script>
<template>
  <button
    type="button"
    v-bind="$attrs"
    ref="element"
    data-tk-part="role-trigger"
    :data-role="role"
    :aria-pressed="state.activeRole === role"
    :data-state="state.activeRole === role ? 'active' : 'inactive'"
    :disabled="
      disabled ||
      theme.disabled ||
      state.colors[state.activeRole].disabled ||
      !state.roles.includes(role)
    "
    @click="
      (event) => {
        if (!event.defaultPrevented) picker.selectRole(role);
      }
    "
  >
    <slot>{{ role }}</slot>
  </button>
</template>
