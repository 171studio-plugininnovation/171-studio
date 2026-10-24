import React, { useState } from 'react';
import {
  ArrowLeft, Cpu, Sparkles, Zap, Flame, Shield, Sliders, Download,
  Check, Mail, Star, Heart, MessageSquare, ExternalLink, FileArchive,
  CheckCircle2, Send, Lock, Bug, ChevronDown, ChevronUp, Eye, X, Layers
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { PluginItem, STUDIO_PAYPAL_EMAIL } from '../types/cms';
import { getPayPalDonationUrl, getPayPalMeUrl, triggerPluginZipFileDownload } from '../utils/emailService';
import { getAssetUrl } from '../utils/assetPath';

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
  } = useStudio();

  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [thankYouPlugin, setThankYouPlugin] = useState<PluginItem | null>(null);

  // Expanded technologies state for each plugin (all open by default so user can read everything)
  const [expandedTechPluginId, setExpandedTechPluginId] = useState<Record<string, boolean>>({
    'plugin-optocom': true,
    'plugin-perfectpre': true,
    'plugin-cleandrive': true,
    'plugin-cleanreso': true,
  });

  // Modal for previewing hardware GUI snapshot
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Feedback form state on the post-download page
  const [rating, setRating] = useState<number>(5);
  const [dawUsed, setDawUsed] = useState<string>('Ableton Live');
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Donation amount state (null = free amount on PayPal)
  const [selectedDonationAmount, setSelectedDonationAmount] = useState<number | undefined>(undefined);

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

  const handleDownload = (plugin: PluginItem) => {
    if (!currentUser) {
      openAuthModal(`Accedi o registrati gratuitamente per scaricare il pacchetto .ZIP di "${plugin.name}".`);
      return;
    }

    const success = downloadPlugin(plugin.id);
    if (success) {
      setDownloadSuccessId(plugin.id);
      setFeedbackSubmitted(false);
      setFeedbackComment('');
      setRating(5);
      // Open the dedicated post-download Thank You, Feedback & Free Donation page
      setThankYouPlugin(plugin);
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

  // POST-DOWNLOAD DEDICATED PAGE: "Grazie per aver scaricato <Nome del Plugin>" + Feedback + Free PayPal Donation
  if (thankYouPlugin) {
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const donationUrl = getPayPalDonationUrl(selectedDonationAmount, thankYouPlugin.name, effectivePaypalEmail);
    const paypalMeLink = getPayPalMeUrl(selectedDonationAmount);
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
                Per noi è molto importante che tu lasci un <strong>feedback sui nostri plugin</strong> per permetterci di migliorarli continuamente.
              </p>
              <p className="text-amber-300 font-medium">
                Il nostro è un <strong>progetto gratuito e sempre rimarrà tale</strong>: se vuoi sostenerci, ecco qui sotto il link PayPal per una donazione libera!
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

            {/* Column 2: Free PayPal Donation */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-950/40 via-neutral-900/90 to-neutral-950 border border-blue-500/40 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Heart className="w-5 h-5 fill-blue-400/30" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-bold block">
                      100% OPEN & FREEWARE DSP
                    </span>
                    <h3 className="text-lg font-heading font-bold text-white">
                      Sostienici con una Donazione Libera
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  <strong>171 Plugin Innovation</strong> è un progetto gratuito nato a Messina e <strong>rimarrà sempre gratuito</strong> per tutti gli artisti e produttori. Se i nostri plugin ti aiutano nei tuoi mix e vuoi offrire un caffè o sostenere lo sviluppo di nuovi algoritmi DSP, puoi fare una donazione libera su PayPal:
                </p>

                {/* Optional Preset Donation Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                    Scegli un importo o lascia Donazione Libera:
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                    {[
                      { label: 'Libera', val: undefined },
                      { label: '5 €', val: 5 },
                      { label: '10 €', val: 10 },
                      { label: '25 €', val: 25 },
                    ].map((opt) => {
                      const isSel = selectedDonationAmount === opt.val;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => setSelectedDonationAmount(opt.val)}
                          className={`py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                              : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-amber-500/40'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-800/80">
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all"
                >
                  <Heart className="w-4 h-4 fill-black" />
                  <span>
                    Donazione Libera PayPal
                    {selectedDonationAmount ? ` (${selectedDonationAmount} €)` : ''}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1">
                  <span>PayPal Studio: <strong className="text-white">{effectivePaypalEmail}</strong></span>
                  <a
                    href={paypalMeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>PayPal.Me Diretto</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
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
                4 strumenti DSP boutique originali con modellazione fisica e tecnologia proprietaria per missaggio e mastering.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <span className="text-[11px] font-mono text-emerald-400 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>VST3 64-bit + Standalone EXE</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800">
                Windows 64-bit Ready
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {siteContent.plugins.map((plugin) => {
              const isDownloaded = downloadSuccessId === plugin.id;
              const zipFileLabel =
                plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Installer.zip`;
              const isTechExpanded = expandedTechPluginId[plugin.id] ?? true;
              const hasTechnologies = plugin.technologies && plugin.technologies.length > 0;

              return (
                <div 
                  key={plugin.id} 
                  className="p-6 sm:p-7 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl relative overflow-hidden"
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
                      <span className="shrink-0 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {plugin.status}
                      </span>
                    </div>

                    {/* Preview Image if available */}
                    {plugin.imageUrl && (
                      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 group/img bg-neutral-950">
                        <img 
                          src={getAssetUrl(plugin.imageUrl)} 
                          alt={`${plugin.name} GUI Snapshot`} 
                          className="w-full h-44 object-cover object-center group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
                          onClick={() => setPreviewModalImage(plugin.imageUrl || null)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewModalImage(plugin.imageUrl || null)}
                          className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-amber-400 border border-amber-500/40 text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer"
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
                    <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 truncate" title={zipFileLabel}>
                        <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">{zipFileLabel}</span>
                      </span>
                      <span className="text-emerald-400 shrink-0 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {plugin.zipFileSize || 'Archivio .ZIP'}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-5 mt-5 border-t border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{plugin.downloadCount || 0} download registrati</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDownload(plugin)}
                      className={`px-5 py-3 rounded-xl text-xs font-mono uppercase tracking-wider font-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        isDownloaded 
                          ? 'bg-emerald-500 text-black shadow-emerald-500/30' 
                          : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 hover:scale-[1.02]'
                      }`}
                    >
                      {isDownloaded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Scaricato (.ZIP)</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Scarica Pacchetto .ZIP ({plugin.zipFileSize})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Early Access / Support Card */}
        <div className="p-8 rounded-3xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider block mb-1">
              PROGETTO GRATUITO & SUPPORTO LIBERO
            </span>
            <h4 className="text-lg font-heading font-bold text-white mb-1">
              Vuoi sostenere lo sviluppo gratuito di 171 Plugin Innovation?
            </h4>
            <p className="text-xs text-neutral-300 font-light">
              I nostri plugin sono e saranno sempre gratuiti. Puoi supportarci con una donazione libera su PayPal o scriverci il tuo feedback tecnico.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={getPayPalDonationUrl(undefined, '171 Plugin Innovation', siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Heart className="w-4 h-4 fill-black" />
              <span>Donazione Libera PayPal</span>
            </a>

            <a
              href={`mailto:${siteContent.contactEmail}?subject=Feedback%20171%20Plugin%20Innovatio`}
              className="px-5 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Invia Feedback</span>
            </a>
          </div>
        </div>

      </div>

      {/* High-Resolution Hardware GUI Modal */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full bg-neutral-950 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Snapshot Hardware Ufficiale Interfaccia Utente
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Chiudi anteprima"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-neutral-800 max-h-[75vh] flex items-center justify-center bg-black">
              <img 
                src={getAssetUrl(previewModalImage)} 
                alt="Hardware GUI Snapshot" 
                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
