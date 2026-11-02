import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface StudioInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  telemetryBadge?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const StudioInput = forwardRef<HTMLInputElement, StudioInputProps>(
  ({ className, label, helperText, error, telemetryBadge, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-1.5 text-left">
        {(label || telemetryBadge) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={inputId} className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                {label}
              </label>
            )}
            {telemetryBadge && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                {telemetryBadge}
              </span>
            )}
          </div>
        )}

        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-400 transition-colors pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'h-11 w-full rounded-xl bg-neutral-950/90 text-neutral-100 placeholder:text-neutral-600',
              'border border-neutral-800 font-sans text-sm tracking-wide px-3.5 shadow-inner',
              'transition-all duration-200 outline-none',
              leftIcon ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              'focus:border-amber-400/90 focus:ring-1 focus:ring-amber-400/80 focus:shadow-[0_0_18px_rgba(245,158,11,0.2)] focus:bg-neutral-900/95',
              error && 'border-red-500/80 focus:border-red-400 focus:ring-red-400/80 focus:shadow-[0_0_16px_rgba(239,68,68,0.25)]',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-400 transition-colors pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="font-mono text-[11px] text-red-400 flex items-center gap-1.5 mt-1">
            <span className="inline-block h-1 w-1 rounded-full bg-red-500 animate-ping" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="font-mono text-[10px] text-neutral-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

StudioInput.displayName = 'StudioInput';
