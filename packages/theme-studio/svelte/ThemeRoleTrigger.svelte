<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { Snippet } from 'svelte';
  import type { Role } from '../core';
  import { useTheme } from './context';
  import { useThemePicker, useThemePickerStore } from './picker-context';
  let {
    role,
    children,
    onclick,
    disabled = false,
    ref = $bindable(),
    ...attributes
  }: HTMLButtonAttributes & {
    role: Role;
    children?: Snippet;
    ref?: HTMLButtonElement;
  } = $props();
  const picker = useThemePickerStore(),
    state = useThemePicker(),
    theme = useTheme();
</script>

<button
  type="button"
  {...attributes}
  bind:this={ref}
  data-tk-part="role-trigger"
  data-role={role}
  aria-pressed={$state.activeRole === role}
  data-state={$state.activeRole === role ? 'active' : 'inactive'}
  disabled={disabled ||
    $theme.disabled ||
    $state.colors[$state.activeRole].disabled ||
    !$state.roles.includes(role)}
  onclick={(event) => {
    onclick?.(event);
    if (!event.defaultPrevented) picker.selectRole(role);
  }}
>
  {#if children}{@render children()}{:else}{role}{/if}
</button>
