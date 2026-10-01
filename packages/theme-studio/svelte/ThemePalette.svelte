<script lang="ts">
  import { shades, type Role, type PaletteOptions } from '../core';
  import { useTheme } from './context';
  let {
    role = 'primary',
    class: className = '',
    shape = 'square',
    classes = {},
    labels = {},
    shadeClasses = {},
  }: PaletteOptions & { role?: Role; class?: string } = $props();
  const theme = useTheme();
</script>

<div
  class="tk-palette {classes.root ?? ''} {className}"
  data-shape={shape}
  aria-label="{role} shades"
>
  {#each shades as shade}<div
      data-palette-part="item"
      class="{classes.item ?? ''} {shadeClasses[shade] ?? ''}"
    >
      <span data-palette-part="label" class={classes.label}
        >{labels[shade] ?? shade}</span
      >
      <div
        data-palette-part="swatch"
        class="tk-shade {classes.swatch ?? ''}"
        style:background="hsl({$theme.theme.structure.userPreset[role][shade]})"
      ></div>
    </div>{/each}
</div>
