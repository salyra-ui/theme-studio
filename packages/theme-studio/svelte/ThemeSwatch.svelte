<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Theme } from '../core';
  import { useTheme, useThemeStore } from './context';
  let {
    theme,
    children,
    class: className = '',
  }: { theme: Theme; children?: Snippet; class?: string } = $props();
  const state = useTheme(),
    store = useThemeStore();
</script>

<button
  type="button"
  class={className}
  aria-pressed={$state.theme.id === theme.id}
  onclick={() => store.setTheme(theme)}
  >{#if children}{@render children()}{:else}{theme.name}{/if}</button
>
