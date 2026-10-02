'use client';
import {
  ColorArea,
  ColorFormatSelect,
  ColorInput,
  ColorMode,
  ColorSlider,
  ColorWheel,
} from '@salyra-ui/color-picker/react';
import { type ReactNode } from 'react';
import {
  roles as allRoles,
  themePickerViews,
  type ThemePickerOptions,
  type ThemePickerStore,
  type ThemePickerView,
} from '../core';
import {
  ThemePickerRoot,
  ThemePickerWheel,
  useThemePicker,
  useThemePickerStore,
} from './primitives';
export function ThemePicker({
  picker: provided,
  children,
  ...options
}: ThemePickerOptions & { picker?: ThemePickerStore; children?: ReactNode }) {
  return (
    <ThemePickerRoot picker={provided} {...options}>
      <ThemePickerPreset options={options}>{children}</ThemePickerPreset>
    </ThemePickerRoot>
  );
}
function ThemePickerPreset({
  options,
  children,
}: {
  options: ThemePickerOptions;
  children?: ReactNode;
}) {
  const picker = useThemePickerStore(),
    state = useThemePicker();
  return (
    <>
      <div className="tk-picker tk-generator">
        <label
          className="cp-format"
          hidden={
            options.controls === false ||
            (options.controls === undefined && options.roles?.length === 1)
          }
        >
          Theme picker view
          <select
            value={state.view}
            onChange={(e) => picker.setView(e.target.value as ThemePickerView)}
          >
            {themePickerViews.map((view) => (
              <option key={view} value={view}>
                {view === 'area'
                  ? 'Rectangle'
                  : view === 'wheel'
                    ? 'Wheel'
                    : 'Shared wheel'}
              </option>
            ))}
          </select>
        </label>
        <fieldset
          className="tk-role-options"
          hidden={
            options.controls === false ||
            (options.controls === undefined && options.roles?.length === 1)
          }
        >
          <legend>Visible roles</legend>
          {allRoles.map((role) => (
            <label key={role}>
              <input
                type="checkbox"
                checked={state.roles.includes(role)}
                disabled={
                  state.roles.length === 1 && state.roles.includes(role)
                }
                onChange={(e) =>
                  picker.setRoles(
                    e.target.checked
                      ? [...state.roles, role]
                      : state.roles.filter((r) => r !== role),
                  )
                }
              />
              {role}
            </label>
          ))}
        </fieldset>
        <div
          className="tk-role-tabs"
          aria-label="Active color"
          hidden={state.roles.length === 1}
        >
          {state.roles.map((role) => (
            <button
              key={role}
              type="button"
              aria-pressed={state.activeRole === role}
              onClick={() => picker.selectRole(role)}
            >
              <span style={{ background: state.colors[role].hex }} />
              {role}
            </button>
          ))}
        </div>
        {state.view === 'shared-wheel' ? (
          <ThemePickerWheel className="cp-wheel tk-shared-wheel" />
        ) : state.view === 'wheel' ? (
          <ColorWheel />
        ) : (
          <ColorArea />
        )}
        <p className="tk-editing" aria-live="polite">
          Editing {state.activeRole}
        </p>
        {children ?? (
          <>
            <ColorSlider channel={state.view === 'area' ? 'h' : 'v'} />
            <ColorFormatSelect />
            <ColorInput />
            <ColorMode />
          </>
        )}
      </div>
    </>
  );
}
