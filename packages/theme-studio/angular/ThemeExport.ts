import {
  Component,
  Output,
  EventEmitter,
  afterRenderEffect,
  Input,
  signal,
} from '@angular/core';
import {
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
} from '../core';
import { useTheme } from './context';
@Component({
  selector: 'tk-export',
  standalone: true,
  template: `@if (custom) {
      <ng-content />
    } @else {
      <pre class="tk-export" aria-label="Theme configuration">{{
        configuration()[format]
      }}</pre>
    }`,
})
export class ThemeExport {
  @Input() format: ThemeExportFormat = 'json';
  private selectionKey = signal<string | undefined>(undefined);
  @Input() set selection(value: TokenSelection | undefined) {
    this.selectionKey.set(JSON.stringify(value));
  }
  get selection(): TokenSelection | undefined {
    const key = this.selectionKey();
    return key ? JSON.parse(key) : undefined;
  }
  @Input() custom = false;
  @Output() configurationChange = new EventEmitter<ThemeConfiguration>();
  readonly state = useTheme();
  configuration() {
    return themeConfiguration(this.state(), this.selection);
  }
  constructor() {
    afterRenderEffect(() => {
      this.configurationChange.emit(this.configuration());
    });
  }
}
