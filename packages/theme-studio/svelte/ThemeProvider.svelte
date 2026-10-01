<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    createThemeStore,
    mountThemeStore,
    type ThemeOptions,
    type ThemeStore,
  } from '../core';
  import { provideTheme, useTheme } from './context';
  let {
    children,
    options = {},
    store: provided,
    class: className = '',
  }: {
    children: Snippet;
    options?: ThemeOptions;
    store?: ThemeStore;
    class?: string;
  } = $props();
  const store = provideTheme(
      untrack(() => provided ?? createThemeStore(options)),
    ),
    theme = useTheme();
  onMount(() => mountThemeStore(store, options.storage, options));
</script>

<div
  class="tk-scope {className}"
  data-disabled={$theme.disabled}
  data-theme={$theme.theme.id}
  data-mode={$theme.mode}
  data-mode-preference={$theme.modePreference}
  data-theme-status={$theme.status}
  style={$theme.style}
>
  <fieldset
    class="tk-provider-controls"
    disabled={$theme.disabled}
    inert={$theme.disabled}
    aria-disabled={$theme.disabled}
  >
    {@render children()}
  </fieldset>
</div>
