import { Component, Input } from '@angular/core';
import { type Target } from '../core';
import { ThemeBorder } from './ThemeBorder';
@Component({
  selector: 'tk-border-width',
  standalone: true,
  imports: [ThemeBorder],
  template: `<tk-border kind="width" [target]="target" [label]="label" />`,
})
export class ThemeBorderWidth {
  @Input() target: Target = 'DEFAULT';
  @Input() label = '';
}
