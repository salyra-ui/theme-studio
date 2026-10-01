// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createThemeStore } from '../core';
import { applyScopeStyle } from '../vanilla/style';
import { bindBorderInput } from '../core/border-control';
describe('geometry input controller', () => {
  it('retains custom inline control variables while updating generated theme styles', () => {
    const store = createThemeStore({ modeStorage: false });
    const provider = document.createElement('div');
    provider.style.setProperty('--tk-control-radius', '0');
    provider.style.padding = '12px';
    applyScopeStyle(provider, store.getSnapshot());
    const before = provider.style.getPropertyValue('--primary');
    store.setColor('primary', '#FF0000');
    applyScopeStyle(provider, store.getSnapshot());
    expect(provider.style.getPropertyValue('--primary')).not.toBe(before);
    expect(provider.style.getPropertyValue('--tk-control-radius')).toBe('0');
    expect(provider.style.padding).toBe('12px');
  });
  it('keeps a geometry draft, rejects invalid input and restores the latest store value on blur', () => {
    const store = createThemeStore();
    const input = document.createElement('input');
    input.type = 'number';
    const unbind = bindBorderInput(input, store, 'radius', 'card');
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '0.625';
    input.dispatchEvent(new Event('input'));
    expect(
      store.getSnapshot().theme.structure.websitePreset.border.radius.card,
    ).toBe(0.625);
    // Another control can update the store without destroying an in-progress edit.
    store.setBorder('radius', 'card', 2);
    expect(input.value).toBe('0.625');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      store.getSnapshot().theme.structure.websitePreset.border.radius.card,
    ).toBe(2);
    input.dispatchEvent(new FocusEvent('blur'));
    expect(input.value).toBe('2');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    unbind();
    store.setBorder('radius', 'card', 3);
    expect(input.value).toBe('2'); // Cleanup releases the subscription.
  });
  it('does not write disabled geometry and normalizes invalid drafts on Enter or Escape', () => {
    const store = createThemeStore({ disabled: true });
    const before = store.getSnapshot();
    const input = document.createElement('input');
    input.type = 'number';
    const unbind = bindBorderInput(input, store, 'width', 'button');
    input.dispatchEvent(new FocusEvent('focus'));
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    expect(store.getSnapshot()).toBe(before);
    store.setDisabled(false);
    for (const key of ['Enter', 'Escape']) {
      input.value = '-1';
      input.dispatchEvent(new Event('input'));
      expect(input.getAttribute('aria-invalid')).toBe('true');
      input.dispatchEvent(new KeyboardEvent('keydown', { key }));
      expect(input.value).toBe(
        String(
          store.getSnapshot().theme.structure.websitePreset.border.width.button,
        ),
      );
      expect(input.getAttribute('aria-invalid')).toBe('false');
    }
    unbind();
  });
});
