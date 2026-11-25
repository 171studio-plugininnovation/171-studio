/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PageId } from './types';
import { isValidPageId } from './utils/navigation';
import { BackgroundLayer } from './components/BackgroundLayer';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { Footer } from './components/Footer';
import { StudioProvider, useStudio } from './context/StudioContext';
import { AuthModal } from './components/AuthModal';

const BookingSessionPage = lazy(() => import('./components/BookingSessionPage').then(m => ({ default: m.BookingSessionPage })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const PluginsPage = lazy(() => import('./components/PluginsPage').then(m => ({ default: m.PluginsPage })));
const AudioToolsPage = lazy(() => import('./components/AudioToolsPage').then(m => ({ default: m.AudioToolsPage })));
const ClientAccountPage = lazy(() => import('./components/ClientAccountPage').then(m => ({ default: m.ClientAccountPage })));
const TheGodCypherPage = lazy(() => import('./components/TheGodCypherPage').then(m => ({ default: m.TheGodCypherPage })));
const MasterDashboard = lazy(() => import('./components/MasterDashboard').then(m => ({ default: m.MasterDashboard })));

const RouteFallback = () => (
  <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
    <div className="flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-neutral-950/90 border border-amber-500/30 shadow-2xl backdrop-blur-md">
      <span className="w-6 h-6 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300">Caricamento modulo 171 Studio...</span>
    </div>
  </div>
);

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [isMasterDashboardOpen, setIsMasterDashboardOpen] = useState(false);
  const { isMaster } = useStudio();

  // Sync with URL hash for browser history & direct links (including Waves-style dedicated plugin pages)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'master-dashboard' && isMaster) {
        setIsMasterDashboardOpen(true);
      } else if (hash.startsWith('plugin/')) {
        const pId = hash.replace('plugin/', '');
        setIsMasterDashboardOpen(false);
        setCurrentPage('plugin-innovation');
        setSelectedPluginId(pId);
      } else if (hash.startsWith('plugin-') && hash !== 'plugin-innovation') {
        setIsMasterDashboardOpen(false);
        setCurrentPage('plugin-innovation');
        setSelectedPluginId(hash);
      } else if (isValidPageId(hash)) {
        setIsMasterDashboardOpen(false);
        setCurrentPage(hash);
        if (hash !== 'plugin-innovation') {
          setSelectedPluginId(null);
        }
      } else if (!hash) {
        setIsMasterDashboardOpen(false);
        setCurrentPage('home');
        setSelectedPluginId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMaster]);

  const navigateTo = (page: PageId, pluginId?: string | null) => {
    setIsMasterDashboardOpen(false);
    setCurrentPage(page);
    if (page === 'plugin-innovation' && pluginId) {
      setSelectedPluginId(pluginId);
      window.location.hash = `plugin/${pluginId}`;
    } else {
      setSelectedPluginId(null);
      window.location.hash = page === 'home' ? '' : page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openMasterDashboard = () => {
    setIsMasterDashboardOpen(true);
    window.location.hash = 'master-dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeMasterDashboard = () => {
    setIsMasterDashboardOpen(false);
    window.location.hash = currentPage === 'home' ? '' : currentPage;
  };

  const renderActivePage = () => {
    if (isMasterDashboardOpen) {
      return <MasterDashboard onClose={closeMasterDashboard} />;
    }

    switch (currentPage) {
      case 'home':
        return <HeroHome onNavigate={navigateTo} />;
      case 'the-god-cypher':
        return <TheGodCypherPage onNavigate={navigateTo} />;
      case 'prenota-sessione':
        return <BookingSessionPage onNavigate={navigateTo} />;
      case 'chi-siamo':
        return <AboutPage onNavigate={navigateTo} />;
      case 'plugin-innovation':
        return (
          <PluginsPage 
            onNavigate={navigateTo} 
            selectedPluginId={selectedPluginId}
            onSelectPlugin={(id) => {
              setSelectedPluginId(id);
              if (id) {
                window.location.hash = `plugin/${id}`;
              } else {
                window.location.hash = 'plugin-innovation';
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'strumenti-online':
        return <AudioToolsPage onNavigate={navigateTo} />;
      case 'il-mio-account':
        return <ClientAccountPage onNavigate={navigateTo} />;
      default:
        return <HeroHome onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-neutral-950 text-white selection:bg-amber-400 selection:text-black">
      {/* Persistent Background Layer using user's image */}
      <BackgroundLayer currentPage={currentPage} />

      {/* Main Top Header & Navigation */}
      <Navbar 
        currentPage={currentPage} 
        onNavigate={navigateTo}
        onOpenMasterDashboard={openMasterDashboard}
        selectedPluginId={selectedPluginId}
      />

      {/* Dynamic Page Views or Master Dashboard with On-Demand Lazy Loading */}
      <main className="flex-1 flex flex-col pb-12">
        <Suspense fallback={<RouteFallback />}>
          {renderActivePage()}
        </Suspense>
      </main>

      {/* Footer */}
      {!isMasterDashboardOpen && (
        <Footer currentPage={currentPage} onNavigate={navigateTo} />
      )}

      {/* User Login & Register Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <MainApp />
    </StudioProvider>
  );
}
