'use client';
import { useEffect, useRef } from 'react';
import { type BorderKind, type Target } from '../core';
import {
  bindBorderInput,
  borderControlLabel,
  borderControlUnit,
} from '../core/border-control';
import { useThemeStore } from './context';
export function ThemeBorder({
  kind = 'width',
  target = 'DEFAULT',
  label,
}: {
  kind?: BorderKind;
  target?: Target;
  label?: string;
}) {
  const store = useThemeStore();
  const input = useRef<HTMLInputElement>(null);
  const initial =
    store.getSnapshot().theme.structure.websitePreset.border[kind][target];
  useEffect(() => {
    const fields = store.registerFields({ roles: [], [kind]: [target] });
    const unbind = bindBorderInput(input.current!, store, kind, target);
    return () => {
      unbind();
      fields.destroy();
    };
  }, [store, kind, target]);
  return (
    <label className="tk-border">
      <span>{label ?? borderControlLabel(kind, target)}</span>
      <span className="tk-border-field">
        <input
          ref={input}
          type="number"
          min={0}
          max={1000}
          step={kind === 'width' ? 1 : 0.125}
          defaultValue={initial}
        />
        <span aria-hidden="true">{borderControlUnit(kind)}</span>
      </span>
    </label>
  );
}
