import React from 'react';
import { ArrowLeft, Sparkles, Target, Compass, Heart, Radio, Mic2, Cpu, ChevronRight, Award } from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';

import { DEFAULT_PAGE_VALUES } from '../types/cms';

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
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
      
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 text-xs font-mono uppercase tracking-wider transition-all duration-200 backdrop-blur-md group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
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

        {/* Studio Philosophy Block */}
        <div className="p-8 sm:p-10 rounded-3xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
              {siteContent.aboutPhilosophyTitle}
            </h2>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            <p>
              {siteContent.aboutPhilosophy}
            </p>
            <p className="text-neutral-400 text-xs sm:text-sm font-mono pt-2 border-t border-neutral-800">
              {siteContent.contactAddress.toUpperCase()} — PROGETTATO PER ARTISTI EMERGENTI E PROFESSIONISTI.
            </p>
          </div>
        </div>

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
            <button
              type="button"
              onClick={() => onNavigate('prenota-sessione')}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20"
            >
              Prenota Sessione
            </button>
            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation')}
              className="px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs uppercase tracking-wider transition-all"
            >
              I Nostri Plugin
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
