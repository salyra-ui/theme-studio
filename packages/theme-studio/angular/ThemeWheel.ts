import {
  Component,
  Input,
  inject,
  signal,
  DestroyRef,
  type OnInit,
} from '@angular/core';
import { ColorWheel } from '@salyra-ui/color-picker/angular';
import { themePickerMarkers, type ThemePickerStore, type Role } from '../core';
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
  change(event: {
    id: string;
    hsv: Partial<import('@salyra-ui/color-picker').HSV>;
  }) {
    this.picker.setHSV(event.id as Role, event.hsv);
  }
}
