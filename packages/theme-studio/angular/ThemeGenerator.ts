import {
  Component,
  afterRenderEffect,
  Input,
  inject,
  DestroyRef,
} from '@angular/core';
import {
  ColorSurface,
  ColorViewSelect,
  ColorFormatSelect,
  ColorMode,
  ColorProvider,
  ColorInput,
} from '@salyra-ui/color-picker/angular';
import { channelsToHex } from '@salyra-ui/color-picker';
import { type Role } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-generator,tk-color',
  standalone: true,
  imports: [
    ColorSurface,
    ColorViewSelect,
    ColorProvider,
    ColorInput,
    ColorMode,
    ColorFormatSelect,
  ],
  template: `<cp-provider
    [disabled]="disabled || state().disabled"
    [view]="wheel ? 'wheel' : 'area'"
    [value]="seed()"
    (colorChange)="store.setColor(role, $event)"
    ><div class="tk-generator">
      @if (custom) {
        <ng-content />
      } @else {
        <cp-view-select /><cp-surface />
        <cp-format-select /><cp-input /><cp-mode />
      }</div
  ></cp-provider>`,
})
export class ThemeGenerator {
  ngOnChanges() {
    this.registration?.update({ roles: [this.role] });
  }
  private registration?: import('../core').ThemeFieldRegistration;
  constructor() {
    afterRenderEffect(() => {
      const selection = { roles: [this.role] };
      if (this.registration) this.registration.update(selection);
      else this.registration = this.store.registerFields(selection);
    });
    inject(DestroyRef).onDestroy(() => this.registration?.destroy());
  }
  @Input() disabled = false;
  @Input() role: Role = 'primary';
  @Input() wheel = false;
  @Input() custom = false;
  readonly state = useTheme();
  readonly store = useThemeStore();
  seed() {
    return channelsToHex(
      this.state().theme.structure.userPreset[this.role].DEFAULT,
    );
  }
}
