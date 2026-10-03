import {
  Component,
  afterRenderEffect,
  ElementRef,
  ViewChild,
  Input,
  inject,
  signal,
  DestroyRef,
  afterNextRender,
  type OnInit,
} from '@angular/core';
import {
  ColorWheel,
  ColorFormatSelect,
  ColorMode,
  ColorProvider,
  ColorArea,
  ColorSlider,
  ColorInput,
} from '@salyra-ui/color-picker/angular';
import {
  createThemePickerStore,
  themePickerViews,
  roles as allRoles,
  type ThemePickerStore,
  type ThemePickerView,
  type Role,
} from '../core';
import { useThemeStore } from './context';
import { ThemeWheel } from './ThemeWheel';
@Component({
  selector: 'tk-picker',
  standalone: true,
  imports: [
    ColorProvider,
    ColorArea,
    ColorWheel,
    ColorSlider,
    ColorFormatSelect,
    ColorInput,
    ColorMode,
    ThemeWheel,
  ],
  template: `@if (state(); as s) {
    <cp-provider [store]="picker.activeColor"
      ><div class="tk-picker tk-generator">
        <label
          class="cp-format"
          [hidden]="
            controls === false || (controls === undefined && roles.length === 1)
          "
          >Theme picker view<select #viewSelect (change)="changeView($event)">
            @for (view of views; track view) {
              <option
                [value]="view"
                [attr.selected]="s.view === view ? '' : null"
              >
                {{
                  view === 'area'
                    ? 'Rectangle'
                    : view === 'wheel'
                      ? 'Wheel'
                      : 'Shared wheel'
                }}
              </option>
            }
          </select></label
        >
        <fieldset
          class="tk-role-options"
          [hidden]="
            controls === false || (controls === undefined && roles.length === 1)
          "
        >
          <legend>Visible roles</legend>
          @for (role of allRoles; track role) {
            <label
              ><input
                type="checkbox"
                [checked]="s.roles.includes(role)"
                [disabled]="s.roles.length === 1 && s.roles.includes(role)"
                (change)="toggle(role, $event)"
              />{{ role }}</label
            >
          }
        </fieldset>
        <div
          class="tk-role-tabs"
          aria-label="Active color"
          [hidden]="s.roles.length === 1"
        >
          @for (role of s.roles; track role) {
            <button
              type="button"
              [attr.aria-pressed]="s.activeRole === role"
              (click)="picker.selectRole(role)"
            >
              <span [style.background]="s.colors[role].hex"></span>{{ role }}
            </button>
          }
        </div>
        @if (s.view === 'shared-wheel') {
          <tk-wheel [picker]="picker" />
        } @else if (s.view === 'wheel') {
          <cp-wheel />
        } @else {
          <cp-area />
        }
        <p class="tk-editing" aria-live="polite">Editing {{ s.activeRole }}</p>
        @if (custom) {
          <ng-content />
        } @else {
          <cp-slider
            [channel]="s.view === 'area' ? 'h' : 'v'"
          /><cp-format-select /><cp-input /><cp-mode />
        }</div
    ></cp-provider>
  }`,
})
export class ThemePicker implements OnInit {
  @Input() disabled?: boolean;
  @Input() controls?: boolean;
  @Input() roles: readonly Role[] = allRoles;
  @Input() activeRole?: Role;
  @Input() view: ThemePickerView = 'shared-wheel';
  @Input() store?: ThemePickerStore;
  @Input() custom = false;
  @ViewChild('viewSelect') viewSelect?: ElementRef<HTMLSelectElement>;
  picker!: ThemePickerStore;
  readonly state = signal<ReturnType<ThemePickerStore['getSnapshot']> | null>(
    null,
  );
  readonly allRoles = allRoles;
  readonly views = themePickerViews;
  private theme = useThemeStore();
  private destroy = inject(DestroyRef);
  constructor() {
    let cleanup: (() => void) | undefined;
    afterNextRender(() => {
      cleanup = this.picker.mount();
    });
    this.destroy.onDestroy(() => cleanup?.());
    afterRenderEffect(() => {
      const view = this.state()?.view;
      if (this.viewSelect && view) this.viewSelect.nativeElement.value = view;
    });
  }
  ngOnInit() {
    this.picker =
      this.store ??
      createThemePickerStore(this.theme, {
        disabled: this.disabled,
        roles: this.roles,
        activeRole: this.activeRole,
        view: this.view,
      });
    this.state.set(this.picker.getSnapshot());
    this.destroy.onDestroy(
      this.picker.subscribe(() => this.state.set(this.picker.getSnapshot())),
    );
  }
  changeView(event: Event) {
    this.picker.setView(
      (event.target as HTMLSelectElement).value as ThemePickerView,
    );
  }
  toggle(role: Role, event: Event) {
    const current = this.picker.getSnapshot().roles;
    this.picker.setRoles(
      (event.target as HTMLInputElement).checked
        ? [...current, role]
        : current.filter((r) => r !== role),
    );
  }
}
