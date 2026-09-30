<script lang="ts">
  import { shades, type Role } from '../core';
  import { useTheme } from './context';
  let {
    role = 'primary',
    class: className = '',
  }: { role?: Role; class?: string } = $props();
  const theme = useTheme();
</script>

<div class="tk-palette {className}">
  {#each shades as shade}<div>
      <span>{shade}</span>
      <div
        class="tk-shade"
        style:background="hsl({$theme.theme.structure.userPreset[role][shade]})"
      ></div>
    </div>{/each}
</div>
