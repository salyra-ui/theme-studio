<script setup lang="ts">
import { useTheme } from './context';
import ThemeVariableScope from './ThemeVariableScope.vue';
defineOptions({ inheritAttrs: false });
const state = useTheme();
</script>
<template>
  <ThemeVariableScope class="tk-scope" v-bind="$attrs">
    <fieldset
      class="tk-provider-controls"
      :disabled="state.disabled"
      :inert="state.disabled"
      :aria-disabled="state.disabled"
    >
      <slot />
    </fieldset>
  </ThemeVariableScope>
</template>
