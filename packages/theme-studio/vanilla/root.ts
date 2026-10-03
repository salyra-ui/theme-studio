import {
  createThemeStore,
  mountThemeStore,
  createHttpThemeLoader,
  browserStorage,
  browserModeStorage,
  bindThemeScope,
  type ThemeOptions,
  type ThemeStore,
} from '../core';
import { bindThemeParts } from './provider-parts';

export const themeRootSelector = 'tk-root,tk-provider';

/** Theme context and lifecycle. No layout or CSS variables are imposed on descendants. */
export class ThemeRootElement extends HTMLElement {
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
  protected bindPresentation(_store: ThemeStore): () => void {
    return () => {};
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
    if (src && !options.loadTheme)
      options.loadTheme = createHttpThemeLoader(src);
    if (storageKey && !options.storage)
      options.storage = browserStorage(storageKey);
    if (modeStorageKey && options.modeStorage !== false && !options.modeStorage)
      options.modeStorage = browserModeStorage(modeStorageKey);
    const store = (this.store ??= createThemeStore(options));
    const presentation = this.bindPresentation(store);
    const parts = bindThemeParts(this, store, options);
    const unmount = mountThemeStore(store, options.storage, options);
    this.cleanup = () => {
      parts();
      presentation();
      unmount();
    };
  }
  disconnectedCallback() {
    this.cleanup?.();
    this.cleanup = undefined;
  }
}

/** Apply theme variables to an existing element. Ready providers add an inert boundary. */
function bindProviderScope(
  element: HTMLElement,
  store: ThemeStore,
): () => void {
  const stopScope = bindThemeScope(element, store);
  const inert = element.hasAttribute('inert') && !store.getSnapshot().disabled;
  const aria = element.getAttribute('aria-disabled');
  const update = () => {
    element.toggleAttribute('inert', inert || store.getSnapshot().disabled);
    element.setAttribute('aria-disabled', String(store.getSnapshot().disabled));
  };
  update();
  const stop = store.subscribe(update);
  return () => {
    stop();
    stopScope();
    element.toggleAttribute('inert', inert);
    if (aria === null) element.removeAttribute('aria-disabled');
    else element.setAttribute('aria-disabled', aria);
  };
}

/** Ready recipe over the same Root lifecycle and Scope binding. */
export class ThemeProviderElement extends ThemeRootElement {
  protected bindPresentation(store: ThemeStore) {
    return bindProviderScope(this, store);
  }
}

/** A separate variable boundary inside tk-root or tk-provider. */
export class ThemeScopeElement extends HTMLElement {
  private store?: ThemeStore;
  private cleanup?: () => void;
  private detach?: () => void;
  connectedCallback() {
    if (this.detach) return;
    const root = this.closest<ThemeRootElement>(themeRootSelector);
    if (!root) return;
    const bind = () => {
      if (!root.store || this.store === root.store) return;
      this.cleanup?.();
      this.store = root.store;
      this.cleanup = this.hasAttribute('data-controls-boundary')
        ? bindProviderScope(this, root.store)
        : bindThemeScope(this, root.store);
    };
    root.addEventListener('theme-change', bind);
    this.detach = () => root.removeEventListener('theme-change', bind);
    bind();
  }
  disconnectedCallback() {
    this.detach?.();
    this.cleanup?.();
    this.detach = this.cleanup = this.store = undefined;
  }
}
