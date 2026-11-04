import React from 'react';
import { X, Lock, Clock, Sparkles, Download, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { PluginItem } from '../types/cms';

interface HardwareLockedModalProps {
  plugin: PluginItem | null;
  isOpen: boolean;
  onClose: () => void;
  onExploreAvailable?: () => void;
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

export const HardwareLockedModal: React.FC<HardwareLockedModalProps> = ({
  plugin,
  isOpen,
  onClose,
  onExploreAvailable,
  countdown,
}) => {
  if (!isOpen || !plugin) return null;

  const formatUnlockDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-neutral-950 border-2 border-amber-500/60 shadow-[0_0_60px_rgba(245,158,11,0.3)] p-5 sm:p-8 text-neutral-100 flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-modal-title"
      >
        {/* Chassis Corner Rivets / Rack Mount Screws */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-neutral-700 border border-neutral-900 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-900 rotate-45" />
        </div>
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-neutral-700 border border-neutral-900 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-900 -rotate-45" />
        </div>
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-neutral-700 border border-neutral-900 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-900 -rotate-45" />
        </div>
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-neutral-700 border border-neutral-900 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-900 rotate-45" />
        </div>

        {/* Header with Close Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  PROGRAMMA DI SBLOCCO SETTIMANALE
                </span>
                {plugin.unlockWeek && (
                  <span className="text-[10px] font-mono text-neutral-400">
                    SETTIMANA {plugin.unlockWeek}
                  </span>
                )}
              </div>
              <h3 id="locked-modal-title" className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                {plugin.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Chiudi avviso sblocco"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vintage Amber CRT Countdown Display */}
        <div className="my-3 p-4 sm:p-5 rounded-2xl bg-[#120a03] border border-amber-600/60 shadow-[inset_0_0_25px_rgba(245,158,11,0.18)]">
          <div className="flex items-center justify-between text-[11px] font-mono text-amber-400/90 uppercase tracking-widest pb-3 border-b border-amber-500/20 mb-3">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              TEMPO RIMANENTE AL RILASCIO
            </span>
            <span className="text-amber-500/80 font-bold">171 STUDIO CALIBRATION</span>
          </div>

          {countdown ? (
            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-amber-500/30">
                <span className="block text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-amber-500/80 tracking-widest font-bold">
                  GIORNI
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-amber-500/30">
                <span className="block text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-amber-500/80 tracking-widest font-bold">
                  ORE
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-amber-500/30">
                <span className="block text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-amber-500/80 tracking-widest font-bold">
                  MINUTI
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-xl bg-black/70 border border-amber-500/30">
                <span className="block text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider animate-pulse">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase text-amber-500/80 tracking-widest font-bold">
                  SECONDI
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center font-mono text-amber-400 text-sm">
              Sblocco in arrivo a breve!
            </div>
          )}

          {plugin.unlockDate && (
            <p className="text-center text-xs font-mono text-amber-200/90 mt-3 pt-2 border-t border-amber-500/15">
              Data ufficiale sblocco: <strong className="text-amber-300 capitalize">{formatUnlockDate(plugin.unlockDate)}</strong>
            </p>
          )}
        </div>

        {/* Description & Transparency Note */}
        <div className="space-y-2.5 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mb-6">
          <p>
            Questo plugin fa parte del nostro programma di <strong>sblocco progressivo settimanale</strong> per celebrare il <strong>Major Update V2.0.0</strong>.
          </p>
          <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs font-mono text-neutral-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Allo scadere del countdown, il download singolo gratuito per <strong>Windows 64-bit VST3</strong> e <strong>macOS AU/VST3</strong> sarà immediatamente sbloccato senza restrizioni.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {onExploreAvailable && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onExploreAvailable();
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Vedi Plugin Già Disponibili</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider border border-neutral-800 transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
