<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { bindBorderInput, type Target, type BorderKind } from '../core';
  import { useTheme, useThemeStore } from './context';
  let {
    kind = 'radius',
    target = 'DEFAULT',
    disabled = false,
    ref = $bindable(),
    ...attributes
  }: Omit<HTMLInputAttributes, 'value'> & {
    kind?: BorderKind;
    target?: Target;
    ref?: HTMLInputElement;
  } = $props();
  const store = useThemeStore(),
    theme = useTheme();
  const initial = untrack(
    () =>
      store.getSnapshot().theme.structure.websitePreset.border[kind][target],
  );
  $effect(() => {
    if (!ref) return;
    const fields = store.registerFields({ roles: [], [kind]: [target] });
    const stop = bindBorderInput(ref, store, kind, target);
    return () => {
      stop();
      fields.destroy();
    };
  });
</script>

<input
  type="number"
  min="0"
  max="1000"
  step={kind === 'radius' ? 0.125 : 1}
  aria-label={`${target} ${kind}`}
  {...attributes}
  bind:this={ref}
  value={initial}
  disabled={disabled || $theme.disabled}
  data-tk-part="geometry-input"
/>
