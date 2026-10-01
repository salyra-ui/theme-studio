import '@salyra-ui/color-picker/vanilla';
import { bindBorderInput } from '../core/border-control';
import { applyScopeStyle } from './style';
import { channelsToHex } from '@salyra-ui/color-picker';
import {
  browserModeStorage,
  nextThemeMode,
  isModePreference,
  suggestedThemeName,
  themeList,
  selectedThemeId,
  themeConfiguration,
  createHttpThemeLoader,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
  themePickerMarkers,
  createThemePickerStore,
  type ThemePickerView,
  createThemeStore,
  mountThemeStore,
  browserStorage,
  shades,
  type Role,
  type Harmony,
  type BorderKind,
  type Target,
  type ThemeOptions,
  type ThemeStore,
} from '../core';
import type {
  ColorWheelElement,
  ColorProviderElement,
} from '@salyra-ui/color-picker/vanilla';
export class ThemeProviderElement extends HTMLElement {
  store?: ThemeStore;
  options?: ThemeOptions;
  private cleanup?: () => void;
  setStore(store: ThemeStore, options?: ThemeOptions) {
    if (options) this.options = options;
    this.cleanup?.();
    this.cleanup = undefined;
    this.store = store;
    if (this.isConnected) this.connectedCallback();
  }
  connectedCallback() {
    if (this.cleanup) return;
    const { src, storageKey, modeStorageKey, ...serialized } = JSON.parse(
      this.getAttribute('data-config') ?? '{}',
    ) as ThemeOptions & {
      src?: string;
      storageKey?: string;
      modeStorageKey?: string;
    };
    const options: ThemeOptions = { ...serialized, ...this.options };
    if (src) options.loadTheme = createHttpThemeLoader(src);
    if (storageKey) options.storage = browserStorage(storageKey);
    if (modeStorageKey && options.modeStorage !== false)
      options.modeStorage = browserModeStorage(modeStorageKey);
    this.store ??= createThemeStore(options);
    const store = this.store;
    // Reconcile geometry bindings when Astro slots or vanilla consumers add/remove fields.
    const borderInputs = new Map<
      HTMLInputElement,
      { kind: BorderKind; target: Target; destroy(): void }
    >();
    const syncBorderInputs = () => {
      for (const [input, binding] of borderInputs) {
        if (
          input.closest('tk-provider') !== this ||
          input.dataset.tkBorder !== binding.kind ||
          input.dataset.target !== binding.target
        ) {
          binding.destroy();
          borderInputs.delete(input);
        }
      }
      for (const input of this.querySelectorAll<HTMLInputElement>(
        '[data-tk-border]',
      )) {
        if (input.closest('tk-provider') !== this || borderInputs.has(input))
          continue;
        const kind = input.dataset.tkBorder as BorderKind;
        const target = input.dataset.target as Target;
        borderInputs.set(input, {
          kind,
          target,
          destroy: bindBorderInput(input, store, kind, target),
        });
      }
    };
    const syncSelection = () => {
      if (options.selection) return;
      const own = (selector: string) =>
        [...this.querySelectorAll<HTMLElement>(selector)].filter(
          (el) => el.closest('tk-provider') === this,
        );
      const pickers = own('tk-picker');
      const generators = own('cp-provider[data-theme-generator]');
      const fields = own('[data-tk-border]');
      const background = own('[data-tk-background]').length > 0;
      if (
        !pickers.length &&
        !generators.length &&
        !fields.length &&
        !background
      )
        return;
      const roles = new Set<Role>(
        generators.map((el) => (el.dataset.role ?? 'primary') as Role),
      );
      for (const picker of pickers) {
        const checked = [
          ...picker.querySelectorAll<HTMLInputElement>(
            '[data-include-role]:checked',
          ),
        ];
        const configured =
          JSON.parse(picker.dataset.selectedRoles ?? 'null') ??
          JSON.parse(picker.dataset.options ?? '{}').roles;
        for (const role of configured ??
          (checked.length
            ? checked.map((el) => el.dataset.includeRole)
            : ['primary', 'secondary', 'accent']))
          roles.add(role as Role);
      }
      store.setSelection({
        roles: [...roles],
        radius: fields
          .filter((el) => el.dataset.tkBorder === 'radius')
          .map((el) => el.dataset.target as Target),
        width: fields
          .filter((el) => el.dataset.tkBorder === 'width')
          .map((el) => el.dataset.target as Target),
        background,
      });
    };
    const observer = new this.ownerDocument.defaultView!.MutationObserver(
      () => {
        syncBorderInputs();
        syncSelection();
      },
    );
    observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'disabled',
        'data-options',
        'data-role',
        'data-target',
        'data-tk-border',
        'data-selected-roles',
      ],
    });
    const update = () => {
      const state = store.getSnapshot();
      applyScopeStyle(this, state);
      this.toggleAttribute('inert', state.disabled);
      this.setAttribute('aria-disabled', String(state.disabled));
      this.dataset.disabled = String(state.disabled);
      this.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      >('input, select, button').forEach((control) => {
        if (control.closest('tk-provider') !== this) return;
        if (state.disabled) {
          if (!control.disabled) {
            control.dataset.tkDisabled = '';
            control.disabled = true;
          }
        } else if (control.hasAttribute('data-tk-disabled')) {
          control.disabled = false;
          delete control.dataset.tkDisabled;
        }
      });
      this.querySelectorAll<ColorProviderElement>(
        'cp-provider[data-theme-generator]',
      ).forEach((provider) => {
        if (provider.closest('tk-provider') === this)
          provider.store?.setDisabled(
            state.disabled || provider.hasAttribute('disabled'),
          );
      });
      this.dataset.theme = state.theme.id;
      this.dataset.mode = state.mode;
      this.dataset.modePreference = state.modePreference;
      this.querySelectorAll<HTMLElement>('[data-tk-mode]').forEach((button) => {
        if (button.closest('tk-provider') !== this) return;
        const value = button.dataset.tkMode;
        if (isModePreference(value))
          button.setAttribute(
            'aria-pressed',
            String(value === state.modePreference),
          );
        const label = button.querySelector('[data-mode-label]');
        if (label)
          label.textContent = JSON.parse(button.dataset.modeLabels ?? '{}')[
            value || state.modePreference
          ];
      });
      this.querySelectorAll<HTMLInputElement>('[data-tk-name]').forEach(
        (input) => {
          if (input.closest('tk-provider') !== this) return;
          if (input.ownerDocument.activeElement !== input)
            input.value = state.theme.name;
          input.placeholder = suggestedThemeName(state.theme);
        },
      );
      this.querySelectorAll<HTMLElement>('[data-tk-name-suggestion]').forEach(
        (element) => {
          if (element.closest('tk-provider') === this)
            element.textContent = `Suggested: ${suggestedThemeName(state.theme)}`;
        },
      );
      this.dataset.themeStatus = state.status;
      for (const provider of this.querySelectorAll<ColorProviderElement>(
        'cp-provider[data-theme-generator]',
      ))
        if (provider.closest('tk-provider') === this)
          provider.store?.setHex(
            channelsToHex(
              state.theme.structure.userPreset[
                (provider.dataset.role ?? 'primary') as Role
              ].DEFAULT,
            ),
          );
      this.querySelectorAll<HTMLInputElement>('[data-tk-background]').forEach(
        (input) => {
          if (input.closest('tk-provider') === this)
            input.checked = state.background === 'tinted';
        },
      );
      this.querySelectorAll<HTMLSelectElement>('[data-tk-harmony]').forEach(
        (input) => {
          if (input.closest('tk-provider') === this)
            input.value = state.theme.harmony ?? 'analogous';
        },
      );
      this.dispatchEvent(new CustomEvent('theme-change', { detail: state }));
    };
    const color = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target.matches('cp-provider[data-theme-generator]') &&
        target.closest('tk-provider') === this
      ) {
        const hex = (event as CustomEvent<string>).detail;
        if (
          hex !==
          channelsToHex(
            store.getSnapshot().theme.structure.userPreset[
              (target.dataset.role ?? 'primary') as Role
            ].DEFAULT,
          )
        )
          store.setColor((target.dataset.role ?? 'primary') as Role, hex);
      }
    };
    const click = (event: Event) => {
      if (store.getSnapshot().disabled) return;
      const button = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-tk-mode],[data-tk-retry],[data-tk-theme],[data-tk-generate-harmony]',
      );
      if (button?.closest('tk-provider') !== this) return;
      if (button.hasAttribute('data-tk-mode'))
        store.setMode(
          isModePreference(button.dataset.tkMode)
            ? button.dataset.tkMode
            : nextThemeMode(store.getSnapshot().modePreference),
        );
      else if (button.hasAttribute('data-tk-retry')) void store.reload();
      else if (button.hasAttribute('data-tk-generate-harmony'))
        store.generateHarmony();
      else store.setTheme(JSON.parse(button.getAttribute('data-tk-theme')!));
    };
    const background = (event: Event) => {
      if (store.getSnapshot().disabled) return;
      const input = event.target as HTMLInputElement;
      if (
        input.matches('[data-tk-background]') &&
        input.closest('tk-provider') === this
      )
        store.setBackground(input.checked ? 'tinted' : 'neutral');
    };
    const edit = (event: Event) => {
      if (store.getSnapshot().disabled) return;
      const input = event.target as HTMLInputElement;
      if (input.closest('tk-provider') !== this) return;
      if (input.matches('[data-tk-name]'))
        store.setName(
          event.type === 'change' && !input.value ? undefined : input.value,
        );
      if (input.matches('[data-tk-harmony]'))
        store.setHarmony(input.value as Harmony);
    };
    this.addEventListener('change', syncSelection);
    syncBorderInputs();
    syncSelection();
    this.addEventListener('change', edit);
    this.addEventListener('input', edit);
    this.addEventListener('change', background);
    this.addEventListener('color-change', color);
    this.addEventListener('click', click);
    update();
    const unsubscribe = store.subscribe(update),
      unmount = mountThemeStore(store, options.storage, options);
    this.cleanup = () => {
      observer.disconnect();
      borderInputs.forEach((binding) => binding.destroy());
      borderInputs.clear();
      this.removeEventListener('change', syncSelection);
      unsubscribe();
      unmount();
      this.removeEventListener('change', edit);
      this.removeEventListener('input', edit);
      this.removeEventListener('change', background);
      this.removeEventListener('color-change', color);
      this.removeEventListener('click', click);
    };
  }
  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
  }
}
class ThemePaletteElement extends HTMLElement {
  private cleanup?: () => void;
  connectedCallback() {
    const root = this.closest<ThemeProviderElement>('tk-provider');
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
    const root = this.closest<ThemeProviderElement>('tk-provider');
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
  const root = element.closest<ThemeProviderElement>('tk-provider');
  if (!root) throw new Error('Theme components require tk-provider');
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
        root = this.closest<ThemeProviderElement>('tk-provider');
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
