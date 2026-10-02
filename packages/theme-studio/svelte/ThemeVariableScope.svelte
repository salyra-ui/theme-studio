<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
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
  const state = useTheme();
</script>

<div
  {...attributes}
  bind:this={ref}
  data-tk-part="scope"
  style={`${$state.style};${style}`}
  data-theme={$state.theme.id}
  data-mode={$state.mode}
  data-mode-preference={$state.modePreference}
  data-theme-status={$state.status}
  data-disabled={$state.disabled}
>
  {#if children}{@render children()}{/if}
</div>
