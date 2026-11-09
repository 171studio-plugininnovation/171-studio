import React from 'react';
import { ArrowLeft, Sparkles, Target, Compass, Heart, Radio, Mic2, Cpu, ChevronRight, Award } from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { DEFAULT_PAGE_VALUES } from '../types/cms';
import { StudioButton } from './ui';
import { GearLockerSection } from './GearLockerSection';
import { CheckCircle2, Shield, Activity, Waves } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: PageId) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { siteContent } = useStudio();

  const valuesIcons = [Radio, Mic2, Cpu, Award];
  const dynamicValues = siteContent.aboutValues && siteContent.aboutValues.length > 0 
    ? siteContent.aboutValues 
    : DEFAULT_PAGE_VALUES;

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-28 pb-16 px-4 sm:px-8 max-w-6xl mx-auto">
      
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 text-xs font-mono uppercase tracking-wider transition-all duration-200 backdrop-blur-md group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
          aria-label="Torna alla Frontpage"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Torna alla Frontpage</span>
        </button>

        <span className="text-xs font-mono text-neutral-400">
          <span className="text-amber-400">{siteContent.studioName}</span> / {siteContent.aboutTitle}
        </span>
      </div>

      {/* Main Narrative Card */}
      <div className="flex flex-col gap-10">
        
        {/* Header Introduction */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{siteContent.aboutBadge || 'IDENTITÀ & VISIONE SONORA'}</span>
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight mb-4">
            {siteContent.aboutTitle || 'Chi Siamo'}
          </h1>

          <p className="text-lg sm:text-xl text-neutral-300 font-light leading-relaxed">
            {siteContent.aboutIntro}
          </p>
        </div>

        {/* Studio Philosophy Block: "No-Glass / Big Room" Open Acoustic Concept */}
        <div className="p-8 sm:p-10 rounded-3xl bg-neutral-950/90 border border-amber-500/40 backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  FILOSOFIA DI REGISTRAZIONE NO-GLASS
                </span>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                  {siteContent.aboutPhilosophyTitle || 'L\'Esperienza di Ripresa a 171 Studio'}
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold self-start sm:self-auto">
              FEEDBACK UMANO DIRETTO 100%
            </span>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            <p>
              Ispirandoci alla celebre <em>Big Room</em> dei <strong>Real World Studios</strong> di Peter Gabriel, a 171 Studio abbiamo deliberatamente scelto di <strong>non isolare l\'artista dietro una parete di vetro</strong>. 
              Ingegnere del suono e musicista condividono lo stesso ambiente acusticamente calibrato a Messina, azzerando qualsiasi barriera psicologica o ritardo di comunicazione.
            </p>
            <p className="text-neutral-300">
              Ogni intonazione, dinamica vocale e sfumatura interpretativa viene discussa, provata e corretta <strong>in tempo reale, faccia a faccia</strong>. Il risultato è un\'energia di sessione autentica, una velocità esecutiva tripla e registrazioni cariche di reale emozione.
            </p>
          </div>

          {/* 3 Hotspots of 171 Studio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-800 space-y-1.5">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sweet-Spot Vocale</span>
              </span>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                Asse acustico calibrato con riflessioni primarie azzerate: cattura il segnale puro della capsula RØDE, Warm Audio, Lewitt o Shure.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-800 space-y-1.5">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Doppio Ascolto di Regia</span>
              </span>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                Monitor nearfield Kali Audio LP-6 con guida d\'onda 3D affiancati ai leggendari cubi Auratone C1A pilotati dal controller passivo Palmer Monicon.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-800 space-y-1.5">
              <span className="text-blue-400 font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Catena Ibrida 192 kHz</span>
              </span>
              <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                Conversione Apollo Twin X Thunderbolt d\'élite con preamplificazione Unison a impedenza variabile e suite proprietaria 171PluginInnovation.
              </p>
            </div>
          </div>
        </div>

        {/* Real Audio Signal Chain Flowchart */}
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>DIAGRAMMA DEL FLUSSO AUDIO REALE A 171 STUDIO</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
              ZERO DISTORSIONE ATTIVA
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] font-mono text-center">
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-amber-400 font-bold">1. ACQUISIZIONE</span>
              <span className="text-white font-bold text-xs">RØDE / WA / Lewitt / SM7B</span>
              <span className="text-[9.5px] text-neutral-400">Capsula Vocale</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-amber-400 font-bold">2. CONVERSIONE</span>
              <span className="text-white font-bold text-xs">Apollo Twin X</span>
              <span className="text-[9.5px] text-neutral-400">192 kHz / 24-bit AD</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-amber-400 font-bold">3. DSP LAB</span>
              <span className="text-white font-bold text-xs">171 Innovation</span>
              <span className="text-[9.5px] text-neutral-400">C++20 Zero-Latency</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-amber-400 font-bold">4. MONITORING</span>
              <span className="text-white font-bold text-xs">Palmer Monicon</span>
              <span className="text-[9.5px] text-neutral-400">Attenuatore Passivo</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-amber-400 font-bold">5. DIFFUSORI</span>
              <span className="text-white font-bold text-xs">Kali LP-6 & Auratone</span>
              <span className="text-[9.5px] text-neutral-400">Doppio Riferimento</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between gap-1">
              <span className="text-[9px] text-emerald-400 font-bold">6. ENERGIA</span>
              <span className="text-white font-bold text-xs">Black Lion PG-1</span>
              <span className="text-[9.5px] text-neutral-400">Filtro Rete PG-99</span>
            </div>
          </div>
        </div>

        {/* Embedding The 171 Gear Locker Section */}
        <GearLockerSection onNavigate={onNavigate} />

        {/* 4 Core Values Grid */}
        <div>
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
              I NOSTRI PILASTRI
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
              I Valori Fondamentali di <span className="text-amber-400">{siteContent.studioName}</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dynamicValues.map((val, idx) => {
              const Icon = valuesIcons[idx % valuesIcons.length];
              return (
                <div
                  key={val.id || idx}
                  className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800/80 hover:border-amber-500/40 backdrop-blur-xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 uppercase">
                      {val.tag}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-lg text-white group-hover:text-amber-400 transition-colors mb-2">
                    {val.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Footnote CTA */}
        <div className="p-6 rounded-2xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
              {siteContent.aboutCtaTitle || 'VUOI REGISTRARE O PARLARE DEL TUO PROGETTO?'}
            </span>
            <span className="text-sm text-neutral-200">
              {siteContent.aboutCtaDesc || 'Vieni a trovarci in studio a Messina o prenota subito la tua sessione.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StudioButton
              type="button"
              variant="primary"
              size="md"
              onClick={() => onNavigate('prenota-sessione')}
            >
              Prenota Sessione
            </StudioButton>
            <StudioButton
              type="button"
              variant="rack"
              size="md"
              onClick={() => onNavigate('plugin-innovation')}
            >
              I Nostri Plugin
            </StudioButton>
          </div>
        </div>

      </div>

    </div>
  );
};
