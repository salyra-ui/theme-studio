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
  } from '@salyra-ui/color-picker/svelte';
  import { channelsToHex } from '@salyra-ui/color-picker';
  import { useTheme, useThemeStore } from './context';
  let {
    role = 'primary',
    wheel = false,
    disabled = false,
    children,
    class: className = '',
  }: {
    children?: Snippet;
    class?: string;
    role?: Role;
    wheel?: boolean;
    disabled?: boolean;
  } = $props();
  const theme = useTheme(),
    store = useThemeStore();
  $effect(() => {
    const fields = store.registerFields({ roles: [role] });
    return fields.destroy;
  });
</script>

<ColorProvider
  disabled={disabled || $theme.disabled}
  view={wheel ? 'wheel' : 'area'}
  value={channelsToHex($theme.theme.structure.userPreset[role].DEFAULT)}
  onChange={(hex) => store.setColor(role, hex)}
>
  <div class="tk-generator {className}">
    {#if children}{@render children()}{:else}<ColorViewSelect /><ColorSurface
      /><ColorFormatSelect /><ColorInput /><ColorMode />{/if}
  </div>
</ColorProvider>
