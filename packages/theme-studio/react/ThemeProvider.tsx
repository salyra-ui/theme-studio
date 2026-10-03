'use client';
import {
  forwardRef,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import type { ThemeOptions, ThemeStore } from '../core';
import { useTheme } from './context';
import { ThemeRoot, ThemeVariableScope } from './primitives';

export type ThemeProviderProps = ThemeOptions & {
  children: ReactNode;
  store?: ThemeStore;
  /** Native attributes belong to the scope, independently of store options. */
  scopeProps?: HTMLAttributes<HTMLDivElement>;
  className?: string;
  style?: HTMLAttributes<HTMLDivElement>['style'];
};

/** Ready composition of Root, Scope and a disabled controls boundary. Options initialize once. */
export const ThemeProvider = forwardRef<HTMLDivElement, ThemeProviderProps>(
  function ThemeProvider(
    { children, store, scopeProps, className = '', style, ...options },
    ref,
  ) {
    return (
      <ThemeRoot store={store} options={options}>
        <ThemeProviderContent
          scopeProps={scopeProps}
          className={className}
          style={style}
          scopeRef={ref}
        >
          {children}
        </ThemeProviderContent>
      </ThemeRoot>
    );
  },
);

function ThemeProviderContent({
  children,
  scopeProps,
  className,
  style,
  scopeRef,
}: {
  children: ReactNode;
  scopeProps?: HTMLAttributes<HTMLDivElement>;
  className: string;
  style?: HTMLAttributes<HTMLDivElement>['style'];
  scopeRef: ForwardedRef<HTMLDivElement>;
}) {
  const state = useTheme();
  return (
    <ThemeVariableScope
      {...scopeProps}
      ref={scopeRef}
      className={['tk-scope', scopeProps?.className, className]
        .filter(Boolean)
        .join(' ')}
      style={{ ...scopeProps?.style, ...style }}
    >
      <fieldset
        className="tk-provider-controls"
        disabled={state.disabled}
        {...(state.disabled ? { inert: '' } : {})}
        aria-disabled={state.disabled}
      >
        {children}
      </fieldset>
    </ThemeVariableScope>
  );
}
