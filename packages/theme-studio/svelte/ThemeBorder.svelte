<script lang="ts">
  import { untrack } from 'svelte';
  import type { BorderKind, Target } from '../core';
  import {
    bindBorderInput,
    borderControlLabel,
    borderControlUnit,
  } from '../core/border-control';
  import { useThemeStore } from './context';
  let {
    kind = 'width',
    target = 'DEFAULT',
    label,
  }: {
    kind?: BorderKind;
    target?: Target;
    label?: string;
  } = $props();
  const store = useThemeStore();
  const initial = untrack(
    () =>
      store.getSnapshot().theme.structure.websitePreset.border[kind][target],
  );
  let input: HTMLInputElement;
  $effect(() => {
    const fields = store.registerFields({ roles: [], [kind]: [target] });
    const unbind = bindBorderInput(input, store, kind, target);
    return () => {
      unbind();
      fields.destroy();
    };
  });
</script>

<label class="tk-border">
  <span>{label ?? borderControlLabel(kind, target)}</span>
  <span class="tk-border-field">
    <input
      bind:this={input}
      type="number"
      min="0"
      max="1000"
      step={kind === 'width' ? 1 : 0.125}
      value={initial}
    />
    <span aria-hidden="true">{borderControlUnit(kind)}</span>
  </span>
</label>
