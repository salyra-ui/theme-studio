import type { BorderKind, Target, ThemeStore } from './types';

/** Shared field copy and units. Geometry uses rem for radius and px for border width. */
export function borderControlLabel(kind: BorderKind, target: Target): string {
  const name =
    target === 'DEFAULT'
      ? 'Default'
      : target[0].toUpperCase() + target.slice(1);
  return `${name} ${kind === 'radius' ? 'radius' : 'border width'}`;
}
export const borderControlUnit = (kind: BorderKind) =>
  kind === 'radius' ? 'rem' : 'px';

/**
 * Keep the DOM draft while focused, including incomplete decimal input.
 * Only valid values enter the store. Blur, Enter and Escape restore its current value.
 * Bind on mount and clean up on unmount or when the target changes.
 */
export function bindBorderInput(
  input: HTMLInputElement,
  store: ThemeStore,
  kind: BorderKind,
  target: Target,
): () => void {
  let focused = false;
  const render = () => {
    if (focused) return;
    input.value = String(
      store.getSnapshot().theme.structure.websitePreset.border[kind][target],
    );
    input.setAttribute('aria-invalid', 'false');
  };
  const change = (event: Event) => {
    if (
      event.defaultPrevented ||
      input.disabled ||
      store.getSnapshot().disabled
    )
      return;
    const value = input.valueAsNumber;
    const valid =
      input.value !== '' &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1000;
    input.setAttribute('aria-invalid', String(!valid));
    if (valid) store.setBorder(kind, target, value);
  };
  const focus = () => {
    focused = true;
  };
  const blur = () => {
    focused = false;
    render();
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    // Keep Enter available for form submission after normalizing the field.
    focused = false;
    render();
    focused = true;
  };
  input.addEventListener('input', change);
  input.addEventListener('focus', focus);
  input.addEventListener('blur', blur);
  input.addEventListener('keydown', keydown);
  render();
  const unsubscribe = store.subscribe(render);
  return () => {
    unsubscribe();
    input.removeEventListener('input', change);
    input.removeEventListener('focus', focus);
    input.removeEventListener('blur', blur);
    input.removeEventListener('keydown', keydown);
  };
}
