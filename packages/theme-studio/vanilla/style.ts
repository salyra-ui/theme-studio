import type { ThemeSnapshot } from '../core';
import { themeScopeStyle as scopeStyle } from '../core';
export { scopeStyle };

/** Update generated variables without discarding caller-owned inline styles. */
export function applyScopeStyle(
  element: HTMLElement,
  state: ThemeSnapshot,
): void {
  for (const declaration of scopeStyle(state).split(';')) {
    const separator = declaration.indexOf(':');
    if (separator <= 0) continue;
    element.style.setProperty(
      declaration.slice(0, separator),
      declaration.slice(separator + 1),
    );
  }
}
