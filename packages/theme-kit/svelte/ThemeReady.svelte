<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useTheme } from './context';
  let { children }: { children: Snippet } = $props();
  const theme = useTheme();
</script>

{#if $theme.status !== 'loading'}{@render children()}{/if}
