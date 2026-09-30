<script lang="ts">
  import type { BorderKind, Target } from '../core';
  import { useTheme, useThemeStore } from './context';
  let {
    kind = 'width',
    target = 'DEFAULT',
    label,
  }: { kind?: BorderKind; target?: Target; label?: string } = $props();
  const state = useTheme(),
    store = useThemeStore();
  function change(e: Event) {
    const n = (e.currentTarget as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(n) && n >= 0 && n <= 1000)
      store.setBorder(kind, target, n);
  }
</script>

<label class="tk-border"
  >{label ?? `${target} border ${kind}`}<input
    type="number"
    min="0"
    max="1000"
    step={kind === 'width' ? 1 : 0.125}
    value={$state.theme.structure.websitePreset.border[kind][target]}
    oninput={change}
  />{kind === 'width' ? 'px' : 'rem'}</label
>
