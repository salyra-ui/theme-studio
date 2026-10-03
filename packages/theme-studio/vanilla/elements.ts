import '@salyra-ui/color-picker/vanilla';
import {
  themeList,
  selectedThemeId,
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
  themePickerMarkers,
  createThemePickerStore,
  type ThemePickerView,
  shades,
  type Role,
  type ThemeStore,
} from '../core';
import type {
  ColorWheelElement,
  ColorProviderElement,
} from '@salyra-ui/color-picker/vanilla';
import {
  ThemeRootElement,
  ThemeProviderElement,
  ThemeScopeElement,
  themeRootSelector,
} from './root';
export {
  ThemeRootElement,
  ThemeProviderElement,
  ThemeScopeElement,
} from './root';
class ThemePaletteElement extends HTMLElement {
  private cleanup?: () => void;
  connectedCallback() {
    const root = this.closest<ThemeRootElement>(themeRootSelector);
    if (!root) return;
    const update = () => {
      if (!root.store) return;
      const role = (this.getAttribute('role-name') ?? 'primary') as 'primary';
      const palette = root.store.getSnapshot().theme.structure.userPreset[role];
      this.querySelectorAll<HTMLElement>('[data-shade]').forEach(
        (element, i) => {
          element.style.background = `hsl(${palette[(element.dataset.shade ? Number(element.dataset.shade) : shades[i]) as (typeof shades)[number]]})`;
        },
      );
    };
    root.addEventListener('theme-change', update);
    update();
    this.cleanup = () => root.removeEventListener('theme-change', update);
  }
  disconnectedCallback() {
    this.cleanup?.();
  }
}
if (!customElements.get('tk-provider'))
  customElements.define('tk-provider', ThemeProviderElement);
if (!customElements.get('tk-palette'))
  customElements.define('tk-palette', ThemePaletteElement);

class ThemePickerElement extends HTMLElement {
  private detach?: () => void;
  private cleanup?: () => void;
  connectedCallback() {
    const root = this.closest<ThemeRootElement>(themeRootSelector);
    if (!root) return;
    let boundStore: ThemeStore | undefined;
    const setup = () => {
      if (
        !this.isConnected ||
        !root.store ||
        (this.cleanup && boundStore === root.store)
      )
        return;
      const provider = this.querySelector<ColorProviderElement>(
        'cp-provider[data-tk-active-color]',
      );
      const wheel = this.querySelector<ColorWheelElement>(
        '[data-picker-surface="shared-wheel"] cp-wheel',
      );
      // Declarative HTML can connect the parent before its children are upgraded.
      if (!provider || !wheel) return;
      customElements.upgrade(this);
      this.cleanup?.();
      this.cleanup = undefined;
      boundStore = root.store;
      const pickerOptions = JSON.parse(
        this.getAttribute('data-options') ?? '{}',
      );
      const picker = createThemePickerStore(root.store, pickerOptions);
      const fixed =
        pickerOptions.controls === false ||
        (pickerOptions.controls === undefined &&
          pickerOptions.roles?.length === 1);
      this.querySelector<HTMLElement>('[data-picker-view]')
        ?.closest('label')
        ?.toggleAttribute('hidden', fixed);
      this.querySelector<HTMLElement>('.tk-role-options')?.toggleAttribute(
        'hidden',
        fixed,
      );
      provider.setStore(picker.activeColor);
      const update = () => {
        const state = picker.getSnapshot();
        if (this.dataset.selectedRoles !== JSON.stringify(state.roles))
          this.dataset.selectedRoles = JSON.stringify(state.roles);
        this.querySelector<HTMLElement>('.tk-role-tabs')?.toggleAttribute(
          'hidden',
          state.roles.length === 1,
        );
        this.querySelector<HTMLSelectElement>('[data-picker-view]')!.value =
          state.view;
        this.querySelectorAll<HTMLElement>('[data-picker-surface]').forEach(
          (el) => (el.hidden = el.dataset.pickerSurface !== state.view),
        );
        this.querySelectorAll<HTMLElement>('[data-picker-channel]').forEach(
          (el) =>
            (el.hidden =
              el.dataset.pickerChannel !== (state.view === 'area' ? 'h' : 'v')),
        );
        this.querySelector<HTMLElement>('.tk-editing')!.textContent =
          `Editing ${state.activeRole}`;
        this.querySelectorAll<HTMLInputElement>('[data-include-role]').forEach(
          (input) => {
            const role = input.dataset.includeRole as Role;
            input.checked = state.roles.includes(role);
            input.disabled = state.roles.length === 1 && input.checked;
          },
        );
        this.querySelectorAll<HTMLElement>('[data-select-role]').forEach(
          (button) => {
            const role = button.dataset.selectRole as Role;
            button.hidden = !state.roles.includes(role);
            button.setAttribute(
              'aria-pressed',
              String(state.activeRole === role),
            );
            (button.firstElementChild as HTMLElement).style.background =
              state.colors[role].hex;
          },
        );
        wheel.setMarkers(themePickerMarkers(state), state.activeRole);
      };
      const change = (event: Event) => {
        const input = event.target as HTMLInputElement;
        if (input.matches('[data-picker-view]'))
          picker.setView(input.value as ThemePickerView);
        if (input.matches('[data-include-role]')) {
          const role = input.dataset.includeRole as Role,
            current = picker.getSnapshot().roles;
          picker.setRoles(
            input.checked
              ? [...current, role]
              : current.filter((r) => r !== role),
          );
        }
      };
      const click = (event: Event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-select-role]',
        );
        if (button) picker.selectRole(button.dataset.selectRole as Role);
      };
      const markerSelect = (e: Event) =>
        picker.selectRole((e as CustomEvent<string>).detail as Role);
      const markerChange = (e: Event) => {
        const { id, hsv } = (
          e as CustomEvent<{
            id: string;
            hsv: Partial<import('@salyra-ui/color-picker').HSV>;
          }>
        ).detail;
        picker.setHSV(id as Role, hsv);
      };
      wheel.addEventListener('marker-select', markerSelect);
      wheel.addEventListener('marker-change', markerChange);
      this.addEventListener('change', change);
      this.addEventListener('click', click);
      const unsubscribe = picker.subscribe(update),
        unmount = picker.mount();
      update();
      this.cleanup = () => {
        unsubscribe();
        unmount();
        wheel.removeEventListener('marker-select', markerSelect);
        wheel.removeEventListener('marker-change', markerChange);
        this.removeEventListener('change', change);
        this.removeEventListener('click', click);
      };
    };
    root.addEventListener('theme-change', setup);
    this.ownerDocument.addEventListener('DOMContentLoaded', setup, {
      once: true,
    });
    this.detach = () => {
      root.removeEventListener('theme-change', setup);
      this.ownerDocument.removeEventListener('DOMContentLoaded', setup);
    };
    setup();
    queueMicrotask(setup);
  }
  disconnectedCallback() {
    this.detach?.();
    this.detach = undefined;
    this.cleanup?.();
    this.cleanup = undefined;
  }
}
if (!customElements.get('tk-picker'))
  customElements.define('tk-picker', ThemePickerElement);

