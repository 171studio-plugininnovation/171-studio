import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Sliders, Users, Calendar, Sparkles, Music2, Cpu, Mic, 
  ShieldCheck, ChevronRight, ChevronLeft, Play, Youtube, Disc, Radio, ExternalLink, Settings2,
  Download, Clock, Lock, CheckCircle2, Award, Zap, Layers, Activity
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { PluginItem } from '../types/cms';
import { StudioLogoLockup } from './StudioLogoLockup';
import { getAssetUrl } from '../utils/assetPath';
import { HardwareTiltCard } from './HardwareTiltCard';
import { HardwareLockedModal } from './HardwareLockedModal';
import { triggerPluginZipFileDownload } from '../utils/emailService';

interface HeroHomeProps {
  onNavigate: (page: PageId, pluginId?: string | null) => void;
}

// Map analog topologies for authentic pro-audio rack telemetry (UAD / Waves style)
const TOPOLOGY_MAP: Record<string, { topology: string; tube: string; oversampling: string }> = {
  'plugin-realtune': {
    topology: 'PITCH ENGINE & PHASE COHERENT VOCAL SYNTH',
    tube: 'Zero Phase Disruption Core',
    oversampling: '8x Internal Processing',
  },
  'plugin-easyvoice': {
    topology: 'SERIAL TUBE + OPTICAL DUAL STAGE STRIP',
    tube: '12AX7 & 6BA6 Analog Valves',
    oversampling: '4x ADAA-2 Oversampling',
  },
  'plugin-cleandrive': {
    topology: 'TRANSIENT-SPLIT ASYMMETRIC SATURATOR',
    tube: 'Triode + Pentode Bias',
    oversampling: '4x ADAA-2 Alias Free',
  },
  'plugin-cleanreso': {
    topology: 'ADAPTIVE MULTI-BAND SPECTRAL NOTCH',
    tube: 'Zero Delay Biquad Matrix',
    oversampling: 'Ultra-Narrow Q Tracking',
  },
  'plugin-perfectpre': {
    topology: 'CLASS-A BRITISH CONSOLE & VINTAGE PREAMP',
    tube: 'Carnhill Transformer Saturation',
    oversampling: 'Analog Transformer Harmonic 3rd',
  },
  'plugin-spaceluxe': {
    topology: 'CONVOLUTION IMPULSE + RECIRCULATING PLATE',
    tube: 'Diffusion Modulation Core',
    oversampling: 'True Stereo Width Engine',
  },
  'plugin-masterglue': {
    topology: 'VCA BUS COMPRESSOR & ANALOG CONSOLE DRIVE',
    tube: 'Quad-VCA Stereo Matrix',
    oversampling: 'True Peak Sidechain Guard',
  },
  'plugin-punchcraft': {
    topology: 'FREQUENCY-DEPENDENT TRANSIENT SCULPTOR',
    tube: 'Dynamic Envelope Follower',
    oversampling: 'Sub-Harmonic Wave Engine',
  },
  'plugin-perfectclip': {
    topology: 'ANALOG-SQUARED SOFT & HARD DUAL CLIPPER',
    tube: 'Bipolar Diode Clamping',
    oversampling: '4x ADAA-2 Zero-Aliasing',
  },
  'plugin-vocalcraft': {
    topology: 'COMPLETE DUAL-TUBE RACK & CRT HARMONIC SUITE',
    tube: 'Twin 12AX7 & EF86 Pentode',
    oversampling: '8x Pristine Oversampling',
  },
};

