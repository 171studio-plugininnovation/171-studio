import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] cursor-pointer',
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 text-neutral-950 font-bold',
          'border border-amber-300/40 shadow-[0_2px_12px_rgba(217,119,6,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]',
          'hover:from-amber-300 hover:to-amber-500 hover:shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:brightness-105',
        ],
        rack: [
          'bg-neutral-900/90 text-neutral-200 border border-neutral-800',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.5)]',
          'hover:bg-neutral-850 hover:border-amber-500/40 hover:text-amber-300 hover:shadow-[0_0_16px_rgba(245,158,11,0.2)]',
        ],
        recording: [
          'bg-red-950/80 text-red-200 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
          'hover:bg-red-900 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:text-white',
        ],
        outlineGold: [
          'bg-transparent text-amber-300 border border-amber-500/40',
          'hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-[0_0_18px_rgba(245,158,11,0.25)]',
        ],
        ghost: [
          'bg-transparent text-neutral-400 border border-transparent hover:text-amber-400 hover:bg-neutral-900/60',
        ],
      },
      size: {
        sm: 'h-9 px-3.5 text-[11px] rounded-lg',
        md: 'h-11 px-5 text-xs rounded-xl',
        lg: 'h-12 px-7 text-sm rounded-2xl',
        icon: 'h-11 w-11 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'rack',
      size: 'md',
    },
  }
);

export interface StudioButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  ledIndicator?: 'active' | 'rec' | 'standby';
}

export const StudioButton = forwardRef<HTMLButtonElement, StudioButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, ledIndicator, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {ledIndicator && (
          <span
            className={cn(
              'h-2 w-2 rounded-full inline-block shrink-0 transition-all duration-300',
              ledIndicator === 'active' && 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse',
              ledIndicator === 'rec' && 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping',
              ledIndicator === 'standby' && 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
            )}
          />
        )}
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>ELABORAZIONE...</span>
          </span>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

StudioButton.displayName = 'StudioButton';
