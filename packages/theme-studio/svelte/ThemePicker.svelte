<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ThemePickerOptions, ThemePickerStore } from '../core';
  import ThemePickerRoot from './ThemePickerRoot.svelte';
  import ThemePickerPreset from './ThemePickerPreset.svelte';
  let {
    picker,
    children,
    ...options
  }: ThemePickerOptions & { picker?: ThemePickerStore; children?: Snippet } =
    $props();
</script>

<ThemePickerRoot {picker} {...options}
  ><ThemePickerPreset {options} {children} /></ThemePickerRoot
>
