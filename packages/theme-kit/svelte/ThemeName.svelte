<script lang="ts">
  import type { Snippet } from 'svelte';
  import { suggestedThemeName, type ThemeStore } from '../core';
  import { useTheme, useThemeStore } from './context';
  let { label = 'Theme name', class: className = '', children }: {
    label?: string; class?: string;
    children?: Snippet<[{ name: string; suggestedName: string; setName: ThemeStore['setName'] }]>;
  } = $props();
  const theme = useTheme(), store = useThemeStore();
  const suggestion = $derived(suggestedThemeName($theme.theme));
</script>
{#if children}{@render children({ name: $theme.theme.name, suggestedName: suggestion, setName: store.setName })}
{:else}
<label class={`tk-name ${className}`}>{label}<input maxlength={200} value={$theme.theme.name} placeholder={suggestion} onblur={(e) => { if (!e.currentTarget.value) store.setName(); }} oninput={(e) => store.setName(e.currentTarget.value)} /><small>Suggested: {suggestion}</small></label>
{/if}
