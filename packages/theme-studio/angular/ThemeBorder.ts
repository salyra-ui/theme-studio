import {
  bindBorderInput,
  borderControlLabel,
  borderControlUnit,
} from '../core/border-control';
import {
  Component,
  ElementRef,
  Input,
  inject,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { type Target, type BorderKind } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-border',
  standalone: true,
  template: `<label class="tk-border">
    <span>{{ label || fieldLabel(kind, target) }}</span>
    <span class="tk-border-field">
      <input
        #input
        type="number"
        min="0"
        max="1000"
        [step]="kind === 'width' ? 1 : 0.125"
        [attr.value]="
          state().theme.structure.websitePreset.border[kind][target]
        "
      />
      <span aria-hidden="true">{{ fieldUnit(kind) }}</span>
    </span>
  </label>`,
})
export class ThemeBorder {
  @Input() kind: BorderKind = 'width';
  @Input() target: Target = 'DEFAULT';
  @Input() label = '';
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  readonly fieldLabel = borderControlLabel;
  readonly fieldUnit = borderControlUnit;
  readonly state = useTheme();
  readonly store = useThemeStore();
  private registration?: import('../core').ThemeFieldRegistration;
  private unbind?: () => void;
  private mounted = false;
  private bind() {
    const input = this.host.nativeElement.querySelector<HTMLInputElement>(
      '.tk-border-field input',
    );
    if (!input) return;
    this.unbind?.();
    const selection = { roles: [], [this.kind]: [this.target] };
    if (this.registration) this.registration.update(selection);
    else this.registration = this.store.registerFields(selection);
    this.unbind = bindBorderInput(input, this.store, this.kind, this.target);
  }
  ngOnChanges() {
    if (this.mounted) this.bind();
  }
  constructor() {
    afterNextRender(() => {
      this.mounted = true;
      this.bind();
    });
    inject(DestroyRef).onDestroy(() => {
      this.unbind?.();
      this.registration?.destroy();
    });
  }
}
