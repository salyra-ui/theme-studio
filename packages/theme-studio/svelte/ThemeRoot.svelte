<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    createThemeStore,
    mountThemeStore,
    type ThemeStore,
    type ThemeOptions,
  } from '../core';
  import { provideTheme } from './context';
  let {
    store: provided,
    options = {},
    children,
  }: {
    store?: ThemeStore;
    options?: ThemeOptions;
    children: Snippet;
  } = $props();
  const initial = untrack(() => options),
    store = provideTheme(untrack(() => provided ?? createThemeStore(initial)));
  onMount(() => mountThemeStore(store, initial.storage, initial));
</script>

{@render children()}
