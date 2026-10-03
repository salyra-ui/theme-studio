import {
  Component,
  afterRenderEffect,
  ElementRef,
  ViewChild,
  Input,
} from '@angular/core';
import { harmonies, type Harmony } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-harmony',
  standalone: true,
  template: `<div class="tk-harmony">
    <label
      >{{ label
      }}<select #select (change)="change($event)">
        @for (value of harmonies; track value) {
          <option
            [value]="value"
            [attr.selected]="
              (state().theme.harmony ?? 'analogous') === value ? '' : null
            "
          >
            {{ value }}
          </option>
        }
      </select></label
    ><button type="button" (click)="store.generateHarmony()">
      Generate accent &amp; secondary
    </button>
  </div>`,
})
export class ThemeHarmony {
  @Input() label = 'Color harmony';
  @ViewChild('select') select!: ElementRef<HTMLSelectElement>;
  readonly harmonies = harmonies;
  readonly state = useTheme();
  readonly store = useThemeStore();
  constructor() {
    afterRenderEffect(() => {
      const value = this.state().theme.harmony ?? 'analogous';
      if (this.select) this.select.nativeElement.value = value;
    });
  }
  change(event: Event) {
    this.store.setHarmony((event.target as HTMLSelectElement).value as Harmony);
  }
}
