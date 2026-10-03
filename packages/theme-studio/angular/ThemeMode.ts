import { NgTemplateOutlet } from '@angular/common';
import { ContentChild, TemplateRef, Component, Input } from '@angular/core';
import { type ModePreference } from '../core';
import { useThemeMode } from './useThemeMode';
@Component({
  selector: 'tk-mode',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `<button
    type="button"
    [attr.aria-pressed]="value ? mode.preference() === value : null"
    (click)="value ? mode.setMode(value) : mode.cycle()"
  >
    @if (content) {
      <ng-container
        [ngTemplateOutlet]="content"
        [ngTemplateOutletContext]="{ $implicit: mode }"
      />
    } @else {
      {{ labels[value ?? mode.preference()] }}
    }
  </button>`,
})
export class ThemeMode {
  @Input() value?: ModePreference;
  @Input() labels: Record<ModePreference, string> = {
    system: 'System',
    light: 'Light mode',
    dark: 'Dark mode',
  };
  @ContentChild(TemplateRef) content?: TemplateRef<unknown>;
  readonly mode = useThemeMode();
}
