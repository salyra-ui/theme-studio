<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import { themeScopeStyle } from '../core';
  import { useTheme } from './context';
  let {
    style = '',
    children,
    ref = $bindable(),
    ...attributes
  }: HTMLAttributes<HTMLDivElement> & {
    children?: Snippet;
    ref?: HTMLDivElement;
  } = $props();
  const theme = useTheme();
</script>

<div
  {...attributes}
  bind:this={ref}
  data-tk-part="scope"
  style={`${themeScopeStyle($theme)};${style}`}
  data-theme={$theme.theme.id}
  data-mode={$theme.mode}
  data-mode-preference={$theme.modePreference}
  data-theme-status={$theme.status}
  data-disabled={$theme.disabled}
>
  {#if children}{@render children()}{/if}
</div>
