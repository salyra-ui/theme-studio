<script lang="ts">
  import {
    ColorWheelSurface,
    ColorMarkerThumb,
  } from '@salyra-ui/color-picker/svelte';
  import { themePickerMarkers, type Role } from '../core';
  import type { ComponentProps } from 'svelte';
  import { useThemePicker, useThemePickerStore } from './picker-context';
  let {
    children,
    ...attributes
  }: Omit<
    ComponentProps<typeof ColorWheelSurface>,
    'markers' | 'activeId' | 'onSelect' | 'onMarkerChange'
  > = $props();
  const picker = useThemePickerStore(),
    pickerState = useThemePicker();
  const markers = $derived(themePickerMarkers($pickerState));
</script>

<ColorWheelSurface
  {...attributes}
  {markers}
  activeId={$pickerState.activeRole}
  onSelect={(id) => picker.selectRole(id as Role)}
  onMarkerChange={(id, hsv) => picker.setHSV(id as Role, hsv)}
>
  {#if children}{@render children()}{:else}{#each markers as marker (marker.id)}<ColorMarkerThumb
        {marker}
        active={$pickerState.activeRole === marker.id}
        class="cp-wheel-marker"
      />{/each}{/if}
</ColorWheelSurface>
