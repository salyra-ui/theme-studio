<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { useTheme } from './context';
  import ThemeVariableScope from './ThemeVariableScope.svelte';
  let {
    children,
    class: className = '',
    ref = $bindable(),
    ...attributes
  }: HTMLAttributes<HTMLDivElement> & {
    children: Snippet;
    ref?: HTMLDivElement;
  } = $props();
  const theme = useTheme();
</script>

<ThemeVariableScope {...attributes} class="tk-scope {className}" bind:ref>
  <fieldset
    class="tk-provider-controls"
    disabled={$theme.disabled}
    inert={$theme.disabled}
    aria-disabled={$theme.disabled}
  >
    {@render children()}
  </fieldset>
</ThemeVariableScope>
