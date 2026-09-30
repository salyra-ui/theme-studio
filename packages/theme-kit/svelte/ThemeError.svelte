<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useTheme, useThemeStore } from './context';
  let { children }: { children: Snippet<[Error, () => Promise<void>]> } =
    $props();
  const theme = useTheme(),
    store = useThemeStore();
</script>

{#if $theme.error}{@render children($theme.error, store.reload)}{/if}
