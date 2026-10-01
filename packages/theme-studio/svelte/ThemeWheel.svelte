<script lang="ts">
  import { ColorWheel } from '@salyra-ui/color-picker/svelte';
  import {
    themePickerMarkers,
    type ThemePickerStore,
    type Role,
  } from '../core';
  let { picker }: { picker: ThemePickerStore } = $props();
  const pickerState = {
    subscribe(
      run: (value: ReturnType<ThemePickerStore['getSnapshot']>) => void,
    ) {
      run(picker.getSnapshot());
      return picker.subscribe(() => run(picker.getSnapshot()));
    },
  };
</script>

<ColorWheel
  class="tk-shared-wheel"
  label="Shared theme color wheel"
  markers={themePickerMarkers($pickerState)}
  activeId={$pickerState.activeRole}
  onSelect={(id) => picker.selectRole(id as Role)}
  onMarkerChange={(id, hsv) => picker.setHSV(id as Role, hsv)}
/>
