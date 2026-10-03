import { Component, Input } from '@angular/core';
import { type Target } from '../core';
import { ThemeBorder } from './ThemeBorder';
@Component({
  selector: 'tk-radius',
  standalone: true,
  imports: [ThemeBorder],
  template: `<tk-border kind="radius" [target]="target" [label]="label" />`,
})
export class ThemeRadius {
  @Input() target: Target = 'DEFAULT';
  @Input() label = '';
}
