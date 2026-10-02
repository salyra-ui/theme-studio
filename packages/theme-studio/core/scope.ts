import type { ThemeStore, ThemeSnapshot } from './types';
/** CSS shared by SSR scopes and client bindings, including loading boundaries. */
export function themeScopeStyle(state: ThemeSnapshot): string {
  return `${state.style};--tk-loading-display:${state.status === 'loading' ? 'contents' : 'none'};--tk-ready-display:${state.status === 'loading' ? 'none' : 'contents'};--tk-error-display:${state.error ? 'contents' : 'none'}`;
}
export function themeScopeStyles(state: ThemeSnapshot): Record<string, string> {
  return Object.fromEntries(
    themeScopeStyle(state)
      .split(';')
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf(':');
        return [part.slice(0, i), part.slice(i + 1)];
      }),
  );
}
/** Apply only theme-owned declarations to an existing scope. Restore prior values on cleanup. */
export function bindThemeScope(
  element: HTMLElement,
  store: ThemeStore,
): () => void {
  const original = new Map<string, { value: string; priority: string }>();
  const render = () => {
    for (const [key, value] of Object.entries(
      themeScopeStyles(store.getSnapshot()),
    )) {
      if (!original.has(key))
        original.set(key, {
          value: element.style.getPropertyValue(key),
          priority: element.style.getPropertyPriority(key),
        });
      element.style.setProperty(key, value);
    }
    const state = store.getSnapshot();
    for (const [key, value] of Object.entries({
      'data-tk-part': 'scope',
      'data-mode': state.mode,
      'data-mode-preference': state.modePreference,
      'data-theme': state.theme.id,
      'data-theme-status': state.status,
      'data-disabled': String(state.disabled),
    }))
      element.setAttribute(key, value);
  };
  render();
  const stop = store.subscribe(render);
  return () => {
    stop();
    for (const [key, previous] of original)
      if (previous.value)
        element.style.setProperty(key, previous.value, previous.priority);
      else element.style.removeProperty(key);
  };
}
