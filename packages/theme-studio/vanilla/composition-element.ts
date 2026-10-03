import { mountThemeControls } from './composition';
import { themeRootSelector, type ThemeRootElement } from './root';
import type { ThemePickerOptions, ThemePickerStore, ThemeStore } from '../core';
export class ThemeCompositionElement extends HTMLElement {
  picker?: ThemePickerStore;
  private controls: Element[] = [];
  private bound?: ThemeStore;
  private stop?: () => void;
  private detach?: () => void;
  connectedCallback() {
    const root = this.closest<ThemeRootElement>(themeRootSelector);
    if (!root) return;
    const setup = () => {
      if (!root.store) return;
      const controls = Array.from(
        this.querySelectorAll(
          '[data-tk-control], [data-cp-control], [data-marker-id]',
        ),
      );
      if (
        this.bound === root.store &&
        controls.length === this.controls.length &&
        controls.every((control, index) => control === this.controls[index])
      )
        return;
      this.controls = controls;
      this.stop?.();
      this.bound = root.store;
      const composition = mountThemeControls(
        this,
        root.store,
        JSON.parse(this.dataset.options ?? '{}') as ThemePickerOptions,
      );
      this.picker = composition.picker;
      this.stop = composition.destroy;
    };
    const context = () => setup();
    const observer = new MutationObserver(() => setup());
    observer.observe(this, { childList: true, subtree: true });
    root.addEventListener('theme-change', context);
    this.detach = () => {
      observer.disconnect();
      root.removeEventListener('theme-change', context);
    };
    setup();
    queueMicrotask(() => {
      if (this.isConnected) setup();
    });
  }
  disconnectedCallback() {
    this.stop?.();
    this.detach?.();
    this.bound = this.picker = undefined;
    this.controls = [];
    this.stop = this.detach = undefined;
  }
}
if (!customElements.get('tk-compose'))
  customElements.define('tk-compose', ThemeCompositionElement);
