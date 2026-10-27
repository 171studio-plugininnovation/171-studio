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

function MainApp() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [isMasterDashboardOpen, setIsMasterDashboardOpen] = useState(false);
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
      <main className="flex-1 flex flex-col pb-12">
        {renderActivePage()}
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
