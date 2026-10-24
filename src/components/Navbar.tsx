import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Shield, Radio, User, LogOut, LogIn, ChevronDown, ChevronsDown, ChevronUp, Sparkles } from 'lucide-react';
import { PageId } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { useStudio } from '../context/StudioContext';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenMasterDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  onNavigate,
  onOpenMasterDashboard 
}) => {
  const { currentUser, isMaster, logout, openAuthModal, siteContent } = useStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isIslandOpen, setIsIslandOpen] = useState(false);
  const islandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const islandContainerRef = useRef<HTMLDivElement | null>(null);

  interface NavItemDef {
    id: PageId;
    label: string;
    badge?: string;
    lines?: string[];
  }

  const navItems: NavItemDef[] = [
    { id: 'home', label: 'Frontpage' },
    { id: 'the-god-cypher', label: 'The God Cypher', badge: 'ALBUM' },
    { id: 'chi-siamo', label: 'Chi Siamo' },
    { id: 'prenota-sessione', label: 'Prenota Sessione' },
    { id: 'plugin-innovation', label: '171 Plugin Innovation', badge: 'DSP' },
    {
      id: 'strumenti-online',
      label: 'Strumenti Online',
      badge: 'BPM & KEY',
      lines: ['Strumenti', 'Online', 'Key & BPM Finder'],
    },
    {
      id: 'il-mio-account',
      label: 'Il Mio Account',
      badge: 'AREA CLIENTI',
      lines: ['Il Mio', 'Account', 'Area Personale'],
    },
  ];

  const activeNavItem = navItems.find((item) => item.id === currentPage);

  const handleIslandMouseEnter = () => {
    if (islandTimeoutRef.current) {
      clearTimeout(islandTimeoutRef.current);
      islandTimeoutRef.current = null;
    }
    setIsIslandOpen(true);
  };

  const handleIslandMouseLeave = () => {
    if (islandTimeoutRef.current) {
      clearTimeout(islandTimeoutRef.current);
    }
    islandTimeoutRef.current = setTimeout(() => {
      setIsIslandOpen(false);
    }, 240);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (islandContainerRef.current && !islandContainerRef.current.contains(e.target as Node)) {
        setIsIslandOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (islandTimeoutRef.current) clearTimeout(islandTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (id: PageId) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top micro bar for studio info & user auth status */}
      <div className="bg-black/85 border-b border-neutral-800/80 backdrop-blur-md text-[11px] font-mono text-neutral-400 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-red-500 font-semibold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
              <Radio className="w-3 h-3 text-red-500" />
              <span>REC STUDIO</span>
            </span>
            <span className="hidden md:inline text-neutral-600">•</span>
            <span className="hidden md:inline text-neutral-400">
              {siteContent.contactAddress}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavClick('il-mio-account')}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                currentPage === 'il-mio-account'
                  ? 'bg-amber-500 text-black border-amber-400 font-bold'
                  : 'bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border-amber-500/40 font-bold'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Il Mio Account</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavClick('il-mio-account')}
                  className="flex items-center gap-1 text-neutral-200 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline font-bold">{currentUser.name}</span>
                </button>
                {isMaster && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                    MASTER
                  </span>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="text-neutral-400 hover:text-red-400 text-[10px] uppercase ml-1 flex items-center gap-0.5 cursor-pointer"
                  title="Disconnetti"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Esci</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('Accedi per gestire prenotazioni, scaricare i plugin e usare il Key & BPM Finder')}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Accedi / Registrati</span>
              </button>
            )}

            <span className="text-emerald-400 hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SESSIONI APERTE
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav 
        className="relative bg-neutral-950/90 border-b border-neutral-800/80 backdrop-blur-2xl px-4 sm:px-8 py-1.5 sm:py-2 transition-all duration-300 shadow-[0_10px_35px_rgba(0,0,0,0.85)]"
        aria-label="Navigazione principale"
      >
        {/* Subtle top/bottom gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Brand Logo with 171 emblem */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-xl p-0.5"
            aria-label="Torna alla Home di 171 Studio"
          >
            <div className="relative w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-neutral-950 border border-neutral-800 group-hover:border-amber-500/60 p-1 flex items-center justify-center shadow-md shadow-black transition-all overflow-hidden shrink-0">
              {/* Soft dark aura */}
              <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-black pointer-events-none" />
              <img
                src="/assets/aistudio/171_logo_standalone.png"
                alt="171 Logo"
                className="w-full h-full object-contain relative z-10 group-hover:scale-105 transition-transform duration-300"
                style={{
                  filter: 'drop-shadow(0 0 1px #000000) drop-shadow(0 0 2px #000000)',
                }}
              />
            </div>
            <div className="flex items-center">
              <span className="font-heading font-black text-base sm:text-lg tracking-wider text-white group-hover:text-amber-400 transition-colors leading-none">
                171 <span className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]">STUDIO</span>
              </span>
            </div>
          </button>

          {/* Central iPhone Style Dynamic Island Navigation */}
          <div 
            ref={islandContainerRef}
            onMouseEnter={handleIslandMouseEnter}
            onMouseLeave={handleIslandMouseLeave}
            className="hidden lg:flex items-center justify-center relative z-30"
          >
            {!isIslandOpen ? (
              /* Collapsed Capsule: "Scopri di più" with downward chevrons */
              <button
                type="button"
                onClick={() => setIsIslandOpen(true)}
                className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950/90 hover:bg-neutral-900/90 border border-neutral-800/90 hover:border-amber-500/50 backdrop-blur-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Apri menu di navigazione Scopri di più"
                aria-expanded={false}
                aria-haspopup="true"
              >
                {/* Dynamic island ambient pulsing indicator */}
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                </span>

                <span className="font-heading font-black text-[11px] uppercase tracking-wider text-neutral-200 group-hover:text-amber-400 transition-colors">
                  Scopri di più
                </span>

                {/* Downward chevrons ("frecce verso il basso") */}
                <div className="flex items-center text-amber-400 group-hover:text-amber-300 transition-transform group-hover:translate-y-0.5 duration-200">
                  <ChevronsDown className="w-3.5 h-3.5 animate-bounce" />
                </div>

                {/* Active page pill badge */}
                {activeNavItem && (
                  <span className="ml-1 px-2 py-0.2 rounded-full bg-neutral-900 border border-neutral-800/80 text-[9px] font-mono text-neutral-400 group-hover:text-neutral-300 hidden xl:inline-block">
                    {activeNavItem.label}
                  </span>
                )}
              </button>
            ) : (
              /* Expanded Capsule: Full Navigation Dock */
              <div 
                className="flex items-center gap-1.5 bg-neutral-950/95 border border-amber-500/40 p-1.5 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-2xl animate-in zoom-in-95 duration-200"
                role="menu"
              >
                {/* Quick collapse button */}
                <button
                  type="button"
                  onClick={() => setIsIslandOpen(false)}
                  className="flex items-center gap-1 pl-2.5 pr-2 py-1 text-[10px] font-mono text-neutral-400 hover:text-amber-400 transition-colors border-r border-neutral-800/80 mr-0.5 cursor-pointer self-center"
                  title="Riduci a capsula"
                >
                  <span className="font-semibold text-neutral-300 uppercase">Riduci</span>
                  <ChevronUp className="w-3 h-3 text-amber-400" />
                </button>

                {/* Navigation Links */}
                {navItems.map((item) => {
                  const isActive = currentPage === item.id;
                  const hasLines = item.lines && item.lines.length > 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        handleNavClick(item.id);
                        setIsIslandOpen(false);
                      }}
                      className={`relative px-3 py-1.5 rounded-2xl text-[11px] font-medium tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer flex items-center justify-center ${
                        isActive
                          ? 'text-black font-bold bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 shadow-md shadow-amber-500/35'
                          : 'text-neutral-300 hover:text-white hover:bg-neutral-900/90'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      role="menuitem"
                    >
                      {hasLines ? (
                        <div className="flex flex-col items-center justify-center leading-tight py-0.5 text-center min-w-[95px]">
                          <span className="text-[11px] font-heading font-black leading-none">{item.lines![0]}</span>
                          <span className="text-[10px] font-medium leading-none mt-0.5">{item.lines![1]}</span>
                          <span className={`text-[8.5px] font-mono tracking-tight font-bold mt-1 px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                            isActive 
                              ? 'bg-black/20 text-black border border-black/20' 
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {item.lines![2]}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className={`ml-1 px-1.5 py-0.2 text-[8px] rounded-full font-mono font-bold ${
                              isActive 
                                ? 'bg-black/20 text-black border border-black/20' 
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right actions: Master Dashboard button + Audio visualizer + Booking CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Master Dashboard access button */}
            {isMaster && onOpenMasterDashboard && (
              <button
                type="button"
                onClick={onOpenMasterDashboard}
                className="px-3 py-1 rounded-full bg-neutral-950 hover:bg-amber-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-black"
                title="Pannello di Amministrazione Master"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span className="font-bold">MASTER CMS</span>
              </button>
            )}

            <div className="p-0.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 shadow-inner">
              <AudioVisualizer interactive={true} instanceId="desktop-navbar" />
            </div>

            <button
              type="button"
              onClick={() => handleNavClick('prenota-sessione')}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-heading font-black text-[11px] tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] border border-amber-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Prenota Ora
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {isMaster && onOpenMasterDashboard && (
              <button
                type="button"
                onClick={onOpenMasterDashboard}
                className="p-1.5 px-2 rounded-lg bg-amber-500 text-black font-bold text-[11px] font-mono"
                title="Master Dashboard"
              >
                CMS
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu di navigazione'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden mt-3 pt-3 border-t border-neutral-800/80 flex flex-col gap-2 pb-2 animate-in fade-in slide-in-from-top-2 duration-200"
            role="menu"
          >
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              const hasLines = item.lines && item.lines.length > 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    {hasLines ? (
                      <div className="flex flex-col text-left leading-tight py-0.5">
                        <span className="text-sm font-heading font-black tracking-wide text-white">{item.lines![0]}</span>
                        <span className="text-xs text-neutral-300 font-medium mt-0.5">{item.lines![1]}</span>
                        <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 w-fit">
                          {item.lines![2]}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isActive && <span className="text-xs text-amber-400 font-mono">ATTIVO</span>}
                </button>
              );
            })}

            {/* Auth / Master in mobile menu */}
            <div className="pt-2 mt-1 border-t border-neutral-800/60 flex flex-col gap-2">
              {currentUser ? (
                <div className="flex items-center justify-between px-2 py-1 text-xs font-mono">
                  <span className="text-neutral-300">Connesso: <strong>{currentUser.name}</strong></span>
                  <button onClick={logout} className="text-red-400 font-bold">Esci</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('Accedi per prenotare o scaricare'); }}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-amber-400 border border-amber-500/40 text-xs font-mono uppercase"
                >
                  Accedi / Registrati
                </button>
              )}

              {isMaster && onOpenMasterDashboard && (
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); onOpenMasterDashboard(); }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs font-mono uppercase"
                >
                  Apri Dashboard Master
                </button>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <AudioVisualizer interactive={true} instanceId="mobile-navbar" />
              <button
                type="button"
                onClick={() => handleNavClick('prenota-sessione')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs tracking-wider uppercase shadow-md shadow-amber-500/30"
              >
                Prenota
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
