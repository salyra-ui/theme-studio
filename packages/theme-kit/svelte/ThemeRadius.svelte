<script lang="ts">
  import type { Target } from '../core';
  import ThemeBorder from './ThemeBorder.svelte';
  let props: { target?: Target; label?: string } = $props();
</script>

<ThemeBorder {...props} kind="radius" />
