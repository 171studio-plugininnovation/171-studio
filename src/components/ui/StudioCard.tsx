import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface StudioCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  telemetryCode?: string;
  showRivets?: boolean;
  isInteractive?: boolean;
  goldAccent?: boolean;
}

export const StudioCard = forwardRef<HTMLDivElement, StudioCardProps>(
  ({ className, title, telemetryCode, showRivets = true, isInteractive = false, goldAccent = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-3xl border bg-neutral-950/85 backdrop-blur-xl text-neutral-100 overflow-hidden transition-all duration-300',
          goldAccent ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]' : 'border-neutral-800/80',
          isInteractive && 'hover:border-amber-500/60 hover:shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.18)] hover:-translate-y-0.5 cursor-pointer group',
          className
        )}
        {...props}
      >
        {/* Viti Torx di fissaggio al rack nei 4 angoli */}
        {showRivets && (
          <>
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-85 transition-opacity flex items-center justify-center">
              <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
            </div>
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-85 transition-opacity flex items-center justify-center">
              <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
            </div>
            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-85 transition-opacity flex items-center justify-center">
              <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
            </div>
            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-85 transition-opacity flex items-center justify-center">
              <div className="w-1 h-0.5 bg-neutral-500 rounded-full" />
            </div>
          </>
        )}

        {/* Bordo riflettente superiore */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/35 to-transparent pointer-events-none" />

        {/* Intestazione Serigrafata Opzionale */}
        {(title || telemetryCode) && (
          <div className="flex items-center justify-between border-b border-neutral-800/60 px-6 py-3.5 text-xs">
            {title && (
              <span className="font-mono text-[11px] font-bold tracking-widest uppercase text-neutral-300">
                {title}
              </span>
            )}
            {telemetryCode && (
              <span className="font-mono text-[10px] tracking-widest text-amber-400/90 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {telemetryCode}
              </span>
            )}
          </div>
        )}

        <div className="p-6 sm:p-8">{children}</div>
      </div>
    );
  }
);

StudioCard.displayName = 'StudioCard';
