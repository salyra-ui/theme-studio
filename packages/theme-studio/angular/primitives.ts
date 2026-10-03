import {
  Directive,
  Injectable,
  Input,
  ElementRef,
  DestroyRef,
  inject,
  afterNextRender,
  signal,
  type OnInit,
  type OnChanges,
} from '@angular/core';
import { ColorContext } from '@salyra-ui/color-picker/angular';
import { ThemeContext, useTheme, useThemeStore } from './context';
import {
  createThemeStore,
  mountThemeStore,
  themeScopeStyles,
  createThemePickerStore,
  bindBorderInput,
  type ThemeStore,
  type ThemeOptions,
  type ThemePickerStore,
  type ThemePickerOptions,
  type Role,
  type BorderKind,
  type Target,
} from '../core';
@Directive({
  selector: '[tkRoot]',
  standalone: true,
  providers: [ThemeContext],
  exportAs: 'tkRoot',
})
export class ThemeRoot implements OnInit {
  @Input() store?: ThemeStore;
  @Input() options: ThemeOptions = {};
  private context = inject(ThemeContext);
  private stop?: () => void;
  private initial: ThemeOptions = {};
  constructor() {
    afterNextRender(
      () =>
        (this.stop = mountThemeStore(
          this.context.store,
          this.initial.storage,
          this.initial,
        )),
    );
    inject(DestroyRef).onDestroy(() => this.stop?.());
  }
  ngOnInit() {
    this.initial = this.options;
    this.context.configure(this.store ?? createThemeStore(this.initial));
  }
}
@Directive({
  selector: '[tkScope]',
  standalone: true,
  host: {
    '[attr.data-tk-part]': '"scope"',
    '[attr.data-mode]': 'state().mode',
    '[attr.data-mode-preference]': 'state().modePreference',
    '[attr.data-theme]': 'state().theme.id',
    '[attr.data-theme-status]': 'state().status',
    '[attr.data-disabled]': 'state().disabled',
  },
})
export class ThemeVariableScope {
  readonly state = useTheme();
  private store = useThemeStore();
  private node = inject(ElementRef<HTMLElement>).nativeElement;
  constructor() {
    const render = () => {
      for (const [key, value] of Object.entries(
        themeScopeStyles(this.store.getSnapshot()),
      ))
        this.node.style.setProperty(key, value);
    };
    render();
    inject(DestroyRef).onDestroy(this.store.subscribe(render));
  }
}
@Injectable()
export class ThemePickerContext {
  private current = createThemePickerStore(createThemeStore());
  private listeners = new Set<() => void>();
  private forward = () => this.listeners.forEach((fn) => fn());
  private stop = this.current.subscribe(this.forward);
  readonly picker: ThemePickerStore = (() => {
    const context = this;
    return {
      getSnapshot: () => this.current.getSnapshot(),
      getServerSnapshot: () => this.current.getServerSnapshot(),
      subscribe: (fn) => {
        this.listeners.add(fn);
        return () => {
          this.listeners.delete(fn);
        };
      },
      mount: () => this.current.mount(),
      setDisabled: (disabled) => this.current.setDisabled(disabled),
      setRoles: (roles) => this.current.setRoles(roles),
      selectRole: (role) => this.current.selectRole(role),
      setView: (view) => this.current.setView(view),
      setHSV: (role, hsv) => this.current.setHSV(role, hsv),
      get activeColor() {
        return context.current.activeColor;
      },
    };
  })();
  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }
  configure(picker: ThemePickerStore) {
    this.stop();
    this.current = picker;
    this.stop = picker.subscribe(this.forward);
    this.forward();
  }
}
export function useThemePickerStore() {
  const picker = inject(ThemePickerContext).picker;
  if (!picker) throw new Error('Theme picker parts require tkPickerRoot');
  return picker;
}
export function useThemePicker() {
  const picker = useThemePickerStore(),
    state = signal(picker.getSnapshot());
  inject(DestroyRef).onDestroy(
    picker.subscribe(() => state.set(picker.getSnapshot())),
  );
  return state.asReadonly();
}
@Directive({
  selector: '[tkPickerRoot]',
  standalone: true,
  providers: [ThemePickerContext, ColorContext],
  exportAs: 'tkPickerRoot',
})
export class ThemePickerRoot implements OnInit {
  @Input() picker?: ThemePickerStore;
  @Input() options: ThemePickerOptions = {};
  private theme = useThemeStore();
  private context = inject(ThemePickerContext);
  private color = inject(ColorContext);
  private stop?: () => void;
  constructor() {
    afterNextRender(() => (this.stop = this.context.picker!.mount()));
    inject(DestroyRef).onDestroy(() => this.stop?.());
  }
  ngOnInit() {
    this.context.configure(
      this.picker ?? createThemePickerStore(this.theme, this.options),
    );
    this.color.configure(this.context.picker.activeColor);
  }
}
@Directive({
  selector: 'button[tkRoleTrigger]',
  standalone: true,
  host: {
    '[attr.type]': '"button"',
    '[attr.data-tk-part]': '"role-trigger"',
    '[attr.data-role]': 'tkRoleTrigger',
    '[attr.aria-pressed]': 'state().activeRole === tkRoleTrigger',
    '[disabled]':
      'disabled || theme().disabled || state().colors[state().activeRole].disabled || !state().roles.includes(tkRoleTrigger)',
    '(click)': 'select($event)',
  },
})
export class ThemeRoleTrigger {
  @Input() tkRoleTrigger: Role = 'primary';
  @Input() disabled = false;
  readonly state = useThemePicker();
  readonly theme = useTheme();
  private picker = useThemePickerStore();
  select(event: Event) {
    if (
      !event.defaultPrevented &&
      !this.disabled &&
      !this.theme().disabled &&
      !this.state().colors[this.state().activeRole].disabled
    )
      this.picker.selectRole(this.tkRoleTrigger);
  }
}
@Directive({
  selector: 'input[tkGeometry]',
  standalone: true,
  host: {
    '[attr.type]': '"number"',
    '[attr.min]': '0',
    '[attr.max]': '1000',
    '[attr.step]': 'tkGeometry === "radius" ? .125 : 1',
    '[attr.aria-label]': 'ariaLabel ?? target + " " + tkGeometry',
    '[attr.data-tk-part]': '"geometry-input"',
    '[attr.value]':
      'state().theme.structure.websitePreset.border[tkGeometry][target]',
    '[disabled]': 'disabled || state().disabled',
  },
})
export class ThemeGeometryInput implements OnChanges {
  @Input('aria-label') ariaLabel?: string;
  @Input() tkGeometry: BorderKind = 'radius';
  @Input() target: Target = 'DEFAULT';
  @Input() disabled = false;
  readonly state = useTheme();
  private store = useThemeStore();
  private input = inject(ElementRef<HTMLInputElement>).nativeElement;
  private stop?: () => void;
  private ready = false;
  constructor() {
    afterNextRender(() => {
      this.ready = true;
      this.bind();
    });
    inject(DestroyRef).onDestroy(() => this.stop?.());
  }
  ngOnChanges() {
    if (this.ready) this.bind();
    else
      this.input.value = String(
        this.state().theme.structure.websitePreset.border[this.tkGeometry][
          this.target
        ],
      );
  }
  private bind() {
    this.stop?.();
    const fields = this.store.registerFields({
        roles: [],
        [this.tkGeometry]: [this.target],
      }),
      stop = bindBorderInput(
        this.input,
        this.store,
        this.tkGeometry,
        this.target,
      );
    this.stop = () => {
      stop();
      fields.destroy();
    };
  }
}
export const themeStudioPrimitives = [
  ThemeRoot,
  ThemeVariableScope,
  ThemePickerRoot,
  ThemeRoleTrigger,
  ThemeGeometryInput,
] as const;
