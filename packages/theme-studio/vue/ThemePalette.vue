<script setup lang="ts">
import { shades, type Role, type PaletteClasses, type Shade } from '../core';
import { useTheme } from './context';
withDefaults(defineProps<{ role?: Role; shape?: 'square' | 'circle' | 'joined'; classes?: PaletteClasses; labels?: Partial<Record<Shade, string>>; shadeClasses?: Partial<Record<Shade, string>> }>(), {
  role: 'primary',
  shape: 'square',
  classes: () => ({}),
  labels: () => ({}),
  shadeClasses: () => ({}),
});
const theme = useTheme();
</script>
<template>
  <div
    :class="['tk-palette', classes.root]"
    :data-shape="shape"
    :aria-label="`${role} shades`"
  >
    <div
      v-for="shade in shades"
      :key="shade"
      data-palette-part="item"
      :class="[classes.item, shadeClasses[shade]]"
    >
      <span data-palette-part="label" :class="classes.label">{{
        labels[shade] ?? shade
      }}</span>
      <div
        data-palette-part="swatch"
        :class="['tk-shade', classes.swatch]"
        :style="{
          background: `hsl(${theme.theme.structure.userPreset[role][shade]})`,
        }"
      />
    </div>
  </div>
</template>