function connectTheme(
  element: HTMLElement,
  render: (store: ThemeStore) => void,
): () => void {
  const root = element.closest<ThemeRootElement>(themeRootSelector);
  if (!root) throw new Error('Theme components require tk-root or tk-provider');
  const update = () => {
    if (root.store) render(root.store);
  };
  root.addEventListener('theme-change', update);
  update();
  return () => root.removeEventListener('theme-change', update);
}
export class ThemeSelectElement extends HTMLElement {
  private cleanup?: () => void;
  connectedCallback() {
    const themes = themeList(JSON.parse(this.dataset.themes ?? '[]')),
      select = this.querySelector('select')!;
    const choose = () => {
      const theme = themes.find((theme) => theme.id === select.value),
        root = this.closest<ThemeRootElement>(themeRootSelector);
      if (theme) root?.store?.setTheme(theme);
    };
    select.addEventListener('change', choose);
    const disconnect = connectTheme(this, (store) => {
      select.value = selectedThemeId(store.getSnapshot().theme, themes) ?? '';
    });
    this.cleanup = () => {
      disconnect();
      select.removeEventListener('change', choose);
    };
  }
  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
  }
}
export class ThemeExportElement extends HTMLElement {
  configuration?: ThemeConfiguration;
  private cleanup?: () => void;
  connectedCallback() {
    this.cleanup = connectTheme(this, (store) => {
      const state = store.getSnapshot(),
        selection: TokenSelection | undefined = this.dataset.selection
          ? JSON.parse(this.dataset.selection)
          : undefined;
      const next = themeConfiguration(state, selection);
      if (
        this.configuration === next &&
        this.configuration.mode === next.mode &&
        this.configuration.modePreference === next.modePreference &&
        this.configuration.systemMode === next.systemMode
      )
        return;
      this.configuration = next;
      const pre = this.querySelector('pre');
      if (pre)
        pre.textContent =
          next[(this.getAttribute('format') ?? 'json') as ThemeExportFormat];
      this.dispatchEvent(
        new CustomEvent('configuration-change', {
          detail: next,
          bubbles: true,
        }),
      );
    });
  }
  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
    this.configuration = undefined;
  }
}
if (!customElements.get('tk-select'))
  customElements.define('tk-select', ThemeSelectElement);
if (!customElements.get('tk-export'))
  customElements.define('tk-export', ThemeExportElement);

if (!customElements.get('tk-root'))
  customElements.define('tk-root', ThemeRootElement);
if (!customElements.get('tk-scope'))
  customElements.define('tk-scope', ThemeScopeElement);
