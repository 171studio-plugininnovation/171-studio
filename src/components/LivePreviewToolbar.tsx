import React, { useState } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  Sliders, 
  Copy, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Activity, 
  Sparkles,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface LivePreviewToolbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  previewDevice: PreviewDevice;
  setPreviewDevice: (device: PreviewDevice) => void;
  isMasterDashboardOpen: boolean;
  onToggleMasterDashboard: () => void;
}

export const LivePreviewToolbar: React.FC<LivePreviewToolbarProps> = ({
  currentPage,
  onNavigate,
  previewDevice,
  setPreviewDevice,
  isMasterDashboardOpen,
  onToggleMasterDashboard,
}) => {
  const { isMaster, currentUser, activities } = useStudio();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  const localUrl = typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : 'http://localhost:3000/';
  const networkUrl = 'http://192.168.1.51:3000/';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(localUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const pages: { id: PageId; label: string; short: string }[] = [
    { id: 'home', label: 'Home (Frontpage)', short: 'Home' },
    { id: 'the-god-cypher', label: 'The God Cypher (Album)', short: 'Album' },
    { id: 'prenota-sessione', label: 'Prenota Sessione', short: 'Prenota' },
    { id: 'chi-siamo', label: 'Chi Siamo', short: 'About' },
    { id: 'plugin-innovation', label: 'Plugin Innovation', short: 'Plugins' },
    { id: 'strumenti-online', label: 'Key & BPM Finder', short: 'Key & BPM' },
    { id: 'il-mio-account', label: 'Il Mio Account (My Files)', short: 'Account' },
  ];

  return (
    <aside 
      aria-label="Barra di controllo live preview per Master"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl transition-all duration-300"
    >
      {/* Activity Drawer Popover */}
      {showActivityDrawer && (
        <div className="mb-2 p-4 rounded-3xl bg-neutral-950/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl text-xs font-mono animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider">
                Attività in Tempo Reale (Ultimi Eventi)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowActivityDrawer(false)}
              className="text-neutral-400 hover:text-white"
            >
              Chiudi
            </button>
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {activities.slice(0, 8).map((act) => (
              <div 
                key={act.id} 
                className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/80 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                    {act.action}
                  </span>
                  <span className="text-neutral-300 truncate">{act.details}</span>
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0">
                  {new Date(act.timestamp || Date.now()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Glassmorphic Dock */}
      <div className="p-2.5 rounded-2xl bg-neutral-950/90 border border-amber-500/30 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-2">
        {/* Left: Status & Live indicator */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="absolute w-4 h-4 rounded-full bg-emerald-500/30 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-heading font-black tracking-wider text-white uppercase">
                Live Preview
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                Port 3000
              </span>
            </div>
            <p className="text-[9px] font-mono text-neutral-400 hidden sm:block">
              Vite HMR & Live Sync attivi
            </p>
          </div>
        </div>

        {/* Center: Device Viewport Mode */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            title="Vista Desktop (100% Schermo intero)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              previewDevice === 'desktop'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewDevice('tablet')}
            title="Vista Tablet (iPad 768px)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              previewDevice === 'tablet'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Tablet</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            title="Vista Mobile (iPhone 390px)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              previewDevice === 'mobile'
                ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Mobile</span>
          </button>
        </div>

        {/* Quick Page Navigator Buttons (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center gap-1">
          {pages.map((p) => {
            const isCurrent = currentPage === p.id && !isMasterDashboardOpen;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (isMasterDashboardOpen) onToggleMasterDashboard();
                  onNavigate(p.id);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-neutral-800 text-amber-400 font-bold border border-amber-500/40'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {p.short}
              </button>
            );
          })}
        </div>

        {/* Right: Actions (Dashboard Toggle, Open in New Window, Activity Log) */}
        <div className="flex items-center gap-1.5">
          {/* Master Dashboard Toggle Button */}
          {isMaster && (
            <button
              type="button"
              onClick={onToggleMasterDashboard}
              className={`px-3 py-1.5 rounded-xl font-heading font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isMasterDashboardOpen
                  ? 'bg-amber-500 text-black shadow-amber-500/20'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30'
              }`}
              title={isMasterDashboardOpen ? 'Torna al Sito Live' : 'Apri Dashboard Master'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isMasterDashboardOpen ? 'Torna al Sito' : 'Dashboard Master'}</span>
            </button>
          )}

          {/* Activity Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowActivityDrawer(!showActivityDrawer)}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-800 transition-colors cursor-pointer"
            title="Registro Modifiche & Eventi in Tempo Reale"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Copy URL / Open URL in new window */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
            title={`Copia indirizzo (${localUrl})`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-400 border border-neutral-800 transition-colors"
            title="Apri il sito live a schermo intero in una nuova scheda"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Expand Collapse for small screens */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white lg:hidden"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Mobile/Tablet Page Switcher */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-2xl bg-neutral-950/95 border border-neutral-800 backdrop-blur-xl shadow-xl flex flex-wrap gap-1.5 lg:hidden animate-in fade-in">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (isMasterDashboardOpen) onToggleMasterDashboard();
                onNavigate(p.id);
                setIsExpanded(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentPage === p.id && !isMasterDashboardOpen
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
