import { Component } from '@angular/core';
import { useTheme } from './context';
@Component({
  selector: 'tk-loading',
  standalone: true,
  template: `@if (state().status === 'loading') {
    <ng-content />
  }`,
})
export class ThemeLoading {
  readonly state = useTheme();
}
