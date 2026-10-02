<script lang="ts">
  import type { Snippet } from 'svelte';
  import { useThemeMode } from './context';
  import type { ModePreference } from '../core';
  let {
    class: className = '',
    value,
    labels = { system: 'System', light: 'Light mode', dark: 'Dark mode' },
    children,
  }: {
    class?: string;
    value?: ModePreference;
    labels?: Record<ModePreference, string>;
    children?: Snippet<
      [
        {
          preference: ModePreference;
          resolvedMode: 'light' | 'dark';
          setMode: (mode: ModePreference) => void;
          cycle: () => void;
        },
      ]
    >;
  } = $props();
  const mode = useThemeMode();
</script>

<button
  type="button"
  class={className}
  aria-pressed={value ? $mode.preference === value : undefined}
  onclick={() => (value ? mode.setMode(value) : mode.cycle())}
>
  {#if children}{@render children({
      ...$mode,
      setMode: mode.setMode,
      cycle: mode.cycle,
    })}{:else}{labels[value ?? $mode.preference]}{/if}
</button>
