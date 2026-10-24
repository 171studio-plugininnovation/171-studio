/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PageId } from './types';
import { isValidPageId } from './utils/navigation';
import { BackgroundLayer } from './components/BackgroundLayer';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { BookingSessionPage } from './components/BookingSessionPage';
import { AboutPage } from './components/AboutPage';
import { PluginsPage } from './components/PluginsPage';
import { AudioToolsPage } from './components/AudioToolsPage';
import { ClientAccountPage } from './components/ClientAccountPage';
import { TheGodCypherPage } from './components/TheGodCypherPage';
import { Footer } from './components/Footer';
import { StudioProvider, useStudio } from './context/StudioContext';
import { AuthModal } from './components/AuthModal';
import { MasterDashboard } from './components/MasterDashboard';
import { LivePreviewToolbar, PreviewDevice } from './components/LivePreviewToolbar';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [isMasterDashboardOpen, setIsMasterDashboardOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop');
  const { isMaster } = useStudio();

  // Sync with URL hash for browser history & direct links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'master-dashboard' && isMaster) {
        setIsMasterDashboardOpen(true);
      } else if (isValidPageId(hash)) {
        setIsMasterDashboardOpen(false);
        setCurrentPage(hash);
      } else if (!hash) {
        setIsMasterDashboardOpen(false);
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isMaster]);

  const navigateTo = (page: PageId) => {
    setIsMasterDashboardOpen(false);
    setCurrentPage(page);
    window.location.hash = page === 'home' ? '' : page;
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
        return <PluginsPage onNavigate={navigateTo} />;
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
      />

      {/* Dynamic Page Views or Master Dashboard */}
      {previewDevice === 'desktop' ? (
        <main className="flex-1 flex flex-col pb-20">
          {renderActivePage()}
        </main>
      ) : previewDevice === 'tablet' ? (
        <main className="flex-1 flex justify-center py-6 px-4 bg-neutral-900/60 pb-24">
          <div className="w-full max-w-[768px] min-h-[960px] bg-neutral-950 rounded-[32px] border-[8px] border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-amber-500/30">
            <div className="bg-neutral-900 px-4 py-2 flex items-center justify-between border-b border-neutral-800 text-[10px] font-mono text-neutral-400">
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                iPad / Tablet Mode (768px)
              </span>
              <span>171 Studio Messina</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderActivePage()}
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex justify-center py-6 px-2 bg-neutral-900/60 pb-24">
          <div className="w-full max-w-[390px] min-h-[820px] bg-neutral-950 rounded-[44px] border-[8px] border-neutral-800 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative ring-1 ring-amber-500/30">
            <div className="w-full bg-neutral-900 pt-2 pb-1.5 px-6 flex items-center justify-between border-b border-neutral-800 text-[10px] font-mono text-neutral-400 select-none">
              <span className="font-bold text-white">9:41</span>
              <div className="w-20 h-4 bg-black rounded-full" />
              <span className="text-emerald-400 font-bold">5G 100%</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderActivePage()}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      {!isMasterDashboardOpen && previewDevice === 'desktop' && (
        <Footer currentPage={currentPage} onNavigate={navigateTo} />
      )}

      {/* Persistent Live Preview Dock & Real-Time Sync Bar */}
      <LivePreviewToolbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        previewDevice={previewDevice}
        setPreviewDevice={setPreviewDevice}
        isMasterDashboardOpen={isMasterDashboardOpen}
        onToggleMasterDashboard={() => {
          if (isMasterDashboardOpen) {
            closeMasterDashboard();
          } else {
            openMasterDashboard();
          }
        }}
      />

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
