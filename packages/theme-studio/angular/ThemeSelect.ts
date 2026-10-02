import {
  Component,
  afterRenderEffect,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import { themeList, selectedThemeId, type Theme } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-select',
  standalone: true,
  template: `<label class="cp-format tk-select"
    >{{ label
    }}<select #select [disabled]="!themes.length" (change)="choose($event)">
      <option value="" disabled [attr.selected]="!value() ? '' : null">
        {{ themes.length ? 'Custom theme' : 'No themes available' }}
      </option>
      @for (theme of list(); track theme.id) {
        <option
          [value]="theme.id"
          [attr.selected]="value() === theme.id ? '' : null"
        >
          {{ theme.name }}
        </option>
      }
    </select></label
  >`,
})
export class ThemeSelect {
  @Input() themes: readonly Theme[] = [];
  @Input() label = 'Saved themes';
  @ViewChild('select') select!: ElementRef<HTMLSelectElement>;
  readonly store = useThemeStore();
  readonly state = useTheme();
  list() {
    return themeList(this.themes);
  }
  value() {
    return selectedThemeId(this.state().theme, this.list()) ?? '';
  }
  choose(event: Event) {
    const theme = this.list().find(
      (theme) => theme.id === (event.target as HTMLSelectElement).value,
    );
    if (theme) this.store.setTheme(theme);
  }
  constructor() {
    afterRenderEffect(() => {
      this.select.nativeElement.value = this.value();
    });
  }
}
