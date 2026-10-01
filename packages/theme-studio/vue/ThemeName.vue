<script setup lang="ts">
import { computed } from 'vue';
import { useTheme, useThemeStore } from './context';
import { suggestedThemeName } from '../core';
withDefaults(defineProps<{ label?: string }>(), { label: 'Theme name' });
const theme = useTheme(), store = useThemeStore(), suggestion = computed(() => suggestedThemeName(theme.value.theme));
</script>
<template>
  <slot :name="theme.theme.name" :suggestedName="suggestion" :setName="store.setName">
    <label class="tk-name">{{ label }}<input maxlength="200" :value="theme.theme.name" :placeholder="suggestion" @blur="!($event.target as HTMLInputElement).value && store.setName()" @input="store.setName(($event.target as HTMLInputElement).value)" /><small>Suggested: {{ suggestion }}</small></label>
  </slot>
</template>
