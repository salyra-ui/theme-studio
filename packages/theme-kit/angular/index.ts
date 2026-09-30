export * from '../core';
import { NgTemplateOutlet } from '@angular/common';
import {
  ContentChild,
  TemplateRef,
  computed,
  Component,
  Output,
  EventEmitter,
  afterRenderEffect,
  ElementRef,
  ViewChild,
  Injectable,
  Input,
  inject,
  signal,
  DestroyRef,
  afterNextRender,
  type OnInit,
} from '@angular/core';
import {
  ColorSurface,
  ColorViewSelect,
  ColorWheel,
  ColorFormatSelect,
  ColorMode,
  ColorProvider,
  ColorArea,
  ColorSlider,
  ColorInput,
} from '@sebytza23/color-picker-angular';
import { channelsToHex } from '@sebytza23/color-picker';
import {
  themeModeActions,
  suggestedThemeName,
  type ModePreference,
  themeList,
  selectedThemeId,
  themeConfiguration,
  type ThemeConfiguration,
  type ThemeExportFormat,
  type TokenSelection,
  themePickerMarkers,
  createThemePickerStore,
  bindThemeWheel,
  sharedWheelStyle,
  themeMarkerStyle,
  themePickerViews,
  roles as allRoles,
  type ThemePickerStore,
  type ThemePickerView,
  harmonies,
  type Harmony,
  type Target,
  type BorderKind,
  createThemeStore,
  mountThemeStore,
  shades,
  type ThemeOptions,
  type ThemeStore,
  type Theme,
  type Role,
} from '../core';
@Injectable()
export class ThemeContext {
  private current = createThemeStore();
  private listeners = new Set<() => void>();
  private forward = () => this.listeners.forEach((fn) => fn());
  private unsubscribe = this.current.subscribe(this.forward);
  readonly store: ThemeStore = {
    getSnapshot: () => this.current.getSnapshot(),
    getServerSnapshot: () => this.current.getServerSnapshot(),
    subscribe: (fn) => {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    },
    start: () => this.current.start(),
    reload: () => this.current.reload(),
    stop: () => this.current.stop(),
    setTheme: (theme) => this.current.setTheme(theme),
    setBackground: (mode) => this.current.setBackground(mode),
    setMode: (mode) => this.current.setMode(mode),
    setSystemMode: (mode) => this.current.setSystemMode(mode),
    setName: (name) => this.current.setName(name),
    generate: (seed, options) => this.current.generate(seed, options),
    setColor: (role, hex) => this.current.setColor(role, hex),
    setBorder: (kind, target, value) =>
      this.current.setBorder(kind, target, value),
    setHarmony: (value) => this.current.setHarmony(value),
    generateHarmony: () => this.current.generateHarmony(),
  };
  constructor() {
    inject(DestroyRef).onDestroy(() => this.unsubscribe());
  }
  configure(store: ThemeStore) {
    this.unsubscribe();
    this.current = store;
    this.unsubscribe = store.subscribe(this.forward);
    this.forward();
  }
}
export function useThemeStore() {
  return inject(ThemeContext).store;
}
export function useTheme() {
  const store = useThemeStore(),
    state = signal(store.getSnapshot());
  inject(DestroyRef).onDestroy(
    store.subscribe(() => state.set(store.getSnapshot())),
  );
  return state.asReadonly();
}
@Component({
  selector: 'tk-provider',
  standalone: true,
  providers: [ThemeContext],
  template: `<div
    class="tk-scope"
    [attr.data-theme]="state().theme.id"
    [attr.data-mode]="state().mode"
    [attr.data-mode-preference]="state().modePreference"
    [attr.data-theme-status]="state().status"
    [style]="state().style"
  >
    <ng-content />
  </div>`,
})
export class ThemeProvider implements OnInit {
  @Input() options: ThemeOptions = {};
  @Input() store?: ThemeStore;
  private context = inject(ThemeContext);
  private destroyRef = inject(DestroyRef);
  readonly state = signal(this.context.store.getSnapshot());
  constructor() {
    let cleanup: (() => void) | undefined;
    afterNextRender(() => {
      cleanup = mountThemeStore(
        this.context.store,
        this.options.storage,
        this.options,
      );
    });
    this.destroyRef.onDestroy(() => cleanup?.());
  }
  ngOnInit() {
    this.context.configure(this.store ?? createThemeStore(this.options));
    this.state.set(this.context.store.getSnapshot());
    this.destroyRef.onDestroy(
      this.context.store.subscribe(() =>
        this.state.set(this.context.store.getSnapshot()),
      ),
    );
  }
}
@Component({
  selector: 'tk-loading',
  standalone: true,
  template: `@if (state().status === 'loading') {
    <ng-content />
  }`,
})
export class ThemeLoading {
  readonly state = useTheme();
}
@Component({
  selector: 'tk-ready',
  standalone: true,
  template: `@if (state().status !== 'loading') {
    <ng-content />
  }`,
})
export class ThemeReady {
  readonly state = useTheme();
}
@Component({
  selector: 'tk-error',
  standalone: true,
  template: `@if (state().error) {
    <ng-content />
  }`,
})
export class ThemeError {
  readonly state = useTheme();
}
@Component({
  selector: 'tk-swatch',
  standalone: true,
  template: `<button
    type="button"
    [attr.aria-pressed]="state().theme.id === theme.id"
    (click)="store.setTheme(theme)"
  >
    {{ theme.name }}
  </button>`,
})
export class ThemeSwatch {
  @Input({ required: true }) theme!: Theme;
  readonly state = useTheme();
  readonly store = useThemeStore();
}
export function useThemeMode() {
  const store = useThemeStore(), state = useTheme();
  return { preference: computed(() => state().modePreference), resolvedMode: computed(() => state().mode), ...themeModeActions(store) };
}
@Component({
  selector: 'tk-mode', standalone: true, imports: [NgTemplateOutlet],
  template: `<button type="button" [attr.aria-pressed]="value ? mode.preference() === value : null" (click)="value ? mode.setMode(value) : mode.cycle()">
    @if (content) { <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ $implicit: mode }" /> }
    @else { {{ labels[value ?? mode.preference()] }} }
  </button>`,
})
export class ThemeMode {
  @Input() value?: ModePreference;
  @Input() labels: Record<ModePreference, string> = { system: 'System', light: 'Light mode', dark: 'Dark mode' };
  @ContentChild(TemplateRef) content?: TemplateRef<unknown>;
  readonly mode = useThemeMode();
}
@Component({
  selector: 'tk-name', standalone: true, imports: [NgTemplateOutlet],
  template: `@if (content) { <ng-container [ngTemplateOutlet]="content" [ngTemplateOutletContext]="{ name: state().theme.name, suggestedName: suggestion(), setName: store.setName }" /> }
  @else { <label class="tk-name">{{ label }}<input maxlength="200" [value]="state().theme.name" [placeholder]="suggestion()" (blur)="!$any($event.target).value && store.setName()" (input)="store.setName($any($event.target).value)" /><small>Suggested: {{ suggestion() }}</small></label> }`,
})
export class ThemeName {
  @Input() label = 'Theme name';
  @ContentChild(TemplateRef) content?: TemplateRef<unknown>;
  readonly store = useThemeStore();
  readonly state = useTheme();
  readonly suggestion = computed(() => suggestedThemeName(this.state().theme));
}
@Component({
  selector: 'tk-palette',
  standalone: true,
  template: `<div class="tk-palette">
    @for (shade of shades; track shade) {
      <div>
        <span>{{ shade }}</span>
        <div
          class="tk-shade"
          [style.background]="
            'hsl(' + state().theme.structure.userPreset[role][shade] + ')'
          "
        ></div>
      </div>
    }
  </div>`,
})
export class ThemePalette {
  @Input() role: Role = 'primary';
  readonly shades = shades;
  readonly state = useTheme();
}
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
  @Input() label = 'Tint background with primary';
  readonly state = useTheme();
  readonly store = useThemeStore();
  change(event: Event) {
    this.store.setBackground(
      (event.target as HTMLInputElement).checked ? 'tinted' : 'neutral',
    );
  }
}