export const HeroHome: React.FC<HeroHomeProps> = ({ onNavigate }) => {
  const { 
    siteContent, 
    updateSiteContent, 
    isMaster, 
    visitorCount, 
    liveOnlineCount,
    downloadPlugin,
    currentUser,
    openAuthModal
  } = useStudio();

  const [activePlayerTab, setActivePlayerTab] = useState<'both' | 'spotify' | 'youtube'>('both');
  const [showConfig, setShowConfig] = useState(false);

  // Live 1000ms ticker for accurate weekly unlock countdowns
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Hardware Rack Carousel state
  const [activeRackIndex, setActiveRackIndex] = useState(0);
  const [lockedModalPlugin, setLockedModalPlugin] = useState<PluginItem | null>(null);

  const pluginsList = siteContent.plugins && siteContent.plugins.length > 0 ? siteContent.plugins : [];
  const currentRackPlugin = pluginsList[activeRackIndex] || pluginsList[0];

  const getCountdown = (targetDateStr?: string) => {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr).getTime();
    const diff = target - now;
    if (diff <= 0) {
      return { isUnlocked: true, days: 0, hours: 0, minutes: 0, seconds: 0, totalDiff: 0 };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { isUnlocked: false, days, hours, minutes, seconds, totalDiff: diff };
  };

  const handleNextRack = () => {
    setActiveRackIndex((prev) => (prev + 1) % pluginsList.length);
  };

  const handlePrevRack = () => {
    setActiveRackIndex((prev) => (prev - 1 + pluginsList.length) % pluginsList.length);
  };

  const handleQuickDownload = (plugin: PluginItem, os: 'win' | 'mac') => {
    const countdown = plugin.unlockDate ? getCountdown(plugin.unlockDate) : null;
    const isLocked = countdown ? !countdown.isUnlocked : (plugin.status === 'IN ARRIVO');

    if (isLocked) {
      setLockedModalPlugin(plugin);
      return;
    }

    if (!currentUser) {
      openAuthModal(`Accedi o registrati per scaricare ${plugin.name} (${os === 'mac' ? 'macOS AU/VST3' : 'Windows x64 VST3'}).`);
      return;
    }

    downloadPlugin(plugin.id, os);
    triggerPluginZipFileDownload(plugin);
  };

  const cleanSpotifyId = (raw?: string) => {
    if (!raw) return '2nLiKk1RIeFhbMabi9iQ34';
    const trimmed = raw.trim();
    const match = trimmed.match(/(?:playlist|album|track)[/:]([a-zA-Z0-9]+)/);
    if (match) return match[1];
    return trimmed.split('?')[0];
  };

  const cleanYoutubeId = (raw?: string) => {
    if (!raw) return 'PLXK7O-W_io4CCKTgd_kyDOh_jgFYmMyfj';
    const trimmed = raw.trim();
    const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return trimmed.split('?')[0];
  };

  const spotifyId = cleanSpotifyId(siteContent.spotifyPlaylistId);
  const youtubeId = cleanYoutubeId(siteContent.youtubePlaylistId);

  // 4 Pro Audio Foreground Destination Cards (Universal Audio / Waves High-Density Grid)
  const foregroundCards = [
    {
      id: 'plugin-innovation' as PageId,
      badge: 'DSP SUITE V2.0.0',
      tag: '11 HARDWARE RACK',
      title: '171PluginInnovation',
      subtitle: 'Suite DSP Proprietaria & Freeware',
      description: '11 plugin analog-modeled per voce, batteria e mastering. Architettura v2.0.0 ricostruita con ADAA-2, True-Peak e sblocco settimanale.',
      icon: Cpu,
      isPrimary: true,
      highlightColor: 'from-amber-500/25 to-yellow-600/10',
      borderColor: 'border-amber-500/50 hover:border-amber-400',
      buttonText: 'Apri Catalogo Plugin',
      chips: ['VST3 64-Bit', 'macOS AU', 'Zero Host Latency'],
    },
    {
      id: 'prenota-sessione' as PageId,
      badge: 'MESSINA • SALA ATTIVA',
      tag: 'REGIA & MONITORAGGIO',
      title: 'Prenota Sessione',
      subtitle: 'Recording & Mastering Suite',
      description: 'Sessioni di registrazione vocale a stretto contatto con feedback acustico diretto senza vetro isolante, mix analogico e master professionale.',
      icon: Mic,
      isPrimary: false,
      highlightColor: 'from-amber-600/20 to-orange-700/5',
      borderColor: 'border-neutral-800 hover:border-amber-500/60',
      buttonText: 'Prenota Sessione Live',
      chips: ['25€/h Recording', '50€ Mix & Master', 'Feedback Diretto'],
    },
    {
      id: 'the-god-cypher' as PageId,
      badge: 'OPERA 14 TRACCE',
      tag: 'PRODUZIONE UFFICIALE',
      title: 'The God Cypher',
      subtitle: 'Album Ufficiale 171 Studio',
      description: 'Il disco manifesto interamente composto, registrato e rifinito a 171 Studio. Edizione fisica CD Deluxe e Master Pack ad alta risoluzione.',
      icon: Disc,
      isPrimary: false,
      highlightColor: 'from-red-600/25 to-red-950/20',
      borderColor: 'border-red-800/60 hover:border-red-500',
      buttonText: 'Esplora Album TGC',
      chips: ['CD Deluxe €9.99', 'Master Pack €4.99', '14 Artisti'],
    },
    {
      id: 'strumenti-online' as PageId,
      badge: 'WEB AUDIO LAB',
      tag: 'DSP BROWSER ENGINE',
      title: 'Strumenti Online',
      subtitle: 'Key & BPM Finder Studio',
      description: 'Analizzatore spettrale e armonico istantaneo nel browser con Web Audio API: stima precisa della tonalità, rilevatore BPM e metronomo.',
      icon: Sliders,
      isPrimary: false,
      highlightColor: 'from-amber-500/15 to-neutral-900/40',
      borderColor: 'border-neutral-800 hover:border-amber-500/60',
      buttonText: 'Lancia Strumenti Online',
      chips: ['Rilevatore Key', 'BPM Estimation', 'Tap Tempo'],
    },
  ];

  const specIcons = [Mic, Sliders, Cpu, ShieldCheck];
  const dynamicSpecs = siteContent.frontpageSpecs && siteContent.frontpageSpecs.length > 0
    ? siteContent.frontpageSpecs
    : [
        { id: 'spec-1', label: 'RECORDING ROOM', title: 'Vocal & Instruments' },
        { id: 'spec-2', label: 'MIX & MASTER', title: 'Analog & Digital' },
        { id: 'spec-3', label: '171PluginInnovation', title: 'Innovatio DSP' },
        { id: 'spec-4', label: 'FEEDBACK DIRETTO', title: 'Ambiente Trattato' },
      ];

  // Active rack plugin countdown
  const currentCountdown = currentRackPlugin?.unlockDate ? getCountdown(currentRackPlugin.unlockDate) : null;
  const isCurrentRackLocked = currentCountdown ? !currentCountdown.isUnlocked : (currentRackPlugin?.status === 'IN ARRIVO');
  const currentTopology = currentRackPlugin ? TOPOLOGY_MAP[currentRackPlugin.id] : null;

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      
      {/* 1. UNIVERSAL AUDIO / WAVES STYLE TOP RACK METER BRIDGE (TELEMETRY STRIP) */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 shadow-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Hardware Status LED */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-neutral-200 font-bold uppercase tracking-wider text-[11px]">
            171 STUDIO ENGINE • V2.0.0
          </span>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <span className="text-amber-400 font-semibold hidden md:inline text-[11px]">
            64-BIT FLOAT • 44.1 - 192 KHZ • ZERO HOST LATENCY
          </span>
        </div>

        {/* Live Studio Reach Telemetry */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-bold">{liveOnlineCount} ATTIVI ORA</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/90 border border-neutral-800">
            <span className="text-amber-400 font-bold">{visitorCount.toLocaleString('it-IT')}</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline uppercase">VISITE TOTALI</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('prenota-sessione')}
            className="hidden sm:flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>PRENOTA STUDIO</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. HERO HEADER: 3D EMBLEM & BEVELED STUDIO WORDMARK */}
      <div className="flex flex-col items-center text-center mt-1 sm:mt-4">
        <div className="my-2 sm:my-3 flex justify-center">
          <StudioLogoLockup 
            size="hero" 
            onClick={() => onNavigate('prenota-sessione')} 
          />
        </div>

        <p className="text-base sm:text-xl font-light text-neutral-300 max-w-2xl mb-3 tracking-wide">
          {siteContent.heroTagline}
        </p>

        {siteContent.frontpageHeroSubtitle && (
          <p className="text-xs sm:text-sm text-neutral-400 font-mono max-w-xl mb-5">
            {siteContent.frontpageHeroSubtitle}
          </p>
        )}

        {/* Studio Specs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-4xl p-2.5 sm:p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl mb-4 shadow-xl">
          {dynamicSpecs.map((spec, idx) => {
            const Icon = specIcons[idx % specIcons.length];
            return (
              <div key={spec.id || idx} className="flex flex-col items-center p-2 rounded-xl bg-neutral-900/50 border border-neutral-800/80 hover:border-amber-500/40 hover:bg-neutral-900 transition-all">
                <Icon className="w-4 h-4 text-amber-400 mb-0.5" />
                <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider">{spec.label}</span>
                <span className="text-xs sm:text-sm font-semibold text-neutral-200">{spec.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PROMINENT MAJOR UPDATE 2.2.5 LUXURY RELEASE BANNER (UNIVERSAL AUDIO / WAVES STYLE) */}
      <div 
        className="w-full relative rounded-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border-2 border-amber-500/60 shadow-[0_15px_50px_rgba(245,158,11,0.25)] p-5 sm:p-8 overflow-hidden group"
      >
        {/* Chassis Hex Bolts */}
        <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-neutral-700 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-950 rotate-45" />
        </div>
        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-neutral-700 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-950 -rotate-45" />
        </div>
        <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-neutral-700 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-950 -rotate-45" />
        </div>
        <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-neutral-700 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
          <div className="w-1.5 h-0.5 bg-neutral-950 rotate-45" />
        </div>

        {/* Ambient Amber Glow Background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3.5 max-w-3xl text-left">
            {/* Top Badges & Glowing Jewel Lamp */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/50">
                ✨ MAJOR UPDATE 2.2.5 • 8 NOVEMBRE 2026 • OFFICIAL RELEASE
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40">
                100% FREEWARE ILLIMITATO
              </span>
            </div>

            {/* Banner Main Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white leading-tight">
              171PluginInnovation Major Update 2.2.5 — Nuove Versioni per RealTune, EasyVoice, PerfectPre e SpaceLuxe
            </h2>

            {/* Technical Bullet Highlights */}
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
              Rilascio maggiore con ottimizzazioni specifiche e verifiche matematiche dsp171: tracking sub-cent (&lt; 0.0033 Hz) e curva quintica per <strong>RealTune</strong>, 0 dB Pre-Open e routing seriale invertibile per <strong>EasyVoice</strong>, taglio LC Neve 1073 con decramping Andy Simper per <strong>PerfectPre</strong> e serbatoio FDN-16 lossless senza glitch per <strong>SpaceLuxe</strong>.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-neutral-300">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>RealTune 2.2.5 (&lt;0.01 cent)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>EasyVoice 2.2.5 (Dual Dyn)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PerfectPre 2.2.5 (Neve 1073)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>SpaceLuxe 2.2.5 (FDN-16)</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation')}
              className="py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Esplora Major Update 2.2.5</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation', 'plugin-easyvoice')}
              className="py-3 px-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 hover:text-amber-200 font-mono text-xs uppercase tracking-wider border border-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Vedi EasyVoice v2.2.5</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE HARDWARE RACK CAROUSEL SHOWCASE (IN FOREGROUND) */}
      <section 
        className="w-full space-y-4"
        aria-label="Carosello Rack Hardware 171PluginInnovation"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase tracking-widest font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>CAROSELLO HARDWARE 19 POLLICI • SUITE ATTIVA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
              Esplora i Rack <span className="text-amber-400">171PluginInnovation</span>
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrevRack}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white transition-all cursor-pointer"
              aria-label="Rack precedente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-neutral-400 px-2">
              <strong className="text-amber-400">{activeRackIndex + 1}</strong> / {pluginsList.length}
            </span>
            <button
              type="button"
              onClick={handleNextRack}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-neutral-300 hover:text-white transition-all cursor-pointer"
              aria-label="Rack successivo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mini Rack Selector Strip (Scrollable Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {pluginsList.map((p, idx) => {
            const pCountdown = p.unlockDate ? getCountdown(p.unlockDate) : null;
            const pLocked = pCountdown ? !pCountdown.isUnlocked : (p.status === 'IN ARRIVO');
            const isSelected = idx === activeRackIndex;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveRackIndex(idx)}
                className={`shrink-0 px-3 py-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-950/80 text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-heading uppercase tracking-wide truncate max-w-[130px]">
                    {p.name.replace('171 ', '')}
                  </span>
                  <span className={`text-[9px] font-mono uppercase tracking-wider ${
                    isSelected ? 'text-black/80' : pLocked ? 'text-amber-500' : 'text-emerald-400'
                  }`}>
                    {pLocked ? (p.unlockWeek ? `Settimana ${p.unlockWeek}` : 'In Arrivo') : 'Disponibile'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Master Active Rack Frame */}
        {currentRackPlugin && (
          <div className="relative rounded-3xl bg-neutral-950 border-2 border-neutral-800 hover:border-amber-500/60 shadow-2xl p-4 sm:p-7 overflow-hidden transition-all duration-300">
            {/* Chassis Mounting Ears & Screws */}
            <div className="absolute top-4 left-4 w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-neutral-950 rotate-45" />
            </div>
            <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-neutral-950 -rotate-45" />
            </div>
            <div className="absolute bottom-4 left-4 w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-neutral-950 -rotate-45" />
            </div>
            <div className="absolute bottom-4 right-4 w-3.5 h-3.5 rounded-full bg-neutral-800 border border-neutral-950 shadow-inner flex items-center justify-center pointer-events-none">
              <div className="w-2 h-0.5 bg-neutral-950 rotate-45" />
            </div>

            {/* Rack Header Info Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                    {currentRackPlugin.badge}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    VERSIONE V2.0.0
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                  {currentRackPlugin.name}
                </h3>
              </div>

              {/* Status Badge */}
              <div>
                {isCurrentRackLocked ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-600/60 text-amber-300 text-xs font-mono font-bold">
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>
                      SBLOCCO TRA: {currentCountdown ? `${currentCountdown.days}g ${currentCountdown.hours}o ${currentCountdown.minutes}m ${currentCountdown.seconds}s` : 'IN ARRIVO'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>DISPONIBILE ORA • DOWNLOAD GRATUITO</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hardware Faceplate Screenshot View */}
            <div 
              onClick={() => onNavigate('plugin-innovation', currentRackPlugin.id)}
              className="relative w-full aspect-[16/10] sm:aspect-[1024/571] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/90 shadow-2xl p-1.5 sm:p-3 flex items-center justify-center cursor-pointer group/image"
            >
              <img
                src={getAssetUrl(currentRackPlugin.imageUrl || '/assets/gui/spaceluxe.png')}
                alt={currentRackPlugin.name}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] group-hover/image:scale-[1.01] transition-transform duration-300"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity flex items-end justify-center p-6">
                <span className="px-4 py-2 rounded-xl bg-amber-500 text-black font-heading font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2">
                  <span>Apri Scheda Tecnica e Download</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Analog Topology & Controls Footer */}
            <div className="mt-5 pt-4 border-t border-neutral-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                {currentTopology && (
                  <p className="text-xs font-mono text-amber-400/90 uppercase tracking-wider font-bold">
                    CIRCUITO: {currentTopology.topology} • {currentTopology.tube}
                  </p>
                )}
                <p className="text-xs text-neutral-300 font-light max-w-xl">
                  {currentRackPlugin.description}
                </p>
              </div>

              {/* Action Buttons for Active Rack */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => onNavigate('plugin-innovation', currentRackPlugin.id)}
                  className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-mono text-xs uppercase tracking-wider border border-neutral-700 transition-colors cursor-pointer"
                >
                  Scheda DSP Completa
                </button>

                {isCurrentRackLocked ? (
                  <button
                    type="button"
                    onClick={() => setLockedModalPlugin(currentRackPlugin)}
                    className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-mono text-xs uppercase tracking-wider border border-amber-500/50 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Dettagli Sblocco</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickDownload(currentRackPlugin, 'win')}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Win VST3</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDownload(currentRackPlugin, 'mac')}
                      className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-white font-mono text-xs uppercase tracking-wider border border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>macOS AU</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. MULTI-DECK FEATURE CARDS (4-COLUMN HIGH-DENSITY GRID) */}
      <section 
        className="w-full space-y-4"
        aria-label="Aree Principali di 171 Studio"
      >
        <div className="text-center sm:text-left mb-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
            NAVIGAZIONE PROFESSIONALE
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-0.5">
            I Reparti di <span className="text-amber-400">171 Studio & Innovation</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {foregroundCards.map((card) => {
            const Icon = card.icon;

            return (
              <HardwareTiltCard
                key={card.id}
                maxTilt={6}
                glareColor={card.isPrimary ? 'gold' : 'amber'}
                isSelected={card.isPrimary}
                showCornerRivets={true}
                className={`flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-neutral-950/90 backdrop-blur-xl group cursor-pointer overflow-hidden border ${card.borderColor} transition-all duration-300`}
                onClick={() => onNavigate(card.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(card.id);
                  }
                }}
                aria-label={`Accedi a ${card.title}`}
              >
                <div 
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${card.highlightColor} opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none`} 
                />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-neutral-900/90 text-amber-400 border border-amber-500/30">
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-heading font-bold text-white group-hover:text-amber-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-light">
                    {card.description}
                  </p>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.chips.map((chip, cIdx) => (
                      <span key={cIdx} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/80 border border-neutral-800 text-neutral-300">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-6 pt-3 border-t border-neutral-800/70 flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span className={`${card.isPrimary ? 'text-amber-400' : 'text-neutral-400 group-hover:text-white'} transition-colors`}>
                    {card.buttonText}
                  </span>
                  <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                    card.isPrimary
                      ? 'bg-amber-500 text-black group-hover:translate-x-1'
                      : 'bg-neutral-900 text-neutral-400 group-hover:text-amber-400 group-hover:bg-neutral-800 group-hover:translate-x-1'
                  }`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </HardwareTiltCard>
            );
          })}
        </div>
      </section>

      {/* 6. EXCLUSIVE RELEASE BANNER: "THE GOD CYPHER" OFFICIAL ALBUM */}
      <div 
        onClick={() => onNavigate('the-god-cypher')}
        className="w-full p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-black via-[#160606] to-black border-2 border-red-700/60 shadow-[0_10px_40px_rgba(220,38,38,0.25)] hover:border-red-500 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-red-600/70 shadow-2xl shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src={getAssetUrl('/assets/the-god-cypher/covers/cover-front.png')} 
                alt="The God Cypher Album" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-600/60 text-red-400 text-[10px] font-mono tracking-widest uppercase mb-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>NUOVA USCITA UFFICIALE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-['Cinzel_Decorative',serif] font-black text-white group-hover:text-red-400 transition-colors">
                THE GOD CYPHER
              </h3>
              <p className="text-xs sm:text-sm text-[#fdf6e2]/80 font-['Playfair_Display',serif] italic mt-0.5">
                L'Album Ufficiale di 171 Studio • 14 Tracce • CD Deluxe €9.99 • Master Pack €4.99 • Solo MP3 €2.99
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-center">
            <span className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-700 group-hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-950 flex items-center justify-center gap-2">
              <span>Esplora Album & Acquista</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* 7. "I NOSTRI LAVORI" SECTION: SPOTIFY & YOUTUBE PLAYERS */}
      <section 
        className="w-full pt-4 pb-2"
        aria-label="I Nostri Lavori - Playlist Spotify e YouTube"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-1.5">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              <span>PORTFOLIO & PRODUZIONI REALIZZATE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
              I Nostri <span className="metallic-gold-text">Lavori</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-light mt-0.5">
              Ascolta tutti i brani registrati, prodotti, mixati e masterizzati a 171 Studio.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActivePlayerTab('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activePlayerTab === 'both'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setActivePlayerTab('spotify')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activePlayerTab === 'spotify'
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Spotify</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlayerTab('youtube')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activePlayerTab === 'youtube'
                  ? 'bg-red-600 text-white font-bold shadow-md shadow-red-600/20'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Youtube className="w-3.5 h-3.5" />
              <span>YouTube</span>
            </button>
            {isMaster && (
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                title="Configura ID Playlist (Solo Master)"
                aria-label="Configura playlist"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {showConfig && (
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-md mb-6 animate-in fade-in duration-200">
            <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block mb-2">
              Configura URL / ID Playlist Ufficiali di 171 Studio
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  ID Playlist Spotify (o embed URI)
                </label>
                <input
                  type="text"
                  value={siteContent.spotifyPlaylistId || ''}
                  onChange={(e) => updateSiteContent({ spotifyPlaylistId: e.target.value.trim() })}
                  placeholder="Es. 2nLiKk1RIeFhbMabi9iQ34"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-neutral-400 block mb-1">
                  ID Playlist YouTube (o playlist list ID)
                </label>
                <input
                  type="text"
                  value={siteContent.youtubePlaylistId || ''}
                  onChange={(e) => updateSiteContent({ youtubePlaylistId: e.target.value.trim() })}
                  placeholder="Es. PLXK7O-W_io4CCKTgd_kyDOh_jgFYmMyfj"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        <div className={`grid gap-6 ${
          activePlayerTab === 'both' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}>
          {(activePlayerTab === 'both' || activePlayerTab === 'spotify') && (
            <div className={`${activePlayerTab === 'both' ? 'lg:col-span-6' : 'w-full'} flex flex-col rounded-3xl bg-neutral-950/85 border border-emerald-500/30 backdrop-blur-xl shadow-2xl p-5 sm:p-6 relative overflow-hidden group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                      Spotify Playlist
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                      Uscite & Master 171 Studio
                    </p>
                  </div>
                </div>

                <a
                  href={`https://open.spotify.com/playlist/${spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-xs font-mono uppercase tracking-wider transition-all duration-300"
                >
                  <span>Apri App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900/60 shadow-inner">
                <iframe
                  title="171 Studio Spotify Playlist"
                  src={`https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="360"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-2xl"
                />
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>QUALITÀ AUDIO: 320 KBPS</span>
                <span className="text-emerald-400">AGGIORNATA COSTANTEMENTE</span>
              </div>
            </div>
          )}

          {(activePlayerTab === 'both' || activePlayerTab === 'youtube') && (
            <div className={`${activePlayerTab === 'both' ? 'lg:col-span-6' : 'w-full'} flex flex-col rounded-3xl bg-neutral-950/85 border border-red-600/30 backdrop-blur-xl shadow-2xl p-5 sm:p-6 relative overflow-hidden group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base sm:text-lg text-white">
                      YouTube Video Playlist
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                      Videoclip Ufficiali & Sessioni
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.youtube.com/playlist?list=${youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 text-xs font-mono uppercase tracking-wider transition-all duration-300"
                >
                  <span>Guarda</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="w-full aspect-video rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-900/60 shadow-inner">
                <iframe
                  title="171 Studio YouTube Playlist"
                  src={`https://www.youtube.com/embed/videoseries?list=${youtubeId}&loop=1`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full rounded-2xl"
                />
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span>FORMATO: FULL HD 4K VIDEO</span>
                <span className="text-red-500">PRODUZIONI UFFICIALI</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8. DYNAMIC AUDIO CONSOLE FOOTER INDICATOR */}
      <div className="w-full p-3 sm:p-4 rounded-2xl bg-neutral-950/70 border border-neutral-900 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-neutral-200 font-semibold tracking-wider">CONSOLE DI CONTROLLO</span>
          </div>
          <span>|</span>
          <span className="text-amber-400 font-medium">171 STUDIO DSP READY</span>
          <span className="hidden md:inline text-neutral-600">|</span>
          <span className="hidden md:inline text-neutral-300 font-mono text-[11px]">
            LIVE REACH: <strong className="text-amber-400">{visitorCount.toLocaleString('it-IT')}</strong> PRODUCER • <span className="text-emerald-400 font-bold">{liveOnlineCount} ATTIVI ORA</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-neutral-500">MESSINA, SICILIA</span>
          <button
            type="button"
            onClick={() => onNavigate('prenota-sessione')}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <span>PRENOTA LA TUA SESSIONE</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 9. BOUTIQUE HARDWARE LOCKED MODAL (NO BROWSER ALERTS) */}
      <HardwareLockedModal
        plugin={lockedModalPlugin}
        isOpen={lockedModalPlugin !== null}
        onClose={() => setLockedModalPlugin(null)}
        countdown={lockedModalPlugin?.unlockDate ? getCountdown(lockedModalPlugin.unlockDate) : null}
        onExploreAvailable={() => {
          setLockedModalPlugin(null);
          onNavigate('plugin-innovation');
        }}
      />

    </div>
  );
};
