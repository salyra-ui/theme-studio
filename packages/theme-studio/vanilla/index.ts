export * from './elements';
export * from '../core';
import {
  colorAreaMarkup,
  colorWheelMarkup,
  colorFormatMarkup,
  colorSliderMarkup,
} from '@salyra-ui/color-picker/vanilla';
import {
  createThemeStore,
  themeConfiguration,
  browserStorage,
  type ThemeOptions,
  type ThemeStore,
  type Theme,
  type ThemePickerOptions,
  type ThemeConfiguration,
  type TokenSelection,
  type Target,
  type Role,
  type PaletteOptions,
  shades,
} from '../core';
import type { ThemeProviderElement } from './elements';
export interface ThemeKitOptions extends ThemeOptions {
  store?: ThemeStore;
  themes?: readonly Theme[];
  picker?: ThemePickerOptions;
  radius?: readonly Target[];
  width?: readonly Target[];
  backgroundControl?: boolean;
  className?: string;
  onChange?: (configuration: ThemeConfiguration) => void;
}
const roles = ['primary', 'secondary', 'accent'] as const;
export const themePickerMarkup = `<tk-picker><cp-provider data-tk-active-color><div class="tk-picker tk-generator">
  <label class="cp-format">Theme picker view<select data-picker-view><option value="area">Rectangle</option><option value="wheel">Wheel</option><option value="shared-wheel">Shared wheel</option></select></label>
  <fieldset class="tk-role-options"><legend>Visible roles</legend>${roles.map((role) => `<label><input type="checkbox" data-include-role="${role}" checked />${role}</label>`).join('')}</fieldset>
  <div class="tk-role-tabs" aria-label="Active color">${roles.map((role) => `<button type="button" data-select-role="${role}"><span></span>${role}</button>`).join('')}</div>
  <div data-picker-surface="shared-wheel"><cp-wheel data-markers="[]"><div class="cp-wheel tk-shared-wheel" data-area data-cp-part="surface" role="group" tabindex="0" aria-label="Shared theme color wheel"></div></cp-wheel></div>
  <div data-picker-surface="area">${colorAreaMarkup}</div><div data-picker-surface="wheel">${colorWheelMarkup}</div>
  <p class="tk-editing" aria-live="polite"></p>
  <div data-picker-channel="h">${colorSliderMarkup('h', 'Hue')}</div><div data-picker-channel="v">${colorSliderMarkup('v', 'Brightness')}</div>
  ${colorFormatMarkup}<cp-input></cp-input><cp-mode><button type="button">Switch format</button></cp-mode>
</div></cp-provider></tk-picker>`;
export const themeKitMarkup = `<div class="tk-generator">
  <div class="tk-role-tabs" aria-label="Theme mode"><button type="button" data-tk-mode="system">System</button><button type="button" data-tk-mode="light">Light mode</button><button type="button" data-tk-mode="dark">Dark mode</button></div>
  <label class="tk-name">Theme name<input data-tk-name maxlength="200" /><small data-tk-name-suggestion></small></label>
  <tk-select><label class="cp-format">Saved themes<select><option value="" disabled>Custom theme</option></select></label></tk-select>
  ${themePickerMarkup}
  <div class="tk-harmony"><label>Color harmony<select data-tk-harmony><option value="analogous">Analogous</option><option value="triadic">Triadic</option><option value="split-complementary">Split complementary</option></select></label><button type="button" data-tk-generate-harmony>Generate accent &amp; secondary</button></div>
  <label class="tk-background"><input type="checkbox" data-tk-background />Tint background with primary</label>
  <label class="tk-border">Card radius<input type="number" min="0" max="1000" step=".125" data-tk-border="radius" data-target="card" />rem</label>
  <label class="tk-border">Card border width<input type="number" min="0" max="1000" step="1" data-tk-border="width" data-target="card" />px</label>
  <details><summary>Export configuration</summary><tk-export format="json"><pre class="tk-export" aria-label="Theme configuration"></pre></tk-export></details>
</div>`;
/** Native DOM controls with exports limited to the mounted fields. */
export function mountThemeKit(
  host: HTMLElement,
  options: ThemeKitOptions = {},
) {
  const store = options.store ?? createThemeStore(options),
    provider = host.ownerDocument.createElement(
      'tk-provider',
    ) as ThemeProviderElement;
  provider.className = `tk-scope ${options.className ?? ''}`;
  provider.setStore(store, options);
  provider.innerHTML = themeKitMarkup;
  for (const kind of ['radius', 'width'] as const) {
    provider
      .querySelectorAll(`[data-tk-border="${kind}"]`)
      .forEach((el) => el.closest('label')!.remove());
    const fields = (options[kind] ?? ['card'])
      .map(
        (target) =>
          `<label class="tk-border">${target === 'DEFAULT' ? 'Default' : target} ${kind}<input type="number" min="0" max="1000" step="${kind === 'radius' ? '.125' : '1'}" data-tk-border="${kind}" data-target="${target}">${kind === 'radius' ? 'rem' : 'px'}</label>`,
      )
      .join('');
    provider
      .querySelector('details')!
      .insertAdjacentHTML('beforebegin', fields);
  }
  if (options.backgroundControl === false)
    provider.querySelector('[data-tk-background]')!.closest('label')!.remove();
  if (options.picker?.roles?.length === 1) {
    provider.querySelector('.tk-harmony')!.remove();
    provider.querySelector('tk-select')!.setAttribute('hidden', '');
  }
  const picker = provider.querySelector('tk-picker')!;
  picker.setAttribute('data-options', JSON.stringify(options.picker ?? {}));
  const list = provider.querySelector('tk-select')!;
  list.setAttribute('data-themes', JSON.stringify(options.themes ?? []));
  const select = list.querySelector('select')!;
  select.disabled = !options.themes?.length;
  for (const theme of options.themes ?? []) {
    const option = host.ownerDocument.createElement('option');
    option.value = theme.id;
    option.textContent = theme.name;
    select.append(option);
  }
  const change = () =>
    options.onChange?.(themeConfiguration(store.getSnapshot()));
  provider.addEventListener('theme-change', change);
  host.append(provider);
  return {
    element: provider,
    store,
    getConfiguration: (selection?: TokenSelection) =>
      themeConfiguration(store.getSnapshot(), selection),
    destroy() {
      provider.removeEventListener('theme-change', change);
      provider.remove();
    },
  };
}

/** Shade colors come from the nearest theme provider. All other parts can be styled. */
export function themePaletteMarkup(
  role: Role = 'primary',
  options: PaletteOptions = {},
): string {
  if (
    !roles.includes(role) ||
    (options.shape && !['square', 'circle', 'joined'].includes(options.shape))
  )
    throw new TypeError('Invalid palette role or shape');
  const escape = (value: unknown) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c]!,
    );
  const classes = options.classes ?? {};
  return `<tk-palette role-name="${role}"><div class="tk-palette ${escape(classes.root ?? '')}" data-shape="${options.shape ?? 'square'}" aria-label="${role} shades">${shades.map((shade) => `<div data-palette-part="item" class="${escape(classes.item ?? '')} ${escape(options.shadeClasses?.[shade] ?? '')}"><span data-palette-part="label" class="${escape(classes.label ?? '')}">${escape(options.labels?.[shade] ?? shade)}</span><div data-palette-part="swatch" data-shade="${shade}" class="tk-shade ${escape(classes.swatch ?? '')}"></div></div>`).join('')}</div></tk-palette>`;
}
