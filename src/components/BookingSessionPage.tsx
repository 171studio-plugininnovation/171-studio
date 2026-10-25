import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, Calendar as CalendarIcon, Clock, User, Mail, Phone, 
  CheckCircle2, Sparkles, Info, ShieldCheck, DollarSign, Send, RotateCcw,
  Lock, LogIn, ChevronRight, Check, CreditCard, ExternalLink, Copy, Sliders, Sun, Moon, Zap, Tag, Gift, Percent, X, Download
} from 'lucide-react';
import { PageId } from '../types';
import { 
  SERVICE_OPTIONS, ServiceType, getDynamicServiceOptions, calculateEstimatedPrice, formatDurationLabel, calculateEndTime 
} from '../utils/pricing';
import { useStudio } from '../context/StudioContext';
import { BookingRecord, STUDIO_PAYPAL_EMAIL, VoucherItem } from '../types/cms';
import { BookingCalendar } from './BookingCalendar';
import { isRangeOverlapping, getBookingInterval } from '../utils/calendarSlots';

interface BookingSessionPageProps {
  onNavigate: (page: PageId) => void;
}

export const BookingSessionPage: React.FC<BookingSessionPageProps> = ({ onNavigate }) => {
  const {
    currentUser,
    openAuthModal,
    createBooking,
    bookings,
    siteContent,
    lastSentEmail,
    isGmailConnected,
    sendReceiptEmailViaGmail,
    validateAndCalculateDiscount,
    openGmailWebCompose,
    openMailtoCompose,
    openClientContactStudioGmail,
    downloadBookingCalendarIcs,
    openGoogleCalendarWeb,
  } = useStudio();

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceType>('recording_hourly');
  const [hours, setHours] = useState<number>(2); // Default 2h (supports 1, 1.5, 2, 2.5, 3, etc.)
  const [preferredFascia, setPreferredFascia] = useState<'tutti' | 'pomeriggio' | 'sera'>('tutti');
  const [dataPreferita, setDataPreferita] = useState(todayStr);
  const [oraPreferita, setOraPreferita] = useState('15:00');
  const [note, setNote] = useState('');
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState<BookingRecord | null>(null);
  const [copiedPayment, setCopiedPayment] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Voucher & 5% Registration Discount state
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>('');
  const [voucherMessage, setVoucherMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Pre-fill user data when logged in & auto-suggest registration 5% code if available
  useEffect(() => {
    if (currentUser) {
      if (!nome) setNome(currentUser.name);
      if (!email) setEmail(currentUser.email);
      const regCode = currentUser.welcomeDiscountCode || siteContent.registrationDiscountCode || 'BENVENUTO5';
      if (
        !appliedVoucherCode &&
        !currentUser.welcomeDiscountUsed &&
        siteContent.registrationDiscountEnabled !== false
      ) {
        setVoucherInput(regCode);
      }
    }
  }, [currentUser, nome, email, appliedVoucherCode, siteContent.registrationDiscountCode, siteContent.registrationDiscountEnabled]);

  const dynamicServiceOptions = useMemo(() => getDynamicServiceOptions(siteContent), [siteContent]);
  const currentServiceObj = dynamicServiceOptions.find((s) => s.id === selectedService) || dynamicServiceOptions[0];
  const effectiveHours = currentServiceObj.allowsExtraHours ? hours : 2;
  const estimate = calculateEstimatedPrice(selectedService, effectiveHours, siteContent);

  // Live discount calculation whenever service, hours, email, or appliedVoucherCode changes
  const discountCalculation = useMemo(() => {
    if (!appliedVoucherCode) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: estimate.total,
        message: '',
      };
    }
    return validateAndCalculateDiscount(
      appliedVoucherCode,
      selectedService,
      estimate.total,
      email || currentUser?.email
    );
  }, [appliedVoucherCode, selectedService, estimate.total, email, currentUser?.email, validateAndCalculateDiscount]);

  const finalPriceToPay = discountCalculation.valid ? discountCalculation.finalPrice : estimate.total;

  const handleApplyVoucher = (codeToApply?: string) => {
    const targetCode = (codeToApply ?? voucherInput).trim().toUpperCase();
    if (!targetCode) {
      setVoucherMessage({ text: 'Inserisci un codice sconto o voucher.', isError: true });
      return;
    }
    const res = validateAndCalculateDiscount(
      targetCode,
      selectedService,
      estimate.total,
      email || currentUser?.email
    );
    if (res.valid) {
      setVoucherInput(targetCode);
      setAppliedVoucherCode(targetCode);
      setVoucherMessage({ text: res.message || 'Codice sconto applicato!', isError: false });
    } else {
      setAppliedVoucherCode('');
      setVoucherMessage({ text: res.message || 'Codice sconto non valido per questo servizio.', isError: true });
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucherCode('');
    setVoucherMessage(null);
  };

  // Computed end time based on start time & selected hours
  const calculatedEndTime = useMemo(() => {
    if (!oraPreferita) return '';
    return calculateEndTime(oraPreferita, effectiveHours);
  }, [oraPreferita, effectiveHours]);

  // Formatted date string for summary
  const formattedSelectedDate = useMemo(() => {
    if (!dataPreferita) return 'Nessuna data';
    const [y, m, d] = dataPreferita.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [dataPreferita]);

  // Check if chosen time range is already booked or blocked by Master (dynamic adaptation check)
  const isSlotBookedOrBlocked = useMemo(() => {
    if (!dataPreferita || !oraPreferita || !calculatedEndTime) return false;

    // Check Master all-day block
    const blockedCommitments = siteContent.calendarSettings?.blockedCommitments || [];
    const allDayBlock = blockedCommitments.find(b => b.date === dataPreferita && b.allDay);
    if (allDayBlock) return true;

    // Check conflict with other bookings on this date
    const dateBookings = bookings.filter(b => b.date === dataPreferita && b.status !== 'annullata');
    const hasBookingConflict = dateBookings.some(b => {
      const { start: bStart, end: bEnd } = getBookingInterval(b);
      return isRangeOverlapping(oraPreferita, calculatedEndTime, bStart, bEnd);
    });
    if (hasBookingConflict) return true;

    // Check conflict with specific Master slot blocks
    const slotBlocks = blockedCommitments.filter(b => b.date === dataPreferita && !b.allDay);
    const hasBlockConflict = slotBlocks.some(b => {
      return (b.timeSlots || []).some(slotTime => {
        const blockEnd = calculateEndTime(slotTime, 1);
        return isRangeOverlapping(oraPreferita, calculatedEndTime, slotTime, blockEnd);
      });
    });

    return hasBlockConflict;
  }, [bookings, siteContent.calendarSettings?.blockedCommitments, dataPreferita, oraPreferita, calculatedEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim() || !email.trim() || !telefono.trim() || !dataPreferita || !oraPreferita) {
      setFormError('Compila tutti i campi obbligatori contrassegnati con * (Nome, Email, Telefono) e seleziona data e orario.');
      return;
    }

    if (isSlotBookedOrBlocked) {
      setFormError('L\'intervallo orario selezionato entra in conflitto con un\'altra sessione o impegno dello studio. Seleziona un orario differente nel calendario.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createBooking({
        userName: nome.trim(),
        userEmail: email.trim(),
        userPhone: telefono.trim(),
        serviceId: selectedService,
        serviceTitle: currentServiceObj.title,
        hours: effectiveHours,
        date: dataPreferita,
        time: oraPreferita,
        endTime: calculatedEndTime,
        estimatedPrice: finalPriceToPay,
        originalPrice: estimate.total,
        discountCode: discountCalculation.valid ? appliedVoucherCode : undefined,
        discountAmount: discountCalculation.valid ? discountCalculation.discountAmount : undefined,
        notes: note.trim(),
      });

      setSubmittedBooking(created);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const e = err as Error;
      setFormError(e.message || 'Si è verificato un errore durante l\'invio della prenotazione.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedPayment(true);
    setTimeout(() => setCopiedPayment(false), 2500);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmittedBooking(null);
    setTelefono('');
    setNote('');
  };

  // Quick duration presets
  const durationPresets = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5];

  return (
    <div className="relative z-10 w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between pt-28 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
      
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-6">
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
          <span className="text-amber-400 font-bold">171 STUDIO</span> / Prenota Sessione
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col gap-8">
        
        {/* Title & Introduction */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-widest uppercase mb-4">
            <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>{siteContent.bookingBadge || 'BOOKING SESSIONI & CALENDARIO INTELLIGENTE'}</span>
          </div>
          
          <h1 className="font-heading font-black text-4xl sm:text-6xl text-white tracking-tight mb-3">
            {siteContent.bookingTitle || 'Prenota la tua Sessione'}
          </h1>
          
          <p className="text-neutral-300 text-sm sm:text-base font-light leading-relaxed">
            {siteContent.bookingSubtitle || 'Seleziona la durata con la barra oraria, scegli la tua fascia preferita (pomeriggio o sera) e prenota il tuo slot ideale tra le 15:00 e le 20:00.'}
          </p>
        </div>

        {/* Studio Acoustic & Recording Philosophy Notice */}
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs sm:text-sm text-neutral-300 leading-relaxed font-light">
            <strong className="text-amber-400 font-semibold block mb-1 uppercase tracking-wider font-mono">
              Ambiente di Ripresa & Feedback Diretto
            </strong>
            A 171 Studio <span className="text-white font-medium">non è presente un vocal booth isolato</span>: 
            l'intero ambiente è acusticamente calibrato e trattato per registrare nella stessa stanza a stretto contatto con l'ingegnere del suono. 
            Questo garantisce un <strong className="text-amber-300 font-medium">feedback immediato e continuo</strong> durante l'esecuzione.
          </div>
        </div>

        {/* Success Confirmation View */}
        {isSubmitted ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-neutral-950/90 border border-emerald-500/40 backdrop-blur-2xl shadow-2xl text-center max-w-3xl mx-auto flex flex-col items-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
              Prenotazione Registrata con Successo nel Sistema
            </span>

            <div className="my-2 px-4 py-1.5 rounded-xl bg-neutral-900 border border-amber-500/40 inline-flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-neutral-400">Codice Ordine Ufficiale:</span>
              <strong className="text-base font-mono text-amber-400 font-bold tracking-wider">
                {submittedBooking?.orderCode || '171-ORD-SESSION'}
              </strong>
            </div>

            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-2 mt-2">
              Grazie, {nome}!
            </h2>

            {/* Client Notification & Contact Card */}
            <div className="w-full my-4 p-5 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/20 border border-emerald-500/40 text-xs font-mono space-y-3 text-left shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <strong className="text-white text-xs uppercase tracking-wide">
                    Richiesta Inviata al Desk dello Studio (#{submittedBooking?.orderCode})
                  </strong>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-emerald-950/80 text-emerald-300 border-emerald-500/50">
                  ✓ Presa in Carico da Igor Rozanov
                </span>
              </div>

              <p className="text-[11.5px] text-neutral-300 font-sans leading-relaxed">
                La tua prenotazione è stata ricevuta da Igor Rozanov. Riceverai la conferma formale e i dettagli all'indirizzo <strong className="text-amber-400 font-mono">{submittedBooking?.userEmail || email}</strong>. Se hai note aggiuntive o basi/stems da inviare in anticipo:
              </p>

              {submittedBooking && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openClientContactStudioGmail(submittedBooking.id)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    title="Scrivi direttamente allo studio o invia il link alle tue basi / stems"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Invia Note / File allo Studio (Gmail)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openMailtoCompose(submittedBooking.id, 'receipt')}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>App Posta (Mailto)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Calendar Integration (Universal 1-Click Web & .ICS Download specifically for the Client) */}
            {submittedBooking && (
              <div className="w-full mb-6 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white text-xs font-mono uppercase block mb-0.5">
                      Promemoria Personale nel Tuo Calendario
                    </strong>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Aggiungi la sessione del <strong className="text-white">{dataPreferita}</strong> ({oraPreferita} - {calculatedEndTime}) al tuo calendario personale (Google Calendar o iPhone/Outlook):
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openGoogleCalendarWeb(submittedBooking.id, true)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Aggiungi al tuo Google Calendar personale"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Google Calendar (1 Click)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadBookingCalendarIcs(submittedBooking.id, true)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Scarica promemoria .ICS per Apple Calendar (iPhone/Mac) o Outlook"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scarica .ICS (Apple/Outlook)</span>
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm text-neutral-300 font-light mb-6 leading-relaxed">
              La tua sessione di{' '}
              <strong className="text-amber-400 font-semibold">{currentServiceObj.title}</strong>{' '}
              per il giorno <strong className="text-white capitalize">{formattedSelectedDate}</strong> dalle ore <strong className="text-white font-mono">{oraPreferita}</strong> alle <strong className="text-white font-mono">{calculatedEndTime}</strong> ({formatDurationLabel(effectiveHours)}) è stata registrata.
            </p>

            {/* Session Summary Card */}
            <div className="w-full p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left text-xs font-mono space-y-2.5 mb-6">
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Codice Ordine:</span>
                <span className="text-amber-400 font-bold">{submittedBooking?.orderCode}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Account / Recapiti:</span>
                <span className="text-neutral-200">{submittedBooking?.userEmail || email} ({telefono})</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Data & Orario Sessione:</span>
                <span className="text-white font-semibold">
                  {dataPreferita} • {oraPreferita} ➔ {calculatedEndTime} ({formatDurationLabel(effectiveHours)})
                </span>
              </div>
              {submittedBooking?.discountCode && submittedBooking?.discountAmount ? (
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-400">Voucher Sconto Applicato:</span>
                  <span className="text-amber-300 font-bold">
                    {submittedBooking.discountCode} (-{submittedBooking.discountAmount} € su {submittedBooking.originalPrice} €)
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400">Cifra Finale da Saldare:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{submittedBooking?.estimatedPrice ?? finalPriceToPay} €</span>
              </div>
              {note && (
                <div className="pt-1">
                  <span className="text-neutral-400 block mb-1">Note progetto:</span>
                  <span className="text-neutral-300 italic">{note}</span>
                </div>
              )}
            </div>

            {/* PAYPAL PAYMENT SECTION */}
            <div className="w-full p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/50 text-left mb-8 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-white">
                      Saldo Anticipato con PayPal
                    </h3>
                    <p className="text-[11px] font-mono text-neutral-400">
                      Possibilità di pagare la cifra stabilita prima di arrivare in studio
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {submittedBooking?.estimatedPrice || estimate.total} €
                </span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed font-light mb-4">
                Come da indicazioni di 171 Studio, puoi procedere comodamente al saldo della cifra stabilita (<strong className="text-emerald-400 font-semibold">{submittedBooking?.estimatedPrice || estimate.total} €</strong>) direttamente online tramite PayPal sul conto dello studio:
              </p>

              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Conto PayPal Destinatario:</span>
                  <span className="text-white font-bold text-sm">{siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}</span>
                </div>
                <div className="text-neutral-400 text-[11px]">
                  Causale: <span className="text-amber-300 font-bold">{submittedBooking?.orderCode}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={submittedBooking?.paypalPaymentUrl || `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL)}&currency_code=EUR&amount=${submittedBooking?.estimatedPrice || estimate.total}&item_name=171%20Studio%20Sessione%20${submittedBooking?.orderCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider font-mono flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.01]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Paga {submittedBooking?.estimatedPrice || estimate.total} € con PayPal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyPaymentLink(submittedBooking?.paypalPaymentUrl || '')}
                  className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono flex items-center gap-1.5 transition-all border border-neutral-700 cursor-pointer"
                >
                  {copiedPayment ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Link Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-neutral-400" />
                      <span>Copia Link Pagamento</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-neutral-400 font-mono mt-3 pt-3 border-t border-neutral-800/80">
                • <em>Preferisci saldare di persona?</em> Nessun problema: puoi pagare comodamente all'arrivo in studio (contanti, POS o bonifico istantaneo).
              </p>
            </div>

            {/* Toggle Email Preview */}
            <div className="w-full text-left mb-8">
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="text-xs font-mono text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors select-none cursor-pointer"
              >
                <span>{showEmailPreview ? 'Nascondi' : 'Mostra'} copia del testo dell'email inviata alla tua casella</span>
              </button>

              {showEmailPreview && (
                <div className="mt-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono whitespace-pre-wrap leading-relaxed animate-in fade-in duration-200">
                  <div className="text-amber-400 font-bold mb-2 pb-2 border-b border-neutral-800">
                    Oggetto: [171 STUDIO] Richiesta Ricevuta - Codice Ordine #{submittedBooking?.orderCode}
                  </div>
                  {`Gentile ${nome},\n\nGrazie della tua prenotazione! Il nostro staff sta verificando la disponibilità dello studio per la sessione richiesta.\n\nCODICE ORDINE: #${submittedBooking?.orderCode}\nSERVIZIO: ${currentServiceObj.title}\nDATA: ${dataPreferita}\nORARIO: dalle ${oraPreferita} alle ${calculatedEndTime} (${formatDurationLabel(effectiveHours)})\nIMPORTO STIMATO: ${submittedBooking?.estimatedPrice || estimate.total} €\n\nUna volta che il Master confermerà la disponibilità dello studio dal pannello di controllo, riceverai un'ulteriore email ufficiale con la conferma definitiva dell'ordine, la firma di Igor Rozanov e il link per il saldo anticipato prima dell'arrivo in studio con PayPal.\n\nA presto in studio!\n171 Studio Staff — Messina, Sicilia\nMittente Ufficiale: 171studiomessina@gmail.com`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold uppercase tracking-wider text-neutral-200 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nuova Prenotazione</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('il-mio-account')}
                className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Vai a Il Mio Account (Gestisci / Cancella entro 24h)
              </button>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Torna alla Frontpage
              </button>
            </div>
          </div>
        ) : (
          /* The Interactive Booking Flow */
          <form 
            onSubmit={handleSubmit}
            className="flex flex-col gap-10"
          >
            
            {/* STEP 1: Service Selection & Interactive Duration Bar */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl shadow-xl flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
                      Seleziona il Servizio & Imposta la Durata
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Scegli tra registrazione vocale, mix, master o produzione completa.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-amber-400 font-semibold hidden sm:inline-block">
                  Tariffa: {currentServiceObj.priceNote}
                </span>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dynamicServiceOptions.map((srv) => {
                  const isSelected = selectedService === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv.id)}
                      className={`text-left p-4 rounded-2xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                          : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900'
                      }`}
                    >
                      <div className="mb-2">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="font-semibold text-white text-sm">{srv.title}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-amber-400 font-bold block mb-1">
                          {srv.priceNote}
                        </span>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                          {srv.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* INTERACTIVE DURATION SELECTION BAR (Ore & Minuti) */}
              {currentServiceObj.allowsExtraHours && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-amber-500/30 flex flex-col gap-4 shadow-xl">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-mono uppercase tracking-wider text-white font-bold block">
                          Barra a Selezione Ore & Minuti
                        </span>
                        <span className="text-[11px] text-neutral-400 font-light">
                          Tariffa oraria {siteContent.hourlyRecordingPrice ?? 25}€/h (minimo 1 ora, regolabile a scatti di 30 minuti)
                        </span>
                      </div>
                    </div>

                    {/* Selected duration badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs self-start sm:self-auto">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Durata: <strong className="text-white font-bold">{formatDurationLabel(hours)}</strong> ({Math.round(hours * 60)} min)</span>
                      <span className="text-amber-400 font-bold">• {estimate.total} €</span>
                    </div>
                  </div>

                  {/* Range Slider for Duration */}
                  <div className="space-y-2 py-1">
                    <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                      <span>1 ora (minimo)</span>
                      <span className="text-amber-400 font-semibold">{formatDurationLabel(hours)}</span>
                      <span>5 ore (massimo)</span>
                    </div>
                    
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.5}
                      value={hours}
                      onChange={(e) => setHours(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-2.5 bg-neutral-800 rounded-lg"
                      aria-label="Regola durata sessione"
                    />
                  </div>

                  {/* Quick Preset Chips for Hours & Minutes */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2">
                      Scelta Rapida Ore & Minuti:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {durationPresets.map((dur) => {
                        const isCurrent = hours === dur;
                        return (
                          <button
                            key={dur}
                            type="button"
                            onClick={() => setHours(dur)}
                            className={`py-2 px-1 rounded-xl text-center font-mono text-xs transition-all border cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-500 text-black font-extrabold border-amber-400 shadow-md shadow-amber-500/30'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                            }`}
                          >
                            {formatDurationLabel(dur)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* STEP 2: Fascia Oraria Preferita & Dynamic Calendar */}
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-amber-500/30 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-black font-mono text-xs font-extrabold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-heading font-bold text-white flex items-center gap-2">
                      <span>Fascia Oraria Preferita & Calendario Studio</span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Scegli la fascia oraria che preferisci tra le 15:00 e le 20:00: gli orari si ricalcoleranno all'istante.
                    </p>
                  </div>
                </div>

                {dataPreferita && oraPreferita && (
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
                      SELEZIONE ATTUALE
                    </span>
                    <span className="text-xs font-mono text-amber-400 font-bold capitalize">
                      {dataPreferita} • {oraPreferita} ➔ {calculatedEndTime} ({formatDurationLabel(effectiveHours)})
                    </span>
                  </div>
                )}
              </div>

              {/* FASCIA ORARIA PREFERITA SELECTOR CARDS */}
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold block mb-2.5">
                  1. Scegli la tua Fascia Oraria Preferita:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Pomeriggio */}
                  <button
                    type="button"
                    onClick={() => setPreferredFascia('pomeriggio')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      preferredFascia === 'pomeriggio'
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/5 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      preferredFascia === 'pomeriggio' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-amber-400'
                    }`}>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-white">Pomeriggio</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          15:00 - 18:00
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Ideale per registrazione vocale, strofe, cori e sessioni di ascolto.
                      </p>
                    </div>
                  </button>

                  {/* Sera */}
                  <button
                    type="button"
                    onClick={() => setPreferredFascia('sera')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      preferredFascia === 'sera'
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/5 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      preferredFascia === 'sera' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-amber-400'
                    }`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-white">Sera</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          18:00 - 20:00
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Ideale per Mix & Master, finalizzazione e rifinitura serale.
                      </p>
                    </div>
                  </button>

                  {/* Qualsiasi */}
                  <button
                    type="button"
                    onClick={() => setPreferredFascia('tutti')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      preferredFascia === 'tutti'
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/5 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      preferredFascia === 'tutti' ? 'bg-amber-500 text-black font-bold' : 'bg-neutral-800 text-amber-400'
                    }`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-white">Tutte le Fasce</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          15:00 - 20:00
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        Massima flessibilità oraria e panoramica completa degli slot liberi.
                      </p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Dynamic Calendar with automatic slot adjustment */}
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold block mb-2.5">
                  2. Scegli Data & Orario Esatto di Inizio:
                </span>
                
                <BookingCalendar
                  selectedDate={dataPreferita}
                  onSelectDate={(newDate) => {
                    setDataPreferita(newDate);
                    setFormError('');
                  }}
                  selectedTime={oraPreferita}
                  onSelectTime={(newTime) => {
                    setOraPreferita(newTime);
                    setFormError('');
                  }}
                  estimatedHours={effectiveHours}
                  preferredFascia={preferredFascia}
                  onSelectFascia={(f) => setPreferredFascia(f)}
                />
              </div>

            </div>

            {/* STEP 3: Artist Details, Form Errors & Submission */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left: Artist Information Fields */}
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-xl shadow-xl flex flex-col gap-6">
                
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <div>
                      <h2 className="text-lg font-heading font-bold text-white">
                        Dati dell'Artista & Note Progetto
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Inserisci i recapiti per la conferma ufficiale e il recall del progetto.
                      </p>
                    </div>
                  </div>

                  {currentUser ? (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Account: {currentUser.name}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Accesso Diretto
                    </span>
                  )}
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
                    <Info className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Nome & Cognome / Nome d'Arte (Single flexible input so no user gets blocked) */}
                <div>
                  <label htmlFor="field-nome" className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Nome Completo o Nome d'Arte *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="field-nome"
                      type="text"
                      required
                      placeholder="Es. Marco Rossi oppure Kid Yugi"
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value);
                        setFormError('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-neutral-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email & Telefono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="field-email" className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                      Indirizzo Email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="field-email"
                        type="email"
                        required
                        placeholder="artista@esempio.it"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setFormError('');
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="field-telefono" className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                      Numero di Telefono *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="field-telefono"
                        type="tel"
                        required
                        placeholder="+39 3XX XXXXXXX"
                        value={telefono}
                        onChange={(e) => {
                          setTelefono(e.target.value);
                          setFormError('');
                        }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-neutral-600 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Note Aggiuntive */}
                <div>
                  <label htmlFor="field-note" className="block text-xs font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                    Note Aggiuntive & Dettagli del Progetto
                  </label>
                  <textarea
                    id="field-note"
                    rows={3}
                    placeholder={siteContent.bookingNotesPlaceholder || "Descrivi il genere musicale, se porti una base tua, link provini/demo o esigenze particolari..."}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm text-white placeholder-neutral-600 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <span>Conferma & Invia Richiesta di Prenotazione</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>

              {/* Right: Live Summary Card & Official Rates */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Dynamic Selection Summary Card */}
                <div className="p-6 rounded-3xl bg-neutral-950/85 border border-amber-500/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 block mb-1">
                    RIEPILOGO DELLA SESSIONE
                  </span>
                  
                  <h3 className="font-heading font-bold text-xl text-white mb-4">
                    La Tua Prenotazione
                  </h3>

                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3 mb-4">
                    
                    {/* Service */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-neutral-400 font-mono">Servizio:</span>
                      <span className="text-xs font-semibold text-white text-right">
                        {currentServiceObj.title}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-neutral-400 font-mono">Data:</span>
                      <span className="text-xs font-mono font-medium text-amber-300 text-right capitalize">
                        {formattedSelectedDate}
                      </span>
                    </div>

                    {/* Time Slot & Computed End Time */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-neutral-400 font-mono">Orario Calcolato:</span>
                      <span className="text-xs font-mono font-bold text-white text-right">
                        {oraPreferita} ➔ {calculatedEndTime} ({formatDurationLabel(effectiveHours)})
                      </span>
                    </div>

                    {/* Preferred Fascia */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs text-neutral-400 font-mono">Fascia Oraria:</span>
                      <span className="text-xs font-mono font-medium text-amber-300 text-right capitalize">
                        {preferredFascia === 'tutti' ? 'Flessibile (15:00 - 20:00)' : `Fascia ${preferredFascia}`}
                      </span>
                    </div>

                    {/* Slot Status indicator */}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-neutral-800/80">
                      <span className="text-neutral-400 font-mono">Stato Disponibilità:</span>
                      {isSlotBookedOrBlocked ? (
                        <span className="text-red-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Non Disponibile / Conflitto</span>
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Disponibile</span>
                        </span>
                      )}
                    </div>

                    {/* Voucher / Discount Code Application Box */}
                    <div className="pt-3 border-t border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Codice Sconto / Voucher Studio</span>
                        </span>
                        {siteContent.registrationDiscountEnabled !== false && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            -{siteContent.registrationDiscountPercent || 5}% Registrazione
                          </span>
                        )}
                      </div>

                      {/* 5% Registration Promo Banner */}
                      {siteContent.registrationDiscountEnabled !== false && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-neutral-200 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Gift className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              {currentUser ? (
                                <>
                                  Sconto Benvenuto <strong className="text-amber-300">-{siteContent.registrationDiscountPercent || 5}%</strong> ({siteContent.registrationDiscountCode || 'BENVENUTO5'})
                                </>
                              ) : (
                                <>
                                  Registrati gratis per avere subito il <strong className="text-amber-300">-{siteContent.registrationDiscountPercent || 5}% di sconto</strong> ({siteContent.registrationDiscountCode || 'BENVENUTO5'})!
                                </>
                              )}
                            </span>
                          </div>
                          {currentUser ? (
                            currentUser.welcomeDiscountUsed ? (
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-800/80 text-neutral-400 text-[10px] font-mono">
                                ✓ Sconto benvenuto già riscattato
                              </span>
                            ) : appliedVoucherCode !== (currentUser.welcomeDiscountCode || siteContent.registrationDiscountCode || 'BENVENUTO5') ? (
                              <button
                                type="button"
                                onClick={() => handleApplyVoucher(currentUser.welcomeDiscountCode || siteContent.registrationDiscountCode || 'BENVENUTO5')}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] uppercase shrink-0 cursor-pointer"
                              >
                                Applica -{siteContent.registrationDiscountPercent || 5}%
                              </button>
                            ) : null
                          ) : (
                            <button
                              type="button"
                              onClick={() => openAuthModal('Sessione & Sconto 5%')}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] uppercase shrink-0 cursor-pointer"
                            >
                              Registrati (-5%)
                            </button>
                          )}
                        </div>
                      )}

                      {/* Voucher Input Row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={voucherInput}
                          onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                          placeholder="Es. BENVENUTO5 o VOUCHER..."
                          className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-amber-400 text-xs font-mono text-white uppercase outline-none"
                        />
                        {appliedVoucherCode ? (
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rimuovi</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApplyVoucher()}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase cursor-pointer"
                          >
                            Applica
                          </button>
                        )}
                      </div>

                      {/* Quick active vouchers: public ones + personalized ones for current user only */}
                      {(() => {
                        const effectiveEmail = (email || currentUser?.email || '').trim().toLowerCase();
                        const visibleVouchers = (siteContent.vouchers || []).filter((v) => {
                          if (!v.active || v.isRegistrationVoucher || v.isRegistrationWelcome) return false;
                          // If assigned to a specific email, only show if it matches effectiveEmail
                          if (v.assignedToEmail) {
                            if (!effectiveEmail || v.assignedToEmail.toLowerCase() !== effectiveEmail) return false;
                          }
                          // If single use per account, don't show if already redeemed
                          if (v.singleUsePerAccount && effectiveEmail && (v.usedByEmails || []).some(e => e.toLowerCase() === effectiveEmail)) {
                            return false;
                          }
                          return true;
                        });

                        if (visibleVouchers.length === 0) return null;

                        return (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-mono text-neutral-500">Voucher attivi:</span>
                            {visibleVouchers.map((v) => {
                              const isPct = v.discountType === 'percentage' || v.discountType === 'percent';
                              const isPersonal = Boolean(v.assignedToEmail);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleApplyVoucher(v.code)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                                    appliedVoucherCode === v.code
                                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                      : isPersonal
                                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 hover:border-purple-400'
                                      : 'bg-neutral-950 text-amber-300 border-neutral-800 hover:border-amber-500/40'
                                  }`}
                                >
                                  <span>{v.code} ({isPct ? `-${v.discountValue}%` : `-${v.discountValue}€`})</span>
                                  {isPersonal && (
                                    <span className="text-[8px] uppercase tracking-wider px-1 rounded bg-purple-500/30 text-purple-200 font-bold">
                                      Personale
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {voucherMessage && (
                        <div className={`p-2 rounded-xl text-[11px] font-mono flex items-center gap-1.5 ${
                          voucherMessage.isError
                            ? 'bg-red-950/60 border border-red-500/30 text-red-300'
                            : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                        }`}>
                          {voucherMessage.isError ? (
                            <Info className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{voucherMessage.text}</span>
                        </div>
                      )}
                    </div>

                    {/* Price calculation */}
                    <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                      <span className="text-xs font-mono uppercase text-neutral-300 font-bold">
                        Totale Stimato:
                      </span>
                      <div className="text-right">
                        {discountCalculation.valid && discountCalculation.discountAmount > 0 ? (
                          <div>
                            <span className="text-xs font-mono text-neutral-500 line-through mr-2">
                              {estimate.total} €
                            </span>
                            <span className="text-2xl font-black text-emerald-400 font-heading">
                              {finalPriceToPay} €
                            </span>
                            <p className="text-[10px] text-emerald-400 font-mono font-bold">
                              Risparmi {discountCalculation.discountAmount} € con {appliedVoucherCode}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="text-2xl font-black text-amber-400 font-heading">
                              {estimate.total} €
                            </span>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {estimate.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="text-[11px] text-neutral-400 space-y-1.5 font-light">
                    <p className="flex items-center gap-1.5 text-neutral-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Nessun pagamento anticipato obbligatorio per inviare la richiesta.</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-neutral-300">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{siteContent.bookingPaymentNotice || "Possibilità di saldo con PayPal oppure di persona all'arrivo in studio."}</span>
                    </p>
                  </div>
                </div>

                {/* Complete Studio Transparent Price List */}
                <div className="p-6 rounded-3xl bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-xl shadow-xl">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-amber-400 block mb-1">
                    LISTINO TRASPARENTE 171 STUDIO
                  </span>
                  <h4 className="font-heading font-bold text-base text-white mb-3">
                    Tutti i Prezzi & Pacchetti
                  </h4>
                  <ul className="text-xs font-mono space-y-2 text-neutral-300">
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Registrazione Vocale / Strumentale:</span>
                      <strong className="text-amber-400">{siteContent.hourlyRecordingPrice ?? 25}€ / ora</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Mix & Master in Studio:</span>
                      <strong className="text-amber-400">{siteContent.mixMasterPrice ?? 50}€ + {siteContent.hourlyRecordingPrice ?? 25}€/h</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Solo Master Traccia:</span>
                      <strong className="text-amber-400">{siteContent.soloMasterPrice ?? 40}€ fisso</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Solo Mix Online:</span>
                      <strong className="text-amber-400">{siteContent.soloMixOnlinePrice ?? 60}€ fisso</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Brano Completo (Non Esclusivo, 3h REC):</span>
                      <strong className="text-amber-400">{siteContent.branoCompletoNonEsclusivoPrice ?? 150}€</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Brano Completo (Esclusivo Totale, 3h REC):</span>
                      <strong className="text-amber-400">{siteContent.branoCompletoEsclusivoPrice ?? 200}€</strong>
                    </li>
                    <li className="flex justify-between border-b border-neutral-900 pb-1.5">
                      <span>Produzione Beat / Base (Senza Esclusiva):</span>
                      <strong className="text-amber-400">{siteContent.produzioneNonEsclusivaPrice ?? 50}€</strong>
                    </li>
                    <li className="flex justify-between pb-1">
                      <span>Produzione Beat / Base (Esclusiva Totale):</span>
                      <strong className="text-amber-400">{siteContent.produzioneEsclusivaPrice ?? siteContent.beatProductionPrice ?? 150}€</strong>
                    </li>
                  </ul>
                </div>

              </div>

            </div>

          </form>
        )}

      </div>

    </div>
  );
};
