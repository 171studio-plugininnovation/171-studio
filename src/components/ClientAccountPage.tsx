import React, { useState, useMemo } from 'react';
import {
  User, Calendar, Clock, FileAudio, Cpu, Activity, Trash2, Download,
  Upload, CheckCircle2, AlertTriangle, ExternalLink, Plus, Music,
  Sparkles, Shield, LogOut, ArrowRight, X, Check, Lock, History,
  CreditCard, FolderOpen, HelpCircle, Copy, Search, Disc, Truck,
  MapPin, PackageCheck, Package, MailCheck, ShoppingBag, Eye, ShieldCheck,
  Bug, Wrench, Send, Tag, Gift, Info, AlertCircle, Heart, Award
} from 'lucide-react';
import { PageId } from '../types';
import { useStudio } from '../context/StudioContext';
import { BookingRecord, ClientFileItem, STUDIO_PAYPAL_EMAIL, AlbumOrderRecord, PluginDonationRecord } from '../types/cms';
import { getPayPalPaymentUrl } from '../utils/emailService';
import { ALBUM_MP3_DOWNLOAD_URL, ALBUM_MASTER_DOWNLOAD_URL } from '../utils/albumDownloads';
import { getAssetUrl } from '../utils/assetPath';

interface ClientAccountPageProps {
  onNavigate: (page: PageId) => void;
}

