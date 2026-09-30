<script setup lang="ts">
import { shallowRef, onScopeDispose } from 'vue';
import { ColorWheel } from '@sebytza23/color-picker-vue';
import { themePickerMarkers, type ThemePickerStore, type Role } from '../core';
const props = defineProps<{ picker: ThemePickerStore }>(),
  state = shallowRef(props.picker.getSnapshot());
onScopeDispose(
  props.picker.subscribe(() => (state.value = props.picker.getSnapshot())),
);
</script>
<template>
  <ColorWheel
    class="tk-shared-wheel"
    label="Shared theme color wheel"
    :markers="themePickerMarkers(state)"
    :active-id="state.activeRole"
    @select="picker.selectRole($event as Role)"
    @marker-change="(id, hsv) => picker.setHSV(id as Role, hsv)"
  />
</template>
