import React from 'react';
import { Mail, MapPin, ArrowUpRight, Eye } from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { getAssetUrl } from '../utils/assetPath';

interface FooterProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { siteContent, visitorCount } = useStudio();

  return (
    <footer className="relative z-10 w-full border-t border-neutral-800/80 bg-neutral-950/90 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* Col 1: Studio Brand & Identity */}
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-900/80 border border-amber-500/40 p-1 flex items-center justify-center">
                <img
                  src={getAssetUrl('/assets/aistudio/171_logo_standalone.png')}
                  alt="171 Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-heading font-black text-lg tracking-wider text-white">
                  171 <span className="text-amber-400">STUDIO</span>
                </span>
                <p className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  Studio di Registrazione
                </p>
              </div>
            </div>
            
            <p className="text-xs text-neutral-400 font-light max-w-sm mt-1 leading-relaxed">
              Studio di registrazione professionale a Messina, acustica di precisione e progettazione di 171 Plugin Innovation.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400/90 mb-1">
              Esplora
            </span>
            <div className="flex flex-col gap-2 text-xs text-neutral-300">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none"
              >
                Frontpage
              </button>
              <button
                type="button"
                onClick={() => onNavigate('chi-siamo')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none"
              >
                Chi Siamo
              </button>
              <button
                type="button"
                onClick={() => onNavigate('prenota-sessione')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none"
              >
                Prenota Sessione
              </button>
              <button
                type="button"
                onClick={() => onNavigate('plugin-innovation')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
              >
                171 Plugin Innovation
              </button>
              <button
                type="button"
                onClick={() => onNavigate('strumenti-online')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none cursor-pointer"
              >
                Key & BPM Finder (Strumenti Online)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('il-mio-account')}
                className="text-left hover:text-amber-400 transition-colors focus:outline-none font-bold text-amber-400/90 cursor-pointer"
              >
                Il Mio Account (Area Clienti)
              </button>
            </div>
          </div>

          {/* Col 3: Direct Studio Contact */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400/90 mb-1">
              Contatti Studio
            </span>
            
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{siteContent.contactAddress}</span>
            </div>

            <a
              href={`mailto:${siteContent.contactEmail}`}
              className="flex items-center gap-2 text-xs text-neutral-300 hover:text-amber-400 transition-colors group"
            >
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono">{siteContent.contactEmail}</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sessioni e prenotazioni aperte</span>
            </div>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="mt-8 pt-6 border-t border-neutral-800/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-mono text-neutral-400">
          <p>© {new Date().getFullYear()} 171 Studio. Tutti i diritti riservati.</p>

          {/* Real-time Studio Visitor Counter */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Visite Totali:</span>
            <span className="text-xs font-bold font-mono text-white tracking-wide">
              {visitorCount.toLocaleString('it-IT')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span>STUDIO DI REGISTRAZIONE</span>
            <span>•</span>
            <span className="text-amber-400/80">171 PLUGIN INNOVATION</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
