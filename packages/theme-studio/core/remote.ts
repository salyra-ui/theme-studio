import { parseTheme } from './theme';
import type { Theme, ThemeStore } from './types';
export interface HttpThemeLoaderOptions {
  fetch?: typeof fetch;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
}
/** Per-provider conditional HTTP loader. Construct safely on the server; fetch is deferred. */
export function createHttpThemeLoader(
  url: string,
  options: HttpThemeLoaderOptions = {},
) {
  let cached: Theme | undefined,
    etag: string | undefined,
    revision = 0;
  const load = async (signal: AbortSignal): Promise<Theme> => {
    const version = ++revision,
      headers = new Headers(options.headers);
    if (etag && cached) headers.set('If-None-Match', etag);
    const response = await (options.fetch ?? fetch)(url, {
      signal,
      headers,
      credentials: options.credentials,
      cache: 'no-cache',
    });
    if (signal.aborted) throw new Error('Theme load cancelled');
    if (response.status === 304) {
      if (!cached)
        throw new Error('Theme server returned 304 without a cached theme');
      return cached;
    }
    if (!response.ok)
      throw new Error(`Theme request failed (${response.status})`);
    const theme = parseTheme(await response.json());
    if (signal.aborted) throw new Error('Theme load cancelled');
    if (version === revision) {
      cached = theme;
      etag = response.headers.get('ETag') ?? undefined;
    }
    return theme;
  };
  return Object.assign(load, {
    invalidate() {
      revision++;
      cached = undefined;
      etag = undefined;
    },
  });
}
export interface ThemeUpdateOptions {
  /** Revalidate when this page becomes active again. */
  onFocus?: boolean;
  intervalMs?: number;
  /** Connect an SSE/WebSocket or other application's theme-changed notification. */
  subscribe?: (invalidate: () => void) => () => void;
}
/** Mount-only watcher; coalesces simultaneous notifications and cleans every listener. */
export function watchThemeUpdates(
  store: ThemeStore,
  options: ThemeUpdateOptions = {},
): () => void {
  if (
    options.intervalMs !== undefined &&
    (!Number.isFinite(options.intervalMs) || options.intervalMs <= 0)
  )
    throw new TypeError('intervalMs must be positive');
  if (typeof window === 'undefined') return () => {};
  let disposed = false,
    running = false,
    queued = false;
  const refresh = async () => {
    if (disposed) return;
    if (running) {
      queued = true;
      return;
    }
    running = true;
    do {
      queued = false;
      try {
        await store.reload();
      } catch {
        /* Store owns loader errors. */
      }
    } while (queued && !disposed);
    running = false;
  };
  const focus = () => {
    if (document.visibilityState !== 'hidden') void refresh();
  };
  if (options.onFocus ?? true) {
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', focus);
  }
  const timer =
    options.intervalMs === undefined
      ? undefined
      : window.setInterval(focus, options.intervalMs);
  const unsubscribe = options.subscribe?.(() => void refresh());
  return () => {
    disposed = true;
    window.removeEventListener('focus', focus);
    document.removeEventListener('visibilitychange', focus);
    window.clearInterval(timer);
    unsubscribe?.();
  };
}