export { ThemeGenerator as ThemeColor };
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
@Component({
  selector: 'tk-border',
  standalone: true,
  template: `<label class="tk-border"
    >{{ label || target + ' border ' + kind
    }}<input
      type="number"
      min="0"
      max="1000"
      [step]="kind === 'width' ? 1 : 0.125"
      [value]="state().theme.structure.websitePreset.border[kind][target]"
      (input)="change($event)"
    />{{ kind === 'width' ? 'px' : 'rem' }}</label
  >`,
})
export class ThemeBorder {
  @Input() kind: BorderKind = 'width';
  @Input() target: Target = 'DEFAULT';
  @Input() label = '';
  readonly state = useTheme();
  readonly store = useThemeStore();
  change(event: Event) {
    const n = (event.target as HTMLInputElement).valueAsNumber;
    if (Number.isFinite(n) && n >= 0 && n <= 1000)
      this.store.setBorder(this.kind, this.target, n);
  }
}
@Component({
  selector: 'tk-radius',
  standalone: true,
  imports: [ThemeBorder],
  template: `<tk-border kind="radius" [target]="target" [label]="label" />`,
})
export class ThemeRadius {
  @Input() target: Target = 'DEFAULT';
  @Input() label = '';
}
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

@Component({
  selector: 'tk-wheel',
  standalone: true,
  imports: [ColorWheel],
  template: `@if (state(); as s) {
    <cp-wheel
      className="tk-shared-wheel"
      label="Shared theme color wheel"
      [markers]="themePickerMarkers(s)"
      [activeId]="s.activeRole"
      (markerSelect)="select($event)"
      (markerChange)="change($event)"
    />
  }`,
})
export class ThemeWheel implements OnInit {
  @Input({ required: true }) picker!: ThemePickerStore;
  readonly state = signal<ReturnType<ThemePickerStore['getSnapshot']> | null>(
    null,
  );
  readonly themePickerMarkers = themePickerMarkers;
  private destroy = inject(DestroyRef);
  ngOnInit() {
    this.state.set(this.picker.getSnapshot());
    this.destroy.onDestroy(
      this.picker.subscribe(() => this.state.set(this.picker.getSnapshot())),
    );
  }
  select(id: string) {
    this.picker.selectRole(id as Role);
  }
  change(event: { id: string; hsv: Partial<import('@sebytza23/color-picker').HSV> }) {
    this.picker.setHSV(event.id as Role, event.hsv);
  }
}
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
        <label class="cp-format"
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
        <fieldset class="tk-role-options">
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
        <div class="tk-role-tabs" aria-label="Active color">
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
