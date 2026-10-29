import React, { useState } from 'react';
import {
  ArrowLeft, Cpu, Sparkles, Zap, Flame, Shield, Sliders, Download,
  Check, Mail, Star, Heart, MessageSquare, ExternalLink, FileArchive,
  CheckCircle2, Send, Lock, Bug, ChevronDown, ChevronUp, Eye, X, Layers,
  Award, Gift, Clock
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { PluginItem, STUDIO_PAYPAL_EMAIL, PluginDonationRecord } from '../types/cms';
import { getPayPalDonationUrl, getPayPalMeUrl, triggerPluginZipFileDownload } from '../utils/emailService';
import { getAssetUrl } from '../utils/assetPath';
import { HardwareTiltCard } from './HardwareTiltCard';

interface PluginsPageProps {
  onNavigate: (page: PageId) => void;
}

export const PluginsPage: React.FC<PluginsPageProps> = ({ onNavigate }) => {
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
  } = useStudio();

  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [thankYouPlugin, setThankYouPlugin] = useState<PluginItem | null>(null);

  // Early Supporter Lifetime Pass & Verified PayPal Donation State
  const [activeDonation, setActiveDonation] = useState<PluginDonationRecord | null>(null);
  const [donationTxInput, setDonationTxInput] = useState('');
  const [donationTxError, setDonationTxError] = useState<string | null>(null);
  const [donationTxSuccess, setDonationTxSuccess] = useState<string | null>(null);
  const [isVerifyingDonation, setIsVerifyingDonation] = useState(false);
  const [donorEmailInput, setDonorEmailInput] = useState('');
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Expanded technologies state for each plugin (all open by default so user can read everything)
  const [expandedTechPluginId, setExpandedTechPluginId] = useState<Record<string, boolean>>({
    'plugin-realtune': true,
    'plugin-easyvoice': true,
    'plugin-optocom': true,
    'plugin-cleandrive': true,
    'plugin-cleanreso': true,
    'plugin-perfectpre': true,
    'plugin-masterglue': true,
    'plugin-spaceluxe': true,
    'plugin-punchcraft': true,
  });

  // Modal for previewing hardware GUI snapshot
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Feedback form state on the post-download page
  const [rating, setRating] = useState<number>(5);
  const [dawUsed, setDawUsed] = useState<string>('Ableton Live');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Donation amount state (20 € default for Early Supporter Lifetime Pass, or custom amount)
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<number | 'custom'>(20);
  const [customDonationInput, setCustomDonationInput] = useState<string>('5');

  // Cumulative donations tracking for the active user / email
  const targetEmailForDonation = (currentUser?.email || donorEmailInput || '').trim().toLowerCase();
  const cumulativeStats = getUserCumulativeDonations(targetEmailForDonation);

  const getEffectiveDonationAmount = (): number => {
    if (selectedDonationAmount === 'custom') {
      const parsed = parseFloat(customDonationInput.replace(',', '.'));
      return isNaN(parsed) || parsed <= 0 ? 5 : Math.max(1, Math.round(parsed * 100) / 100);
    }
    return typeof selectedDonationAmount === 'number' ? selectedDonationAmount : 20;
  };

  const benefitIcons = [Flame, Zap, Sliders, Shield];
  const dynamicBenefits = siteContent.pluginBenefits && siteContent.pluginBenefits.length > 0
    ? siteContent.pluginBenefits
    : [
        {
          id: 'ben-1',
          tag: 'ANALOG TONE DSP',
          title: 'Calore Analogico & Dinamica Trasparente',
          desc: 'Algoritmi modellati su trasformatori e stadi valvolari vintage con simulazione armonica pari/dispari, donando spessore e calore immediato alle registrazioni vocali senza artefatti digitali duri.',
        },
        {
          id: 'ben-2',
          tag: 'LOW CPU USAGE',
          title: 'Zero Latenza per Tracking Live',
          desc: "Codice C++ / DSP ultra-ottimizzato per consentire all'artista di cantare e registrarsi in tempo reale con il plugin attivo in cuffia senza alcun ritardo percepibile, ideale sia in tracking che su progetti con oltre 80 tracce.",
        },
        {
          id: 'ben-3',
          tag: 'STREAMLINED UI',
          title: 'Workflow Immediato a Zero Distrazioni',
          desc: 'Interfacce essenziali pensate per chi fa musica: macro-controlli calibrati su sweet-spot acustici testati in studio. Meno tempo a cercare frequenze, più tempo a creare hit.',
        },
        {
          id: 'ben-4',
          tag: 'REAL-WORLD TESTED',
          title: 'Calibrati sul Campo a 171 Studio',
          desc: 'Ogni preset e curva di risposta è stata scolpita direttamente sulle sessioni reali del nostro studio a Messina, testata su voci rap, trap, pop e acustiche.',
        },
      ];


  const handleDownload = (plugin: PluginItem, platform: 'win' | 'mac' = 'win') => {
    if (!currentUser) {
      openAuthModal(`Accedi o registrati gratuitamente per scaricare il pacchetto .ZIP di "${plugin.name}" (${platform === 'mac' ? 'macOS Universal' : 'Windows 64-bit'}).`);
      return;
    }

    const success = downloadPlugin(plugin.id, platform);
    if (success) {
      setDownloadSuccessId(`${plugin.id}-${platform}`);
      setFeedbackSubmitted(false);
      setFeedbackComment('');
      setRating(5);
      // Open the dedicated post-download Thank You, Feedback & Free Donation page
      const isMac = platform === 'mac';
      setThankYouPlugin({
        ...plugin,
        name: `${plugin.name} (${isMac ? 'macOS' : 'Windows 64-bit'})`,
        zipFileName: isMac
          ? (plugin.macZipFileName || `${plugin.name.replace(/\s+/g, '_')}_Mac.zip`)
          : (plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Win64.zip`),
        zipFileSize: isMac ? (plugin.macZipFileSize || '15 MB') : (plugin.zipFileSize || '14.2 MB'),
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('Accedi o registrati per lasciare una recensione e votare i plugin di 171 Studio.');
      return;
    }
    if (!thankYouPlugin || !feedbackComment.trim()) return;

    addPluginFeedback({
      pluginId: thankYouPlugin.id,
      pluginName: thankYouPlugin.name,
      rating,
      dawUsed,
      comment: feedbackComment.trim(),
    });

    setFeedbackSubmitted(true);
    setFeedbackComment('');
  };

  const handleStartDonation = (explicitAmount?: number) => {
    const finalAmount = explicitAmount !== undefined ? explicitAmount : getEffectiveDonationAmount();
    const emailToUse = (currentUser?.email || donorEmailInput).trim().toLowerCase();
    if (!emailToUse && !currentUser) {
      openAuthModal('Accedi o registrati per associare le donazioni e il Badge Early Supporter Lifetime Pass al tuo account');
      return;
    }

    const newDonation = createPluginDonation({
      amount: Math.max(1, finalAmount),
      currency: 'EUR',
      userEmail: emailToUse || undefined,
      userName: currentUser?.name || undefined,
    });

    setActiveDonation(newDonation);
    setDonationTxInput('');
    setDonationTxError(null);
    setDonationTxSuccess(null);

    if (newDonation.paypalPaymentUrl) {
      window.open(newDonation.paypalPaymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVerifyDonationTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDonation) return;

    const rawTx = donationTxInput.trim();
    if (!rawTx || rawTx.length < 5) {
      setDonationTxError('Inserisci un codice transazione o ID ricevuta PayPal valido (almeno 5 caratteri).');
      return;
    }

    setIsVerifyingDonation(true);
    setDonationTxError(null);

    try {
      const confirmed = confirmPluginDonationPayPal(activeDonation.id, rawTx, activeDonation.amount);
      if (confirmed) {
        setActiveDonation(confirmed);
        setDonationTxSuccess(
          confirmed.isEarlySupporterPass
            ? `🎉 Donazione convalidata con successo! Traguardo raggiunto: il Badge "🌟 EARLY SUPPORTER — LIFETIME PASS" è ora ATTIVO sul tuo account (${confirmed.userEmail}) con accesso a vita a tutti i futuri plugin e aggiornamenti DSP!`
            : `🎉 Donazione #${confirmed.donationCode} (€${confirmed.amount.toFixed(2)}) convalidata con successo! Grazie per il supporto, le donazioni sono cumulabili: al raggiungimento di 20$ (o 20€) sbloccherai automaticamente tutti i plugin a vita!`
        );
      } else {
        setDonationTxError('Impossibile verificare la donazione.');
      }
    } catch (err: any) {
      setDonationTxError(err.message || 'Errore nella convalida della transazione PayPal.');
    } finally {
      setIsVerifyingDonation(false);
    }
  };

  // POST-DOWNLOAD DEDICATED PAGE: "Grazie per aver scaricato <Nome del Plugin>" + Feedback + Free PayPal Donation
  if (thankYouPlugin) {
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const currentDonationAmount = getEffectiveDonationAmount();
    const donationUrl = getPayPalDonationUrl(currentDonationAmount, thankYouPlugin.name, effectivePaypalEmail);
    const paypalMeLink = getPayPalMeUrl(currentDonationAmount);
    const zipName =
      thankYouPlugin.zipFileName ||
      `${thankYouPlugin.name.replace(/\s+/g, '_')}_VST3_AU_Installer.zip`;

    const relatedFeedbacks = pluginFeedbacks.filter(
      (f) => f.pluginId === thankYouPlugin.id || f.pluginName === thankYouPlugin.name
    );

    return (
      <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] pt-28 pb-20 px-4 sm:px-8 max-w-4xl mx-auto animate-in fade-in duration-300">
        {/* Top back bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => setThankYouPlugin(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-amber-500/40 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Torna al Catalogo Plugin</span>
          </button>

          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Download .ZIP Avviato ({zipName})</span>
          </span>
        </div>

        {/* Main Thank You Hero Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-neutral-950/90 border-2 border-amber-500/50 backdrop-blur-2xl shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Core Message */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg">
              <Download className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>171 PLUGIN INNOVATION • FREE DOWNLOAD</span>
            </span>

            <h1 className="text-2xl sm:text-4xl font-heading font-black text-white leading-tight">
              Grazie per aver scaricato{' '}
              <span className="text-amber-400">"{thankYouPlugin.name}"</span>!
            </h1>

            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/30 text-sm sm:text-base text-neutral-200 leading-relaxed font-sans space-y-2">
              <p>
                La suite 171 Plugin Innovation è attualmente in <strong>Early Access di Development gratuito</strong>: questo permette alla community di testare sul campo gli algoritmi DSP e aiutarci a renderli sempre più precisi, musicali e potenti.
              </p>
              <p className="text-amber-300 font-medium">
                Con una donazione di <strong>20$ (o 20€)</strong> diventi <strong>Early Supporter</strong> con <strong>Accesso a Vita</strong> a ogni plugin futuro. Inoltre, chi invia feedback e bug verificati riceverà <strong>buoni sconto e plugin commerciali gratis</strong>!
              </p>
            </div>

            {/* Direct ZIP Re-download Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => triggerPluginZipFileDownload(thankYouPlugin)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileArchive className="w-4 h-4 text-amber-400" />
                <span>Il download non è partito? Riscarica {zipName} ({thankYouPlugin.zipFileSize || '14.2 MB'})</span>
              </button>
            </div>
          </div>

          {/* Two Columns: 1. Leave Feedback | 2. Free PayPal Donation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-neutral-800/80">
            
            {/* Column 1: Feedback Form */}
            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    MIGLIORAMENTO CONTINUO DSP
                  </span>
                  <h3 className="text-lg font-heading font-bold text-white">
                    Lascia il tuo Feedback sul Plugin
                  </h3>
                </div>
              </div>

              {!currentUser ? (
                <div className="p-6 rounded-2xl bg-neutral-950/90 border border-amber-500/30 text-center space-y-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                      Recensioni Riservate agli Utenti Registrati
                    </h4>
                    <p className="text-xs font-mono text-neutral-400 max-w-sm mx-auto leading-relaxed">
                      Per garantire recensioni autentiche e affidabili da parte della community di artisti e produttori, è necessario aver effettuato l'accesso o la registrazione gratuita a 171 Studio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('Accedi o registrati per lasciare una recensione e votare i plugin di 171 Studio.')}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Accedi o Registrati per Valutare
                  </button>
                  <div className="pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      onClick={() => onNavigate('il-mio-account')}
                      className="text-[11px] font-mono text-neutral-400 hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                    >
                      <Bug className="w-3.5 h-3.5 text-red-400" />
                      <span>Hai riscontrato un bug o anomalia? <strong>Segnala nel Tuo Account ➔</strong></span>
                    </button>
                  </div>
                </div>
              ) : feedbackSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-base font-heading font-bold text-white">
                    Grazie mille per il tuo feedback!
                  </h4>
                  <p className="text-xs font-mono text-neutral-300">
                    Il tuo commento su <strong>{thankYouPlugin.name}</strong> è stato registrato dal team di sviluppo 171 Studio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFeedbackSubmitted(false)}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-neutral-900 text-amber-400 text-xs font-mono hover:underline cursor-pointer"
                  >
                    Invia un altro suggerimento
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs font-mono">
                  {/* Verified user badge */}
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Recensione di:</span>
                    <strong className="text-amber-400 font-bold truncate ml-2">{currentUser.name} ({currentUser.email})</strong>
                  </div>

                  {/* Reward callout */}
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
                    <Gift className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Programma Tester & Bug Hunter:</strong> Invia un feedback con dettagli tecnici o problemi reali riscontrati. Se confermati, riceverai nel tuo account <strong>buoni sconto studio</strong> e <strong>licenze gratuite per i futuri plugin commerciali</strong>!
                    </span>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase mb-1.5">
                      Valutazione Qualità Sonora & CPU:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                            rating >= star
                              ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${rating >= star ? 'fill-amber-400' : ''}`} />
                        </button>
                      ))}
                      <span className="ml-2 text-amber-400 font-bold">{rating}/5 Stelle</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase mb-1">
                      DAW Utilizzata:
                    </label>
                    <select
                      value={dawUsed}
                      onChange={(e) => setDawUsed(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400"
                    >
                      <option value="Ableton Live">Ableton Live</option>
                      <option value="FL Studio">FL Studio</option>
                      <option value="Logic Pro">Logic Pro</option>
                      <option value="Pro Tools">Pro Tools</option>
                      <option value="Cubase / Nuendo">Cubase / Nuendo</option>
                      <option value="Studio One">Studio One</option>
                      <option value="Reaper">Reaper</option>
                      <option value="Altra DAW">Altra DAW</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 uppercase mb-1">
                      Il tuo Feedback, impressioni o funzioni che vorresti vedere *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder={`Come ti trovi con ${thankYouPlugin.name}? Hai suggerimenti per il prossimo aggiornamento?`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-amber-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Invia Feedback a 171 Studio</span>
                  </button>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Hai riscontrato un bug o un crash?</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('il-mio-account')}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Bug className="w-3 h-3 text-red-400" />
                      <span>Report Plugin Bug ➔</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Column 2: Early Supporter Lifetime Pass & PayPal Donation */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-950/40 via-neutral-900/90 to-neutral-950 border-2 border-amber-500/60 flex flex-col justify-between space-y-5 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-['Cinzel_Decorative',serif] font-black text-[9px] uppercase tracking-widest rounded-bl-xl shadow-md">
                LIFETIME PASS DISPONIBILE
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                      DIVENTA UN EARLY SUPPORTER
                    </span>
                    <h3 className="text-lg font-heading font-black text-white">
                      Supporta lo Sviluppo & Accesso a Vita
                    </h3>
                  </div>
                </div>

                {currentUser?.isEarlySupporter ? (
                  <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-400/80 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase font-mono">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>🌟 BADGE EARLY SUPPORTER ATTIVO</span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                      Il tuo account (<strong>{currentUser.email}</strong>) dispone del <strong>Lifetime Supporter Pass</strong> convalidato. Hai accesso garantito a vita a ogni singolo plugin commerciale, aggiornamento ed espansione DSP di 171 Plugin Innovation!
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400">Totale donazioni registrate:</span>
                      <strong className="text-amber-400 font-bold">€{cumulativeStats.totalDonated.toFixed(2)}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('il-mio-account')}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                      Visualizza il Tuo Badge in "Il Mio Account" ➔
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Callout box: 20$ Cumulative Lifetime Pass */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border border-amber-500/50 text-xs font-mono space-y-2 text-amber-200 shadow-md">
                      <div className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Donazioni Cumulabili verso il Lifetime Pass:</span>
                      </div>
                      <p className="text-[11.5px] text-white leading-relaxed font-sans">
                        <strong>Grazie per il supporto, le donazioni sono cumulabili: quando arriverai a 20 dollari (o 20€) sbloccherai tutti i plugin</strong> a vita, inclusi aggiornamenti futuri ed espansioni commerciali!
                      </p>

                      {/* Cumulative Progress Tracker */}
                      <div className="pt-1 space-y-1.5 border-t border-amber-500/20">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-neutral-300">
                            Donato finora: <strong className="text-amber-400 font-bold">€{cumulativeStats.totalDonated.toFixed(2)}</strong> / €20.00
                          </span>
                          <span className="text-amber-300 font-bold">
                            {cumulativeStats.remainingForLifetime <= 0
                              ? '🌟 100% (Pass Sbloccato!)'
                              : `Mancano €${cumulativeStats.remainingForLifetime.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.round((cumulativeStats.totalDonated / 20) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Early Access Development Explanation */}
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Il fatto che la suite sia attualmente scaricabile gratis fa parte del nostro <strong>Early Access di Development</strong>. Questa apertura permette lo sviluppo di plugin <strong>sempre più precisi e potenti</strong> grazie ai feedback e ai test sul campo della community.
                    </p>

                    {/* Rewards for verified feedback */}
                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 space-y-1">
                      <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                        <Gift className="w-3.5 h-3.5 shrink-0" />
                        <span>Premi per Feedback Verificati:</span>
                      </div>
                      <p className="text-neutral-300 leading-relaxed">
                        Gli account registrati che forniranno feedback tecnici verificati con problemi reali riscontrati nelle DAW verranno ricompensati con <strong>buoni sconto studio</strong> e <strong>copie gratuite dei futuri plugin commerciali</strong>!
                      </p>
                    </div>

                    {/* Preset & Custom Donation Selection */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                        Seleziona importo o Donazione Libera:
                      </span>
                      <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                        {[
                          { label: '20 € (Lifetime)', val: 20 },
                          { label: '10 €', val: 10 },
                          { label: '5 €', val: 5 },
                          { label: 'Donazione Libera', val: 'custom' as const },
                        ].map((opt) => {
                          const isSel = selectedDonationAmount === opt.val;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => setSelectedDonationAmount(opt.val)}
                              className={`py-2 px-1 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-102'
                                  : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-amber-500/40'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Amount Input Field */}
                      {selectedDonationAmount === 'custom' && (
                        <div className="p-3 rounded-xl bg-black border border-amber-500/50 flex flex-wrap items-center gap-2 animate-in fade-in duration-150">
                          <span className="text-xs font-mono text-amber-400 font-bold uppercase shrink-0">
                            Importo Libero (€):
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={customDonationInput}
                            onChange={(e) => setCustomDonationInput(e.target.value)}
                            placeholder="es. 5, 15, 25..."
                            className="flex-1 min-w-[90px] px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                          />
                          <div className="flex gap-1 shrink-0">
                            {[3, 5, 10, 15, 25].map((presetVal) => (
                              <button
                                key={presetVal}
                                type="button"
                                onClick={() => setCustomDonationInput(presetVal.toString())}
                                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-[10px] font-mono text-neutral-300 hover:text-amber-400 border border-neutral-700 transition-colors cursor-pointer"
                              >
                                {presetVal}€
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!currentUser?.isEarlySupporter && (
                <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                  {activeDonation ? (
                    <div className="p-3.5 rounded-xl bg-neutral-950/90 border border-amber-500/60 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 font-bold">DONAZIONE #{activeDonation.donationCode}</span>
                        <span className="text-white font-black">€{activeDonation.amount.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                        Hai completato la donazione su PayPal? Inserisci il <strong>Codice Transazione / ID Ricevuta PayPal</strong> per convalidarla istantaneamente e aggiornare il tuo cumulo:
                      </p>

                      {donationTxError && (
                        <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/60 text-[11px] font-mono text-red-300">
                          {donationTxError}
                        </div>
                      )}

                      {donationTxSuccess ? (
                        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-xs font-mono text-emerald-300 space-y-2">
                          <p className="font-bold">{donationTxSuccess}</p>
                          <button
                            type="button"
                            onClick={() => onNavigate('il-mio-account')}
                            className="w-full py-2 px-3 rounded-lg bg-emerald-500 text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-400 cursor-pointer"
                          >
                            Visualizza il Tuo Badge in "Il Mio Account" ➔
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleVerifyDonationTx} className="space-y-2">
                          <input
                            type="text"
                            value={donationTxInput}
                            onChange={(e) => setDonationTxInput(e.target.value)}
                            placeholder="es. 9XY81742... o ID Ricevuta PayPal"
                            className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-700 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isVerifyingDonation || !donationTxInput.trim()}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isVerifyingDonation ? 'Verifica in corso...' : 'Convalida Transazione & Aggiorna Cumulo'}</span>
                            </button>
                            <a
                              href={activeDonation.paypalPaymentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1"
                              title="Riapri PayPal"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <>
                      {!currentUser && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-neutral-400 uppercase block">
                            La tua Email per associare le donazioni cumulabili:
                          </label>
                          <input
                            type="email"
                            value={donorEmailInput}
                            onChange={(e) => setDonorEmailInput(e.target.value)}
                            placeholder="nome@dominio.com"
                            className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartDonation()}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-black" />
                        <span>
                          {cumulativeStats.totalDonated + getEffectiveDonationAmount() >= 20 || getEffectiveDonationAmount() >= 20
                            ? `Dona ${getEffectiveDonationAmount()} € • Sblocca Subito Tutti i Plugin a Vita!`
                            : `Dona ${getEffectiveDonationAmount()} € (Cumulabile verso i 20$)`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
                        <span>PayPal Destinatario: <strong className="text-white">{effectivePaypalEmail}</strong></span>
                        <a
                          href={paypalMeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>PayPal.Me Diretto</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Community Feedbacks for this Plugin */}
          {relatedFeedbacks.length > 0 && (
            <div className="pt-6 border-t border-neutral-800 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                FEEDBACK DEI PRODUTTORI SU {thankYouPlugin.name.toUpperCase()} ({relatedFeedbacks.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedFeedbacks.slice(0, 4).map((fb) => (
                  <div
                    key={fb.id}
                    className="p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-mono">{fb.userName}</strong>
                      <span className="text-amber-400 font-mono text-[11px]">
                        {'★'.repeat(fb.rating)}{'☆'.repeat(Math.max(0, 5 - fb.rating))} • {fb.dawUsed}
                      </span>
                    </div>
                    <p className="text-neutral-300 font-light italic">"{fb.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-28 pb-16 px-4 sm:px-8 max-w-5xl mx-auto">
      
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
          <span className="text-amber-400">171 STUDIO</span> / I Nostri Plugin (.ZIP Free Download)
        </span>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-10">
        
        {/* Title & Introduction */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-4">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>{siteContent.pluginIntroBadge || 'SOFTWARE DSP & INGEGNERIA AUDIO • 100% FREEWARE'}</span>
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight mb-4">
            {siteContent.pluginIntroTitle || '171 Plugin Innovatio'}
          </h1>

          <p className="text-lg sm:text-xl text-neutral-300 font-light leading-relaxed">
            {siteContent.pluginIntroSubtitle || "I nostri plugin audio di nuova generazione: strumenti digitali proprietari gratuiti concepiti e calibrati all'interno di 171 Studio per offrire una qualità da studio professionale direttamente nella tua DAW."}
          </p>
        </div>

        {/* Cos'è 171 Plugin Innovatio */}
        <div className="p-8 sm:p-10 rounded-3xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
              {siteContent.pluginAboutSectionTitle || "Cos'è 171 Plugin Innovatio"}
            </h2>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
            <p>
              {siteContent.pluginAboutSectionText1 || "171 Plugin Innovatio è la divisione di ricerca e sviluppo software di 171 Studio. Nasce da un'esigenza diretta: durante le nostre sessioni quotidiane di missaggio e mastering cercavamo plugin che combinassero la musicalità e la pasta sonora degli outboard analogici d'epoca con la flessibilità chirurgica e la stabilità del software moderno."}
            </p>
            <p>
              {siteContent.pluginAboutSectionText2 || 'Il nostro è un progetto gratuito e rimarrà sempre tale: scarica liberamente i pacchetti .ZIP dei plugin, provali nelle tue produzioni e lasciaci un feedback per aiutarci a migliorarli costantemente!'}
            </p>
          </div>
        </div>

        {/* Benefici Chiave */}
        <div>
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
              VANTAGGI COMPETITIVI
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white mt-1">
              {siteContent.pluginBenefitsTitle || 'Quali Benefici Offrono i Nostri Plugin'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dynamicBenefits.map((item, idx) => {
              const Icon = benefitIcons[idx % benefitIcons.length];
              return (
                <div
                  key={item.id || idx}
                  className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800/80 hover:border-amber-500/40 backdrop-blur-xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-black transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-amber-500/30 uppercase">
                      {item.tag}
                    </span>
                  </div>

                  <h4 className="font-heading font-bold text-lg text-white group-hover:text-amber-400 transition-colors mb-2">
                    {item.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plugin Suite Catalog with Free .ZIP Download */}
        <div className="p-6 sm:p-10 rounded-3xl bg-neutral-950/85 border border-amber-500/30 backdrop-blur-xl shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  CATALOGO SUITE & FREE DOWNLOAD (.ZIP)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                Scarica Gratis i Plugin di 171 Studio
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1">
                6 strumenti DSP boutique ufficiali con modellazione fisica, VST3 64-bit, Standalone EXE e tecnologia proprietaria per missaggio e mastering.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <span className="text-[11px] font-mono text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>VST3 + AudioUnit v2 + Standalone</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1.5">
                <span>🍏 macOS Universal (M1-M4 & Intel)</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-300 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center gap-1.5">
                <span>🪟 Windows 64-bit</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {siteContent.plugins.map((plugin) => {
              const isDownloaded = downloadSuccessId === plugin.id;
              const zipFileLabel =
                plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Installer.zip`;
              const isTechExpanded = expandedTechPluginId[plugin.id] ?? true;
              const hasTechnologies = plugin.technologies && plugin.technologies.length > 0;

              return (
                <HardwareTiltCard 
                  key={plugin.id} 
                  maxTilt={6}
                  glareColor="gold"
                  showCornerRivets={true}
                  className="p-6 sm:p-7 rounded-3xl bg-neutral-900/80 backdrop-blur-md flex flex-col justify-between group overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block mb-1">
                          {plugin.badge}
                        </span>
                        <h4 className="font-heading font-black text-2xl text-white group-hover:text-amber-400 transition-colors">
                          {plugin.name}
                        </h4>
                        {plugin.version && (
                          <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                            {plugin.version}
                          </span>
                        )}
                      </div>
                      {plugin.status === 'IN ARRIVO' ? (
                        <span className="shrink-0 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>IN ARRIVO</span>
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {plugin.status}
                        </span>
                      )}
                    </div>

                    {/* Preview Image if available */}
                    {plugin.imageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 hover:border-amber-500/50 group/img bg-neutral-950 aspect-[1024/571] flex items-center justify-center transition-all duration-300 shadow-inner">
                        <img 
                          src={getAssetUrl(plugin.imageUrl)} 
                          alt={`${plugin.name} GUI Snapshot`} 
                          className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
                          onClick={() => setPreviewModalImage(plugin.imageUrl || null)}
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-neutral-700/80 text-[10px] font-mono text-neutral-300 flex items-center gap-1.5 pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>GUI Fotorealistica</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewModalImage(plugin.imageUrl || null)}
                          className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-amber-400 hover:text-amber-300 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ingrandisci GUI Hardware</span>
                        </button>
                      </div>
                    )}

                    {/* Formats Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(plugin.formats || ['VST3 (64-bit)', 'Standalone App (.EXE)']).map((fmt, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-neutral-950/80 border border-neutral-800 text-neutral-300"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>

                    {/* Short Description */}
                    <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-1.5">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">
                        Descrizione Breve:
                      </span>
                      <p className="text-xs sm:text-sm text-neutral-200 font-light leading-relaxed">
                        {plugin.description}
                      </p>
                    </div>

                    {/* Technologies & DSP Architecture Section */}
                    {hasTechnologies && (
                      <div className="rounded-2xl bg-neutral-950/90 border border-amber-500/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedTechPluginId(prev => ({ ...prev, [plugin.id]: !isTechExpanded }))}
                          className="w-full px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                              Tecnologie & Architettura DSP ({plugin.technologies?.length})
                            </span>
                          </div>
                          {isTechExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>

                        {isTechExpanded && (
                          <div className="p-4 space-y-2.5 text-xs text-neutral-300 border-t border-neutral-800/80 animate-in fade-in duration-200">
                            {plugin.technologies?.map((tech, techIdx) => (
                              <div key={techIdx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span className="leading-relaxed font-light text-[11.5px] text-neutral-200">
                                  {tech}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Package details banner */}
                    {plugin.status === 'IN ARRIVO' ? (
                      <div className="p-3 rounded-xl bg-neutral-950/90 border border-amber-500/30 text-[11px] font-mono text-amber-300 flex items-center justify-between gap-2 shadow-inner">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-neutral-300">Stato: <span className="text-amber-400 font-semibold">Calibrazione DSP & Fine Tuning</span></span>
                        </span>
                        <span className="text-amber-400 shrink-0 font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px]">
                          PROSSIMA USCITA
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 truncate" title={zipFileLabel}>
                            <span className="text-blue-400 font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">🪟 WIN</span>
                            <span className="truncate text-neutral-300">{zipFileLabel}</span>
                          </span>
                          <span className="text-emerald-400 shrink-0 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                            {plugin.zipFileSize || 'Win .ZIP'}
                          </span>
                        </div>

                        {plugin.macZipFileName && (
                          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 truncate" title={plugin.macZipFileName}>
                              <span className="text-amber-400 font-bold shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">🍏 MAC</span>
                              <span className="truncate text-neutral-300">{plugin.macZipFileName}</span>
                            </span>
                            <span className="text-cyan-400 shrink-0 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px]">
                              {plugin.macZipFileSize || 'Mac .ZIP'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer with Dual Windows & macOS Download Buttons */}
                  <div className="pt-4 mt-4 border-t border-neutral-800/80 space-y-3">
                    {plugin.status === 'IN ARRIVO' ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5 text-amber-400/90 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>In arrivo sul catalogo 171 Studio</span>
                          </span>
                          <span className="text-amber-400/80 text-[10px] font-mono font-semibold">VST3 • AUv2 • Standalone</span>
                        </div>

                        <div className="w-full py-3.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2 shadow-inner select-none">
                          <Clock className="w-4 h-4 animate-pulse text-amber-400" />
                          <span>IN ARRIVO</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5 text-neutral-400" />
                            <span>{plugin.downloadCount || 0} download registrati</span>
                          </span>
                          <span className="text-emerald-400/80 text-[10px] font-mono">AUv2 • VST3 • Standalone</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Windows Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(plugin, 'win')}
                            className={`py-3 px-3 rounded-xl text-[11px] font-mono uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                              downloadSuccessId === `${plugin.id}-win`
                                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 hover:text-white border border-neutral-700 hover:border-blue-500/40 hover:scale-[1.01]'
                            }`}
                            title={`Scarica versione Windows 64-bit (${plugin.zipFileSize})`}
                          >
                            {downloadSuccessId === `${plugin.id}-win` ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Scaricato (Win)</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 text-blue-400" />
                                <span>🪟 Win ({plugin.zipFileSize})</span>
                              </>
                            )}
                          </button>

                          {/* macOS Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(plugin, 'mac')}
                            className={`py-3 px-3 rounded-xl text-[11px] font-mono uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                              downloadSuccessId === `${plugin.id}-mac`
                                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 hover:scale-[1.01]'
                            }`}
                            title={`Scarica versione macOS Universal AU & VST3 (${plugin.macZipFileSize})`}
                          >
                            {downloadSuccessId === `${plugin.id}-mac` ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Scaricato (Mac)</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>🍏 Mac ({plugin.macZipFileSize})</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </HardwareTiltCard>
              );
            })}
          </div>
        </div>

        {/* Early Access / Support Card - Optimized for Desktop Full Screen and Mobile */}
        <div className="rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/40 border-2 border-amber-500/40 backdrop-blur-xl shadow-2xl p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Context, Benefits & Value Proposition */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>EARLY ACCESS DEVELOPMENT & EARLY SUPPORTER PASS</span>
              </div>

              <h4 className="text-2xl sm:text-3xl font-heading font-black text-white leading-tight">
                Diventa Early Supporter ($20): <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Accesso a Vita</span> a Ogni Futuro Plugin
              </h4>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                La suite di 171 Plugin Innovation è attualmente disponibile in <strong>Early Access di Development</strong>: la community testa sul campo gli algoritmi DSP nelle proprie DAW e ci aiuta a perfezionare ogni processore analogico virtuale. Con un contributo di <strong>20$ (o 20€)</strong> sblocchi il <strong>Lifetime Pass a vita</strong> per tutti i plugin futuri!
              </p>

              {/* Supporter Key Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Accesso a vita a tutti i plugin futuri</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Donazioni cumulabili fino alla soglia di 20$</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Aggiornamenti continui e supporto DSP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Sconti studio e licenze gratis per tester</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Supporter & Donation Console */}
            <div className="lg:col-span-5 w-full">
              <div className="rounded-2xl bg-black/70 border border-amber-500/30 p-6 space-y-4 shadow-xl">
                {currentUser?.isEarlySupporter ? (
                  <div className="text-center space-y-3 py-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-heading font-black text-white text-base block">
                        🌟 EARLY SUPPORTER ATTIVO
                      </span>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">
                        Hai il Lifetime Pass: accesso garantito a vita a tutti i plugin di 171 Studio.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('il-mio-account')}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      Visualizza Badge in Area Clienti
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Real-time cumulative progress mini tracker */}
                    <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-400">Progresso Lifetime Pass:</span>
                        <span className="text-amber-400 font-bold">
                          €{cumulativeStats.totalDonated.toFixed(2)} / €20.00
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black border border-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((cumulativeStats.totalDonated / 20) * 100))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 font-mono text-right">
                        {cumulativeStats.remainingForLifetime <= 0
                          ? 'Traguardo 20$ raggiunto!'
                          : `Mancano solo €${cumulativeStats.remainingForLifetime.toFixed(2)} per sbloccare tutti i plugin`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDonationAmount(20);
                          setShowDonationModal(true);
                        }}
                        className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-black" />
                        <span>Dona 20$ / 20€ • Sblocca Lifetime Pass</span>
                        <Sparkles className="w-3.5 h-3.5 text-black" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDonationAmount('custom');
                          setShowDonationModal(true);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 font-heading font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-amber-400" />
                        <span>Donazione Libera (Cumulabile)</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Bug Report / Feedback link */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => onNavigate('il-mio-account')}
                    className="w-full py-2.5 px-3 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 text-[11px] font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5 text-red-400" />
                    <span>Invia Feedback Tecnico o Segnala un Bug</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Dedicated Early Supporter Donation & PayPal Verification Modal */}
      {showDonationModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowDonationModal(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-neutral-950 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    EARLY SUPPORTER & DONAZIONI CUMULABILI
                  </span>
                  <h3 className="text-lg font-heading font-black text-white">
                    Supporta lo Sviluppo & Accesso a Vita
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDonationModal(false)}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core cumulative message card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border-2 border-amber-500/50 text-xs font-mono space-y-2 text-amber-200 shadow-md">
              <div className="font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Accesso a Vita Garantito & Cumulo Donazioni:</span>
              </div>
              <p className="text-[11.5px] text-white leading-relaxed font-sans">
                <strong>Grazie per il supporto, le donazioni sono cumulabili: quando arriverai a 20 dollari (o 20€) sbloccherai tutti i plugin</strong> a vita, inclusi tutti i futuri algoritmi DSP e release commerciali di 171 Plugin Innovation!
              </p>

              {/* Real-time cumulative progress bar */}
              <div className="pt-1.5 space-y-1.5 border-t border-amber-500/25">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-neutral-300">
                    Totale donato finora: <strong className="text-amber-400 font-bold">€{cumulativeStats.totalDonated.toFixed(2)}</strong> / €20.00
                  </span>
                  <span className="text-amber-300 font-bold">
                    {cumulativeStats.remainingForLifetime <= 0
                      ? '🌟 100% (Pass Sbloccato!)'
                      : `Mancano €${cumulativeStats.remainingForLifetime.toFixed(2)}`}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((cumulativeStats.totalDonated / 20) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              La suite gratuita è in <strong>Early Access di Development</strong> per permettere alla community di testare gli algoritmi DSP nelle DAW e aiutarci a renderli <strong>sempre più precisi e potenti</strong>. Inoltre, chi invia feedback tecnici verificati riceverà <strong>buoni sconto in studio e plugin commerciali gratuiti</strong>!
            </p>

            {/* Chips selector */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block font-semibold">
                Seleziona importo o scegli Donazione Libera:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                {[
                  { label: '20 € (Lifetime)', val: 20 },
                  { label: '10 €', val: 10 },
                  { label: '5 €', val: 5 },
                  { label: 'Donazione Libera', val: 'custom' as const },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedDonationAmount(opt.val)}
                    className={`py-3 px-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                      selectedDonationAmount === opt.val
                        ? 'bg-amber-500 text-black border-amber-400 shadow-lg scale-102 font-extrabold'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-amber-500/40 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input Field */}
              {selectedDonationAmount === 'custom' && (
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/50 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-amber-400 font-bold uppercase shrink-0">
                      Importo Libero (€):
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customDonationInput}
                      onChange={(e) => setCustomDonationInput(e.target.value)}
                      placeholder="es. 5, 15, 25..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-black border border-neutral-700 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">Scorciatoie:</span>
                    {[3, 5, 10, 15, 25, 50].map((presetVal) => (
                      <button
                        key={presetVal}
                        type="button"
                        onClick={() => setCustomDonationInput(presetVal.toString())}
                        className="px-2.5 py-1 rounded-lg bg-black hover:bg-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-amber-400 border border-neutral-700 transition-colors cursor-pointer"
                      >
                        {presetVal}€
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Verification Box or Start Button */}
            {activeDonation ? (
              <div className="p-4 rounded-2xl bg-black border border-amber-500/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">DONAZIONE #{activeDonation.donationCode}</span>
                  <span className="text-white font-black">€{activeDonation.amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-neutral-300 font-sans">
                  Inserisci il <strong>Codice Transazione / ID Ricevuta PayPal</strong> per verificare e aggiornare il tuo cumulo:
                </p>

                {donationTxError && (
                  <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-xs font-mono text-red-300">
                    {donationTxError}
                  </div>
                )}

                {donationTxSuccess ? (
                  <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-xs font-mono text-emerald-300 space-y-3">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{donationTxSuccess}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDonationModal(false);
                        onNavigate('il-mio-account');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors cursor-pointer"
                    >
                      Vai a Il Mio Account per visualizzare il tuo Badge ➔
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyDonationTx} className="space-y-2.5">
                    <input
                      type="text"
                      value={donationTxInput}
                      onChange={(e) => setDonationTxInput(e.target.value)}
                      placeholder="es. 9XY81742... o ID Ricevuta PayPal"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-500 text-white font-mono text-xs focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isVerifyingDonation || !donationTxInput.trim()}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isVerifyingDonation ? 'Verifica in corso...' : 'Convalida Transazione & Aggiorna Cumulo'}</span>
                      </button>
                      <a
                        href={activeDonation.paypalPaymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1"
                        title="Riapri PayPal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!currentUser && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Tua Email per associare le donazioni cumulabili:
                    </label>
                    <input
                      type="email"
                      value={donorEmailInput}
                      onChange={(e) => setDonorEmailInput(e.target.value)}
                      placeholder="nome@dominio.com"
                      className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleStartDonation()}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-black" />
                  <span>
                    {cumulativeStats.totalDonated + getEffectiveDonationAmount() >= 20 || getEffectiveDonationAmount() >= 20
                      ? `Dona ${getEffectiveDonationAmount()} € • Sblocca Subito Tutti i Plugin a Vita!`
                      : `Dona ${getEffectiveDonationAmount()} € (Cumulabile verso i 20$)`}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* High-Resolution Hardware GUI Modal */}
      {previewModalImage && (() => {
        const activePluginPreview = siteContent.plugins.find((p) => p.imageUrl === previewModalImage);
        return (
          <div 
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewModalImage(null)}
          >
            <div 
              className="relative max-w-5xl w-full bg-neutral-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-heading font-black text-white flex items-center gap-2">
                      <span>{activePluginPreview?.name || '171 Plugin Innovation'}</span>
                      {activePluginPreview?.badge && (
                        <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                          {activePluginPreview.badge}
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Interfaccia Grafica Fotorealistica (1024x571) • Formato nativo VST3 / Standalone
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalImage(null)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Chiudi anteprima"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-neutral-800 max-h-[75vh] flex items-center justify-center bg-black/90 p-1">
                <img 
                  src={getAssetUrl(previewModalImage)} 
                  alt={activePluginPreview?.name || "Hardware GUI Snapshot"} 
                  className="w-full h-auto max-h-[72vh] object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
