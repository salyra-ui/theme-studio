import {
  Component,
  Input,
  inject,
  signal,
  DestroyRef,
  afterNextRender,
  type OnInit,
} from '@angular/core';
import {
  createThemeStore,
  mountThemeStore,
  type ThemeOptions,
  type ThemeStore,
} from '../core';
import { ThemeContext } from './context';
@Component({
  selector: 'tk-provider',
  standalone: true,
  providers: [ThemeContext],
  template: `<div
    class="tk-scope"
    [attr.data-disabled]="state().disabled"
    [attr.data-theme]="state().theme.id"
    [attr.data-mode]="state().mode"
    [attr.data-mode-preference]="state().modePreference"
    [attr.data-theme-status]="state().status"
    [style]="state().style"
  >
    <fieldset
      class="tk-provider-controls"
      [disabled]="state().disabled"
      [attr.inert]="state().disabled ? '' : null"
      [attr.aria-disabled]="state().disabled"
    >
      <ng-content />
    </fieldset>
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
