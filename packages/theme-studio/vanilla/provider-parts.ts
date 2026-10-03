import '@salyra-ui/color-picker/vanilla';
import { bindBorderInput } from '../core/border-control';
import { channelsToHex } from '@salyra-ui/color-picker';
import {
  nextThemeMode,
  isModePreference,
  suggestedThemeName,
  type Role,
  type Harmony,
  type BorderKind,
  type Target,
  type ThemeOptions,
  type ThemeStore,
} from '../core';
import type { ColorProviderElement } from '@salyra-ui/color-picker/vanilla';

/** Bind ready-made native controls to one context. Context initialization belongs to ThemeRootElement. */
export function bindThemeParts(
  root: HTMLElement,
  store: ThemeStore,
  options: ThemeOptions,
): () => void {
  // Reconcile geometry bindings when Astro slots or vanilla consumers add/remove fields.
  const borderInputs = new Map<
    HTMLInputElement,
    { kind: BorderKind; target: Target; destroy(): void }
  >();
  const syncBorderInputs = () => {
    for (const [input, binding] of borderInputs) {
      if (
        input.closest('tk-root,tk-provider') !== root ||
        input.dataset.tkBorder !== binding.kind ||
        input.dataset.target !== binding.target
      ) {
        binding.destroy();
        borderInputs.delete(input);
      }
    }
    for (const input of root.querySelectorAll<HTMLInputElement>(
      '[data-tk-border]',
    )) {
      if (
        input.closest('tk-root,tk-provider') !== root ||
        borderInputs.has(input)
      )
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
      [...root.querySelectorAll<HTMLElement>(selector)].filter(
        (el) => el.closest('tk-root,tk-provider') === root,
      );
    const pickers = own('tk-picker');
    const generators = own('cp-provider[data-theme-generator]');
    const fields = own('[data-tk-border]');
    const background = own('[data-tk-background]').length > 0;
    if (!pickers.length && !generators.length && !fields.length && !background)
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
  const observer = new root.ownerDocument.defaultView!.MutationObserver(() => {
    syncBorderInputs();
    syncSelection();
  });
  observer.observe(root, {
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
    root.dataset.disabled = String(state.disabled);
    root
      .querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLButtonElement
      >('input, select, button')
      .forEach((control) => {
        if (control.closest('tk-root,tk-provider') !== root) return;
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
    root
      .querySelectorAll<ColorProviderElement>(
        'cp-provider[data-theme-generator]',
      )
      .forEach((provider) => {
        if (provider.closest('tk-root,tk-provider') === root)
          provider.store?.setDisabled(
            state.disabled || provider.hasAttribute('disabled'),
          );
      });
    root.dataset.theme = state.theme.id;
    root.dataset.mode = state.mode;
    root.dataset.modePreference = state.modePreference;
    root.querySelectorAll<HTMLElement>('[data-tk-mode]').forEach((button) => {
      if (button.closest('tk-root,tk-provider') !== root) return;
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
    root
      .querySelectorAll<HTMLInputElement>('[data-tk-name]')
      .forEach((input) => {
        if (input.closest('tk-root,tk-provider') !== root) return;
        if (input.ownerDocument.activeElement !== input)
          input.value = state.theme.name;
        input.placeholder = suggestedThemeName(state.theme);
      });
    root
      .querySelectorAll<HTMLElement>('[data-tk-name-suggestion]')
      .forEach((element) => {
        if (element.closest('tk-root,tk-provider') === root)
          element.textContent = `Suggested: ${suggestedThemeName(state.theme)}`;
      });
    root.dataset.themeStatus = state.status;
    for (const provider of root.querySelectorAll<ColorProviderElement>(
      'cp-provider[data-theme-generator]',
    ))
      if (provider.closest('tk-root,tk-provider') === root)
        provider.store?.setHex(
          channelsToHex(
            state.theme.structure.userPreset[
              (provider.dataset.role ?? 'primary') as Role
            ].DEFAULT,
          ),
        );
    root
      .querySelectorAll<HTMLInputElement>('[data-tk-background]')
      .forEach((input) => {
        if (input.closest('tk-root,tk-provider') === root)
          input.checked = state.background === 'tinted';
      });
    root
      .querySelectorAll<HTMLSelectElement>('[data-tk-harmony]')
      .forEach((input) => {
        if (input.closest('tk-root,tk-provider') === root)
          input.value = state.theme.harmony ?? 'analogous';
      });
    root.dispatchEvent(new CustomEvent('theme-change', { detail: state }));
  };
  const color = (event: Event) => {
    const target = event.target as HTMLElement;
    if (
      target.matches('cp-provider[data-theme-generator]') &&
      target.closest('tk-root,tk-provider') === root
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
    if (button?.closest('tk-root,tk-provider') !== root) return;
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
      input.closest('tk-root,tk-provider') === root
    )
      store.setBackground(input.checked ? 'tinted' : 'neutral');
  };
  const edit = (event: Event) => {
    if (store.getSnapshot().disabled) return;
    const input = event.target as HTMLInputElement;
    if (input.closest('tk-root,tk-provider') !== root) return;
    if (input.matches('[data-tk-name]'))
      store.setName(
        event.type === 'change' && !input.value ? undefined : input.value,
      );
    if (input.matches('[data-tk-harmony]'))
      store.setHarmony(input.value as Harmony);
  };
  root.addEventListener('change', syncSelection);
  syncBorderInputs();
  syncSelection();
  root.addEventListener('change', edit);
  root.addEventListener('input', edit);
  root.addEventListener('change', background);
  root.addEventListener('color-change', color);
  root.addEventListener('click', click);
  update();
  const unsubscribe = store.subscribe(update);
  return () => {
    observer.disconnect();
    borderInputs.forEach((binding) => binding.destroy());
    borderInputs.clear();
    root.removeEventListener('change', syncSelection);
    unsubscribe();
    root.removeEventListener('change', edit);
    root.removeEventListener('input', edit);
    root.removeEventListener('change', background);
    root.removeEventListener('color-change', color);
    root.removeEventListener('click', click);
  };
}
