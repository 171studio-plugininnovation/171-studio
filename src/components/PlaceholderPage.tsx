import React from 'react';
import { ArrowLeft, Sparkles, Mail, Clock, ArrowRight, Shield, Disc3, Wrench } from 'lucide-react';
import { PageId, PAGES } from '../types';

interface PlaceholderPageProps {
  pageId: PageId;
  onNavigate: (page: PageId) => void;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ pageId, onNavigate }) => {
  const page = PAGES[pageId] || PAGES.home;

  const getSubpageDetails = (id: PageId) => {
    switch (id) {
      case 'chi-siamo':
        return {
          category: 'PROFILO STUDIO & SPAZIO',
          status: 'CONTENUTI IN FASE DI ALLESTIMENTO',
          tag: '171 SOUND ARCHITECTURE',
          nextPage: 'prenota-sessione' as PageId,
          nextLabel: 'Prenota Sessione',
        };
      case 'prenota-sessione':
        return {
          category: 'BOOKING & CALENDARIO SESSIONI',
          status: 'SISTEMA DI PRENOTAZIONE IN ATTIVAZIONE',
          tag: 'RECORDING & MASTERING SUITE',
          nextPage: 'plugin-innovation' as PageId,
          nextLabel: '171 Plugin Innovation',
        };
      case 'plugin-innovation':
        return {
          category: 'SOFTWARE & AUDIO DSP',
          status: 'PLUGIN SUITE IN SVILUPPO',
          tag: 'INNOVATIO AUDIO DSP ENGINE',
          nextPage: 'chi-siamo' as PageId,
          nextLabel: 'Chi Siamo',
        };
      default:
        return {
          category: 'STUDIO 171',
          status: 'IN COSTRUZIONE',
          tag: 'MESSINA, IT',
          nextPage: 'home' as PageId,
          nextLabel: 'Torna alla Home',
        };
    }
  };

  const details = getSubpageDetails(pageId);

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
      
      {/* Top Breadcrumb & Return to Home */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 text-xs font-mono uppercase tracking-wider transition-all duration-200 backdrop-blur-md group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Ritorna alla Frontpage"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Torna alla Frontpage</span>
        </button>

        <span className="text-xs font-mono text-neutral-400">
          <span className="text-amber-400">171 STUDIO</span> / {page.title}
        </span>
      </div>

      {/* Main Glass Card container */}
      <div className="relative flex flex-col items-center text-center p-8 sm:p-14 rounded-3xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-2xl shadow-2xl shadow-black/80 my-auto">
        
        {/* Subtle decorative glowing corner dots */}
        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-amber-400/40" />
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-400/40" />
        <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-amber-400/40" />
        <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-amber-400/40" />

        {/* Studio Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-6">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{details.category}</span>
        </div>

        {/* Page Title */}
        <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight mb-4">
          {page.title}
        </h1>

        <p className="text-lg sm:text-xl text-amber-400/90 font-medium max-w-xl mb-6">
          {page.subtitle}
        </p>

        <p className="text-neutral-300 text-sm sm:text-base font-light max-w-lg mb-10 leading-relaxed">
          {page.description}
        </p>

        {/* Clean Modern Status indicator box */}
        <div className="w-full max-w-md p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-sm mb-8 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
            {details.status}
          </div>

          <p className="text-xs text-neutral-400 font-mono">
            Questa sezione verrà configurata prossimamente. Puoi contattare direttamente lo studio per informazioni e prenotazioni anticipate.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:171studiomessina@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-500/20 hover:scale-105"
          >
            <Mail className="w-4 h-4" />
            <span>Contatta 171studiomessina@gmail.com</span>
          </a>

          <button
            type="button"
            onClick={() => onNavigate(details.nextPage)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/80 text-xs uppercase tracking-wider font-semibold transition-all duration-300"
          >
            <span>Passa a {details.nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Bottom studio footnote */}
      <div className="flex items-center justify-center gap-4 text-xs font-mono text-neutral-500 mt-8">
        <span>171 STUDIO</span>
        <span>•</span>
        <span>MESSINA (ITALY)</span>
        <span>•</span>
        <span>PRODUZIONE & RECORDING</span>
      </div>

    </div>
  );
};
