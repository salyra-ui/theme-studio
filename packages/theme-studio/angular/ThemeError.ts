import { Component } from '@angular/core';
import { useTheme } from './context';
@Component({
  selector: 'tk-error',
  standalone: true,
  template: `@if (state().error) {
    <ng-content />
  }`,
})
export class ThemeError {
  readonly state = useTheme();
}
