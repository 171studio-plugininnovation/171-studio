import React from 'react';
import { CheckCircle2, ExternalLink, X, ShieldCheck, Clock, User, FileAudio, FolderOpen, ArrowRight } from 'lucide-react';

export interface DownloadReceiptData {
  title: string;
  driveUrl: string;
  fileName: string;
  orderCode?: string;
  downloadedAt: string;
  downloadedBy: 'cliente' | 'master';
  userEmail?: string;
  message?: string;
}

interface DownloadConfirmationModalProps {
  receipt: DownloadReceiptData | null;
  onClose: () => void;
}

export const DownloadConfirmationModal: React.FC<DownloadConfirmationModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const formattedDate = new Date(receipt.downloadedAt).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(receipt.downloadedAt).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleOpenDriveLink = () => {
    if (receipt.driveUrl) {
      window.open(receipt.driveUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-emerald-500/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Chiudi notifica"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top Status Icon & Heading */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                  NOTIFICA DI CONFERMA DOWNLOAD FILE
                </span>
                <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  RICEVUTA CERTIFICATA 171 STUDIO
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                Download Confermato con Successo!
              </h2>
              <p className="text-xs font-mono text-neutral-300">
                I file da Google Drive sono stati aperti e scaricati. Entrambe le parti hanno ricevuto la ricevuta di avvenuta consegna.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3.5 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-neutral-400 uppercase text-[11px] flex items-center gap-1.5">
                <FileAudio className="w-3.5 h-3.5 text-amber-400" />
                File / Cartella Master:
              </span>
              <span className="text-white font-bold text-right break-all">
                {receipt.fileName || receipt.title}
              </span>
            </div>

            {receipt.orderCode && (
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                <span className="text-neutral-400 uppercase text-[11px] flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  Codice Ordine Sessione:
                </span>
                <span className="text-amber-400 font-bold">
                  #{receipt.orderCode}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-neutral-400 uppercase text-[11px] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Data & Ora di Accesso:
              </span>
              <span className="text-emerald-300 font-bold">
                {formattedDate} • {formattedTime}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-neutral-400 uppercase text-[11px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Azione Registrata Da:
              </span>
              <span className="text-white font-bold uppercase">
                {receipt.downloadedBy === 'master' ? '171 Master Studio (Verifica)' : `Cliente (${receipt.userEmail || 'Artista'})`}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                Link Google Drive Ufficiale:
              </span>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-blue-300 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{receipt.driveUrl}</span>
                <button
                  type="button"
                  onClick={handleOpenDriveLink}
                  className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Apri
                </button>
              </div>
            </div>
          </div>

          {/* Sync & Confirmation Banner */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-mono space-y-1">
              <p className="text-emerald-200 font-bold">
                Notifica Inviata al Master & Registrata nel Database
              </p>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Il Master Igor Rozanov e il cliente visualizzano in tempo reale lo stato <strong className="text-emerald-400">DOWNLOAD CONFERMATO</strong> con la data e l'ora esatta di scaricamento. I file rimangono sempre accessibili su Google Drive.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleOpenDriveLink}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Riapri Cartella Google Drive</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Chiudi & Conferma Ricezione</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
