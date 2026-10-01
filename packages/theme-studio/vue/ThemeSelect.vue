<script setup lang="ts">
import { computed } from 'vue';
import { themeList, selectedThemeId, type Theme } from '../core';
import { useTheme, useThemeStore } from './context';
const props = withDefaults(
  defineProps<{ themes: readonly Theme[]; label?: string }>(),
  { label: 'Saved themes' },
);
const state = useTheme(),
  store = useThemeStore(),
  list = computed(() => themeList(props.themes)),
  value = computed(() => selectedThemeId(state.value.theme, list.value) ?? '');
function select(event: Event) {
  const theme = list.value.find(
    (theme) => theme.id === (event.target as HTMLSelectElement).value,
  );
  if (theme) store.setTheme(theme);
}
</script>
<template>
  <label class="cp-format tk-select"
    >{{ label
    }}<select :value="value" :disabled="!list.length" @change="select">
      <option value="" disabled>
        {{ list.length ? 'Custom theme' : 'No themes available' }}
      </option>
      <option v-for="theme in list" :key="theme.id" :value="theme.id">
        {{ theme.name }}
      </option>
    </select></label
  >
</template>
