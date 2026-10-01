<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    ColorProvider,
    ColorArea,
    ColorWheel,
    ColorSlider,
    ColorFormatSelect,
    ColorInput,
    ColorMode,
  } from '@salyra-ui/color-picker/svelte';
  import {
    createThemePickerStore,
    themePickerViews,
    roles as allRoles,
    type ThemePickerOptions,
    type ThemePickerStore,
    type ThemePickerView,
    type Role,
  } from '../core';
  import { useThemeStore } from './context';
  import ThemeWheel from './ThemeWheel.svelte';
  let {
    picker: provided,
    children,
    ...options
  }: ThemePickerOptions & {
    picker?: ThemePickerStore;
    children?: Snippet;
  } = $props();
  const theme = useThemeStore(),
    picker = untrack(() => provided ?? createThemePickerStore(theme, options));
  const state = {
    subscribe(
      run: (value: ReturnType<ThemePickerStore['getSnapshot']>) => void,
    ) {
      run(picker.getSnapshot());
      return picker.subscribe(() => run(picker.getSnapshot()));
    },
  };
  onMount(() => picker.mount());
  function toggle(role: Role, checked: boolean) {
    picker.setRoles(
      checked
        ? [...$state.roles, role]
        : $state.roles.filter((r) => r !== role),
    );
  }
</script>

<ColorProvider store={picker.activeColor}
  ><div class="tk-picker tk-generator">
    <label
      class="cp-format"
      hidden={options.controls === false ||
        (options.controls === undefined && options.roles?.length === 1)}
      >Theme picker view<select
        value={$state.view}
        onchange={(e) =>
          picker.setView(e.currentTarget.value as ThemePickerView)}
        >{#each themePickerViews as view}<option value={view}
            >{view === 'area'
              ? 'Rectangle'
              : view === 'wheel'
                ? 'Wheel'
                : 'Shared wheel'}</option
          >{/each}</select
      ></label
    >
    <fieldset
      class="tk-role-options"
      hidden={options.controls === false ||
        (options.controls === undefined && options.roles?.length === 1)}
    >
      <legend>Visible roles</legend>{#each allRoles as role}<label
          ><input
            type="checkbox"
            checked={$state.roles.includes(role)}
            disabled={$state.roles.length === 1 && $state.roles.includes(role)}
            onchange={(e) => toggle(role, e.currentTarget.checked)}
          />{role}</label
        >{/each}
    </fieldset>
    <div
      class="tk-role-tabs"
      aria-label="Active color"
      hidden={$state.roles.length === 1}
    >
      {#each $state.roles as role}<button
          type="button"
          aria-pressed={$state.activeRole === role}
          onclick={() => picker.selectRole(role)}
          ><span style:background={$state.colors[role].hex}
          ></span>{role}</button
        >{/each}
    </div>
    {#if $state.view === 'shared-wheel'}<ThemeWheel
        {picker}
      />{:else if $state.view === 'wheel'}<ColorWheel />{:else}<ColorArea
      />{/if}
    <p class="tk-editing" aria-live="polite">Editing {$state.activeRole}</p>
    {#if children}{@render children()}{:else}<ColorSlider
        channel={$state.view === 'area' ? 'h' : 'v'}
      /><ColorFormatSelect /><ColorInput /><ColorMode />{/if}
  </div></ColorProvider
>
