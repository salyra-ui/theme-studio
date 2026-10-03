<script setup lang="ts">
import type { ThemePickerOptions, ThemePickerStore } from '../core';
import ThemePickerRoot from './ThemePickerRoot.vue';
import ThemePickerPreset from './ThemePickerPreset.vue';
const props = defineProps<ThemePickerOptions & { picker?: ThemePickerStore }>();
</script>
<template>
  <ThemePickerRoot v-bind="props"
    ><ThemePickerPreset v-bind="props"
      ><template v-if="$slots.default" #default
        ><slot /></template></ThemePickerPreset
  ></ThemePickerRoot>
</template>
