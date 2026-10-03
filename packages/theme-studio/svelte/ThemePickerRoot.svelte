<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import { ColorRoot } from '@salyra-ui/color-picker/svelte';
  import {
    createThemePickerStore,
    type ThemePickerStore,
    type ThemePickerOptions,
  } from '../core';
  import { useThemeStore } from './context';
  import { provideThemePicker } from './picker-context';
  let {
    picker: provided,
    children,
    ...options
  }: ThemePickerOptions & {
    picker?: ThemePickerStore;
    children: Snippet;
  } = $props();
  const theme = useThemeStore(),
    picker = provideThemePicker(
      untrack(() => provided ?? createThemePickerStore(theme, options)),
    );
  onMount(() => picker.mount());
  $effect(() => {
    if (options.disabled !== undefined) picker.setDisabled(options.disabled);
  });
  $effect(() => {
    if (options.activeRole) picker.selectRole(options.activeRole);
  });
  $effect(() => {
    if (options.roles) picker.setRoles(options.roles);
  });
  $effect(() => {
    if (options.view) picker.setView(options.view);
  });
</script>

<ColorRoot store={picker.activeColor}>{@render children()}</ColorRoot>
