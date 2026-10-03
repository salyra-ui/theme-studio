'use client';
import { ColorWheel } from '@salyra-ui/color-picker/react';
import { useSyncExternalStore } from 'react';
import { themePickerMarkers, type Role, type ThemePickerStore } from '../core';
export function ThemeWheel({ picker }: { picker: ThemePickerStore }) {
  const state = useSyncExternalStore(
    picker.subscribe,
    picker.getSnapshot,
    picker.getServerSnapshot,
  );
  return (
    <ColorWheel
      className="tk-shared-wheel"
      label="Shared theme color wheel"
      markers={themePickerMarkers(state)}
      activeId={state.activeRole}
      onSelect={(id) => picker.selectRole(id as Role)}
      onMarkerChange={(id, hsv) => picker.setHSV(id as Role, hsv)}
    />
  );
}
