import { Component } from '@angular/core';
import { useTheme } from './context';
@Component({
  selector: 'tk-ready',
  standalone: true,
  template: `@if (state().status !== 'loading') {
    <ng-content />
  }`,
})
export class ThemeReady {
  readonly state = useTheme();
}
