<script setup lang="ts">
import { shallowRef, onMounted, onBeforeUnmount } from 'vue';
import {
  ColorProvider,
  ColorArea,
  ColorWheel,
  ColorSlider,
  ColorFormatSelect,
  ColorInput,
  ColorMode,
} from '@salyra-ui/color-picker/vue';
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
import ThemeWheel from './ThemeWheel.vue';
const props = withDefaults(defineProps<{ roles?: readonly Role[]; activeRole?: Role; view?: ThemePickerView; controls?: boolean; disabled?: boolean; picker?: ThemePickerStore }>(), { controls: undefined, disabled: undefined }),
  picker = props.picker ?? createThemePickerStore(useThemeStore(), props),
  state = shallowRef(picker.getSnapshot());
const unsubscribe = picker.subscribe(
  () => (state.value = picker.getSnapshot()),
);
let cleanup: (() => void) | undefined;
onMounted(() => (cleanup = picker.mount()));
onBeforeUnmount(() => {
  cleanup?.();
  unsubscribe();
});
function toggle(role: Role, checked: boolean) {
  picker.setRoles(
    checked
      ? [...state.value.roles, role]
      : state.value.roles.filter((r) => r !== role),
  );
}
</script>
<template>
  <ColorProvider :store="picker.activeColor"
    ><div class="tk-picker tk-generator">
      <label
        class="cp-format"
        :hidden="
          props.controls === false ||
          (props.controls === undefined && props.roles?.length === 1)
        "
        >Theme picker view<select
          :value="state.view"
          @change="
            picker.setView(
              ($event.target as HTMLSelectElement).value as ThemePickerView,
            )
          "
        >
          <option v-for="view in themePickerViews" :key="view" :value="view">
            {{
              view === 'area'
                ? 'Rectangle'
                : view === 'wheel'
                  ? 'Wheel'
                  : 'Shared wheel'
            }}
          </option>
        </select></label
      >
      <fieldset
        class="tk-role-options"
        :hidden="
          props.controls === false ||
          (props.controls === undefined && props.roles?.length === 1)
        "
      >
        <legend>Visible roles</legend>
        <label v-for="role in allRoles" :key="role"
          ><input
            type="checkbox"
            :checked="state.roles.includes(role)"
            :disabled="state.roles.length === 1 && state.roles.includes(role)"
            @change="toggle(role, ($event.target as HTMLInputElement).checked)"
          />{{ role }}</label
        >
      </fieldset>
      <div
        class="tk-role-tabs"
        aria-label="Active color"
        :hidden="state.roles.length === 1"
      >
        <button
          v-for="role in state.roles"
          :key="role"
          type="button"
          :aria-pressed="state.activeRole === role"
          @click="picker.selectRole(role)"
        >
          <span :style="{ background: state.colors[role].hex }" />{{ role }}
        </button>
      </div>
      <ThemeWheel
        v-if="state.view === 'shared-wheel'"
        :picker="picker"
      /><ColorWheel v-else-if="state.view === 'wheel'" /><ColorArea v-else />
      <p class="tk-editing" aria-live="polite">
        Editing {{ state.activeRole }}
      </p>
      <slot
        ><ColorSlider
          :channel="
            state.view === 'area' ? 'h' : 'v'
          " /><ColorFormatSelect /><ColorInput /><ColorMode
      /></slot></div
  ></ColorProvider>
</template>
