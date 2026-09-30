<script setup lang="ts">
import { shades, type Role } from '../core';
import { useTheme } from './context';
withDefaults(defineProps<{ role?: Role }>(), { role: 'primary' });
const theme = useTheme();
</script>
<template>
  <div class="tk-palette">
    <div v-for="shade in shades" :key="shade">
      <span>{{ shade }}</span>
      <div
        class="tk-shade"
        :style="{
          background: `hsl(${theme.theme.structure.userPreset[role][shade]})`,
        }"
      />
    </div>
  </div>
</template>
