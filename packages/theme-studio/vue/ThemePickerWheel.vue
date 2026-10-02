<script setup lang="ts">
defineOptions({ inheritAttrs: false });
import { computed } from 'vue';
import {
  ColorWheelSurface,
  ColorMarkerThumb,
} from '@salyra-ui/color-picker/vue';
import { themePickerMarkers, type Role } from '../core';
import { useThemePicker, useThemePickerStore } from './picker-context';
const picker = useThemePickerStore(),
  state = useThemePicker(),
  markers = computed(() => themePickerMarkers(state.value));
</script>
<template>
  <ColorWheelSurface
    v-bind="$attrs"
    :markers="markers"
    :active-id="state.activeRole"
    :on-select="(id) => picker.selectRole(id as Role)"
    :on-marker-change="(id, hsv) => picker.setHSV(id as Role, hsv)"
    ><slot :markers="markers" :state="state">
      <ColorMarkerThumb
        v-for="marker in markers"
        :key="marker.id"
        :marker="marker"
        :active="state.activeRole === marker.id"
        class="cp-wheel-marker"
      /> </slot
  ></ColorWheelSurface>
</template>
