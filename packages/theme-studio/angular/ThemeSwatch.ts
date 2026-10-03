import { Component, Input } from '@angular/core';
import { type Theme } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-swatch',
  standalone: true,
  template: `<button
    type="button"
    [attr.aria-pressed]="state().theme.id === theme.id"
    (click)="store.setTheme(theme)"
  >
    {{ theme.name }}
  </button>`,
})
export class ThemeSwatch {
  @Input({ required: true }) theme!: Theme;
  readonly state = useTheme();
  readonly store = useThemeStore();
}
