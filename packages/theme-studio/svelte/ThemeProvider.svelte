<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ThemeOptions, ThemeStore } from '../core';
  import ThemeRoot from './ThemeRoot.svelte';
  import ThemeProviderContent from './ThemeProviderContent.svelte';
  let {
    children,
    options = {},
    store,
    ref = $bindable(),
    ...attributes
  }: HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    options?: ThemeOptions;
    store?: ThemeStore;
    ref?: HTMLDivElement;
  } = $props();
</script>

<ThemeRoot {store} {options}>
  <ThemeProviderContent {...attributes} bind:ref
    >{@render children()}</ThemeProviderContent
  >
</ThemeRoot>
