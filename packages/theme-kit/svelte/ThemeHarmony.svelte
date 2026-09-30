<script lang="ts">
  import { harmonies, type Harmony } from '../core';
  import { useTheme, useThemeStore } from './context';
  let { label = 'Color harmony' }: { label?: string } = $props();
  const state = useTheme(),
    store = useThemeStore();
</script>

<div class="tk-harmony">
  <label
    >{label}<select
      value={$state.theme.harmony ?? 'analogous'}
      onchange={(e) => store.setHarmony(e.currentTarget.value as Harmony)}
      >{#each harmonies as value}<option {value}>{value}</option>{/each}</select
    ></label
  ><button type="button" onclick={() => store.generateHarmony()}
    >Generate accent &amp; secondary</button
  >
</div>
