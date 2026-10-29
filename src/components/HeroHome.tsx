import React, { useState } from 'react';
import { 
  ArrowRight, Sliders, Users, Calendar, Sparkles, Music2, Cpu, Mic, 
  ShieldCheck, ChevronRight, Play, Youtube, Disc, Radio, ExternalLink, Settings2
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { StudioLogoLockup } from './StudioLogoLockup';
import { getAssetUrl } from '../utils/assetPath';
import { HardwareTiltCard } from './HardwareTiltCard';

interface HeroHomeProps {
  onNavigate: (page: PageId) => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({ onNavigate }) => {
  const { siteContent, updateSiteContent, isMaster } = useStudio();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activePlayerTab, setActivePlayerTab] = useState<'both' | 'spotify' | 'youtube'>('both');
  const [showConfig, setShowConfig] = useState(false);

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

  const mainSections = [
    {
      id: 'chi-siamo' as PageId,
      title: 'Chi Siamo',
      subtitle: 'Identità & Visione',
      description: siteContent.frontpageNavChiSiamoDesc || 'Scopri la filosofia acustica, la registrazione a stretto contatto con feedback diretto e lo spazio di 171 Studio.',
      icon: Users,
      badge: 'IL NOSTRO SPAZIO',
      highlightColor: 'from-amber-500/20 to-amber-700/5',
      borderColor: 'hover:border-amber-400/60',
    },
    {
      id: 'prenota-sessione' as PageId,
      title: 'Prenota Sessione',
      subtitle: 'Recording & Mastering Suite',
      description: siteContent.frontpageNavPrenotaDesc || 'Pianifica la tua sessione in studio: registrazione vocale, missaggio, mastering e produzioni su misura.',
      icon: Calendar,
      badge: 'BOOKING DIRETTO',
      highlightColor: 'from-amber-400/25 to-yellow-600/10',
      borderColor: 'hover:border-amber-400',
      isPrimary: true,
    },
    {
      id: 'plugin-innovation' as PageId,
      title: '171 Plugin Innovation',
      subtitle: 'Tecnologia Sonora Proprietaria',
      description: siteContent.frontpageNavPluginsDesc || 'I nostri plugin DSP progettati per elevare il workflow, la purezza vocale e il calore analogico del mix moderno.',
      icon: Cpu,
      badge: 'SOFTWARE & INNOVATION',
      highlightColor: 'from-amber-600/20 to-orange-700/5',
      borderColor: 'hover:border-amber-400/60',
    },
  ];

  const specIcons = [Mic, Sliders, Cpu, ShieldCheck];
  const dynamicSpecs = siteContent.frontpageSpecs && siteContent.frontpageSpecs.length > 0
    ? siteContent.frontpageSpecs
    : [
        { id: 'spec-1', label: 'RECORDING ROOM', title: 'Vocal & Instruments' },
        { id: 'spec-2', label: 'MIX & MASTER', title: 'Analog & Digital' },
        { id: 'spec-3', label: '171 PLUGINS', title: 'Innovatio DSP' },
        { id: 'spec-4', label: 'FEEDBACK DIRETTO', title: 'Ambiente Trattato' },
      ];

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* Hero Header: 171 STUDIO Unified Official Logo Lockup */}
      <div className="flex flex-col items-center text-center mt-2 sm:mt-6">
        
        {/* Unified 3D 171 Emblem + Matching Beveled STUDIO Wordmark */}
        <div className="my-2 sm:my-3 flex justify-center">
          <StudioLogoLockup 
            size="hero" 
            onClick={() => onNavigate('prenota-sessione')} 
          />
        </div>

        <p className="text-base sm:text-xl font-light text-neutral-300 max-w-2xl mb-4 tracking-wide">
          {siteContent.heroTagline}
        </p>

        {siteContent.frontpageHeroSubtitle && (
          <p className="text-xs sm:text-sm text-neutral-400 font-mono max-w-xl mb-6">
            {siteContent.frontpageHeroSubtitle}
          </p>
        )}

        {/* Quick Studio Specs bar (Fully customizable in Master CMS) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl p-3 sm:p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 backdrop-blur-xl mb-6 shadow-2xl">
          {dynamicSpecs.map((spec, idx) => {
            const Icon = specIcons[idx % specIcons.length];
            return (
              <div key={spec.id || idx} className="flex flex-col items-center p-2 rounded-xl bg-neutral-900/40 border border-neutral-800/50">
                <Icon className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs text-neutral-400 font-mono uppercase">{spec.label}</span>
                <span className="text-sm font-semibold text-neutral-200">{spec.title}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3 Main Interactive Destination Cards */}
      <div className="w-full">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
            NAVIGAZIONE VELOCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
            Esplora le Aree di <span className="text-amber-400">171 Studio</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mainSections.map((section) => {
            const Icon = section.icon;

            return (
              <HardwareTiltCard
                key={section.id}
                maxTilt={7}
                glareColor={section.isPrimary ? 'gold' : 'amber'}
                isSelected={section.isPrimary}
                showCornerRivets={true}
                className={`flex flex-col justify-between p-6 sm:p-8 rounded-3xl bg-neutral-950/85 backdrop-blur-xl group cursor-pointer overflow-hidden ${section.borderColor}`}
                onClick={() => onNavigate(section.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(section.id);
                  }
                }}
                aria-label={`Accedi a ${section.title}`}
              >
                <div 
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${section.highlightColor} opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none`} 
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all duration-300 shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full bg-neutral-900/90 text-amber-400 border border-amber-500/30">
                      {section.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-heading font-bold text-white group-hover:text-amber-400 transition-colors mb-1">
                    {section.title}
                  </h3>
                  
                  <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                    {section.subtitle}
                  </p>

                  <p className="text-sm text-neutral-300 leading-relaxed font-light">
                    {section.description}
                  </p>
                </div>

                <div className="relative z-10 mt-8 pt-4 border-t border-neutral-800/70 flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span className={`${section.isPrimary ? 'text-amber-400' : 'text-neutral-400 group-hover:text-white'} transition-colors`}>
                    Vai alla Pagina
                  </span>
                  <div className={`p-2 rounded-xl transition-all duration-300 ${
                    section.isPrimary
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
      </div>

      {/* EXCLUSIVE RELEASE BANNER: "THE GOD CYPHER" OFFICIAL ALBUM (Placed under "Esplora le Aree") */}
      <div 
        onClick={() => onNavigate('the-god-cypher')}
        className="w-full p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-black via-[#160606] to-black border-2 border-red-700/60 shadow-[0_10px_40px_rgba(220,38,38,0.25)] hover:border-red-500 transition-all cursor-pointer group relative overflow-hidden my-4"
      >
        <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.25),transparent_70%)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-red-600/70 shadow-2xl shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src={getAssetUrl('/assets/the-god-cypher/covers/cover-front.png')} 
                alt="The God Cypher Album" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-600/60 text-red-400 text-[10px] font-mono tracking-widest uppercase mb-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>NUOVA USCITA UFFICIALE</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-['Cinzel_Decorative',serif] font-black text-white group-hover:text-red-400 transition-colors">
                THE GOD CYPHER
              </h3>
              <p className="text-xs sm:text-sm text-[#fdf6e2]/80 font-['Playfair_Display',serif] italic mt-0.5">
                L'Album Ufficiale di 171 Studio • 14 Tracce • CD Deluxe €9.99 • Master Pack €4.99 • Solo MP3 €2.99
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-center">
            <span className="px-5 py-3 rounded-2xl bg-red-700 group-hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-950 flex items-center gap-2">
              <span>Esplora Album & Acquista</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* "I Nostri Lavori" Section with Spotify & YouTube Players */}
      <section 
        className="w-full pt-8 pb-4"
        aria-label="I Nostri Lavori - Playlist Spotify e YouTube"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-2">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              <span>PORTFOLIO & PRODUZIONI REALIZZATE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white">
              I Nostri <span className="metallic-gold-text">Lavori</span>
            </h2>
            <p className="text-sm text-neutral-300 font-light mt-1">
              Ascolta tutti i brani registrati, prodotti, mixati e masterizzati a 171 Studio.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-800 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActivePlayerTab('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activePlayerTab === 'both'
                  ? 'bg-amber-500 text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setActivePlayerTab('spotify')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activePlayerTab === 'spotify'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Spotify</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlayerTab('youtube')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
                activePlayerTab === 'youtube'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
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
                title="Configura ID Playlist di 171 Studio (Solo Master)"
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
            <div className={`${activePlayerTab === 'both' ? 'lg:col-span-6' : 'w-full'} flex flex-col rounded-3xl bg-neutral-950/85 border border-emerald-500/30 backdrop-blur-xl shadow-2xl p-6 sm:p-7 relative overflow-hidden group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Disc className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">
                      Spotify Playlist
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
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
                  height="380"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-2xl"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>QUALITÀ AUDIO: 320 KBPS</span>
                <span className="text-emerald-400">AGGIORNATA COSTANTEMENTE</span>
              </div>
            </div>
          )}

          {(activePlayerTab === 'both' || activePlayerTab === 'youtube') && (
            <div className={`${activePlayerTab === 'both' ? 'lg:col-span-6' : 'w-full'} flex flex-col rounded-3xl bg-neutral-950/85 border border-red-600/30 backdrop-blur-xl shadow-2xl p-6 sm:p-7 relative overflow-hidden group`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">
                      YouTube Video Playlist
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
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

              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>FORMATO: FULL HD 4K VIDEO</span>
                <span className="text-red-500">PRODUZIONI UFFICIALI</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic Audio Console Footer Indicator */}
      <div className="w-full p-4 rounded-2xl bg-neutral-950/60 border border-neutral-900 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-neutral-200 font-semibold tracking-wider">CONSOLE DI CONTROLLO</span>
          </div>
          <span>|</span>
          <span className="text-amber-400 font-medium">171 STUDIO DSP READY</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-neutral-500">MESSINA, SICILIA</span>
          <button
            type="button"
            onClick={() => onNavigate('prenota-sessione')}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
          >
            <span>PRENOTA LA TUA SESSIONE</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
