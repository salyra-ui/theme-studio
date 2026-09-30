<script setup lang="ts">
import {
  ColorSurface,
  ColorViewSelect,
  ColorWheel,
  ColorFormatSelect,
  ColorMode,
  ColorProvider,
  ColorArea,
  ColorSlider,
  ColorInput,
} from '@sebytza23/color-picker-vue';
import type { Role } from '../core';
withDefaults(defineProps<{ role?: Role; wheel?: boolean }>(), {
  role: 'primary',
  wheel: false,
});
import { channelsToHex } from '@sebytza23/color-picker';
import { useTheme, useThemeStore } from './context';
const theme = useTheme(),
  store = useThemeStore();
</script>
<template>
  <ColorProvider
    :view="wheel ? 'wheel' : 'area'"
    :value="channelsToHex(theme.theme.structure.userPreset[role].DEFAULT)"
    @change="store.setColor(role, $event)"
    ><div class="tk-generator">
      <slot
        ><ColorViewSelect /><ColorSurface /><ColorFormatSelect /><ColorInput /><ColorMode
      /></slot></div
  ></ColorProvider>
</template>
