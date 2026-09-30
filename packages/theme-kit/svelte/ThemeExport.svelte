<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    themeConfiguration,
    type ThemeConfiguration,
    type ThemeExportFormat,
    type TokenSelection,
  } from '../core';
  import { useTheme } from './context';
  let {
    format = 'json',
    selection,
    onChange,
    children,
    class: className = '',
  }: {
    format?: ThemeExportFormat;
    selection?: TokenSelection;
    onChange?: (value: ThemeConfiguration) => void;
    children?: Snippet<[ThemeConfiguration]>;
    class?: string;
  } = $props();
  const theme = useTheme();
  const configuration = $derived(themeConfiguration($theme, selection));
  $effect(() => {
    const value = configuration;
    untrack(() => onChange?.(value));
  });
</script>

{#if children}{@render children(configuration)}{:else}<pre
    class="tk-export {className}"
    aria-label="Theme configuration">{configuration[format]}</pre>{/if}
