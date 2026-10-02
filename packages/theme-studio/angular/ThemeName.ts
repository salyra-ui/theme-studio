import { NgTemplateOutlet } from '@angular/common';
import {
  ContentChild,
  TemplateRef,
  computed,
  Component,
  Input,
} from '@angular/core';
import { suggestedThemeName } from '../core';
import { useThemeStore } from './context';
import { useTheme } from './context';
@Component({
  selector: 'tk-name',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `@if (content) {
      <ng-container
        [ngTemplateOutlet]="content"
        [ngTemplateOutletContext]="{
          name: state().theme.name,
          suggestedName: suggestion(),
          setName: store.setName,
        }"
      />
    } @else {
      <label class="tk-name"
        >{{ label
        }}<input
          maxlength="200"
          [value]="state().theme.name"
          [placeholder]="suggestion()"
          (blur)="!$any($event.target).value && store.setName()"
          (input)="store.setName($any($event.target).value)"
        /><small>Suggested: {{ suggestion() }}</small></label
      >
    }`,
})
export class ThemeName {
  @Input() label = 'Theme name';
  @ContentChild(TemplateRef) content?: TemplateRef<unknown>;
  readonly store = useThemeStore();
  readonly state = useTheme();
  readonly suggestion = computed(() => suggestedThemeName(this.state().theme));
}
