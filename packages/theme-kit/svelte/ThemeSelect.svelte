<script lang="ts">
  import { themeList, selectedThemeId, type Theme } from '../core';
  import { useTheme, useThemeStore } from './context';
  let {
    themes,
    label = 'Saved themes',
    class: className = '',
  }: { themes: readonly Theme[]; label?: string; class?: string } = $props();
  const store = useThemeStore(),
    themeState = useTheme();
  const list = $derived(themeList(themes)),
    value = $derived(selectedThemeId($themeState.theme, list) ?? '');
</script>

<label class="cp-format tk-select {className}"
  >{label}<select
    {value}
    disabled={!list.length}
    onchange={(e) => {
      const theme = list.find((theme) => theme.id === e.currentTarget.value);
      if (theme) store.setTheme(theme);
    }}
  >
    <option value="" disabled
      >{list.length ? 'Custom theme' : 'No themes available'}</option
    >
    {#each list as theme (theme.id)}<option value={theme.id}
        >{theme.name}</option
      >{/each}
  </select></label
>
