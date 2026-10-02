import { Component } from '@angular/core';
import { useTheme } from './context';
import { ThemeRoot, ThemeVariableScope } from './primitives';

/** Ready composition. Host directive owns context and lifecycle. */
@Component({
  selector: 'tk-provider',
  standalone: true,
  hostDirectives: [{ directive: ThemeRoot, inputs: ['options', 'store'] }],
  imports: [ThemeVariableScope],
  template: `<div tkScope class="tk-scope">
    <fieldset
      class="tk-provider-controls"
      [disabled]="state().disabled"
      [attr.inert]="state().disabled ? '' : null"
      [attr.aria-disabled]="state().disabled"
    >
      <ng-content />
    </fieldset>
  </div>`,
})
export class ThemeProvider {
  readonly state = useTheme();
}
