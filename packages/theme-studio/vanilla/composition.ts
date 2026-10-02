import { mountColorControls } from '@salyra-ui/color-picker/vanilla';
import { thumbPosition } from '@salyra-ui/color-picker';
import {
  createThemePickerStore,
  bindThemeWheel,
  themePickerMarkers,
  bindBorderInput,
  type ThemeStore,
  type ThemePickerOptions,
  type Role,
  type BorderKind,
  type Target,
} from '../core';
/** Connect a custom theme editor to a store without prescribing its DOM or creating controls. */
export function mountThemeControls(
  root: HTMLElement,
  store: ThemeStore,
  options: ThemePickerOptions = {},
) {
  const localDisabled = new Map<HTMLElement, boolean>(
    Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        'button, input',
      ),
    ).map((element) => [
      element,
      element.disabled &&
        !element.hasAttribute('data-tk-disabled') &&
        !element.hasAttribute('data-cp-disabled'),
    ]),
  );
  const picker = createThemePickerStore(store, options),
    stops: (() => void)[] = [picker.mount()];
  const color = mountColorControls(root, picker.activeColor);
  stops.push(color.destroy);
  const owned = (selector: string) =>
    Array.from(root.querySelectorAll<HTMLElement>(selector));
  for (const surface of owned('[data-tk-control="wheel"]')) {
    surface.dataset.cpPart = 'surface';
    surface.style.position = 'relative';
    surface.style.touchAction = 'none';
    surface.style.aspectRatio = '1';
    surface.style.borderRadius = '50%';
    surface.style.background =
      'radial-gradient(closest-side,white,transparent),conic-gradient(from 90deg,red,yellow,lime,cyan,blue,magenta,red)';
    // Astro renders native color inputs inside this theme context without another color provider.
    surface.tabIndex = 0;
    stops.push(bindThemeWheel(surface, picker));
  }
  for (const input of owned('input[data-tk-control="geometry"]')) {
    const kind = (input.dataset.kind ?? 'radius') as BorderKind,
      target = (input.dataset.target ?? 'DEFAULT') as Target;
    const fields = store.registerFields({ roles: [], [kind]: [target] });
    stops.push(
      fields.destroy,
      bindBorderInput(input as HTMLInputElement, store, kind, target),
    );
  }

  const roleButtons = owned('button[data-tk-control="role"]');
  for (const button of roleButtons) {
    const click = (event: Event) => {
      if (!event.defaultPrevented && !(button as HTMLButtonElement).disabled)
        picker.selectRole(button.dataset.role as Role);
    };
    button.addEventListener('click', click);
    stops.push(() => button.removeEventListener('click', click));
  }
  const render = () => {
    const state = picker.getSnapshot(),
      disabled = picker.activeColor.getSnapshot().disabled;
    for (const button of roleButtons) {
      const role = button.dataset.role as Role;
      button.setAttribute('aria-pressed', String(state.activeRole === role));
      (button as HTMLButtonElement).disabled =
        !!localDisabled.get(button) || disabled || !state.roles.includes(role);
    }
    for (const surface of owned('[data-tk-control="wheel"]')) {
      surface.setAttribute('aria-disabled', String(disabled));
      surface.tabIndex = disabled ? -1 : 0;
      for (const button of surface.querySelectorAll<HTMLButtonElement>(
        '[data-marker-id]',
      )) {
        const marker = themePickerMarkers(state).find(
          (marker) => marker.id === button.dataset.markerId,
        );
        button.hidden = !marker;
        if (!marker) continue;
        button.disabled = !!localDisabled.get(button) || disabled;
        button.setAttribute(
          'aria-pressed',
          String(state.activeRole === marker.id),
        );
        for (const [key, value] of Object.entries(
          thumbPosition(marker.color, 'wheel'),
        ))
          button.style.setProperty(
            key.replace(/[A-Z]/g, (x) => '-' + x.toLowerCase()),
            value,
          );
        button.style.pointerEvents = 'auto';
        button.style.background = marker.color.hex;
        button.style.zIndex = state.activeRole === marker.id ? '2' : '1';
      }
    }
    for (const input of owned('input[data-tk-control="geometry"]'))
      (input as HTMLInputElement).disabled =
        !!localDisabled.get(input) || store.getSnapshot().disabled;
  };
  render();
  stops.push(picker.subscribe(render), store.subscribe(render));
  return {
    store,
    picker,
    getConfiguration: () => importConfiguration(store.getSnapshot()),
    destroy() {
      stops
        .splice(0)
        .reverse()
        .forEach((stop) => stop());
    },
  };
}
import { themeConfiguration as importConfiguration } from '../core';
