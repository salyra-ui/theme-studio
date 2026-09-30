<script lang="ts">
  import { useTheme, useThemeStore } from './context';
  let {
    label = 'Tint background with primary',
    class: className = '',
  }: { label?: string; class?: string } = $props();
  const theme = useTheme(),
    store = useThemeStore();
</script>

<label class="tk-background {className}"
  ><input
    type="checkbox"
    checked={$theme.background === 'tinted'}
    onchange={(e) =>
      store.setBackground(e.currentTarget.checked ? 'tinted' : 'neutral')}
  />{label}</label
>
