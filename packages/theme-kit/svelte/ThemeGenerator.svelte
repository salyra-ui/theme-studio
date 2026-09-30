<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Role } from '../core';
  import {
    ColorSurface,
    ColorViewSelect,
    ColorWheel,
    ColorFormatSelect,
    ColorMode,
    ColorProvider,
    ColorArea,
    ColorSlider,
    ColorInput,
  } from '@sebytza23/color-picker-svelte';
  import { channelsToHex } from '@sebytza23/color-picker';
  import { useTheme, useThemeStore } from './context';
  let {
    role = 'primary',
    wheel = false,
    children,
    class: className = '',
  }: {
    children?: Snippet;
    class?: string;
    role?: Role;
    wheel?: boolean;
  } = $props();
  const theme = useTheme(),
    store = useThemeStore();
</script>

<ColorProvider
  view={wheel ? 'wheel' : 'area'}
  value={channelsToHex($theme.theme.structure.userPreset[role].DEFAULT)}
  onChange={(hex) => store.setColor(role, hex)}
>
  <div class="tk-generator {className}">
    {#if children}{@render children()}{:else}<ColorViewSelect /><ColorSurface
      /><ColorFormatSelect /><ColorInput /><ColorMode />{/if}
  </div>
</ColorProvider>
