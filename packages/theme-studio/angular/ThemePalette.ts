import { Component, Input } from '@angular/core';
import {
  shades,
  type Role,
  type PaletteOptions,
  type PaletteClasses,
  type Shade,
} from '../core';
import { useTheme } from './context';
@Component({
  selector: 'tk-palette',
  standalone: true,
  template: `<div
    [class]="'tk-palette ' + (classes.root ?? '')"
    [attr.data-shape]="shape"
    [attr.aria-label]="role + ' shades'"
  >
    @for (shade of shades; track shade) {
      <div
        data-palette-part="item"
        [class]="(classes.item ?? '') + ' ' + (shadeClasses[shade] ?? '')"
      >
        <span data-palette-part="label" [class]="classes.label">{{
          labels[shade] ?? shade
        }}</span>
        <div
          data-palette-part="swatch"
          [class]="'tk-shade ' + (classes.swatch ?? '')"
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
  @Input() shape: PaletteOptions['shape'] = 'square';
  @Input() classes: PaletteClasses = {};
  @Input() labels: Partial<Record<Shade, string>> = {};
  @Input() shadeClasses: Partial<Record<Shade, string>> = {};
  readonly shades = shades;
  readonly state = useTheme();
}
