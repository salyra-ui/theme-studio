import type { ThemeStore, ThemeSnapshot } from './types';
export function themeScopeStyles(state: ThemeSnapshot): Record<string, string> {
  return Object.fromEntries(
    state.style
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
    element.dataset.mode = store.getSnapshot().mode;
    element.dataset.modePreference = store.getSnapshot().modePreference;
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
