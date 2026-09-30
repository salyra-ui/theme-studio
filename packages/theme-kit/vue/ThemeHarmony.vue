<script setup lang="ts">
import { harmonies, type Harmony } from '../core';
import { useTheme, useThemeStore } from './context';
withDefaults(defineProps<{ label?: string }>(), { label: 'Color harmony' });
const state = useTheme(),
  store = useThemeStore();
</script>
<template>
  <div class="tk-harmony">
    <label
      >{{ label
      }}<select
        :value="state.theme.harmony ?? 'analogous'"
        @change="
          store.setHarmony(
            ($event.target as HTMLSelectElement).value as Harmony,
          )
        "
      >
        <option v-for="value in harmonies" :key="value" :value="value">
          {{ value }}
        </option>
      </select></label
    ><button type="button" @click="store.generateHarmony()">
      Generate accent &amp; secondary
    </button>
  </div>
</template>