export const ClientAccountPage: React.FC<ClientAccountPageProps> = ({ onNavigate }) => {
  const {
    currentUser,
    isMaster,
    openAuthModal,
    logout,
    bookings,
    clientFiles,
    downloadedPlugins,
    keyBpmHistory,
    albumOrders,
    confirmAlbumOrderPayPalPayment,
    pluginBugReports,
    addPluginBugReport,
    addClientFile,
    deleteClientFile,
    canClientCancelBooking,
    cancelClientBooking,
    downloadPlugin,
    siteContent,
    createBooking,
    confirmDriveFileDownload,
    confirmBookingDriveDownload,
    pluginDonations,
    createPluginDonation,
    confirmPluginDonationPayPal,
    getUserCumulativeDonations,
  } = useStudio();

  const userCumulativeStats = getUserCumulativeDonations(currentUser?.email);

  const [activeSection, setActiveSection] = useState<'overview' | 'album_orders' | 'sessions' | 'files' | 'plugins' | 'keybpm' | 'bug_report' | 'vouchers' | 'donations'>('overview');
  const [bookingToCancel, setBookingToCancel] = useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dedicated Donation Verification State
  const [donationVerifyingMap, setDonationVerifyingMap] = useState<Record<string, boolean>>({});
  const [donationTxInputMap, setDonationTxInputMap] = useState<Record<string, string>>({});
  const [donationTxErrorMap, setDonationTxErrorMap] = useState<Record<string, string | null>>({});

  const handleVerifyDonationPayPal = (donationId: string) => {
    const rawTx = (donationTxInputMap[donationId] || '').trim();
    if (!rawTx || rawTx.length < 5) {
      setDonationTxErrorMap((prev) => ({
        ...prev,
        [donationId]: 'Inserisci un codice transazione o ID ricevuta PayPal valido (almeno 5 caratteri).',
      }));
      return;
    }

    setDonationVerifyingMap((prev) => ({ ...prev, [donationId]: true }));
    setDonationTxErrorMap((prev) => ({ ...prev, [donationId]: null }));

    try {
      const confirmed = confirmPluginDonationPayPal(donationId, rawTx);
      if (confirmed) {
        setDonationVerifyingMap((prev) => ({ ...prev, [donationId]: false }));
        setActionBanner({
          type: 'success',
          text: confirmed.isEarlySupporterPass
            ? `Transazione PayPal #${rawTx} convalidata con successo! Badge "🌟 EARLY SUPPORTER — LIFETIME PASS" sbloccato sul tuo account!`
            : `Transazione PayPal #${rawTx} convalidata con successo per la donazione #${confirmed.donationCode}!`,
        });
        setTimeout(() => setActionBanner(null), 6000);
      } else {
        setDonationVerifyingMap((prev) => ({ ...prev, [donationId]: false }));
        setDonationTxErrorMap((prev) => ({ ...prev, [donationId]: 'Impossibile verificare la donazione.' }));
      }
    } catch (err: any) {
      setDonationVerifyingMap((prev) => ({ ...prev, [donationId]: false }));
      setDonationTxErrorMap((prev) => ({ ...prev, [donationId]: err.message || 'Errore nella convalida della transazione.' }));
    }
  };

  // Dedicated Voucher Copy State
  const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(null);

  const handleCopyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucherCode(code);
    setTimeout(() => setCopiedVoucherCode(null), 2500);
  };

  // Dedicated Bug Report Form State ("Report Plugin Bug and Help Us")
  const [bugPluginId, setBugPluginId] = useState<string>('plugin-1');
  const [bugPluginName, setBugPluginName] = useState<string>('171 Vocal Sculptor');
  const [bugDaw, setBugDaw] = useState<string>('FL Studio');
  const [bugOs, setBugOs] = useState<string>('Windows 11 (64-bit)');
  const [bugFormat, setBugFormat] = useState<string>('VST3 (64-bit)');
  const [bugSeverity, setBugSeverity] = useState<'bassa' | 'media' | 'critica'>('media');
  const [bugDescription, setBugDescription] = useState<string>('');
  const [bugSteps, setBugSteps] = useState<string>('');

  // Dedicated Album Order State
  const [copiedOrderCodeId, setCopiedOrderCodeId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const [orderTxInputMap, setOrderTxInputMap] = useState<Record<string, string>>({});
  const [orderTxErrorMap, setOrderTxErrorMap] = useState<Record<string, string>>({});
  const [orderVerifyingMap, setOrderVerifyingMap] = useState<Record<string, boolean>>({});

  const handleVerifyOrderPayment = (orderId: string, totalAmount: number, orderCode: string) => {
    const rawTx = (orderTxInputMap[orderId] || '').trim();
    if (!rawTx) {
      setOrderTxErrorMap((prev) => ({ ...prev, [orderId]: "Inserisci l'ID transazione PayPal o codice ricevuta." }));
      return;
    }
    if (rawTx.length < 5) {
      setOrderTxErrorMap((prev) => ({ ...prev, [orderId]: 'Codice non valido: deve contenere almeno 5 caratteri.' }));
      return;
    }

    setOrderVerifyingMap((prev) => ({ ...prev, [orderId]: true }));
    setOrderTxErrorMap((prev) => ({ ...prev, [orderId]: '' }));

    try {
      const confirmed = confirmAlbumOrderPayPalPayment(orderId, rawTx, totalAmount);
      if (confirmed) {
        setOrderVerifyingMap((prev) => ({ ...prev, [orderId]: false }));
        setActionBanner({
          type: 'success',
          text: `Transazione PayPal #${rawTx} convalidata con successo per l'ordine #${orderCode}! Il download del Master Pack è sbloccato.`,
        });
        setTimeout(() => setActionBanner(null), 5000);
      } else {
        setOrderVerifyingMap((prev) => ({ ...prev, [orderId]: false }));
        setOrderTxErrorMap((prev) => ({ ...prev, [orderId]: "Impossibile verificare l'ordine." }));
      }
    } catch (err: any) {
      setOrderVerifyingMap((prev) => ({ ...prev, [orderId]: false }));
      setOrderTxErrorMap((prev) => ({ ...prev, [orderId]: err?.message || 'Errore durante la convalida.' }));
    }
  };

  // Dedicated My Files State
  const [myFilesCategory, setMyFilesCategory] = useState<'master_shared' | 'all' | 'client_uploaded'>('master_shared');
  const [myFilesStatusFilter, setMyFilesStatusFilter] = useState<'tutti' | 'nuovi' | 'confermati'>('tutti');
  const [myFilesSearch, setMyFilesSearch] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Upload new file modal/form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState('24.5 MB');
  const [uploadFileType, setUploadFileType] = useState<ClientFileItem['fileType']>('stems_progetto');
  const [uploadBookingCode, setUploadBookingCode] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');

  // If user is not logged in, display the registration / login gate
  if (!currentUser) {
    return (
      <div className="relative z-10 min-h-screen pt-28 pb-20 px-4 sm:px-8 max-w-4xl mx-auto flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="w-full p-8 sm:p-12 rounded-3xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-2xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
              PORTALE CLIENTI • 171 STUDIO MESSINA
            </span>
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mt-2">
              Il Mio Account Artista
            </h1>
            <p className="text-sm text-neutral-300 max-w-xl mx-auto font-sans leading-relaxed">
              Accedi o registrati gratuitamente per gestire le tue sessioni in studio (con cancellazione gratuita fino a <strong className="text-amber-400">24 ore prima</strong>), consultare lo storico delle sessioni fatte, scaricare i tuoi file Mix & Master, vedere i plugin scaricati e il conteggio utilizzi del <strong className="text-amber-400">Key & BPM Finder</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs font-mono pt-2">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
              <Calendar className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-white font-bold block">Sessioni & Cancellazione 24h</span>
              <span className="text-neutral-400 text-[11px] block">Visualizza lo stato o cancella fino a 24h prima della sessione.</span>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
              <FileAudio className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-white font-bold block">I Tuoi File & Plugin</span>
              <span className="text-neutral-400 text-[11px] block">Archivio Stems, Mix/Master WAV e licenze 171 Plugin Innovation.</span>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
              <Activity className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-white font-bold block">Storico Key & BPM Finder</span>
              <span className="text-neutral-400 text-[11px] block">Conteggio utilizzi e report di tutte le tracce analizzate.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuthModal('Accedi o registrati per entrare nella sezione Il Mio Account.')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-all cursor-pointer"
            >
              Accedi / Registrati Ora
            </button>
            <button
              type="button"
              onClick={() => onNavigate('prenota-sessione')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Prenota una Sessione
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter records belonging strictly to current user
  const userBookings = bookings.filter(
    (b) =>
      b.userId === currentUser.id ||
      b.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const userFiles = clientFiles.filter(
    (f) =>
      f.userId === currentUser.id ||
      f.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  // Album Orders belonging to current user (The God Cypher)
  const userAlbumOrders: AlbumOrderRecord[] = useMemo(() => {
    if (!currentUser) return [];
    const uEmail = currentUser.email.toLowerCase().trim();
    const uId = currentUser.id;
    return (albumOrders || []).filter(
      (o) =>
        (o.userId && o.userId === uId) ||
        (o.userEmail && o.userEmail.toLowerCase().trim() === uEmail)
    );
  }, [albumOrders, currentUser]);

  // Plugin Donations belonging to current user (171 Plugin Innovation)
  const userDonations: PluginDonationRecord[] = useMemo(() => {
    if (!currentUser) return [];
    const uEmail = currentUser.email.toLowerCase().trim();
    const uId = currentUser.id;
    return (pluginDonations || []).filter(
      (d) =>
        (d.userId && d.userId === uId) ||
        (d.userEmail && d.userEmail.toLowerCase().trim() === uEmail)
    );
  }, [pluginDonations, currentUser]);

  // Combine clientFiles with direct Google Drive deliveries from bookings
  const combinedUserFiles: ClientFileItem[] = useMemo(() => {
    const list = [...userFiles];
    userBookings.forEach((b) => {
      if (b.driveDeliveryUrl) {
        const alreadyExists = list.some(
          (f) => f.bookingOrderCode === b.orderCode || f.driveUrl === b.driveDeliveryUrl
        );
        if (!alreadyExists) {
          list.push({
            id: `bk-drive-${b.id}`,
            userId: b.userId,
            userEmail: b.userEmail,
            userName: b.userName,
            bookingOrderCode: b.orderCode,
            fileName: b.driveDeliveryTitle || `${b.serviceTitle} - Master & Stems Google Drive`,
            fileSize: 'Google Drive Cloud (Spazio Illimitato)',
            fileType: 'mix_master',
            uploadedBy: '171_studio',
            notes: b.driveDeliveryNotes || `Consegna file per la sessione #${b.orderCode} del ${b.date}`,
            downloadUrl: b.driveDeliveryUrl,
            driveUrl: b.driveDeliveryUrl,
            isDriveDelivery: true,
            deliveryStatus: b.driveDeliveryStatus || 'in_attesa_download',
            downloadCount: b.driveDownloadCount || 0,
            lastDownloadedAt: b.driveDownloadedAt,
            lastDownloadedBy: b.driveDownloadedBy,
            createdAt: b.createdAt,
          });
        }
      }
    });
    return list;
  }, [userFiles, userBookings]);

  // Files and links shared by 171 Studio Master
  const masterSharedFiles = useMemo(() => {
    return combinedUserFiles.filter(
      (f) => f.uploadedBy === '171_studio' || Boolean(f.isDriveDelivery || f.driveUrl)
    );
  }, [combinedUserFiles]);

  // Files uploaded by the client
  const clientUploadedFiles = useMemo(() => {
    return combinedUserFiles.filter((f) => f.uploadedBy === 'cliente');
  }, [combinedUserFiles]);

  // New unread / pending download master uploads
  const newMasterUploads = useMemo(() => {
    return masterSharedFiles.filter(
      (f) => f.deliveryStatus !== 'download_confermato' || !f.lastDownloadedAt || (f.downloadCount || 0) === 0
    );
  }, [masterSharedFiles]);

  const newMasterUploadsCount = newMasterUploads.length;

  const filteredMyFiles = useMemo(() => {
    return combinedUserFiles.filter((f) => {
      // Category filter
      if (myFilesCategory === 'master_shared') {
        const isMaster = f.uploadedBy === '171_studio' || Boolean(f.isDriveDelivery || f.driveUrl);
        if (!isMaster) return false;
      } else if (myFilesCategory === 'client_uploaded') {
        if (f.uploadedBy !== 'cliente') return false;
      }

      // Status filter
      if (myFilesStatusFilter === 'nuovi') {
        const isConfirmed = f.deliveryStatus === 'download_confermato' && (f.downloadCount || 0) > 0;
        if (isConfirmed) return false;
      } else if (myFilesStatusFilter === 'confermati') {
        const isConfirmed = f.deliveryStatus === 'download_confermato' || (f.downloadCount || 0) > 0;
        if (!isConfirmed) return false;
      }

      // Search query
      if (myFilesSearch.trim()) {
        const q = myFilesSearch.toLowerCase().trim();
        const matchName = f.fileName.toLowerCase().includes(q);
        const matchNotes = (f.notes || '').toLowerCase().includes(q);
        const matchCode = (f.bookingOrderCode || '').toLowerCase().includes(q);
        if (!matchName && !matchNotes && !matchCode) return false;
      }

      return true;
    });
  }, [combinedUserFiles, myFilesCategory, myFilesStatusFilter, myFilesSearch]);

  const userPlugins = downloadedPlugins.filter(
    (p) =>
      p.userId === currentUser.id ||
      p.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  const userKeyBpm = keyBpmHistory.filter(
    (k) =>
      k.userId === currentUser.id ||
      k.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );

  // User Plugin Bug Reports ("Report Plugin Bug and Help Us")
  const userBugReports = useMemo(() => {
    if (!currentUser) return [];
    const uEmail = currentUser.email.toLowerCase().trim();
    const uId = currentUser.id;
    return (pluginBugReports || []).filter(
      (r) => (r.userId && r.userId === uId) || (r.userEmail && r.userEmail.toLowerCase().trim() === uEmail)
    );
  }, [pluginBugReports, currentUser]);

  const handleBugReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugPluginName || !bugDescription.trim()) return;

    addPluginBugReport({
      pluginId: bugPluginId || 'plugin-general',
      pluginName: bugPluginName,
      dawUsed: bugDaw,
      operatingSystem: bugOs,
      format: bugFormat,
      severity: bugSeverity,
      description: bugDescription.trim(),
      stepsToReproduce: bugSteps.trim() || undefined,
    });

    setBugDescription('');
    setBugSteps('');
    setActionBanner({
      type: 'success',
      text: `Bug report inviato con successo per "${bugPluginName}". Il laboratorio DSP di 171 Studio esaminerà la segnalazione!`,
    });
    setTimeout(() => setActionBanner(null), 6000);
  };

  const activeBookings = userBookings.filter(
    (b) => b.status === 'in_attesa' || b.status === 'confermata'
  );
  const completedOrPastBookings = userBookings.filter(
    (b) => b.status === 'completata' || b.status === 'confermata'
  );
  const cancelledBookings = userBookings.filter((b) => b.status === 'annullata');

  const welcomeCode = currentUser?.welcomeDiscountCode || siteContent.registrationDiscountCode || 'BENVENUTO5';
  const isWelcomeUsed = Boolean(currentUser?.welcomeDiscountUsed);

  // Personalized vouchers assigned to this account by the Master
  const personalVouchers = useMemo(() => {
    if (!currentUser?.email) return [];
    const userEmail = currentUser.email.toLowerCase().trim();
    return (siteContent.vouchers || []).filter(
      (v) =>
        v.active &&
        !v.isRegistrationWelcome &&
        !v.isRegistrationVoucher &&
        v.assignedToEmail &&
        v.assignedToEmail.toLowerCase().trim() === userEmail
    );
  }, [currentUser?.email, siteContent.vouchers]);

  // Studio public vouchers
  const publicVouchers = useMemo(() => {
    return (siteContent.vouchers || []).filter(
      (v) =>
        v.active &&
        !v.isRegistrationWelcome &&
        !v.isRegistrationVoucher &&
        !v.assignedToEmail
    );
  }, [siteContent.vouchers]);

  // Count active/available discounts for this user
  const availableVouchersCount = useMemo(() => {
    let count = isWelcomeUsed ? 0 : 1;
    personalVouchers.forEach((v) => {
      if (!v.singleUsePerAccount || !currentUser?.email || !(v.usedByEmails || []).some(e => e.toLowerCase() === currentUser.email.toLowerCase())) {
        count++;
      }
    });
    return count;
  }, [isWelcomeUsed, personalVouchers, currentUser?.email]);

  const handleConfirmCancellation = async () => {
    if (!bookingToCancel) return;
    const res = await cancelClientBooking(bookingToCancel.id, cancelReason);
    setActionBanner({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setBookingToCancel(null);
    setCancelReason('');
    setTimeout(() => setActionBanner(null), 7000);
  };

  const handleFileInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setUploadFileName(f.name);
      setUploadFileSize((f.size / (1024 * 1024)).toFixed(2) + ' MB');
    }
  };

  const handleCreateClientFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    addClientFile({
      fileName: uploadFileName.trim(),
      fileSize: uploadFileSize || '18.4 MB',
      fileType: uploadFileType,
      uploadedBy: 'cliente',
      bookingOrderCode: uploadBookingCode.trim() || activeBookings[0]?.orderCode || '171-SESSION',
      notes: uploadNotes.trim() || 'Caricato dal portale Il Mio Account',
      downloadUrl: `#download-${Date.now()}`,
    });

    setUploadFileName('');
    setUploadNotes('');
    setShowUploadForm(false);
    setActionBanner({
      type: 'success',
      text: 'File aggiunto con successo al tuo archivio personale 171 Studio.',
    });
    setTimeout(() => setActionBanner(null), 5000);
  };

  const handleDownloadSimulatedFile = (file: ClientFileItem) => {
    if (file.driveUrl) {
      window.open(file.driveUrl, '_blank', 'noopener,noreferrer');
      confirmDriveFileDownload(file.id, isMaster ? 'master' : 'cliente', currentUser.email);
      return;
    }
    const content = `171 STUDIO MESSINA - CERTIFICATO FILE AUDIO
==================================================
Artista: ${currentUser.name} (${currentUser.email})
Nome File: ${file.fileName}
Dimensione: ${file.fileSize}
Tipologia: ${file.fileType.toUpperCase()}
Caricato da: ${file.uploadedBy === '171_studio' ? '171 Studio Mastering Lab' : currentUser.name}
Ordine Associato: ${file.bookingOrderCode || 'N/D'}
Note: ${file.notes || 'Nessuna nota'}
Data: ${new Date(file.createdAt).toLocaleString('it-IT')}
==================================================`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenBookingDrive = (booking: BookingRecord) => {
    if (booking.driveDeliveryUrl) {
      window.open(booking.driveDeliveryUrl, '_blank', 'noopener,noreferrer');
      confirmBookingDriveDownload(booking.id, isMaster ? 'master' : 'cliente');
    }
  };

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Top User Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-2xl shadow-2xl mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-heading font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                IL MIO ACCOUNT • AREA CLIENTI
              </span>
              {isMaster && (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ACCOUNT MASTER
                </span>
              )}
              {currentUser.isEarlySupporter && (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-amber-400/15 text-amber-300 border border-amber-400 font-extrabold flex items-center gap-1 shadow-md shadow-amber-500/20">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>🌟 EARLY SUPPORTER — LIFETIME PASS</span>
                </span>
              )}
              {currentUser.isVerifiedBugHunter && (
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-extrabold flex items-center gap-1 shadow-md shadow-cyan-500/20">
                  <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🛠️ TESTER CERTIFICATO & BUG HUNTER</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
              Benvenuto, {currentUser.name}
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              Email registrata: <strong className="text-neutral-200">{currentUser.email}</strong> • Gestione sessioni (cancellazione fino a 24h prima), file audio, plugin e Key & BPM Finder
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-auto">
          <button
            type="button"
            onClick={() => onNavigate('prenota-sessione')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Prenotazione</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('strumenti-online')}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Apri Key & BPM Finder</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-red-950/50 text-neutral-400 hover:text-red-400 border border-neutral-800 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionBanner && (
        <div
          className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in ${
            actionBanner.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-mono">
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{actionBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-neutral-400 hover:text-white text-xs font-mono"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* 5% Registration Discount & Active Vouchers Banner */}
      {siteContent.registrationDiscountEnabled !== false && (
        <div className={`mb-6 p-5 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all ${
          isWelcomeUsed
            ? 'bg-neutral-900/60 border-neutral-800'
            : 'bg-gradient-to-r from-amber-500/15 via-neutral-900/90 to-emerald-500/10 border-amber-500/40'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
              isWelcomeUsed
                ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {isWelcomeUsed ? (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 font-bold">
                    ✓ SCONTO BENVENUTO GIÀ RISCATTATO (1 UTILIZZO COMPLETATO)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    ● VOUCHER BENVENUTO ATTIVO NEL TUO ACCOUNT (1 UTILIZZO DISPONIBILE)
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-lg border font-mono text-xs font-black flex items-center gap-1.5 ${
                  isWelcomeUsed
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-500 line-through'
                    : 'bg-neutral-950 border-amber-500/50 text-amber-400'
                }`}>
                  CODICE: {welcomeCode} (-{siteContent.registrationDiscountPercent ?? 5}%)
                  {!isWelcomeUsed && (
                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(welcomeCode)}
                      className="ml-1 text-[10px] text-amber-300 hover:text-white cursor-pointer"
                      title="Copia codice"
                    >
                      {copiedVoucherCode === welcomeCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </span>
              </div>
              <p className="text-xs text-neutral-300 font-mono mt-1">
                {isWelcomeUsed ? (
                  <>Hai già riscattato lo sconto di benvenuto per questo account. Controlla la sezione <strong className="text-amber-400 cursor-pointer hover:underline" onClick={() => setActiveSection('vouchers')}>I Miei Sconti & Voucher</strong> per scoprire promozioni dedicate.</>
                ) : (
                  <>In qualità di utente registrato hai diritto al <strong className="text-amber-300">-{siteContent.registrationDiscountPercent ?? 5}% di sconto immediato</strong> sulla tua sessione in studio. Codice personale non trasferibile.</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSection('vouchers')}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 hover:text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span>I Miei Voucher ({availableVouchersCount})</span>
            </button>
            {!isWelcomeUsed && (
              <button
                type="button"
                onClick={() => onNavigate('prenota-sessione')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Usa Sconto Ora
              </button>
            )}
          </div>
        </div>
      )}

      {/* 7 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-8">
        <button
          type="button"
          onClick={() => setActiveSection('vouchers')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer relative"
        >
          {availableVouchersCount > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-black uppercase">
              ● Attivi
            </span>
          )}
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Sconti & Voucher</span>
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {availableVouchersCount}
          </span>
          <span className="text-[10px] font-mono text-amber-400">
            {availableVouchersCount > 0 ? 'Disponibili' : 'Già Riscattati'}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('album_orders')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/50 text-left transition-all cursor-pointer relative"
        >
          {userAlbumOrders.some(o => o.pickupStatus === 'pronto_ritiro' || o.status === 'spedito') && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-heading font-black uppercase tracking-wider animate-pulse shadow-md shadow-red-600/30">
              ● Novità
            </span>
          )}
          <div className="flex items-center justify-between text-red-500 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Ordini Album</span>
            <Disc className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {userAlbumOrders.length}
          </span>
          <span className="text-[10px] font-mono text-red-400">
            {userAlbumOrders.length > 0 ? 'The God Cypher' : 'Copia / Download'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('sessions')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Sessioni Attive</span>
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {activeBookings.length}
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            Cancellabili fino a 24h
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('sessions')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Storico Sessioni</span>
            <History className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {userBookings.length}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            {completedOrPastBookings.length} confermate/fatte
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('files')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer relative"
        >
          {newMasterUploadsCount > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-heading font-black uppercase tracking-wider animate-pulse shadow-md shadow-amber-500/30">
              ● {newMasterUploadsCount} Nuovi
            </span>
          )}
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">I Miei File</span>
            <FileAudio className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {combinedUserFiles.length}
          </span>
          <span className="text-[10px] font-mono text-blue-400 truncate block">
            {masterSharedFiles.length} master • {clientUploadedFiles.length} inviati
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('plugins')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Plugin DSP</span>
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {userPlugins.length}
          </span>
          <span className="text-[10px] font-mono text-purple-400">
            171 Innovation
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('keybpm')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Key & BPM</span>
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-amber-400 block">
            {userKeyBpm.length}
          </span>
          <span className="text-[10px] font-mono text-neutral-300">
            Analisi effettuate
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('bug_report')}
          className="p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/40 text-left transition-all cursor-pointer relative"
        >
          {userBugReports.some(r => r.status === 'risolto' || r.status === 'in_esame') && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-heading font-black uppercase tracking-wider animate-pulse shadow-md shadow-red-600/30">
              ● Novità
            </span>
          )}
          <div className="flex items-center justify-between text-red-400 mb-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Plugin Bug Report</span>
            <Bug className="w-4 h-4" />
          </div>
          <span className="text-3xl font-heading font-black text-white block">
            {userBugReports.length}
          </span>
          <span className="text-[10px] font-mono text-red-400">
            Aiutaci a migliorare
          </span>
        </button>
      </div>

      {/* Section Navigation Tabs (Responsive Smooth Horizontal Dock on Mobile) */}
      <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-8 border-b border-neutral-800 pb-4 overflow-x-auto scrollbar-none py-1">
        {[
          { id: 'overview', label: 'Riepilogo Completo', icon: Sparkles },
          { 
            id: 'album_orders', 
            label: `I Miei Ordini Album (${userAlbumOrders.length})`, 
            icon: Disc,
            highlight: userAlbumOrders.length > 0
          },
          { 
            id: 'donations', 
            label: `Donazioni & Supporter Pass (${userDonations.length})`, 
            icon: Heart,
            highlight: Boolean(currentUser?.isEarlySupporter || userDonations.length > 0)
          },
          { id: 'sessions', label: `Sessioni & Cancellazione 24h (${userBookings.length})`, icon: Calendar },
          { 
            id: 'files', 
            label: `I Miei File (${combinedUserFiles.length})${newMasterUploadsCount > 0 ? ` • ${newMasterUploadsCount} Nuovi` : ''}`, 
            icon: FileAudio,
            highlight: newMasterUploadsCount > 0
          },
          { id: 'plugins', label: `Plugin Scaricati (${userPlugins.length})`, icon: Cpu },
          { id: 'keybpm', label: `Utilizzi Key & BPM Finder (${userKeyBpm.length})`, icon: Activity },
          { 
            id: 'vouchers', 
            label: `I Miei Sconti & Voucher (${availableVouchersCount})`, 
            icon: Tag,
            highlight: availableVouchersCount > 0
          },
          { 
            id: 'bug_report', 
            label: `Report Plugin Bug and Help Us (${userBugReports.length})`, 
            icon: Bug,
            highlight: userBugReports.some(r => r.status === 'risolto' || r.status === 'in_esame')
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                  : tab.highlight
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40 hover:bg-amber-500/20'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: ORDINI ALBUM "THE GOD CYPHER" (FISICO & DIGITALE)                */}
      {/* ========================================================================= */}
      {(activeSection === 'overview' || activeSection === 'album_orders') && (
        <div className="space-y-6 mb-12">
          {/* If overview and 0 orders: show a sleek teaser card */}
          {activeSection === 'overview' && userAlbumOrders.length === 0 ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950 border border-red-800/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-red-700/60 shadow-lg shrink-0 bg-black">
                  <img
                    src={getAssetUrl('/assets/the-god-cypher/covers/cover-front.png')}
                    alt="The God Cypher"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-red-400 uppercase font-bold tracking-widest block">
                    THE GOD CYPHER • STORE UFFICIALE 171
                  </span>
                  <h3 className="text-lg font-['Cinzel_Decorative',serif] font-bold text-white mt-0.5">
                    L'Album Ufficiale di 171 Studio
                  </h3>
                  <p className="text-xs text-neutral-300 font-mono mt-0.5 max-w-xl">
                    Disponibile in <strong className="text-white">CD Audio Deluxe</strong> (€9.99 con spedizione o ritiro gratuito), <strong className="text-white">Master Pack Digitale</strong> (€4.99 con WAV 24b, MP3 e grafiche) ed <strong className="text-white">Essential MP3</strong> (€2.99).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => onNavigate('the-god-cypher')}
                  className="px-5 py-3 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/50 cursor-pointer flex items-center gap-2"
                >
                  <Disc className="w-4 h-4" />
                  <span>Scopri & Ordina</span>
                </button>
              </div>
            </div>
          ) : (
            /* Full section for Album Orders */
            <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-red-900/40 space-y-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-700/50 text-[10px] font-mono font-bold uppercase">
                      THE GOD CYPHER • ORDINI & SPEDIZIONI
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-['Cinzel_Decorative',serif] font-black text-white mt-1">
                    I Tuoi Ordini Album
                  </h2>
                  <p className="text-xs font-mono text-neutral-400">
                    Stato evasione, convalida email dell'ordine, codice di tracciamento corriere espresso e orari per il ritiro in studio.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('the-god-cypher')}
                  className="px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-red-950 cursor-pointer self-start sm:self-auto"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>+ Nuovo Ordine Album</span>
                </button>
              </div>

              {userAlbumOrders.length === 0 ? (
                <div className="p-10 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-950/30 border border-red-800/40 text-red-500 flex items-center justify-center mx-auto">
                    <Disc className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-['Cinzel_Decorative',serif] font-bold text-white">
                      Nessun ordine album registrato
                    </h3>
                    <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto">
                      Non hai ancora ordinato una copia di The God Cypher. Scegli tra l'edizione fisica da collezione con booklet di 16 pagine o il download immediato.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('the-god-cypher')}
                    className="px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950"
                  >
                    <span>Visita lo Store Ufficiale</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {userAlbumOrders.map((order) => {
                    const isPhysical = order.orderType === 'physical';
                    const isShipping = order.shippingMethod === 'shipping';
                    const isPickup = order.shippingMethod === 'pickup';
                    const isDigital = order.orderType === 'digital' || order.shippingMethod === 'digital_download';
                    const isEmailValidated = order.emailValidationStatus === 'convalidata' || order.emailValidationStatus === 'inviata';

                    return (
                      <div
                        key={order.id}
                        className="p-5 sm:p-7 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-red-700/50 transition-all space-y-5"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-3 py-1 rounded-xl bg-red-950/80 border border-red-700/60 text-red-400 font-mono text-xs font-bold flex items-center gap-2">
                              <span>#{order.orderCode}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(order.orderCode);
                                  setCopiedOrderCodeId(order.id);
                                  setTimeout(() => setCopiedOrderCodeId(null), 2500);
                                }}
                                className="hover:text-white transition-colors"
                                title="Copia codice ordine"
                              >
                                {copiedOrderCodeId === order.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                                order.status === 'completato'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : order.status === 'spedito'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : order.status === 'pronto_ritiro'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              }`}
                            >
                              {order.status === 'completato' && '✓ Ordine Completato'}
                              {order.status === 'spedito' && '🚚 Spedito con Corriere Espresso'}
                              {order.status === 'pronto_ritiro' && '🏢 Pronto per il Ritiro in Studio!'}
                              {order.status === 'in_elaborazione' && '⏳ In Elaborazione'}
                              {order.status === 'annullato' && '✕ Annullato'}
                            </span>

                            {/* Method Badge */}
                            <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-mono uppercase">
                              {isShipping && 'Spedizione a Domicilio'}
                              {isPickup && 'Ritiro in Sede (171 Studio)'}
                              {isDigital && 'Download Digitale'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-neutral-400">
                              Ordinato: {new Date(order.createdAt).toLocaleDateString('it-IT')}
                            </span>
                            <span className="text-base font-['Cinzel_Decorative',serif] font-bold text-white">
                              €{order.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Body Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                          
                          {/* Left: Product preview */}
                          <div className="lg:col-span-4 flex items-start gap-3.5">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border border-red-700/60 shadow-lg shrink-0 bg-black">
                              <img
                                src={getAssetUrl('/assets/the-god-cypher/covers/cover-front.png')}
                                alt="The God Cypher"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <h4 className="font-['Cinzel_Decorative',serif] font-bold text-sm text-white truncate">
                                {order.productTitle}
                              </h4>
                              <p className="text-xs font-mono text-neutral-400">
                                {isPhysical ? 'CD Audio 14 Tracce + Booklet 16 Pagine' : 'Master Pack Digitale WAV 24-bit + MP3'}
                              </p>
                              <div className="text-[11px] font-mono text-neutral-500 pt-1">
                                Destinatario: <strong className="text-neutral-300">{order.userName}</strong>
                                {order.userPhone && ` • Tel. ${order.userPhone}`}
                              </div>
                            </div>
                          </div>

                          {/* Right: Validation, PayPal & Delivery Info Cards */}
                          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            
                            {/* Card 1: Stato Pagamento PayPal */}
                            <div
                              className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                                order.paymentStatus === 'saldato'
                                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                  : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 font-bold uppercase text-[11px]">
                                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                  <span>{order.paymentStatus === 'saldato' ? 'Pagamento PayPal Confermato' : 'In Attesa Pagamento PayPal'}</span>
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/60 border border-neutral-700 text-neutral-300 font-bold">
                                  €{order.totalAmount.toFixed(2)}
                                </span>
                              </div>

                              <div className="text-[11px] text-neutral-300 space-y-1">
                                <div>Destinatario: <strong className="text-amber-400">{order.paypalEmail || 'vkrealhakiesake@gmail.com'}</strong></div>
                                {order.paypalTransactionId && (
                                  <div className="flex items-center gap-1.5 text-emerald-300">
                                    <span>Transazione:</span>
                                    <strong className="select-all font-mono">{order.paypalTransactionId}</strong>
                                  </div>
                                )}
                                {order.paypalPaidAt && (
                                  <div className="text-[10px] text-neutral-400">
                                    Saldato il: {new Date(order.paypalPaidAt).toLocaleString('it-IT')}
                                  </div>
                                )}
                              </div>

                              {order.paymentStatus !== 'saldato' && (
                                <div className="space-y-2 mt-2 pt-2 border-t border-amber-900/40">
                                  <a
                                    href={order.paypalPaymentUrl || 'https://www.paypal.com/paypalme/igorrozanov171'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2 px-3 rounded-lg bg-[#ffc439] hover:bg-[#f4b82d] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Paga Ora con PayPal (€{order.totalAmount.toFixed(2)})</span>
                                  </a>

                                  <div className="p-2.5 rounded-lg bg-black/60 border border-neutral-700/80 space-y-1.5">
                                    <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      <span>Verifica ID Transazione PayPal:</span>
                                    </div>
                                    <p className="text-[10px] text-neutral-400">
                                      Inserisci il codice ricevuto da PayPal per registrare il pagamento e sbloccare il download:
                                    </p>
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        value={orderTxInputMap[order.id] || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setOrderTxInputMap((prev) => ({ ...prev, [order.id]: val }));
                                          if (orderTxErrorMap[order.id]) {
                                            setOrderTxErrorMap((prev) => ({ ...prev, [order.id]: '' }));
                                          }
                                        }}
                                        placeholder="Es. 9AB12345CD67890EF"
                                        className="flex-1 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-white font-mono text-xs uppercase focus:outline-none focus:border-amber-400 placeholder:text-neutral-600"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyOrderPayment(order.id, order.totalAmount, order.orderCode)}
                                        disabled={orderVerifyingMap[order.id] || !(orderTxInputMap[order.id] || '').trim()}
                                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-[11px] uppercase tracking-wider cursor-pointer shrink-0 transition-colors"
                                      >
                                        {orderVerifyingMap[order.id] ? 'Verifica...' : 'Sblocca'}
                                      </button>
                                    </div>
                                    {orderTxErrorMap[order.id] && (
                                      <div className="text-[10px] text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>{orderTxErrorMap[order.id]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card 2: Convalida Email dell'Ordine */}
                            <div
                              className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
                                isEmailValidated
                                  ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                                  : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                                {isEmailValidated ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span>Email dell'Ordine Convalidata</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                                    <span>In Attesa di Convalida Email</span>
                                  </>
                                )}
                              </div>
                              <p className="text-[11px] leading-relaxed text-neutral-300">
                                {isEmailValidated ? (
                                  <>
                                    L'ordine è stato regolarmente verificato e confermato dallo staff di 171 Studio per l'indirizzo <strong className="text-emerald-300">{order.userEmail}</strong>.
                                    {order.emailValidatedAt && (
                                      <span className="block text-[10px] text-neutral-400 mt-1">
                                        Data convalida: {new Date(order.emailValidatedAt).toLocaleString('it-IT')}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    La richiesta è stata presa in carico dallo staff 171. A breve riceverai l'email di conferma ufficiale a <strong className="text-amber-200">{order.userEmail}</strong>.
                                  </>
                                )}
                              </p>
                            </div>

                            {/* Card 3: Spedizione o Ritiro in Sede */}
                            {isShipping && (
                              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between text-neutral-300">
                                  <span className="flex items-center gap-1.5 font-bold text-[11px] text-neutral-200 uppercase">
                                    <Truck className="w-4 h-4 text-blue-400" />
                                    <span>Spedizione Corriere Espresso</span>
                                  </span>
                                  <span className="text-[10px] text-neutral-400">
                                    {order.trackingCarrier || 'Poste Italiane SDA'}
                                  </span>
                                </div>

                                {order.trackingNumber ? (
                                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-blue-500/40 space-y-1">
                                    <div className="text-[10px] text-neutral-400 uppercase">
                                      Numero di Tracciamento:
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-sm font-black text-blue-400 select-all">
                                        {order.trackingNumber}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.trackingNumber || '');
                                          setCopiedTrackingId(order.id);
                                          setTimeout(() => setCopiedTrackingId(null), 2500);
                                        }}
                                        className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 cursor-pointer"
                                      >
                                        {copiedTrackingId === order.id ? (
                                          <span className="text-emerald-400 font-bold">Copiato!</span>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copia</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {order.trackingUrl && (
                                      <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:underline pt-0.5"
                                      >
                                        <span>Segui Spedizione Online</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-[11px] text-neutral-400">
                                    Pacco in preparazione presso 171 Studio. Il numero di tracciamento comparirà qui non appena consegnato al corriere.
                                  </div>
                                )}

                                <div className="text-[10px] text-neutral-400 truncate">
                                  Destinazione: <strong className="text-neutral-300">{order.shippingAddress}, {order.shippingZip} {order.shippingCity}</strong>
                                </div>
                              </div>
                            )}

                            {isPickup && (
                              <div className="p-4 rounded-xl bg-neutral-900 border border-amber-500/30 text-xs font-mono space-y-2 md:col-span-2">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300 uppercase">
                                    <MapPin className="w-4 h-4 text-amber-400" />
                                    <span>Ritiro in Studio (Messina)</span>
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                      order.pickupStatus === 'pronto_ritiro'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    }`}
                                  >
                                    {order.pickupStatus === 'pronto_ritiro' ? '✓ Pronto per il Ritiro!' : 'In Preparazione'}
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-1">
                                  <div className="text-[10px] text-amber-400 font-bold uppercase">
                                    QUANDO È POSSIBILE IL RITIRO:
                                  </div>
                                  <div className="text-xs text-white font-bold">
                                    {order.pickupReadyDate
                                      ? `Disponibile a partire dal: ${order.pickupReadyDate}`
                                      : 'Disponibile per il ritiro immediato in sede'}
                                  </div>
                                  <div className="text-[11px] text-neutral-300">
                                    Orari: <strong className="text-amber-300">{order.pickupSlot || 'Dal Lunedì al Sabato (10:00 - 20:00)'}</strong>
                                  </div>
                                  <div className="text-[10px] text-neutral-400 pt-1">
                                    Sede: 171 Studio Messina • Mostra il codice <strong className="text-white">#{order.orderCode}</strong> al bancone.
                                  </div>
                                </div>
                              </div>
                            )}

                            {isDigital && (
                              <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-500/30 text-xs font-mono space-y-2.5 md:col-span-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-300 uppercase">
                                    <Download className="w-4 h-4 text-emerald-400" />
                                    <span>{order.basePrice <= 3.50 ? 'Edizione MP3 (14 Tracce MP3 320k)' : 'Edizione Premium WAVE (WAV 24-bit + Master Pack)'}</span>
                                  </div>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                                    order.paymentStatus === 'saldato'
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                                      : 'bg-amber-950 text-amber-300 border-amber-700/60'
                                  }`}>
                                    {order.paymentStatus === 'saldato' ? '✓ Download Sbloccato' : '🔒 Download Bloccato'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-300">
                                  {order.basePrice <= 3.50 
                                    ? 'Tutte le 14 tracce ufficiali dell\'album in formato MP3 ad alta fedeltà (320 kbps).'
                                    : 'Tutti i 14 brani master WAV 24-bit studio quality + MP3 320k, copertine fronte/retro e le 16 grafiche ufficiali dei singoli.'
                                  }
                                </p>
                                {order.paymentStatus === 'saldato' ? (
                                  <a
                                    href={order.basePrice <= 3.50 ? ALBUM_MP3_DOWNLOAD_URL : ALBUM_MASTER_DOWNLOAD_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={order.basePrice <= 3.50 ? "THE_GOD_CYPHER_MP3_EDITION.zip" : "THE_GOD_CYPHER_PREMIUM_WAVE.zip"}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-['Cinzel_Decorative',serif] text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>{order.basePrice <= 3.50 ? 'Scarica Edizione MP3 (206 MB)' : 'Scarica Edizione Premium WAVE (1 GB)'}</span>
                                  </a>
                                ) : (
                                  <div className="p-2.5 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px] text-amber-300">
                                    <div className="flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                      <span>Download protetto: inserisci e convalida l'ID Transazione PayPal nel box di pagamento sopra per sbloccare i file master.</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-500 text-[10px] uppercase font-bold shrink-0">
                                      Bloccato
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>

                        {/* If physical order: also grant digital download CTA ONLY AFTER payment */}
                        {isPhysical && (
                          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                            <span className="text-neutral-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Con la copia fisica hai diritto anche al <strong>Master Pack Digitale immediato</strong> (WAV 24-bit + MP3 + grafiche).</span>
                            </span>
                            {order.paymentStatus === 'saldato' ? (
                              <a
                                href={ALBUM_MASTER_DOWNLOAD_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                download="THE_GOD_CYPHER_PREMIUM_WAVE.zip"
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>Scarica Edizione Premium WAVE (1 GB)</span>
                              </a>
                            ) : (
                              <span className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                <Lock className="w-3 h-3" />
                                <span>Master Digitale Bloccato (In Attesa Saldo)</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: LE MIE DONAZIONI & EARLY SUPPORTER LIFETIME PASS                 */}
      {/* ========================================================================= */}
      {(activeSection === 'overview' || activeSection === 'donations') && (
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/30 space-y-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Heart className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  171 PLUGIN INNOVATION • EARLY SUPPORTER PROGRAM
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                  Le Mie Donazioni & Early Supporter Lifetime Pass
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Verifica stato donazioni, ID transazioni PayPal e accesso a vita a tutte le future release DSP.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Supporta i Plugin</span>
            </button>
          </div>

          {/* Supporter Badge Summary Card */}
          {currentUser.isEarlySupporter ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-neutral-900 to-amber-950/50 border-2 border-amber-500/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-mono font-black uppercase tracking-wider shadow-md">
                    🌟 LIFETIME PASS ATTIVO
                  </span>
                  <span className="text-xs font-mono text-amber-300 font-bold">
                    Badge Early Supporter Convalidato
                  </span>
                </div>
                <h4 className="text-lg font-heading font-black text-white">
                  Early Supporter Ufficiale di 171 Plugin Innovation
                </h4>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed max-w-2xl">
                  Il tuo account è ufficialmente registrato come <strong>Early Supporter</strong>! Hai diritto all'<strong>Accesso a Vita</strong> ad ogni singolo plugin, espansione o algoritmo DSP sviluppato in futuro da 171 Plugin Innovation, inclusi tutti i futuri aggiornamenti e release commerciali a pagamento!
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-amber-400/90 pt-0.5">
                  <span>Totale donazioni accumulate: <strong>€{userCumulativeStats.totalDonated.toFixed(2)}</strong></span>
                  {currentUser.earlySupporterTxId && (
                    <span>• Transazione PayPal: <strong>{currentUser.earlySupporterTxId}</strong></span>
                  )}
                  {currentUser.earlySupporterUnlockedAt && (
                    <span>• Sbloccato il {new Date(currentUser.earlySupporterUnlockedAt).toLocaleDateString('it-IT')}</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 text-center shrink-0 w-full md:w-auto">
                <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1">Stato Licenza</span>
                <span className="text-sm font-heading font-black text-emerald-400 block">ILLIMITATA A VITA</span>
                <span className="text-[10px] font-mono text-neutral-400">Tutti i plugin futuri gratuiti</span>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/25 via-neutral-950 to-neutral-900 border-2 border-amber-500/50 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                      Pass Non Ancora Sbloccato
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Soglia per Lifetime Pass: <strong>20$ / 20€</strong>
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-heading font-black text-white">
                    Grazie per il supporto, le donazioni sono cumulabili: quando arriverai a 20 dollari sbloccherai tutti i plugin
                  </h4>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                    La suite è attualmente in <strong>Early Access gratuito</strong> per permettere lo sviluppo di plugin sempre più precisi e potenti. Con una o più donazioni cumulabili fino a raggiungere 20$ (o 20€) ti garantisci l'<strong>Accesso a Vita</strong> e copie gratuite di tutti i futuri plugin commerciali sviluppati da 171 Plugin Innovation!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => onNavigate('plugin-innovation')}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Heart className="w-4 h-4 fill-black" />
                    <span>Dona e Completa Soglia (€{userCumulativeStats.remainingForLifetime.toFixed(2)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('plugin-innovation')}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-amber-500/40 font-mono text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Donazione Libera (Cumulabile) ➔</span>
                  </button>
                </div>
              </div>

              {/* Cumulative Progress Bar in Account Dashboard */}
              <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-300">
                    Avanzamento Donazioni Cumulate: <strong className="text-amber-400 font-bold">€{userCumulativeStats.totalDonated.toFixed(2)}</strong> / €20.00
                  </span>
                  <span className="text-amber-300 font-bold">
                    {userCumulativeStats.remainingForLifetime <= 0
                      ? '🌟 100% Raggiunto!'
                      : `Mancano €${userCumulativeStats.remainingForLifetime.toFixed(2)}`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((userCumulativeStats.totalDonated / 20) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* User's Donations History & Verification List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
              Storico Donazioni Registrate ({userDonations.length})
            </h4>

            {userDonations.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-neutral-800/80 text-center text-xs font-mono text-neutral-500">
                Nessuna donazione registrata con questo account. Effettua una donazione nella pagina Plugin per supportare lo sviluppo!
              </div>
            ) : (
              <div className="space-y-3">
                {userDonations.map((don) => {
                  const isVerified = don.status === 'convalidata' || don.paymentStatus === 'saldato';
                  const isVerifying = Boolean(donationVerifyingMap[don.id]);
                  const txError = donationTxErrorMap[don.id];

                  return (
                    <div
                      key={don.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all text-xs font-mono space-y-3 ${
                        isVerified
                          ? 'bg-black/80 border-neutral-800'
                          : 'bg-gradient-to-r from-amber-950/20 via-neutral-950 to-neutral-950 border-amber-500/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-white font-bold text-sm">#{don.donationCode}</strong>
                          <span className="text-neutral-400 text-[11px]">
                            {new Date(don.createdAt).toLocaleDateString('it-IT')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-heading font-black text-white">
                            €{don.amount.toFixed(2)}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isVerified
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                                : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                            }`}
                          >
                            {isVerified ? '✓ Convalidata (Saldato)' : '● In Attesa Convalida PayPal'}
                          </span>
                          {don.isEarlySupporterPass && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                              🌟 Early Supporter
                            </span>
                          )}
                        </div>
                      </div>

                      {don.notes && (
                        <p className="text-neutral-300 text-[11.5px] font-sans">
                          {don.notes}
                        </p>
                      )}

                      {/* If verified, show transaction details */}
                      {isVerified ? (
                        <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div>
                            <span className="text-neutral-500 block text-[10px] uppercase">Codice Transazione PayPal:</span>
                            <span className="text-emerald-400 font-bold">{don.paypalTransactionId || 'Convalidata'}</span>
                          </div>
                          {don.paypalPaidAt && (
                            <div className="text-neutral-400 text-[10px]">
                              Saldato il: {new Date(don.paypalPaidAt).toLocaleString('it-IT')}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* If pending, show PayPal verification input */
                        <div className="p-3.5 rounded-xl bg-neutral-900/90 border border-amber-500/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-amber-300 font-bold uppercase">
                              Convalida Transazione PayPal
                            </span>
                            {don.paypalPaymentUrl && (
                              <a
                                href={don.paypalPaymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                              >
                                <span>Paga su PayPal ({don.amount} €)</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                            Inserisci il codice transazione ricevuto via email da PayPal dopo aver inviato la donazione per sbloccare istantaneamente il badge sul tuo account:
                          </p>

                          {txError && (
                            <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/60 text-[11px] text-red-300">
                              {txError}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={donationTxInputMap[don.id] || ''}
                              onChange={(e) =>
                                setDonationTxInputMap((prev) => ({ ...prev, [don.id]: e.target.value }))
                              }
                              placeholder="Codice Transazione PayPal (es. 9XY81742...)"
                              className="flex-1 px-3 py-2 rounded-xl bg-black border border-neutral-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyDonationPayPal(don.id)}
                              disabled={isVerifying || !(donationTxInputMap[don.id] || '').trim()}
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                            >
                              {isVerifying ? 'Verifica...' : 'Convalida Transazione'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: I MIEI SCONTI & VOUCHER RISERVATI (PERSONALIZZATI & BENVENUTO)   */}
      {/* ========================================================================= */}
      {(activeSection === 'overview' || activeSection === 'vouchers') && (
        <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/30 space-y-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  PROMOZIONI & SCONTI RISERVATI AL TUO ACCOUNT
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                  I Miei Sconti, Voucher Personali & Promo Benvenuto
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  I codici sconto riservati all'account <strong>{currentUser.email}</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('prenota-sessione')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md shadow-amber-500/20"
            >
              <span>Usa Voucher in Prenotazione</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Welcome Discount (Personal & Non-transferable) */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
              isWelcomeUsed
                ? 'bg-neutral-950/40 border-neutral-800 opacity-70'
                : 'bg-neutral-950/90 border-amber-500/50 shadow-lg shadow-amber-500/5'
            }`}>
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sconto Benvenuto Registrazione</span>
                  </span>
                  <span className="text-xl font-heading font-black text-emerald-400">
                    -{siteContent.registrationDiscountPercent ?? 5}%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 mb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 block">Codice Personale</span>
                    <span className="text-sm font-mono font-black text-amber-300 tracking-wider">
                      {welcomeCode}
                    </span>
                  </div>
                  {!isWelcomeUsed && (
                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(welcomeCode)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedVoucherCode === welcomeCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copiato!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copia</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-xs text-neutral-300 font-light mb-3">
                  Valido su tutte le sessioni di registrazione, mix & master e produzione in studio.
                </p>

                <div className="p-2.5 rounded-xl bg-neutral-900/70 border border-neutral-800/80 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Stato Utilizzo:</span>
                    {isWelcomeUsed ? (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        ✗ Riscattato (Limite 1 utilizzo raggiunto)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        ● Disponibile (1 utilizzo per account)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                    🔒 <strong className="text-neutral-300">Non trasferibile:</strong> questo codice sconto di benvenuto è personale e strettamente vincolato al tuo account ({currentUser.email}).
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-500">
                  {isWelcomeUsed ? 'Utilizzato per una sessione' : 'Applicabile al checkout prenotazione'}
                </span>
                {!isWelcomeUsed && (
                  <button
                    type="button"
                    onClick={() => onNavigate('prenota-sessione')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    Usa Ora
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Personalized Vouchers Assigned by Master */}
            <div className="p-5 rounded-2xl bg-neutral-950/90 border border-neutral-800 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-xs font-black tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Voucher Personali Master ({personalVouchers.length})</span>
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-bold">
                    Esclusivi per te
                  </span>
                </div>

                {personalVouchers.length === 0 ? (
                  <div className="p-6 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-center space-y-2">
                    <Gift className="w-8 h-8 text-neutral-600 mx-auto" />
                    <h5 className="text-sm font-heading font-bold text-white">Nessun voucher dedicato attivo</h5>
                    <p className="text-xs text-neutral-400 font-mono">
                      Lo staff di 171 Studio assegna sconti fedeltà personalizzati via via che prenoti sessioni o rilasci feedback.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {personalVouchers.map((v) => {
                      const isPct = v.discountType === 'percent' || v.discountType === 'percentage';
                      const isRedeemed = Boolean(
                        v.singleUsePerAccount &&
                        currentUser.email &&
                        (v.usedByEmails || []).some(e => e.toLowerCase() === currentUser.email.toLowerCase())
                      );

                      return (
                        <div
                          key={v.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isRedeemed
                              ? 'bg-neutral-900/40 border-neutral-800 opacity-60'
                              : 'bg-neutral-900 border-purple-500/40 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono font-black text-amber-300 text-sm tracking-wider">
                              {v.code}
                            </span>
                            <span className="font-heading font-black text-emerald-400 text-base">
                              {isPct ? `-${v.discountValue}%` : `-${v.discountValue} €`}
                            </span>
                          </div>

                          {v.code.startsWith('171-TESTER-VIP') && (
                            <div className="mb-2">
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 w-max">
                                <Wrench className="w-3 h-3 text-cyan-400" />
                                <span>🏆 RICOMPENSA BUG HUNTER 171 STUDIO</span>
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-white font-medium mb-1">
                            {v.title || v.description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-800">
                            <span>
                              {isRedeemed ? (
                                <strong className="text-red-400">✗ Già Riscattato</strong>
                              ) : (
                                <strong className="text-emerald-400">● Disponibile</strong>
                              )}
                            </span>

                            {!isRedeemed && (
                              <button
                                type="button"
                                onClick={() => handleCopyVoucher(v.code)}
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                              >
                                {copiedVoucherCode === v.code ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-300 font-bold">Copiato</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copia</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Public Studio Vouchers */}
              {publicVouchers.length > 0 && (
                <div className="pt-3 border-t border-neutral-800">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2 font-bold">
                    Voucher Promozionali Pubblici Attivi:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {publicVouchers.map((v) => {
                      const isPct = v.discountType === 'percent' || v.discountType === 'percentage';
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleCopyVoucher(v.code)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                          title="Clicca per copiare il codice"
                        >
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span>{v.code} ({isPct ? `-${v.discountValue}%` : `-${v.discountValue}€`})</span>
                          {copiedVoucherCode === v.code && <Check className="w-3 h-3 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1 & 2: SESSIONS & 24H CANCELLATION + FULL HISTORY */}
      {(activeSection === 'overview' || activeSection === 'sessions') && (
        <div className="space-y-8 mb-12">
          {/* Active Sessions with 24h Cancellation Rule */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/30 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                    POLITICA CANCELLAZIONE 24 ORE
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                  Le Tue Sessioni Prenotate
                </h2>
                <p className="text-xs font-mono text-neutral-400">
                  Puoi cancellare autonomamente e gratuitamente qualsiasi sessione fino a <strong className="text-white">24 ore prima</strong> dell'orario di inizio fissato.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('prenota-sessione')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuova Prenotazione</span>
              </button>
            </div>

            {activeBookings.length === 0 ? (
              <div className="p-8 rounded-2xl bg-neutral-950/70 border border-neutral-800 text-center space-y-3">
                <Calendar className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="text-sm font-heading font-bold text-white">
                  Nessuna sessione attiva in programma al momento
                </p>
                <p className="text-xs font-mono text-neutral-400">
                  Prenota una nuova sessione in studio per bloccare data e orario in tempo reale.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeBookings.map((booking) => {
                  const cancelCheck = canClientCancelBooking(booking);
                  const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
                  const paypalUrl =
                    booking.paypalPaymentUrl ||
                    getPayPalPaymentUrl(booking.estimatedPrice, booking.orderCode, effectivePaypalEmail);

                  return (
                    <div
                      key={booking.id}
                      className="p-5 sm:p-6 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-amber-400 font-mono text-xs font-bold">
                            #{booking.orderCode}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              booking.status === 'confermata'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {booking.status === 'confermata'
                              ? '✓ CONFERMATA DA IGOR ROZANOV'
                              : '⏳ IN VERIFICA DISPONIBILITÀ'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase border ${
                              cancelCheck.allowed
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                            }`}
                          >
                            {cancelCheck.hoursRemaining > 0
                              ? `Mancano ${cancelCheck.hoursRemaining}h all'inizio`
                              : 'Sessione odierna / trascorsa'}
                          </span>
                        </div>

                        <h3 className="text-lg font-heading font-bold text-white">
                          {booking.serviceTitle}
                        </h3>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <strong>Data:</strong> {booking.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <strong>Orario:</strong> {booking.time} ({booking.hours}h)
                          </span>
                          <span className="text-emerald-400 font-bold">
                            Quota: {booking.estimatedPrice}€
                          </span>
                        </div>

                        {booking.notes && (
                          <p className="text-xs font-mono text-neutral-400 italic">
                            Note: "{booking.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                        {/* PayPal Payment Link */}
                        {booking.paymentStatus !== 'saldato' && (
                          <a
                            href={paypalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Paga prima di arrivare in studio ({booking.estimatedPrice}€)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {/* Google Drive Delivery Download Button */}
                        {booking.driveDeliveryUrl && (
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDrive(booking)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            title="Scarica i file di progetto da Google Drive"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>
                              {booking.driveDeliveryStatus === 'download_confermato'
                                ? '✓ File Drive (Download Confermato)'
                                : '📥 Scarica File (Google Drive)'}
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {/* 24h Cancellation Button */}
                        {cancelCheck.allowed ? (
                          <button
                            type="button"
                            onClick={() => setBookingToCancel(booking)}
                            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Cancella Sessione (entro 24h)</span>
                          </button>
                        ) : (
                          <div
                            className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[11px] flex items-center gap-1.5"
                            title={cancelCheck.reason}
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Cancellazione bloccata (&lt; 24h)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complete Historical Sessions Table */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                ARCHIVIO STORICO ARTISTA
              </span>
              <h3 className="text-xl font-heading font-bold text-white">
                Storico Generale delle Sessioni Fatte e Prenotate ({userBookings.length})
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-3.5">Codice Ordine</th>
                    <th className="p-3.5">Servizio Studio</th>
                    <th className="p-3.5">Data & Ora</th>
                    <th className="p-3.5">Durata / Quota</th>
                    <th className="p-3.5">Stato Sessione</th>
                    <th className="p-3.5">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {userBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400 whitespace-nowrap">
                        {b.orderCode}
                      </td>
                      <td className="p-3.5 text-white">
                        <span className="font-bold block">{b.serviceTitle}</span>
                        {b.cancellationReason && (
                          <span className="text-[10px] text-red-400 block">
                            Motivo: {b.cancellationReason}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-neutral-300 whitespace-nowrap">
                        {b.date} • {b.time}
                      </td>
                      <td className="p-3.5 text-neutral-300 whitespace-nowrap">
                        {b.hours}h • <strong className="text-emerald-400">{b.estimatedPrice}€</strong>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            b.status === 'confermata'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : b.status === 'completata'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : b.status === 'annullata'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                            b.paymentStatus === 'saldato'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold'
                              : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                          }`}
                        >
                          {b.paymentStatus === 'saldato' ? 'SALDATO' : 'DA SALDARE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: I MIEI FILE (MY FILES - GOOGLE DRIVE DELIVERIES & CLIENT STEMS) */}
      {(activeSection === 'overview' || activeSection === 'files') && (
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-6 mb-12 shadow-xl">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  I Miei File • My Files
                </span>
                {newMasterUploadsCount > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {newMasterUploadsCount} Nuovi in Attesa di Download
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                I Miei File & Consegne Master
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                Consulta e scarica i file Mix/Master e Stems condivisi dal Master tramite Google Drive, con tracciamento download in tempo reale.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-lg shadow-amber-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Invia File / Stems allo Studio</span>
            </button>
          </div>

          {/* New Uploads Attention Banner */}
          {newMasterUploadsCount > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                    Nuovi File Master Pronti al Download
                  </h4>
                  <p className="text-[11px] font-mono text-neutral-300">
                    Igor Rozanov ha caricato <strong className="text-amber-400">{newMasterUploadsCount} nuova/e consegna/e</strong> tramite Google Drive. Clicca per accedere direttamente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMyFilesCategory('master_shared');
                  setMyFilesStatusFilter('nuovi');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0"
              >
                Vedi Subito Nuovi File
              </button>
            </div>
          )}

          {/* Client File Upload Form Drawer */}
          {showUploadForm && (
            <form
              onSubmit={handleCreateClientFile}
              className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/40 space-y-4 text-xs font-mono animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold uppercase flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Invia File / Stems / Basi allo Studio di Registrazione
                </span>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Seleziona File Audio / Archivio
                  </label>
                  <input
                    type="file"
                    accept=".wav,.mp3,.zip,.rar,.aiff,.flac"
                    onChange={handleFileInputSelect}
                    className="w-full text-xs text-neutral-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Nome Traccia / Cartella *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="Es. Beat_Trap_140BPM_Stems.zip"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Tipologia File
                  </label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as ClientFileItem['fileType'])}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-amber-400"
                  >
                    <option value="stems_progetto">Stems Progetto Separati (.ZIP / .WAV)</option>
                    <option value="base_wav">Base Strumentale (.WAV / .MP3)</option>
                    <option value="registrazione_vocale">Take Vocale Grezza / Provino</option>
                    <option value="mix_master">Mix & Master Finale</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Codice Ordine Prenotazione Associato (Opzionale)
                  </label>
                  <input
                    type="text"
                    value={uploadBookingCode}
                    onChange={(e) => setUploadBookingCode(e.target.value)}
                    placeholder="Es. 171-ORD-558291"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Note Tecniche per Igor Rozanov (BPM, Chiave, Indicazioni)
                  </label>
                  <input
                    type="text"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Es. 140 BPM Fa Diesis Minore - Voci principali già allineate"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase transition-all"
                >
                  Salva nel Mio Archivio 171 Studio
                </button>
              </div>
            </form>
          )}

          {/* Dedicated Filters & Live Search Bar */}
          <div className="space-y-3 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Subtabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMyFilesCategory('master_shared')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    myFilesCategory === 'master_shared'
                      ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Condivisi dal Master ({masterSharedFiles.length})</span>
                  {newMasterUploadsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMyFilesCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    myFilesCategory === 'all'
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span>Tutti i File ({combinedUserFiles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMyFilesCategory('client_uploaded')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    myFilesCategory === 'client_uploaded'
                      ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>Caricati da Te ({clientUploadedFiles.length})</span>
                </button>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMyFilesStatusFilter('tutti')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                    myFilesStatusFilter === 'tutti'
                      ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Tutti gli stati
                </button>

                <button
                  type="button"
                  onClick={() => setMyFilesStatusFilter('nuovi')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    myFilesStatusFilter === 'nuovi'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'text-neutral-400 hover:text-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Nuovi ({newMasterUploadsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMyFilesStatusFilter('confermati')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 ${
                    myFilesStatusFilter === 'confermati'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                      : 'text-neutral-400 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Download Confermati</span>
                </button>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={myFilesSearch}
                onChange={(e) => setMyFilesSearch(e.target.value)}
                placeholder="Cerca per titolo file, codice ordine (#171-ORD-...), o note del fonico..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-mono placeholder:text-neutral-400 outline-none focus:border-amber-400 transition-colors"
              />
              {myFilesSearch && (
                <button
                  type="button"
                  onClick={() => setMyFilesSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Files Grid View */}
          {filteredMyFiles.length === 0 ? (
            <div className="p-12 rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
                Nessun file trovato
              </h3>
              <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto">
                {myFilesSearch 
                  ? 'Nessun risultato corrisponde ai criteri di ricerca impostati.'
                  : myFilesCategory === 'master_shared'
                  ? 'Non sono ancora stati condivisi file di consegna per il tuo account. Quando il fonico completerà il tuo Mix & Master, troverai qui il link diretto Google Drive!'
                  : 'Nessun file audio presente in questa categoria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyFiles.map((file) => {
                const isDrive = Boolean(file.isDriveDelivery || file.driveUrl);
                const isConfirmed = file.deliveryStatus === 'download_confermato' && (file.downloadCount || 0) > 0;
                const isNewUpload = isDrive && !isConfirmed;

                return (
                  <div
                    key={file.id}
                    className={`p-5 rounded-2xl bg-neutral-950 border transition-all flex flex-col justify-between gap-4 ${
                      isNewUpload
                        ? 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/30'
                        : isDrive
                        ? 'border-emerald-500/40 hover:border-emerald-400/70 shadow-lg shadow-emerald-500/5'
                        : 'border-neutral-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${
                            isDrive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : file.uploadedBy === '171_studio'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {isDrive ? (
                            <>
                              <FolderOpen className="w-3 h-3 text-emerald-400" />
                              <span>GOOGLE DRIVE • 171 STUDIO</span>
                            </>
                          ) : file.uploadedBy === '171_studio' ? (
                            'CONSEGNATO DA 171 STUDIO'
                          ) : (
                            'CARICATO DA TE'
                          )}
                        </span>

                        {/* Status Indicator: NUOVO UPLOAD vs DOWNLOAD CONFERMATO */}
                        {isDrive && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1.5 ${
                              isConfirmed
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/60 animate-pulse'
                            }`}
                          >
                            {isConfirmed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>
                                  Download Confermato ({file.downloadCount}x)
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                <span>Nuovo Upload • In attesa di download</span>
                              </>
                            )}
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-neutral-400">
                          {file.fileSize}
                        </span>
                      </div>

                      {/* File Title */}
                      <div className="flex items-start gap-2.5">
                        {isDrive ? (
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <FolderOpen className="w-4 h-4 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                            <FileAudio className="w-4 h-4 text-blue-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-heading font-bold text-white break-all leading-tight">
                            {file.fileName}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mt-0.5">
                            {file.fileType === 'mix_master' ? 'Mix & Master WAV 24-bit 96kHz' : file.fileType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Notes from Master / Client */}
                      {file.notes && (
                        <div className="text-xs font-mono text-neutral-300 bg-neutral-900/70 p-3 rounded-xl border border-neutral-800/80 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                            Note per l'Artista:
                          </span>
                          <p>{file.notes}</p>
                        </div>
                      )}

                      {/* Download Confirmation timestamp details */}
                      {isDrive && isConfirmed && file.lastDownloadedAt && (
                        <div className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>
                            Ultimo scaricamento verificato il {new Date(file.lastDownloadedAt).toLocaleDateString('it-IT')} alle ore {new Date(file.lastDownloadedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Action Buttons */}
                    <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-neutral-500">
                        {new Date(file.createdAt).toLocaleDateString('it-IT')}
                        {file.bookingOrderCode ? ` • #${file.bookingOrderCode}` : ''}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Copy Link Button for Drive */}
                        {isDrive && file.driveUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(file.driveUrl || '');
                              setCopiedLinkId(file.id);
                              setTimeout(() => setCopiedLinkId(null), 2500);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1 transition-colors cursor-pointer text-xs"
                            title="Copia link Google Drive"
                          >
                            {copiedLinkId === file.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copiato!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copia Link</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Open / Download Button */}
                        {isDrive ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadSimulatedFile(file)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer hover:scale-105 active:scale-95"
                            title="Apri e scarica da Google Drive con rilascio automatico della ricevuta"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Apri Google Drive</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownloadSimulatedFile(file)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Scarica File</span>
                          </button>
                        )}

                        {/* Delete for client uploaded files */}
                        {file.uploadedBy === 'cliente' && (
                          <button
                            type="button"
                            onClick={() => deleteClientFile(file.id)}
                            className="p-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                            title="Rimuovi file dal tuo archivio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: I PLUGIN SCARICATI (171 PLUGIN INNOVATION) */}
      {(activeSection === 'overview' || activeSection === 'plugins') && (
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-6 mb-12 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold block">
                LICENZE & DOWNLOAD DSP
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                I Tuoi Plugin Scaricati ({userPlugins.length})
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                Elenco dei plugin VST3 / AU / AAX della suite 171 Plugin Innovation associati al tuo account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation')}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Esplora Catalogo Plugin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userPlugins.map((pl) => (
              <div
                key={pl.id}
                className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">
                      {pl.pluginBadge}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                      LICENZA ATTIVA
                    </span>
                  </div>
                  <h4 className="text-base font-heading font-bold text-white mb-1">
                    {pl.pluginName}
                  </h4>
                  <p className="text-[11px] font-mono text-neutral-400">
                    Scaricato il: {new Date(pl.downloadedAt).toLocaleString('it-IT')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    downloadPlugin(pl.pluginId);
                    setActionBanner({
                      type: 'success',
                      text: `Installer di ${pl.pluginName} (VST3/AU) avviato nuovamente.`,
                    });
                    setTimeout(() => setActionBanner(null), 4000);
                  }}
                  className="w-full py-2 rounded-xl bg-neutral-900 hover:bg-amber-500 text-neutral-200 hover:text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-neutral-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Scarica di Nuovo Installer</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: STATISTICHE & STORICO KEY & BPM FINDER */}
      {(activeSection === 'overview' || activeSection === 'keybpm') && (
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/30 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase">
                  CONTATORE UTILIZZI: {userKeyBpm.length} ANALISI EFFETTUATE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                Storico Utilizzi Key & BPM Finder
              </h2>
              <p className="text-xs font-mono text-neutral-400">
                Tutte le tracce che hai analizzato con lo strumento Key & BPM Finder (riservato agli utenti registrati).
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('strumenti-online')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Analizza Nuovo Brano</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Traccia Audio Analizzata</th>
                  <th className="p-3.5">BPM Rilevato</th>
                  <th className="p-3.5">Tonalità (IT / EN)</th>
                  <th className="p-3.5">Camelot</th>
                  <th className="p-3.5">Precisione</th>
                  <th className="p-3.5">Data Analisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {userKeyBpm.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 text-neutral-500 font-bold">
                      #{userKeyBpm.length - idx}
                    </td>
                    <td className="p-3.5 text-white font-bold">
                      {item.fileName}
                      <span className="block text-[10px] text-neutral-500 font-normal">
                        {item.fileSize}
                      </span>
                    </td>
                    <td className="p-3.5 text-amber-400 font-black text-sm">
                      {item.bpm} BPM
                    </td>
                    <td className="p-3.5 text-neutral-200">
                      <strong>{item.musicalKeyIt}</strong> ({item.musicalKey})
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        {item.camelot}
                      </span>
                    </td>
                    <td className="p-3.5 text-emerald-400">
                      {item.confidence}%
                    </td>
                    <td className="p-3.5 text-neutral-400 whitespace-nowrap">
                      {new Date(item.analyzedAt).toLocaleString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: REPORT PLUGIN BUG AND HELP US */}
      {(activeSection === 'overview' || activeSection === 'bug_report') && (
        <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-6 mb-12 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-400">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-red-400 tracking-widest font-bold block">
                  171 PLUGIN INNOVATION • BUG REPORTING LAB
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                  Report Plugin Bug & Help Us
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('plugin-innovation')}
              className="text-xs font-mono text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Vedi Suite Plugin ➔</span>
            </button>
          </div>

          <p className="text-xs text-neutral-300 font-light leading-relaxed max-w-3xl">
            I nostri plugin DSP sono gratuiti e open per tutti i produttori. Aiutaci a renderli stabili ed eccellenti: se hai riscontrato un bug, un crash o un'anomalia audio, compila il modulo tecnico qui sotto. I report vengono gestiti direttamente dal team di sviluppo di 171 Studio.
          </p>

          {/* Form */}
          <form onSubmit={handleBugReportSubmit} className="p-6 rounded-2xl bg-black/60 border border-neutral-800 space-y-5">
            <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Nuova Segnalazione Bug</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {/* Plugin Select */}
              <div>
                <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-bold">
                  Quale Plugin? *
                </label>
                <select
                  required
                  value={bugPluginName}
                  onChange={(e) => {
                    setBugPluginName(e.target.value);
                    const found = siteContent.plugins?.find(p => p.name === e.target.value);
                    if (found) setBugPluginId(found.id);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="" disabled>Seleziona il plugin...</option>
                  {(siteContent.plugins && siteContent.plugins.length > 0 ? siteContent.plugins : [
                    { id: 'plugin-1', name: '171 Vocal Sculptor' },
                    { id: 'plugin-2', name: '171 LowEnd Punch' },
                    { id: 'plugin-3', name: '171 Analog Warmth' },
                    { id: 'plugin-4', name: '171 Spatializer 3D' },
                  ]).map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                  <option value="Altro Plugin / Installer ZIP">Altro Plugin / Installer ZIP</option>
                </select>
              </div>

              {/* Operating System */}
              <div>
                <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-bold">
                  Sistema Operativo (OS) *
                </label>
                <select
                  value={bugOs}
                  onChange={(e) => setBugOs(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="Windows 11 (64-bit)">Windows 11 (64-bit)</option>
                  <option value="Windows 10 (64-bit)">Windows 10 (64-bit)</option>
                  <option value="macOS Apple Silicon (M1/M2/M3/M4)">macOS Apple Silicon (M1/M2/M3/M4)</option>
                  <option value="macOS Intel (64-bit)">macOS Intel (64-bit)</option>
                  <option value="Linux / Wine / Native">Linux / Wine / Native</option>
                </select>
              </div>

              {/* DAW Used */}
              <div>
                <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-bold">
                  DAW Utilizzata *
                </label>
                <select
                  value={bugDaw}
                  onChange={(e) => setBugDaw(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="FL Studio">FL Studio</option>
                  <option value="Ableton Live">Ableton Live</option>
                  <option value="Logic Pro">Logic Pro</option>
                  <option value="Pro Tools">Pro Tools</option>
                  <option value="Cubase / Nuendo">Cubase / Nuendo</option>
                  <option value="Studio One">Studio One</option>
                  <option value="Reaper">Reaper</option>
                  <option value="Bitwig Studio">Bitwig Studio</option>
                  <option value="Altra DAW">Altra DAW</option>
                </select>
              </div>

              {/* Plugin Format */}
              <div>
                <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-bold">
                  Formato Plugin
                </label>
                <select
                  value={bugFormat}
                  onChange={(e) => setBugFormat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-red-500 focus:outline-none"
                >
                  <option value="VST3 (64-bit)">VST3 (64-bit)</option>
                  <option value="AU (Audio Unit macOS)">AU (Audio Unit macOS)</option>
                  <option value="AAX (Pro Tools)">AAX (Pro Tools)</option>
                  <option value="Standalone App">Standalone App</option>
                </select>
              </div>

              {/* Severity */}
              <div className="sm:col-span-2">
                <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-bold">
                  Gravità dell'Anomalia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bassa', label: 'Bassa (Glitch grafico)' },
                    { id: 'media', label: 'Media (Audio anomalo)' },
                    { id: 'critica', label: 'Critica (Crash / DAW Freeze)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBugSeverity(s.id as typeof bugSeverity)}
                      className={`p-2 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                        bugSeverity === s.id
                          ? s.id === 'critica'
                            ? 'bg-red-950 text-red-300 border-red-500 shadow-md'
                            : s.id === 'media'
                            ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md'
                            : 'bg-blue-950 text-blue-300 border-blue-500 shadow-md'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description: che cosa succedeva */}
            <div>
              <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-mono font-bold">
                Che cosa succedeva? (Descrizione dettagliata dell'anomalia) *
              </label>
              <textarea
                required
                rows={3}
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="Descrivi cosa stavi facendo quando si è verificato l'errore: che tipo di traccia stavi processando, quali parametri hai toccato, cosa è successo (es. chiusura improvvisa, glitch nei transienti, manopola bloccata)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            {/* Steps to reproduce */}
            <div>
              <label className="block text-neutral-400 uppercase text-[11px] mb-1.5 font-mono">
                Passaggi per riprodurre il problema (Opzionale)
              </label>
              <textarea
                rows={2}
                value={bugSteps}
                onChange={(e) => setBugSteps(e.target.value)}
                placeholder="es. 1. Carico il plugin su traccia voce... 2. Alzo il parametro Drive oltre 6dB... 3. La DAW si chiude..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:border-red-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] font-mono text-neutral-400">
                Segnalazione a nome di: <strong className="text-white">{currentUser?.name}</strong> ({currentUser?.email})
              </span>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invia Bug Report al Laboratorio 171</span>
              </button>
            </div>
          </form>

          {/* User's Submitted Bug Reports History */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold flex items-center justify-between">
              <span>I Tuoi Bug Report Inviati ({userBugReports.length})</span>
            </h4>

            {userBugReports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-black/40 border border-neutral-800/80 text-center text-xs font-mono text-neutral-500">
                Non hai ancora inviato segnalazioni di bug per i plugin. Grazie per il tuo supporto!
              </div>
            ) : (
              <div className="space-y-3">
                {userBugReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-4 sm:p-5 rounded-2xl bg-black/80 border border-neutral-800 space-y-3 text-xs font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-bold text-sm">{report.pluginName}</strong>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px]">
                          {report.format || 'VST3'} • {report.dawUsed}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          report.severity === 'critica'
                            ? 'bg-red-950 text-red-300 border-red-500/60'
                            : report.severity === 'media'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                            : 'bg-blue-950 text-blue-300 border-blue-500/60'
                        }`}>
                          Gravità: {report.severity}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          report.status === 'risolto'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                            : report.status === 'in_esame'
                            ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}>
                          {report.status === 'risolto' && '✓ Risolto / Patch Pronta'}
                          {report.status === 'in_esame' && '⏳ In Esame dal Team'}
                          {report.status === 'aperto' && '● Ricevuto'}
                          {report.status === 'archiviato' && 'Archiviato'}
                        </span>
                      </div>
                    </div>

                    <div className="text-neutral-300 leading-relaxed">
                      <strong className="text-neutral-400 block text-[10px] uppercase mb-0.5">Cosa succedeva:</strong>
                      {report.description}
                    </div>

                    {report.stepsToReproduce && (
                      <div className="text-neutral-400 text-[11px] bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80">
                        <strong className="text-neutral-300 block text-[10px] uppercase mb-0.5">Passaggi per riprodurre:</strong>
                        {report.stepsToReproduce}
                      </div>
                    )}

                    {report.isVerifiedRealProblem && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-cyan-950/70 border border-emerald-500/60 text-emerald-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>PROBLEMA TECNICO REALE CONFERMATO DAL MASTER</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold text-[9px] uppercase tracking-wider">
                            RICOMPENSA ASSEGNATA
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">
                          Grazie alla tua segnalazione verificata sul plugin <strong>{report.pluginName}</strong>, hai sbloccato il <strong>Badge Tester Certificato</strong>, l'accesso gratuito ai futuri plugin commerciali e il seguente buono sconto in studio:
                        </p>
                        {report.rewardVoucherCode && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-black/70 border border-emerald-500/40">
                            <span className="font-mono font-bold text-amber-300 text-xs">
                              Voucher: {report.rewardVoucherCode} (-25€)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyVoucher(report.rewardVoucherCode!)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {copiedVoucherCode === report.rewardVoucherCode ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Copiato</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copia Codice</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs">
                        <strong className="block text-[10px] uppercase text-amber-400 mb-1">Risposta / Note dal Laboratorio 171 Studio:</strong>
                        {report.adminNotes}
                      </div>
                    )}

                    <div className="text-[10px] text-neutral-500 pt-1 flex items-center justify-between border-t border-neutral-900">
                      <span>Inviato il: {new Date(report.createdAt).toLocaleString('it-IT')}</span>
                      <span>OS: {report.operatingSystem}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CONFERMA CANCELLAZIONE SESSIONE (FINO A 24H PRIMA) */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-red-500/40 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">
                    CANCELLAZIONE GRATUITA ENTRO 24H PRIMA
                  </span>
                  <h3 className="text-lg font-heading font-black text-white">
                    Confermi di voler cancellare la sessione?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono space-y-1.5">
              <p>
                <span className="text-neutral-500">Ordine:</span>{' '}
                <strong className="text-amber-400">#{bookingToCancel.orderCode}</strong>
              </p>
              <p>
                <span className="text-neutral-500">Servizio:</span>{' '}
                <strong className="text-white">{bookingToCancel.serviceTitle}</strong>
              </p>
              <p>
                <span className="text-neutral-500">Data e Ora:</span>{' '}
                <span className="text-neutral-200">
                  {bookingToCancel.date} alle {bookingToCancel.time}
                </span>
              </p>
            </div>

            <div className="text-xs font-mono">
              <label className="block text-neutral-400 uppercase mb-1">
                Motivo della cancellazione (opzionale):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Es. Cambio turno / Imprevisto personale..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono uppercase cursor-pointer"
              >
                Mantieni Sessione
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-red-500/20"
              >
                Conferma Cancellazione
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
