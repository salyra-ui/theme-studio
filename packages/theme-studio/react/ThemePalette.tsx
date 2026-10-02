'use client';
import { shades, type PaletteOptions, type Role } from '../core';
import { useTheme } from './context';
export function ThemePalette({
  role = 'primary',
  className = '',
  shape = 'square',
  classes = {},
  labels = {},
  shadeClasses = {},
}: PaletteOptions & { role?: Role; className?: string }) {
  const state = useTheme();
  return (
    <div
      className={`tk-palette ${classes.root ?? ''} ${className}`}
      data-shape={shape}
      aria-label={`${role} shades`}
    >
      {shades.map((shade) => (
        <div
          key={shade}
          data-palette-part="item"
          className={`${classes.item ?? ''} ${shadeClasses[shade] ?? ''}`}
        >
          <span data-palette-part="label" className={classes.label}>
            {labels[shade] ?? shade}
          </span>
          <div
            data-palette-part="swatch"
            className={`tk-shade ${classes.swatch ?? ''}`}
            style={{
              background: `hsl(${state.theme.structure.userPreset[role][shade]})`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
