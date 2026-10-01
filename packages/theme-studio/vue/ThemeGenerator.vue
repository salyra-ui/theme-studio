<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch } from 'vue';
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
} from '@salyra-ui/color-picker/vue';
import type { Role } from '../core';
const props = withDefaults(
  defineProps<{ role?: Role; wheel?: boolean; disabled?: boolean }>(),
  {
    role: 'primary',
    wheel: false,
    disabled: false,
  },
);
import { channelsToHex } from '@salyra-ui/color-picker';
import { useTheme, useThemeStore } from './context';
const theme = useTheme(),
  store = useThemeStore();
let fields: import('../core').ThemeFieldRegistration | undefined;
onMounted(() => {
  fields = store.registerFields({ roles: [props.role] });
});
watch(
  () => [props.role],
  () => fields?.update({ roles: [props.role] }),
);
onBeforeUnmount(() => fields?.destroy());
</script>
<template>
  <ColorProvider
    :disabled="disabled || theme.disabled"
    :view="wheel ? 'wheel' : 'area'"
    :value="channelsToHex(theme.theme.structure.userPreset[role].DEFAULT)"
    @change="store.setColor(role, $event)"
    ><div class="tk-generator">
      <slot
        ><ColorViewSelect /><ColorSurface /><ColorFormatSelect /><ColorInput /><ColorMode
      /></slot></div
  ></ColorProvider>
</template>
