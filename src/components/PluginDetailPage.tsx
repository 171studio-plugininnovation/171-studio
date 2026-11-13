import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Cpu, Sparkles, Zap, Flame, Shield, Sliders, Download,
  Check, Mail, Star, Heart, MessageSquare, ExternalLink, FileArchive,
  CheckCircle2, Send, Lock, Bug, ChevronDown, ChevronUp, Eye, X, Layers,
  Award, Gift, Clock, Calendar, Share2, Copy, CheckCircle, Radio
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { PluginItem, STUDIO_PAYPAL_EMAIL, PluginDonationRecord } from '../types/cms';
import { getPayPalDonationUrl, getPayPalMeUrl, triggerPluginZipFileDownload } from '../utils/emailService';
import { getAssetUrl } from '../utils/assetPath';
import { HardwareTiltCard } from './HardwareTiltCard';
import { HardwareLockedModal } from './HardwareLockedModal';

interface PluginDetailPageProps {
  pluginId: string;
  onBack: () => void;
  onSelectPlugin: (id: string | null) => void;
  onNavigate?: (page: PageId, pluginId?: string | null) => void;
}

export const PluginDetailPage: React.FC<PluginDetailPageProps> = ({
  pluginId,
  onBack,
  onSelectPlugin,
  onNavigate,
}) => {
  const {
    siteContent,
    downloadPlugin,
    currentUser,
    openAuthModal,
    pluginFeedbacks,
    addPluginFeedback,
    pluginDonations,
    createPluginDonation,
    confirmPluginDonationPayPal,
    getUserCumulativeDonations,
    visitorCount,
    liveOnlineCount,
    favoritePluginIds,
    toggleFavoritePlugin,
    isPluginFavorite,
  } = useStudio();

  const plugin = siteContent.plugins.find((p) => p.id === pluginId) || siteContent.plugins[0];

  // Real-time reviews and rating calculation from verified feedback
  const currentPluginFeedbacks = useMemo(() => {
    return pluginFeedbacks.filter(
      (f) => f.pluginId === plugin?.id || f.pluginName === plugin?.name
    );
  }, [pluginFeedbacks, plugin?.id, plugin?.name]);

  const reviewCount = currentPluginFeedbacks.length;
  const averageRating = useMemo(() => {
    if (reviewCount === 0) return null;
    const total = currentPluginFeedbacks.reduce((acc, curr) => acc + (curr.rating || 5), 0);
    return Math.round((total / reviewCount) * 10) / 10;
  }, [currentPluginFeedbacks, reviewCount]);

  // Active tab in Waves-style product page
  const [activeTab, setActiveTab] = useState<'overview' | 'changelog' | 'tech' | 'specs' | 'feedback'>('overview');

  // Ensure window scrolls cleanly to top when opening or switching plugin detail view
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pluginId]);

  const countdown = null;
  const isLocked = false;

  // Format date in Italian format
  const formatUnlockDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // State for preview modal image
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPathWin, setCopiedPathWin] = useState(false);
  const [copiedPathMac, setCopiedPathMac] = useState(false);

  const copyPath = (path: string, os: 'win' | 'mac') => {
    navigator.clipboard.writeText(path);
    if (os === 'win') {
      setCopiedPathWin(true);
      setTimeout(() => setCopiedPathWin(false), 2000);
    } else {
      setCopiedPathMac(true);
      setTimeout(() => setCopiedPathMac(false), 2000);
    }
  };

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [dawUsed, setDawUsed] = useState<string>('Ableton Live');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Early Supporter Lifetime Pass state
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<number | 'custom'>(20);
  const [customDonationInput, setCustomDonationInput] = useState<string>('5');
  const [activeDonation, setActiveDonation] = useState<PluginDonationRecord | null>(null);
  const [donationTxInput, setDonationTxInput] = useState('');
  const [donationTxError, setDonationTxError] = useState<string | null>(null);
  const [donationTxSuccess, setDonationTxSuccess] = useState<string | null>(null);
  const [isVerifyingDonation, setIsVerifyingDonation] = useState(false);
  const [donorEmailInput, setDonorEmailInput] = useState('');

  const targetEmailForDonation = (currentUser?.email || donorEmailInput || '').trim().toLowerCase();
  const cumulativeStats = getUserCumulativeDonations(targetEmailForDonation);

  const getEffectiveDonationAmount = (): number => {
    if (selectedDonationAmount === 'custom') {
      const parsed = parseFloat(customDonationInput.replace(',', '.'));
      return isNaN(parsed) || parsed <= 0 ? 5 : Math.round(parsed * 100) / 100;
    }
    return selectedDonationAmount;
  };

  const handleStartDonation = (e: React.FormEvent) => {
    e.preventDefault();
    setDonationTxError(null);
    setDonationTxSuccess(null);
    const emailToUse = (currentUser?.email || donorEmailInput || '').trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      setDonationTxError('Inserisci un indirizzo email valido per associare la donazione.');
      return;
    }
    const finalAmount = getEffectiveDonationAmount();
    try {
      const created = createPluginDonation({
        amount: Math.max(1, finalAmount),
        currency: 'EUR',
        userEmail: emailToUse || undefined,
        userName: currentUser?.name || undefined,
      });
      setActiveDonation(created);
      if (created.paypalPaymentUrl) {
        window.open(created.paypalPaymentUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setDonationTxError(err.message || 'Errore nella creazione della donazione');
    }
  };

  const handleConfirmTransaction = () => {
    if (!activeDonation) return;
    const cleanTx = donationTxInput.trim();
    if (!cleanTx || cleanTx.length < 5) {
      setDonationTxError('Inserisci un ID di transazione PayPal valido (minimo 5 caratteri).');
      return;
    }
    setIsVerifyingDonation(true);
    setDonationTxError(null);
    try {
      const confirmed = confirmPluginDonationPayPal(activeDonation.id, cleanTx, activeDonation.amount);
      if (confirmed) {
        setActiveDonation(confirmed);
        setDonationTxSuccess(
          confirmed.isEarlySupporterPass
            ? `🎉 Donazione convalidata con successo! Traguardo raggiunto: il Badge "🌟 EARLY SUPPORTER — LIFETIME PASS" è ora ATTIVO sul tuo account!`
            : `🎉 Donazione convalidata con successo! Grazie per aver supportato lo sviluppo di ${plugin?.name}.`
        );
      } else {
        setDonationTxError('Impossibile verificare la donazione.');
      }
    } catch (err: any) {
      setDonationTxError(err.message || 'Errore durante la verifica');
    } finally {
      setIsVerifyingDonation(false);
    }
  };

  const handleDownload = (os: 'win' | 'mac') => {
    if (!plugin) return;
    if (!currentUser) {
      openAuthModal(`Registrazione obbligatoria: crea un account gratuito in 10 secondi per scaricare ${plugin.name} (${os === 'mac' ? 'macOS Universal' : 'Windows 64-bit'}).`);
      return;
    }
    downloadPlugin(plugin.id, os);
    setDownloadSuccess(true);
    triggerPluginZipFileDownload(plugin);
    setTimeout(() => setDownloadSuccess(false), 5000);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plugin) return;
    if (!feedbackComment.trim()) return;

    addPluginFeedback({
      pluginId: plugin.id,
      pluginName: plugin.name,
      rating,
      dawUsed,
      comment: feedbackComment.trim(),
    });

    setFeedbackSubmitted(true);
    setFeedbackComment('');
  };

  // Other plugins for the bottom carousel / switcher
  const otherPlugins = siteContent.plugins.filter((p) => p.id !== plugin?.id);

  if (!plugin) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-4 text-center">
        <p className="text-neutral-400">Plugin non trovato.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold font-mono"
        >
          Torna ai plugin
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-20 sm:pt-24 md:pt-28 pb-16 sm:pb-20 px-3.5 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Actions Bar (Waves / UAD Style) */}
      <div className="flex items-center justify-between gap-3 pb-4 sm:pb-6 mb-6 sm:mb-8 border-b border-neutral-800/80">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-neutral-400 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 shrink-0 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Catalogo</span> Plugin
          </button>
          <span className="text-neutral-600">/</span>
          <span className="text-amber-300 font-bold font-heading truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
            {plugin.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="hidden sm:flex px-3.5 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-mono text-neutral-300 hover:text-white items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Tutti i Plugin</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] sm:text-xs font-mono text-neutral-300 hover:text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
            title="Copia link della pagina plugin"
          >
            {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedLink ? 'Copiato!' : 'Condividi'}</span>
          </button>
        </div>
      </div>

      {/* Main Flagship Hero (Waves Audio Product Hero Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-start mb-10 sm:mb-14">
        
        {/* Left Column (6 cols): Large GUI Hardware Snapshot & Zoom Button */}
        <div className="lg:col-span-6 space-y-3.5 sm:space-y-4 w-full">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-2.5 sm:p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] group">
            {/* Top hardware bar */}
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 px-1 sm:px-2 border-b border-neutral-800 text-[10px] sm:text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-white tracking-wider truncate">{plugin.name} GUI</span>
              </div>
              <span className="text-amber-400/90 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 shrink-0">
                FOTOREALISTICA 60 FPS
              </span>
            </div>

            {/* GUI Image */}
            <div 
              onClick={() => setPreviewModalOpen(true)}
              className="relative mt-2.5 sm:mt-3 rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-950 aspect-[16/10] sm:aspect-[1024/571] flex items-center justify-center cursor-pointer shadow-inner p-1 sm:p-2 group/img"
            >
              <img
                src={getAssetUrl(plugin.imageUrl || '/assets/plugins/171EasyVoice_GUI.png')}
                alt={`${plugin.name} GUI Hardware`}
                className="w-full h-full object-contain object-center group-hover/img:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewModalOpen(true);
                }}
                className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-black/85 hover:bg-black text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[10.5px] sm:text-xs font-mono flex items-center gap-1.5 backdrop-blur-md transition-all shadow-xl cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Ingrandisci Schermo HD</span>
                <span className="xs:hidden">Zoom HD</span>
              </button>
            </div>

            {/* Technical Highlights Badges below GUI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 pt-2.5 sm:pt-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                <span className="text-[8.5px] sm:text-[9px] font-mono text-neutral-500 uppercase block">FORMATI</span>
                <span className="text-[10.5px] sm:text-[11px] font-mono font-bold text-neutral-200 truncate block">VST3 & EXE</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                <span className="text-[8.5px] sm:text-[9px] font-mono text-neutral-500 uppercase block">LATENZA</span>
                <span className="text-[10.5px] sm:text-[11px] font-mono font-bold text-emerald-400 truncate block">0 ms Safe</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                <span className="text-[8.5px] sm:text-[9px] font-mono text-neutral-500 uppercase block">CPU GUARD</span>
                <span className="text-[10.5px] sm:text-[11px] font-mono font-bold text-blue-400 truncate block">FTZ / DAZ</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-center">
                <span className="text-[8.5px] sm:text-[9px] font-mono text-neutral-500 uppercase block">PRECISIONE</span>
                <span className="text-[10.5px] sm:text-[11px] font-mono font-bold text-amber-400 truncate block">64-bit Audio</span>
              </div>
            </div>

            {/* DSP Architecture telemetry banner */}
            <div className="mt-2.5 sm:mt-3 p-3 rounded-xl sm:rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono text-neutral-400">
              <span className="flex items-start sm:items-center gap-2 min-w-0">
                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">
                  Architettura: <strong className="text-white font-medium">{plugin.badge}</strong>
                </span>
              </span>
              <span className="text-emerald-400 font-semibold text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0 self-end sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>64-bit • 0 ms</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Product Info, Version, Actions, Dual Download Buttons */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6 w-full">
          <div className="space-y-3">
            {/* Badges & Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 break-words">
                {plugin.badge}
              </span>
              {plugin.isNewRelease && (
                <span className="text-[9px] sm:text-[10px] font-mono font-black px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 to-red-500/25 text-amber-300 border border-amber-500/60 flex items-center gap-1.5 shadow-sm animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>{plugin.newReleaseTag || 'MAJOR UPDATE V2.0.0 (4 NOV)'}</span>
                </span>
              )}
              {isLocked ? (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/35 flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>SETTIMANA {plugin.unlockWeek || 1} • SBLOCCO IN ARRIVO</span>
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SBLOCCATO • DOWNLOAD GRATUITO</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading font-black text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight break-words">
              {plugin.name}
            </h1>

            {/* Version & Date */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-[11px] sm:text-xs font-mono text-neutral-300">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700/80 font-bold text-amber-300">
                {plugin.version || 'v2.0.0 (4 Nov 2026)'}
              </span>
              <span className="text-neutral-500 hidden sm:inline">•</span>
              <span className="text-neutral-400">Release: {plugin.changelog?.[0]?.date ? `${plugin.changelog[0].date} • ${plugin.newReleaseTag || plugin.changelog[0].version}` : (plugin.version || 'Nov 2026')}</span>
              <span className="text-neutral-500 hidden sm:inline">•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Freeware Illimitato</span>
              </span>
            </div>

            {/* Real Rating & Review Count Header Row */}
            <div className="flex items-center gap-2 sm:gap-2.5 pt-1 text-[11px] sm:text-xs font-mono flex-wrap">
              {(!reviewCount || reviewCount === 0) ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-0.5 text-neutral-700">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 text-neutral-700" />
                    ))}
                  </div>
                  <span className="text-neutral-400 font-semibold">Nessuna recensione</span>
                  <span className="text-neutral-600">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Sii il primo a recensire
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{averageRating?.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const ratingVal = averageRating || 5;
                      const isFilled = ratingVal >= starIdx;
                      const isHalf = !isFilled && ratingVal >= starIdx - 0.5;
                      return (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : isHalf
                              ? 'fill-amber-400/50 text-amber-400'
                              : 'text-neutral-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-neutral-300 font-medium">
                    ({reviewCount} {reviewCount === 1 ? 'recensione' : 'recensioni'})
                  </span>
                  <span className="text-neutral-600">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('feedback')}
                    className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Leggi recensioni o aggiungi la tua
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-200 font-light leading-relaxed">
            {plugin.description}
          </p>

          {/* Dual Download Buttons Box (Waves Style Big Call-to-Action) */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/90 border border-amber-500/40 shadow-2xl backdrop-blur-xl space-y-3.5 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Diretto Ufficiale</span>
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-neutral-400">
                {plugin.downloadCount > 0 ? `${plugin.downloadCount} download` : 'Pronto al download'}
              </span>
            </div>

            /* Action Buttons with Mandatory Free Registration */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Windows 64-bit button */}
              <button
                type="button"
                onClick={() => handleDownload('win')}
                className="px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between gap-3 shadow-lg shadow-amber-500/25 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg sm:text-xl">🪟</span>
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-black">
                      {currentUser ? 'SCARICA WINDOWS 64-BIT' : '🔒 REGISTRATI PER SCARICARE'}
                    </span>
                    <span className="block text-[9.5px] sm:text-[10px] font-mono opacity-80">
                      {currentUser ? 'VST3 & STANDALONE' : 'WIN 64-BIT (ACCOUNT GRATUITO)'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-black/15 text-[10.5px] sm:text-[11px] font-mono font-bold shrink-0">
                  {plugin.zipFileSize || '35 MB'}
                </span>
              </button>

              {/* macOS button */}
              <button
                type="button"
                onClick={() => handleDownload('mac')}
                className="px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg sm:text-xl">🍏</span>
                  <div className="text-left leading-tight">
                    <span className="block text-xs font-black">
                      {currentUser ? 'SCARICA MACOS UNIVERSAL' : '🔒 REGISTRATI PER SCARICARE'}
                    </span>
                    <span className="block text-[9.5px] sm:text-[10px] font-mono text-neutral-400">
                      {currentUser ? 'AU & VST3' : 'MACOS UNIVERSAL (ACCOUNT GRATUITO)'}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-md bg-neutral-900 text-cyan-400 text-[10.5px] sm:text-[11px] font-mono font-bold border border-neutral-800 shrink-0">
                  {plugin.macZipFileSize || '21 MB'}
                </span>
              </button>
            </div>

            {/* Quick 1-Click Copy Installation Directory Paths */}
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black/90 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] font-mono text-neutral-400">
                <span className="font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <FileArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>PERCORSI STANDARD INSTALLAZIONE</span>
                </span>
                <span className="text-[9px] text-neutral-500 hidden xs:inline">Clicca per copiare</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => copyPath('C:\\Program Files\\Common Files\\VST3', 'win')}
                  className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between gap-2 transition-all cursor-pointer min-w-0"
                  title="Copia percorso cartella VST3 Windows"
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="text-neutral-500 block text-[8px] sm:text-[8.5px] font-bold">CARTELLA WINDOWS VST3:</span>
                    <span className="text-neutral-200 truncate block text-[9.5px] sm:text-[10px]">C:\Program Files\Common Files\VST3</span>
                  </div>
                  <span className="shrink-0 text-amber-400">
                    {copiedPathWin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => copyPath('~/Library/Audio/Plug-Ins/Components', 'mac')}
                  className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between gap-2 transition-all cursor-pointer min-w-0"
                  title="Copia percorso cartella AU macOS"
                >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="text-neutral-500 block text-[8px] sm:text-[8.5px] font-bold">CARTELLA MACOS AU / VST3:</span>
                    <span className="text-neutral-200 truncate block text-[9.5px] sm:text-[10px]">~/Library/Audio/Plug-Ins/Components</span>
                  </div>
                  <span className="shrink-0 text-amber-400">
                    {copiedPathMac ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Download avviato con successo! Estrai il file ZIP ed esegui l'installer o copia il file .vst3 nella cartella VST3 del tuo sistema.</span>
              </div>
            )}

            {/* Freeware statement & Coffee Pass button */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs font-mono text-neutral-400 border-t border-neutral-800/80">
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nessun DRM • Nessun iLok • 100% Gratuito</span>
              </span>

              <button
                type="button"
                onClick={() => setShowDonationModal(true)}
                className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>Supporta lo sviluppo (Early Pass)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs (Mobile & Tablet Touch Optimized) */}
      <div className="mb-6 sm:mb-8 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 scroll-smooth">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Panoramica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('changelog')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'changelog'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>Changelog V2.0.0</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'tech'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Architettura DSP ({plugin.technologies?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'specs'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Host & DAW</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25 font-black'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Recensioni ({reviewCount})</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="mb-12 sm:mb-16">
        
        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-3 sm:space-y-4">
              <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                La Filosofia di {plugin.name}
              </h3>
              <p className="text-neutral-300 font-light leading-relaxed text-sm sm:text-base">
                Progettato negli studi di 171 Studio a Messina, {plugin.name} nasce con un obiettivo chiaro: abbattere i tempi di mix e garantire il suono discografico con fedeltà analogica autentica e zero latenza. Nessun compromesso su allocazioni heap durante l'elaborazione del thread audio e protezione hardware immediata contro i numeri denormali su qualsiasi DAW contemporanea.
              </p>
            </div>

            {/* Key Technologies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {plugin.technologies?.map((tech, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-950/80 border border-neutral-800 hover:border-amber-500/30 transition-all flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold">
                    0{i + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed">
                    {tech}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Changelog & Nuove Funzioni/Fix */}
        {activeTab === 'changelog' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/90 border border-amber-500/40 shadow-xl space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                <div>
                  <span className="text-[10px] sm:text-xs font-mono text-amber-400 uppercase tracking-widest block font-bold">
                    {plugin.newReleaseTag || 'OFFICIAL RELEASE'} • {plugin.changelog?.[0]?.date || 'NOVEMBRE 2026'}
                  </span>
                  <h3 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white mt-1 break-words">
                    Changelog Dettagliato • {plugin.name} {plugin.version}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10.5px] sm:text-xs font-mono font-bold self-start sm:self-auto shrink-0">
                  PASS AUDIT DSP 100%
                </span>
              </div>

              {plugin.changelog && plugin.changelog.length > 0 ? (
                plugin.changelog.map((logItem, idx) => (
                  <div key={idx} className="space-y-5 sm:space-y-6">
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                      <span className="font-heading font-bold text-base sm:text-lg text-amber-300 break-words">
                        {logItem.title}
                      </span>
                      <span className="text-[11px] sm:text-xs font-mono text-neutral-400 shrink-0">
                        Data: {logItem.date}
                      </span>
                    </div>

                    {/* Features block */}
                    {logItem.features && logItem.features.length > 0 && (
                      <div className="space-y-2.5 sm:space-y-3">
                        <h4 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                          <span>Nuove Funzioni & Ottimizzazioni Hardware:</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pl-1 sm:pl-2">
                          {logItem.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                              <span className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed">
                                {feat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fixes block */}
                    {logItem.fixes && logItem.fixes.length > 0 && (
                      <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                        <h4 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                          <span>Bug Fix & Risoluzioni DSP:</span>
                        </h4>
                        <div className="grid grid-cols-1 gap-2 pl-1 sm:pl-2">
                          {logItem.fixes.map((fx, fxIdx) => (
                            <div key={fxIdx} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-neutral-950/70 border border-emerald-500/20">
                              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed">
                                {fx}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                  Release iniziale certificata conforme alle specifiche di produzione 171 Studio.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Tech & Architecture */}
        {activeTab === 'tech' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            {/* Analog Hardware Signal Flow Diagram */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/90 border border-amber-500/40 space-y-3.5 sm:space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                  <span>DIAGRAMMA DEL FLUSSO DI SEGNALE & TOPOLOGIA HARDWARE</span>
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-mono text-neutral-400">
                  Zero Latency Live Processing
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-center font-mono">
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black border border-neutral-800 relative">
                  <span className="text-[8px] sm:text-[8.5px] text-neutral-500 uppercase block">STAGE 01</span>
                  <span className="text-[11px] sm:text-xs font-bold text-white block mt-0.5">INPUT BUFFER</span>
                  <span className="text-[8.5px] sm:text-[9.5px] text-amber-400/90 block mt-1 truncate">Transformer Impedance</span>
                </div>
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black border border-amber-500/30 relative">
                  <span className="text-[8px] sm:text-[8.5px] text-neutral-500 uppercase block">STAGE 02</span>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300 block mt-0.5">TUBE HARMONICS</span>
                  <span className="text-[8.5px] sm:text-[9.5px] text-amber-400/90 block mt-1 truncate">2nd & 3rd Non-Linear</span>
                </div>
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black border border-emerald-500/30 relative">
                  <span className="text-[8px] sm:text-[8.5px] text-neutral-500 uppercase block">STAGE 03</span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-400 block mt-0.5">CORE DSP</span>
                  <span className="text-[8.5px] sm:text-[9.5px] text-emerald-400/90 block mt-1 truncate">64-Bit Float Math</span>
                </div>
                <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-black border border-cyan-500/30 relative">
                  <span className="text-[8px] sm:text-[8.5px] text-neutral-500 uppercase block">STAGE 04</span>
                  <span className="text-[11px] sm:text-xs font-bold text-cyan-400 block mt-0.5">OUTPUT GAIN</span>
                  <span className="text-[8.5px] sm:text-[9.5px] text-cyan-400/90 block mt-1 truncate">True Peak Guard</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3 sm:space-y-4">
              <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                Architettura Hardware Modellata
              </h3>
              <p className="text-neutral-300 font-light leading-relaxed text-xs sm:text-sm">
                Tutti i moduli DSP di 171 Studio operano a 64-bit in virgola mobile a doppia precisione. L'elaborazione non introduce sfasamenti parassiti e implementa la tecnologia State Variable Filter (SVF) Zero-Delay Feedback (ZDF) con risposte d'impulso prive di cramp spettrale alle alte frequenze vicino alla frequenza di Nyquist.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {plugin.technologies?.map((tech, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5 sm:space-y-2">
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                    MODULO TECNICO #{i + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed">
                    {tech}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Specifications & Host Support */}
        {activeTab === 'specs' && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Host Compatibility */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-heading font-black text-base sm:text-lg">
                  <Sliders className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>DAW & Host Certificati</span>
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                  Testati e validati su progetti di mix master con oltre 128 tracce attive:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Cockos Reaper 7+</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Ableton Live 11 / 12</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">FL Studio 20 / 21 / 24</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Steinberg Cubase 12-14</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">PreSonus Studio One 6</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Apple Logic Pro (AUv2)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Bitwig Studio 5+</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Standalone App (.EXE)</span>
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-heading font-black text-base sm:text-lg">
                  <Cpu className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Requisiti di Sistema</span>
                </div>
                <div className="space-y-2.5 sm:space-y-3 text-[11px] sm:text-xs font-mono text-neutral-300">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-amber-400 font-bold block mb-1">🪟 Windows:</span>
                    <span>Windows 10 o Windows 11 (64-bit). Host host VST3 o uso diretto Standalone. SSE4.2 / AVX2 raccomandati.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-amber-400 font-bold block mb-1">🍏 macOS:</span>
                    <span>macOS 11 Big Sur o superiore. Supporto nativo per Apple Silicon (M1, M2, M3, M4) e Intel a 64-bit.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                    <span className="text-amber-400 font-bold block mb-1">Frequenze di Campionamento:</span>
                    <span>44.1 kHz, 48 kHz, 88.2 kHz, 96 kHz, 176.4 kHz, 192 kHz a latenza zero.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Feedback & Bug Reporting */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Feedback Form */}
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-4 sm:space-y-5">
                <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                  Lascia una Recensione su {plugin.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                  Il tuo parere ci aiuta a ottimizzare il motore DSP per le tue produzioni.
                </p>

                {feedbackSubmitted ? (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Grazie per il feedback! È stato registrato e inviato al nostro team.</span>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 sm:space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-neutral-400 mb-1.5">Valutazione:</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setRating(st)}
                            className="p-1 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-5 h-5 sm:w-6 sm:h-6 ${
                                st <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1.5">DAW Principale:</label>
                      <select
                        value={dawUsed}
                        onChange={(e) => setDawUsed(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200"
                      >
                        <option value="Ableton Live">Ableton Live</option>
                        <option value="FL Studio">FL Studio</option>
                        <option value="Reaper">Cockos Reaper</option>
                        <option value="Logic Pro">Apple Logic Pro</option>
                        <option value="Cubase">Steinberg Cubase</option>
                        <option value="Studio One">PreSonus Studio One</option>
                        <option value="Pro Tools">Avid Pro Tools</option>
                        <option value="Altro">Altro Host</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1.5">Il Tuo Commento:</label>
                      <textarea
                        rows={3}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Come risponde il plugin sulle tue voci o mix? Suggerimenti di migliorie..."
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-amber-400"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Invia Recensione
                    </button>
                  </form>
                )}
              </div>

              {/* Verified Bug Report Reward System */}
              <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-neutral-900/80 border border-amber-500/30 space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-heading font-black text-base sm:text-lg">
                  <Bug className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                  <span>Hai Trovato un Bug Reale? Ricevi un Premio!</span>
                </div>
                <p className="text-xs text-neutral-300 font-light leading-relaxed">
                  In 171 Studio premiamo la community. Se individui un bug DSP effettivo (glitch, crash, denormal spike o anomalia grafica) e ci fornisci i dettagli riproducibili, il Master verificherà la segnalazione e ti invierà un <strong className="text-amber-400">Voucher Sconto Esclusivo</strong> utilizzabile per sessioni in studio o produzioni.
                </p>
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/70 border border-neutral-800 text-xs font-mono space-y-2">
                  <div className="text-amber-300 font-bold">Come Segnalare:</div>
                  <p className="text-neutral-400 text-[11px] sm:text-xs">
                    Invia un'email direttamente a <strong className="text-neutral-200 break-all">171studiomessina@gmail.com</strong> indicando versione plugin, host DAW, sistema operativo e comportamento anomalo riscontrato.
                  </p>
                </div>
              </div>

              {/* Reviews List & Producer Community Feedback */}
              <div className="md:col-span-2 space-y-4 pt-4 sm:pt-6 border-t border-neutral-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                    <h4 className="font-heading font-black text-base sm:text-lg text-white">
                      Recensioni Verificate dei Produttori ({reviewCount})
                    </h4>
                  </div>
                  {averageRating && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-white font-bold text-sm">{averageRating.toFixed(1)} / 5</span>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star
                            key={st}
                            className={`w-3.5 h-3.5 ${
                              averageRating >= st ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {reviewCount === 0 ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-black/60 border border-neutral-800 text-center space-y-2">
                    <Star className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-700 mx-auto" />
                    <h5 className="font-heading font-bold text-sm sm:text-base text-neutral-300">
                      Nessuna recensione ancora
                    </h5>
                    <p className="text-[11px] sm:text-xs text-neutral-400 font-mono max-w-md mx-auto">
                      Non ci sono ancora recensioni pubblicate per {plugin.name}. Testa il plugin nel tuo prossimo mix o master e lascia la tua valutazione qui sopra!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentPluginFeedbacks.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-black/60 border border-neutral-800/90 space-y-2 hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-neutral-800 text-amber-400 font-bold text-xs flex items-center justify-center font-mono shrink-0">
                              {fb.userName ? fb.userName[0].toUpperCase() : 'P'}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block leading-none truncate">
                                {fb.userName || 'Produttore 171'}
                              </span>
                              <span className="text-[9.5px] sm:text-[10px] font-mono text-neutral-500 block mt-0.5 truncate">
                                DAW: {fb.dawUsed}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-amber-400 shrink-0">
                            {[1, 2, 3, 4, 5].map((st) => (
                              <Star
                                key={st}
                                className={`w-3 h-3 ${
                                  fb.rating >= st ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-300 font-light leading-relaxed pl-8 sm:pl-9">
                          &laquo;{fb.comment}&raquo;
                        </p>
                        <div className="text-[9px] font-mono text-neutral-600 pl-8 sm:pl-9">
                          {new Date(fb.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Bottom Switcher: Altri Plugin della Suite (Waves Style) */}
      <div className="pt-8 sm:pt-12 border-t border-neutral-800/80 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <div>
            <span className="text-[9.5px] sm:text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
              171PluginInnovation • SUITE AUDIO DSP
            </span>
            <h3 className="font-heading font-black text-xl sm:text-2xl text-white mt-0.5">
              Esplora Altri Plugin della Collezione
            </h3>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Vedi Tutti i Plugin</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {otherPlugins.slice(0, 3).map((other) => (
            <div
              key={other.id}
              onClick={() => {
                onSelectPlugin(other.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="p-4 sm:p-5 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-amber-400 font-bold uppercase truncate max-w-[200px]">
                    {other.badge}
                  </span>
                  {other.isNewRelease && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shrink-0">
                      NUOVA
                    </span>
                  )}
                </div>
                <h4 className="font-heading font-black text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors">
                  {other.name}
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2 font-light">
                  {other.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono text-amber-400 group-hover:translate-x-0.5 transition-transform">
                <span>Apri Scheda Plugin</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal for Zooming Hardware GUI */}
      {previewModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-neutral-950 border border-neutral-800 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 text-xs font-mono">
              <span className="text-white font-bold truncate pr-2">{plugin.name} — Hardware Interface HD</span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 sm:mt-4 rounded-xl sm:rounded-2xl overflow-hidden bg-black flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2">
              <img
                src={getAssetUrl(plugin.imageUrl || '/assets/plugins/171EasyVoice_GUI.png')}
                alt={plugin.name}
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Donation Early Pass Modal */}
      {showDonationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowDonationModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-neutral-950 border border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                  Early Supporter Pass
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDonationModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 font-light leading-relaxed">
              I plugin di 171 Studio sono gratuiti al 100%. Se apprezzi la qualità del DSP e vuoi supportare le release future, fai una donazione libera su PayPal a <strong className="text-amber-400 break-all">{STUDIO_PAYPAL_EMAIL}</strong>.
            </p>

            <form onSubmit={handleStartDonation} className="space-y-3.5 sm:space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1">Importo:</label>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {[5, 10, 20, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedDonationAmount(amt)}
                      className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer text-xs ${
                        selectedDonationAmount === amt
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {amt} €
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">La Tua Email (per associare il pass):</label>
                <input
                  type="email"
                  value={currentUser?.email || donorEmailInput}
                  onChange={(e) => setDonorEmailInput(e.target.value)}
                  placeholder="tua@email.com"
                  disabled={!!currentUser?.email}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400 text-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
              >
                Procedi su PayPal ({getEffectiveDonationAmount()} €)
              </button>
            </form>

            {activeDonation && (
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <label className="block text-[11px] font-mono text-neutral-400">
                  Hai completato il pagamento? Inserisci l'ID transazione PayPal:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={donationTxInput}
                    onChange={(e) => setDonationTxInput(e.target.value)}
                    placeholder="Es. 9AB12345CD67890EF"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white min-w-0"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmTransaction}
                    disabled={isVerifyingDonation}
                    className="px-3 sm:px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono cursor-pointer shrink-0"
                  >
                    {isVerifyingDonation ? 'Verifica...' : 'Conferma'}
                  </button>
                </div>
                {donationTxError && <p className="text-[11px] font-mono text-red-400">{donationTxError}</p>}
                {donationTxSuccess && <p className="text-[11px] font-mono text-emerald-400">{donationTxSuccess}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      

    </div>
  );
};
