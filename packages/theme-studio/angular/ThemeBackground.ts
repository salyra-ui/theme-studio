import {
  Component,
  afterRenderEffect,
  Input,
  inject,
  DestroyRef,
} from '@angular/core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-background',
  standalone: true,
  template: `<label class="tk-background"
    ><input
      type="checkbox"
      [checked]="state().background === 'tinted'"
      (change)="change($event)"
    />{{ label }}</label
  >`,
})
export class ThemeBackground {
  ngOnChanges() {
    this.registration?.update({ roles: [], background: true });
  }
  private registration?: import('../core').ThemeFieldRegistration;
  constructor() {
    afterRenderEffect(() => {
      const selection = { roles: [], background: true };
      if (this.registration) this.registration.update(selection);
      else this.registration = this.store.registerFields(selection);
    });
    inject(DestroyRef).onDestroy(() => this.registration?.destroy());
  }
  @Input() label = 'Tint background with primary';
  readonly state = useTheme();
  readonly store = useThemeStore();
  change(event: Event) {
    this.store.setBackground(
      (event.target as HTMLInputElement).checked ? 'tinted' : 'neutral',
    );
  }
}
