import React from 'react';
import { 
  Download, Eye, Heart, Sparkles, Cpu, Check, 
  ExternalLink, Shield, Layers, Radio, Star, Lock
} from 'lucide-react';
import { PluginItem } from '../types/cms';
import { useStudio } from '../context/StudioContext';
import { getAssetUrl } from '../utils/assetPath';
import { PLUGIN_TOPOLOGY_MAP, DEFAULT_TOPOLOGY_META } from '../data/pluginMetadata';

export interface RackPluginCardProps {
  plugin: PluginItem;
  countdown?: {
    isUnlocked: boolean;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  isLocked?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelectPlugin: (id: string) => void;
  onOpenPreviewModal: (imgUrl: string) => void;
  onQuickDownload?: (plugin: PluginItem, os: 'win' | 'mac') => void;
  reviewCount?: number;
  averageRating?: number | null;
}

export const RackPluginCard: React.FC<RackPluginCardProps> = ({
  plugin,
  isFavorite,
  onToggleFavorite,
  onSelectPlugin,
  onOpenPreviewModal,
  onQuickDownload,
  reviewCount = 0,
  averageRating = null,
}) => {
  const { currentUser, openAuthModal, downloadPlugin } = useStudio();
  const specs = PLUGIN_TOPOLOGY_MAP[plugin.id] || DEFAULT_TOPOLOGY_META;

  const handleDownloadClick = (os: 'win' | 'mac') => {
    if (onQuickDownload) {
      onQuickDownload(plugin, os);
      return;
    }
    if (!currentUser) {
      openAuthModal(`Registrazione obbligatoria: crea un account gratuito per scaricare "${plugin.name}" (${os === 'mac' ? 'macOS Universal' : 'Windows 64-bit'}).`, {
        initialMode: 'register',
        pendingDownload: { pluginId: plugin.id, platform: os },
      });
      return;
    }
    downloadPlugin(plugin.id, os);
  };

  return (
    <div 
      id={plugin.id}
      className="group relative rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-neutral-800 hover:border-amber-500/60 transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.85)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.18)] flex flex-col justify-between overflow-hidden scroll-mt-24"
    >
      {/* 4 Machined Hex Rack Bolts (UAD / Hardware Style) */}
      <div className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity flex items-center justify-center">
        <div className="w-1 h-0.5 bg-neutral-500" />
      </div>
      <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity flex items-center justify-center">
        <div className="w-1 h-0.5 bg-neutral-500" />
      </div>
      <div className="absolute bottom-2.5 left-2.5 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity flex items-center justify-center">
        <div className="w-1 h-0.5 bg-neutral-500" />
      </div>
      <div className="absolute bottom-2.5 right-2.5 w-2 h-2 rounded-full border border-neutral-700 bg-neutral-900 pointer-events-none opacity-40 group-hover:opacity-90 transition-opacity flex items-center justify-center">
        <div className="w-1 h-0.5 bg-neutral-500" />
      </div>

      {/* Top Edge Specular Metallic Glare */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/30 to-transparent pointer-events-none" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Top Header: Rack Telemetry, Modeled Topology, Favorite Toggle */}
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(plugin.id)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-md shadow-red-500/20'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-red-400'
              }`}
              title={isFavorite ? "Rimuovi dai tuoi preferiti" : "Salva nei tuoi preferiti"}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''}`} />
            </button>
            <div className="leading-none">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest block">
                171PluginInnovation
              </span>
              <span className="text-[9.5px] font-mono text-neutral-400 uppercase tracking-tight block truncate max-w-[150px] sm:max-w-[200px]">
                {specs.topology}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
              {plugin.version?.split(' ')[0] || 'v2.2.0'}
            </span>
          </div>
        </div>

        {/* Photorealistic Recessed Hardware Showcase Bay (Waves & UAD style) */}
        <div 
          onClick={() => onSelectPlugin(plugin.id)}
          className="h-44 sm:h-48 w-full flex items-center justify-center p-4 bg-gradient-to-b from-black via-neutral-950 to-neutral-900 rounded-2xl border border-neutral-800/90 group-hover:border-amber-500/40 transition-all cursor-pointer relative shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)] overflow-hidden"
          title={`Apri scheda dettagliata di ${plugin.name}`}
        >
          {/* Subtle background studio grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:12px_12px] opacity-25 pointer-events-none" />

          {plugin.imageUrl ? (
            <img 
              src={getAssetUrl(plugin.imageUrl)} 
              alt={`${plugin.name} GUI Hardware`} 
              className="max-h-36 sm:max-h-40 max-w-full object-contain filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.95)] group-hover:scale-105 transition-transform duration-300 relative z-10"
              loading="lazy"
            />
          ) : (
            <Cpu className="w-16 h-16 text-amber-400/40" />
          )}

          {/* Quick HD Zoom Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (plugin.imageUrl) onOpenPreviewModal(plugin.imageUrl);
            }}
            className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/85 hover:bg-black text-amber-400 border border-amber-500/30 text-[9.5px] font-mono backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1 z-20"
            title="Ingrandisci a schermo intero"
          >
            <Eye className="w-3 h-3" />
            <span>HD ZOOM</span>
          </button>
        </div>

        {/* Plugin Title & Analog Circuit Tag */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4 
              onClick={() => onSelectPlugin(plugin.id)}
              className="font-heading font-black text-xl sm:text-2xl text-white group-hover:text-amber-400 transition-colors cursor-pointer truncate"
              title={plugin.name}
            >
              {plugin.name}
            </h4>
            <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
              DISPONIBILE
            </span>
          </div>

          <p className="text-xs text-neutral-300 font-light leading-relaxed line-clamp-2 mt-1.5 min-h-[2.5rem]">
            {plugin.description}
          </p>
        </div>

        {/* Technical Audio Specs Badges (UAD & Plugin Alliance Style) */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 text-center font-mono">
          <div className="p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[9.5px] text-neutral-400 uppercase block">LATENZA</span>
            <span className="text-[11px] font-bold text-emerald-400">{specs.latencyLabel}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[9.5px] text-neutral-400 uppercase block">OVERSAMPLE</span>
            <span className="text-[11px] font-bold text-amber-300">{specs.oversampling}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-neutral-950/80 border border-neutral-800">
            <span className="text-[9.5px] text-neutral-400 uppercase block">FORMATI</span>
            <span className="text-[11px] font-bold text-neutral-200">VST3 / AU</span>
          </div>
        </div>

        {/* Real Rating & Reviews */}
        <div className="flex items-center justify-between gap-2 pt-1 min-h-[1.75rem] flex-wrap">
          {(!reviewCount || reviewCount === 0) ? (
            <div className="flex items-center gap-1.5 text-neutral-500">
              <div className="flex items-center gap-0.5 text-neutral-700">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3 h-3 text-neutral-700" />
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 font-medium">
                Nessuna recensione
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-white">
                {averageRating?.toFixed(1) || '5.0'}
              </span>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const ratingVal = averageRating || 5;
                  const isFilled = ratingVal >= starIdx;
                  const isHalf = !isFilled && ratingVal >= starIdx - 0.5;
                  return (
                    <Star
                      key={starIdx}
                      className={`w-3 h-3 ${
                        isFilled
                          ? 'fill-amber-400 text-amber-400'
                          : isHalf
                          ? 'fill-amber-400/50 text-amber-400'
                          : 'text-neutral-700'
                      }`}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                ({reviewCount} {reviewCount === 1 ? 'recensione' : 'recensioni'})
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>64-bit Audio DSP</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Section: 1-Click Downloads + Secondary Specs */}
      <div className="p-5 sm:p-6 pt-0 space-y-2.5">
        <div className="space-y-2">
          {/* Direct 1-Click Downloads (Win64 & macOS) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDownloadClick('win')}
              className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95"
              title={currentUser ? `Scarica .ZIP Windows 64-bit (${plugin.zipFileSize || '19 MB'})` : 'Registrazione gratuita obbligatoria per scaricare'}
            >
              {currentUser ? <Download className="w-3.5 h-3.5 text-black shrink-0" /> : <Lock className="w-3.5 h-3.5 text-black shrink-0" />}
              <span className="truncate">{currentUser ? 'Win64 (.ZIP)' : '🔒 Registrati (Win)'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadClick('mac')}
              className="py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-cyan-500/50 text-neutral-200 hover:text-white font-mono text-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              title={currentUser ? `Scarica .ZIP macOS Universal (${plugin.macZipFileSize || '10 MB'})` : 'Registrazione gratuita obbligatoria per scaricare'}
            >
              {currentUser ? <Download className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> : <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              <span className="truncate">{currentUser ? 'macOS (.ZIP)' : '🔒 Registrati (Mac)'}</span>
            </button>
          </div>

          {/* Secondary Action: Scheda Tecnica & Audio Demo */}
          <button
            type="button"
            onClick={() => onSelectPlugin(plugin.id)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>SCHEDA TECNICA & CONTROLLI DSP</span>
            <ExternalLink className="w-3 h-3 text-amber-400/80" />
          </button>
        </div>

        {/* Platform support info */}
        <p className="text-[10px] font-mono text-center text-neutral-400 truncate">
          🪟 Windows 64-bit • 🍏 macOS Universal (M1-M4 & Intel)
        </p>
      </div>
    </div>
  );
};
