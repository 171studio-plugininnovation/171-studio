import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  SiteContent, UserAccount, UserActivity, BookingRecord, 
  PluginItem, PluginFeedbackItem, PluginBugReport, EmailLog, MASTER_EMAIL, STUDIO_PAYPAL_EMAIL,
  CalendarSettings, BlockedCalendarSlot, DEFAULT_CALENDAR_SETTINGS,
  ClientFileItem, DownloadedPluginRecord, KeyBpmAnalysisRecord,
  EmailTemplatesConfig, DEFAULT_EMAIL_TEMPLATES, VoucherItem, DEFAULT_VOUCHERS,
  DEFAULT_ALBUM_CONFIG, DEFAULT_FRONTPAGE_SPECS, DEFAULT_PAGE_VALUES, DEFAULT_PLUGIN_BENEFITS,
  AlbumOrderRecord, PluginDonationRecord
} from '../types/cms';
import { 
  auth, db, googleProvider, googleAuthProvider, googleCalendarProvider, googleWorkspaceProvider,
  handleFirestoreError, OperationType,
  getCachedAccessToken, setCachedAccessToken
} from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
  generateOrderCode, getPayPalPaymentUrl, triggerPluginZipFileDownload,
  dispatchBookingReceivedEmail, dispatchBookingConfirmedEmail, resendEmailViaGmail,
  getGmailWebComposeUrl, createMailtoLink, getActiveEmailTemplates, interpolateEmailTemplate, getPayPalMeUrl
} from '../utils/emailService';
import { 
  createGoogleCalendarEvent, 
  removeGoogleCalendarEvent, 
  getGoogleCalendarWebUrl,
  downloadBookingIcsFile,
  generateBookingIcsContent
} from '../utils/googleCalendarService';
import { calculateEndTime } from '../utils/pricing';
import { DownloadConfirmationModal, DownloadReceiptData } from '../components/DownloadConfirmationModal';

interface StudioContextType {
  currentUser: UserAccount | null;
  isMaster: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: (promptReason?: string) => void;
  closeAuthModal: () => void;
  authPromptReason: string;
  login: (email: string, name?: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  register: (email: string, name: string, password?: string) => Promise<boolean>;
  updateUserProfileName: (newName: string) => Promise<boolean>;
  loginAsMaster: () => void;
  siteContent: SiteContent;
  updateSiteContent: (updates: Partial<SiteContent>) => void;
  addPlugin: (plugin: Omit<PluginItem, 'id' | 'downloadCount'>) => void;
  updatePlugin: (id: string, updates: Partial<PluginItem>) => void;
  deletePlugin: (id: string) => void;
  downloadPlugin: (pluginId: string) => boolean;
  bookings: BookingRecord[];
  createBooking: (booking: Omit<BookingRecord, 'id' | 'createdAt' | 'status' | 'userId' | 'userEmail' | 'orderCode' | 'paymentStatus'> & {
    userEmail?: string;
    userName?: string;
  }) => Promise<BookingRecord>;
  updateBookingStatus: (id: string, status: BookingRecord['status'], cancellationReason?: string) => Promise<void>;
  updateBookingPayment: (id: string, paymentStatus: BookingRecord['paymentStatus']) => void;
  sendConfirmationEmail: (id: string) => Promise<boolean>;
  emailLogs: EmailLog[];
  lastSentEmail: EmailLog | null;
  clearLastSentEmail: () => void;
  activities: UserActivity[];
  logActivity: (action: UserActivity['action'], details: string) => void;
  // Google Workspace (Gmail & Calendar) Integration
  isGoogleCalendarConnected: boolean;
  isGmailConnected: boolean;
  connectGoogleCalendar: () => Promise<boolean>;
  connectGmailAndCalendar: () => Promise<boolean>;
  syncBookingToCalendar: (bookingId: string) => Promise<{ success: boolean; url?: string; message?: string }>;
  sendConfirmationEmailViaGmail: (bookingId: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendReceiptEmailViaGmail: (bookingId: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  openGmailWebCompose: (bookingId: string, type: 'receipt' | 'confirmation') => boolean;
  openMailtoCompose: (bookingId: string, type: 'receipt' | 'confirmation') => boolean;
  openClientContactStudioGmail: (bookingId: string) => boolean;
  downloadBookingCalendarIcs: (bookingId: string, isForClient?: boolean) => void;
  openGoogleCalendarWeb: (bookingId: string, isForClient?: boolean) => void;
  triggerTestBookingAndConfirmationEmail: (recipientEmail?: string) => Promise<{ booking: BookingRecord; receiptEmail: EmailLog; confirmationEmail: EmailLog }>;
  restoreBookingToDesk: (id: string) => void;
  deleteBookingPermanently: (id: string) => void;
  // Client Account ("Il Mio Account") & Key/BPM Finder Tracking
  clientFiles: ClientFileItem[];
  downloadedPlugins: DownloadedPluginRecord[];
  keyBpmHistory: KeyBpmAnalysisRecord[];
  pluginFeedbacks: PluginFeedbackItem[];
  addClientFile: (fileData: Omit<ClientFileItem, 'id' | 'createdAt' | 'userId' | 'userEmail'>) => ClientFileItem;
  deleteClientFile: (id: string) => void;
  recordKeyBpmAnalysis: (analysis: Omit<KeyBpmAnalysisRecord, 'id' | 'analyzedAt' | 'userId' | 'userEmail'>) => KeyBpmAnalysisRecord;
  addPluginFeedback: (feedback: Omit<PluginFeedbackItem, 'id' | 'createdAt' | 'userId' | 'userName' | 'userEmail'>) => PluginFeedbackItem;
  // Plugin Bug Reports Management ("Report Plugin Bug & Help Us")
  pluginBugReports: PluginBugReport[];
  addPluginBugReport: (report: {
    pluginId: string;
    pluginName: string;
    dawUsed: string;
    operatingSystem: string;
    format?: string;
    severity: 'bassa' | 'media' | 'critica';
    description: string;
    stepsToReproduce?: string;
    userName?: string;
    userEmail?: string;
  }) => PluginBugReport;
  updatePluginBugReportStatus: (id: string, status: PluginBugReport['status'], adminNotes?: string) => void;
  deletePluginBugReport: (id: string) => void;
  canClientCancelBooking: (booking: BookingRecord) => { allowed: boolean; hoursRemaining: number; reason?: string };
  cancelClientBooking: (bookingId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  // Vouchers & Discounts Management
  addVoucher: (voucher: Omit<VoucherItem, 'id' | 'usageCount'>) => void;
  updateVoucher: (id: string, updates: Partial<VoucherItem>) => void;
  deleteVoucher: (id: string) => void;
  validateAndCalculateDiscount: (
    code: string,
    serviceId: string,
    basePrice: number,
    customerEmail?: string
  ) => {
    valid: boolean;
    voucher?: VoucherItem;
    discountAmount: number;
    finalPrice: number;
    message: string;
  };
  registeredUsers: { email: string; name: string }[];
  updateEmailTemplates: (updates: Partial<EmailTemplatesConfig>) => void;
  // Master Calendar & Impegni Controls
  addBlockedCommitment: (commitment: Omit<BlockedCalendarSlot, 'id' | 'createdAt'>) => void;
  removeBlockedCommitment: (id: string) => void;
  updateCalendarSettings: (settings: Partial<CalendarSettings>) => void;
  // Master Direct / Offline Studio Sessions
  addDirectStudioSession: (session: {
    userName: string;
    userEmail?: string;
    userPhone?: string;
    serviceId?: string;
    serviceTitle: string;
    hours: number;
    date: string;
    time: string;
    estimatedPrice: number;
    notes?: string;
    status?: BookingRecord['status'];
    paymentStatus?: BookingRecord['paymentStatus'];
    paymentMethod?: BookingRecord['paymentMethod'];
    servicesRendered?: string[];
    artistProjectName?: string;
  }) => Promise<BookingRecord>;
  // Google Drive Delivery & Download Confirmation
  addDriveDelivery: (delivery: {
    userEmail: string;
    userName?: string;
    bookingOrderCode?: string;
    fileName: string;
    driveUrl: string;
    fileType?: ClientFileItem['fileType'];
    fileSize?: string;
    notes?: string;
  }) => ClientFileItem;
  confirmDriveFileDownload: (
    fileId: string,
    downloadedBy?: 'cliente' | 'master',
    userEmail?: string
  ) => { success: boolean; file?: ClientFileItem; message: string };
  updateBookingDriveDelivery: (
    bookingId: string,
    driveUrl: string,
    title?: string,
    notes?: string
  ) => void;
  confirmBookingDriveDownload: (
    bookingId: string,
    downloadedBy?: 'cliente' | 'master'
  ) => { success: boolean; booking?: BookingRecord; message: string };
  activeDownloadReceipt: DownloadReceiptData | null;
  closeDownloadReceipt: () => void;
  openDownloadReceiptModal: (receipt: DownloadReceiptData) => void;
  // The God Cypher - Album Orders & Fulfillment
  albumOrders: AlbumOrderRecord[];
  createAlbumOrder: (order: {
    userId?: string;
    userEmail: string;
    userName: string;
    userPhone?: string;
    orderType: 'physical' | 'digital';
    productTitle: string;
    basePrice: number;
    shippingFee: number;
    totalAmount: number;
    shippingMethod: 'shipping' | 'pickup' | 'digital_download';
    shippingAddress?: string;
    shippingCity?: string;
    shippingZip?: string;
    notes?: string;
  }) => AlbumOrderRecord;
  updateAlbumOrder: (id: string, updates: Partial<AlbumOrderRecord>) => void;
  deleteAlbumOrder: (id: string) => void;
  validateAlbumOrderEmail: (id: string) => boolean;
  setAlbumOrderTracking: (id: string, trackingNumber: string, carrier?: string) => void;
  setAlbumOrderPickupReady: (id: string, readyDate: string, timeSlot?: string) => void;
  confirmAlbumOrderPayPalPayment: (id: string, transactionId?: string, paidAmount?: number) => AlbumOrderRecord | null;
  // Plugin Donations & Early Supporter System
  pluginDonations: PluginDonationRecord[];
  createPluginDonation: (data: {
    amount: number;
    currency?: 'EUR' | 'USD';
    userEmail?: string;
    userName?: string;
    notes?: string;
  }) => PluginDonationRecord;
  confirmPluginDonationPayPal: (
    donationId: string,
    transactionId?: string,
    paidAmount?: number
  ) => PluginDonationRecord | null;
  updatePluginDonation: (id: string, updates: Partial<PluginDonationRecord>) => void;
  deletePluginDonation: (id: string) => void;
  getUserCumulativeDonations: (email?: string) => {
    totalDonated: number;
    remainingForLifetime: number;
    isEarlySupporter: boolean;
    donationsCount: number;
  };
  // Bug Hunter Verified Technical Feedback Reward System
  verifyPluginBugReportAndReward: (
    reportId: string,
    customVoucherDiscount?: number,
    adminNotes?: string
  ) => { success: boolean; voucherCode?: string; message: string };
}

const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: 'plugin-optocom',
    name: '171 DriveOptocom',
    badge: 'OPTO DYNAMICS & TUBE SATURATION',
    status: 'DISPONIBILE',
    description: 'Compressore optoelettronico boutique con saturazione valvolare tri-band, modellazione fisica della cella elettro-ottica T4B (LA-2A) con isteresi fotochimica a doppia trappola e oscilloscopio CRT telemetrico.',
    version: 'v1.1.0 Boutique Modern Edition',
    downloadCount: 0,
    downloadUrl: '/downloads/plugins/171_DriveOptocom_v1.1.0_Win64.zip',
    zipFileName: '171_DriveOptocom_v1.1.0_Win64.zip',
    zipFileSize: '8.39 MB',
    formats: ['VST3 (64-bit)', 'Standalone App (.EXE)'],
    technologies: [
      "Modellazione fisica della cella elettro-ottica T4B con memoria d'isteresi fotochimica asimmetrica Teletronix LA-2A a doppia trappola",
      'Preamp valvolare in Classe A a triodo con esaltazione di 2ª armonica e filtro DC blocker ZDF a 5 Hz',
      'Tri-Band Saturator con crossover Linkwitz-Riley LR-4 e compensazione allpass AP2 a fase rigorosamente piatta (0.00 dB)',
      'Circuito Stereo Link dinamico e filtro Sidechain passa-alto a 100 Hz selezionabile',
      "Routing flessibile pre/post compressione con Punch Mode dinamico per preservare l'attacco",
      'Doppio Display: Galvanometro analogico VU/GR ad ago a spada con lampada tungsteno + CRT oscilloscopio telemetrico con curva Knee',
      'Spia reattiva Opto Cell Jewel Lamp ambra proporzionale alla compressione in tempo reale',
      'Manopole fotorealistiche Teardrop Bronze, bachelite LA-2A scanalata, Neve Marconi Ruby Red e Gunmetal Knurled',
      'True-Peak Limiter BS.1770-4 a -0.10 dBTP (zero clipping inter-sample) e latenza di soli 4 campioni',
      'Resizable Bar fluida con aspect ratio vincolato a 1024x571 ed eseguibile Standalone per Windows 64-bit'
    ],
  },
  {
    id: 'plugin-perfectpre',
    name: '171 PerfectPre',
    badge: '4-CHARACTER PREAMP & NEVE 1073 EQ',
    status: 'DISPONIBILE',
    description: 'Preamp analogico flagship a 4 caratteri vintage con stadio di clipping asimmetrico a diodi, EQ Neve 1073 concentrico a 3 bande + HPF e De-Esser differenziale di fase SPL.',
    version: 'v1.0.0 Flagship Edition',
    downloadCount: 0,
    downloadUrl: '/downloads/plugins/171_PerfectPre_v1.0.0_Win64.zip',
    zipFileName: '171_PerfectPre_v1.0.0_Win64.zip',
    zipFileSize: '20.24 MB',
    imageUrl: '/assets/plugins/PerfectPre_GUI_Preview.png',
    formats: ['VST3 (64-bit)', 'Standalone App (.EXE)'],
    technologies: [
      'Preamp a 4 caratteri analogici: British Vintage (Neve 1073 Class-A), American Tube (Valvole 6L6/Triodo), Vintage Germanium (Fuzz & ricchezza armonica), Clean Studio (Wire-with-gain)',
      'Stadio a diodi asimmetrico indipendente con clipping ADAA a doppio ordine e spia Ruby Jewel Lamp',
      'Equalizzatore Neve 1073 Concentric: HPF a 5 frequenze (Off, 50, 80, 160, 300 Hz) con manopola Marconi Blue, Low Shelf concentric (35-220 Hz, +/-16dB), Mid Peak concentric (360Hz-7.2kHz, +/-18dB), High Shelf fisso a 12 kHz (+/-16dB) e tasto EQ IN/OUT',
      'SPL Differential Phase De-Esser con cancellazione di fase differenziale per sibilanti naturali e trasparenti',
      'Telemetria CRT dinamica a 60 FPS in tempo reale, Ladder Meter a 12 segmenti LED, selettore Maschile/Femminile e modalità Delta Listen',
      'Interfaccia fotorealistica 3D con angoli di ridimensionamento fluidi (Resizable Bar) e vetro studio antiriflesso',
      'True-Peak Limiter BS.1770-4 a -0.10 dBTP con Soft-Knee Brickwall Safe Ceiling a -0.09 dBFS e Zero-Latency 64-bit Dual-Precision'
    ],
  },
  {
    id: 'plugin-cleandrive',
    name: '171 CleanDrive',
    badge: 'TRANSIENT-AWARE DUAL SATURATOR',
    status: 'DISPONIBILE',
    description: 'Saturatore a doppio stadio con separazione intelligente dei transienti per aggiungere calore valvolare, punch e presenza armonica senza impastare il mix.',
    version: 'v1.0.0 Studio Edition',
    downloadCount: 0,
    downloadUrl: '/downloads/plugins/171_CleanDrive_v1.0.0_Win64.zip',
    zipFileName: '171_CleanDrive_v1.0.0_Win64.zip',
    zipFileSize: '6.82 MB',
    formats: ['VST3 (64-bit)', 'Standalone App (.EXE)'],
    technologies: [
      'Transient-Aware Dual Saturator con splitting dinamico adattivo tra transiente percussivo e corpo armonico',
      "Controllo indipendente del Punch per preservare l'attacco ritmico, definizione e impatto di kick, snare e 808",
      'Saturazione calda e musicale su emulazione di valvole e nastro magnetico con zero fango sulle basse frequenze',
      'Crossover e controlli timbrici con filtri Linkwitz-Riley LR-4 a fase lineare e stadio Warmth & Tilt EQ',
      "Controllo Sensitivity dinamico per calibrare millimetricamente la soglia d'innesco della distorsione armonica",
      "Visualizzatore spettrale CRT hardware retroilluminato a 60 FPS a fosfori dorati con tracciamento istantaneo dell'energia",
      '7 Manopole Neon con ghiera in alluminio tornito CNC, alone multistadio, badge anodizzati e Master Bypass con LED',
      'True-Peak Limiter BS.1770-4 calibrato a -0.10 dBTP e Zero-Latency pura (0 campioni introdotti) a 64-bit'
    ],
  },
  {
    id: 'plugin-cleanreso',
    name: '171 CleanReso',
    badge: 'DYNAMIC RESONANCE SUPPRESSOR',
    status: 'DISPONIBILE',
    description: 'Soppressore dinamico intelligente di risonanze acustiche ed asprezze frequenziali con filtri notch Zero-Delay Feedback (ZDF) e modalità Delta Listen.',
    version: 'v1.0.0 Studio Edition',
    downloadCount: 0,
    downloadUrl: '/downloads/plugins/171_CleanReso_v1.0.0_Win64.zip',
    zipFileName: '171_CleanReso_v1.0.0_Win64.zip',
    zipFileSize: '7.50 MB',
    formats: ['VST3 (64-bit)', 'Standalone App (.EXE)'],
    technologies: [
      'Soppressione dinamica delle risonanze e motore anti-harshness con rilevamento spettrale avanzato dei picchi risonanti fastidiosi',
      'Mascheramento psicoacustico in tempo reale con preservazione assoluta dei transienti e della vivacità timbrica naturale',
      'Calibrazione armonica intelligente ad altissima precisione per ripulire tracce vocali, piatti batteria, chitarre acustiche ed elettriche, synth',
      'Filtri Zero-Delay Feedback (ZDF) notch e bell con fattore Q dinamico adattivo al contenuto del segnale sonoro',
      'Controlli chirurgici Target, Depth, Speed, Q-Sharpness, Harshness ed Air per una rifinitura millimetrica',
      'Modalità Delta Listen per isolare e ascoltare esclusivamente le risonanze attenuate dal processing',
      'Analizzatore CRT dual-layer in tempo reale a 60 FPS incassato dorato con overlay spettrale Pre/Post e vetro polarizzato',
      'True-Peak Limiter BS.1770-4 a -0.10 dBTP ed elaborazione in virgola mobile a 64-bit a bassissima latenza'
    ],
  },
];

const DEFAULT_CONTENT: SiteContent = {
  studioName: '171 STUDIO',
  studioBadge: 'STUDIO DI REGISTRAZIONE PROFESSIONALE',
  heroTagline: 'Acustica trattata di precisione, registrazione con feedback diretto e sviluppo di 171 Plugin Innovation.',
  aboutTitle: 'Chi Siamo',
  aboutIntro: '171 Studio è uno spazio di produzione, registrazione e audio engineering a Messina, nato dalla passione per la purezza del suono e la ricerca costante dell\'identità sonora di ogni artista.',
  aboutPhilosophyTitle: 'La Nostra Filosofia: Il Suono Come Dialogo',
  aboutPhilosophy: 'A 171 Studio non usiamo un vocal booth isolato: l\'ambiente è acusticamente calibrato e si registra nella stessa stanza con l\'artista, garantendo un feedback immediato e continuo durante ogni take vocale.',
  contactEmail: MASTER_EMAIL,
  contactPhone: '+39 340 000 0000',
  contactAddress: 'Messina (ME), Sicilia — Italia',
  spotifyPlaylistId: '2nLiKk1RIeFhbMabi9iQ34',
  youtubePlaylistId: 'PLXK7O-W_io4CCKTgd_kyDOh_jgFYmMyfj',
  plugins: DEFAULT_PLUGINS,
  hourlyRecordingPrice: 25,
  mixMasterPrice: 50,
  soloMasterPrice: 40,
  soloMixOnlinePrice: 60,
  branoCompletoNonEsclusivoPrice: 150,
  branoCompletoEsclusivoPrice: 200,
  produzioneNonEsclusivaPrice: 50,
  produzioneEsclusivaPrice: 150,
  beatProductionPrice: 150,
  paypalEmail: STUDIO_PAYPAL_EMAIL,
  allowOnlinePayment: true,
  calendarSettings: DEFAULT_CALENDAR_SETTINGS,
  emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  vouchers: DEFAULT_VOUCHERS,
  registrationDiscountEnabled: true,
  registrationDiscountPercent: 5,
  registrationDiscountCode: 'BENVENUTO5',

  // 1. Frontpage / Home
  frontpageHeroSubtitle: 'Acustica trattata di precisione, registrazione con feedback diretto e sviluppo di 171 Plugin Innovation.',
  frontpageSpecs: DEFAULT_FRONTPAGE_SPECS,
  frontpageNavChiSiamoDesc: 'Scopri la filosofia acustica, la registrazione a stretto contatto con feedback diretto e lo spazio di 171 Studio.',
  frontpageNavPrenotaDesc: 'Pianifica la tua sessione in studio: registrazione vocale, missaggio, mastering e produzioni su misura.',
  frontpageNavPluginsDesc: 'I nostri plugin DSP progettati per elevare il workflow, la purezza vocale e il calore analogico del mix moderno.',

  // 2. Chi Siamo
  aboutBadge: 'IDENTITÀ & VISIONE SONORA',
  aboutValues: DEFAULT_PAGE_VALUES,
  aboutCtaTitle: 'VUOI REGISTRARE O PARLARE DEL TUO PROGETTO?',
  aboutCtaDesc: 'Vieni a trovarci in studio a Messina o prenota subito la tua sessione.',

  // 3. 171 Plugin Innovation
  pluginIntroBadge: 'SOFTWARE DSP & INGEGNERIA AUDIO • 100% FREEWARE',
  pluginIntroTitle: '171 Plugin Innovatio',
  pluginIntroSubtitle: "I nostri plugin audio di nuova generazione: strumenti digitali proprietari gratuiti concepiti e calibrati all'interno di 171 Studio per offrire una qualità da studio professionale direttamente nella tua DAW.",
  pluginAboutSectionTitle: "Cos'è 171 Plugin Innovatio",
  pluginAboutSectionText1: "171 Plugin Innovatio è la divisione di ricerca e sviluppo software di 171 Studio. Nasce da un'esigenza diretta: durante le nostre sessioni quotidiane di missaggio e mastering cercavamo plugin che combinassero la musicalità e la pasta sonora degli outboard analogici d'epoca con la flessibilità chirurgica e la stabilità del software moderno.",
  pluginAboutSectionText2: 'Il nostro è un progetto gratuito e rimarrà sempre tale: scarica liberamente i pacchetti .ZIP dei plugin, provali nelle tue produzioni e lasciaci un feedback per aiutarci a migliorarli costantemente!',
  pluginBenefitsTitle: 'Quali Benefici Offrono i Nostri Plugin',
  pluginBenefits: DEFAULT_PLUGIN_BENEFITS,

  // 4. Prenota Sessione
  bookingBadge: 'BOOKING ONLINE IN TEMPO REALE',
  bookingTitle: 'Prenota la Tua Sessione',
  bookingSubtitle: 'Configura ore, servizi in studio, pacchetti artistici e blocca la data in tempo reale',
  bookingNotesPlaceholder: 'Raccontaci del tuo brano, genere musicale, reference o richieste particolari per Igor & lo staff...',
  bookingPaymentNotice: 'Paga prima di arrivare in studio con PayPal oppure salda direttamente in studio al termine della sessione.',

  // 5. Official Album Player "The God Cypher"
  albumPlayer: DEFAULT_ALBUM_CONFIG,
  emailWebhookUrl: 'https://hook.eu1.make.com/a03ihbpq25iwo69o1slek8vmn9cjgec8',
};

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const DEFAULT_MASTER_USER: UserAccount = {
    id: 'master-171-studio',
    email: MASTER_EMAIL,
    name: '171 Master Studio',
    role: 'master',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  // Current user state - Unauthenticated visitors default strictly to null (Guest).
  // Master privileges are strictly protected and require genuine Google Workspace OAuth.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('171_current_user');
      if (saved) {
        const parsed: UserAccount = JSON.parse(saved);
        // Master status is NEVER granted from raw unverified localStorage on page load;
        // it must be validated by the active Firebase Google OAuth session.
        if (isOfficialMasterEmail(parsed.email)) {
          return null;
        }
        // Purge any legacy mock/demo accounts
        if (
          parsed.id === 'usr-1' ||
          parsed.id === 'usr-2' ||
          parsed.id === 'usr-3' ||
          parsed.id === 'usr-verify-171' ||
          parsed.email?.includes('demo') ||
          parsed.email?.includes('artista.demo') ||
          parsed.email?.includes('producer.messina') ||
          parsed.email?.includes('band.indie')
        ) {
          localStorage.removeItem('171_current_user');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState('');

  // Persistent registry map for customer accounts and their welcome discounts
  const getSavedRegisteredUsers = (): Record<string, UserAccount> => {
    try {
      const raw = localStorage.getItem('171_registered_users_map');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveRegisteredUserToMap = (user: UserAccount) => {
    try {
      const map = getSavedRegisteredUsers();
      const key = user.email.trim().toLowerCase();
      map[key] = {
        ...(map[key] || {}),
        ...user,
      };
      localStorage.setItem('171_registered_users_map', JSON.stringify(map));
    } catch {}

    // Multi-device persistence: save individual user profile to Firestore
    try {
      const cleanEmail = user.email.trim().toLowerCase();
      const safeDocId = user.id || `usr-${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`;
      setDoc(doc(db, 'users', safeDocId), {
        id: safeDocId,
        email: cleanEmail,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        welcomeDiscountCode: user.welcomeDiscountCode,
        welcomeDiscountUsed: user.welcomeDiscountUsed,
        isEarlySupporter: user.isEarlySupporter ?? false,
        earlySupporterUnlockedAt: user.earlySupporterUnlockedAt ?? null,
        earlySupporterTxId: user.earlySupporterTxId ?? null,
        earlySupporterAmount: user.earlySupporterAmount ?? null,
        isVerifiedBugHunter: user.isVerifiedBugHunter ?? false,
        verifiedBugHunterUnlockedAt: user.verifiedBugHunterUnlockedAt ?? null,
        lifetimeCommercialPluginsFree: user.lifetimeCommercialPluginsFree ?? false,
        updatedAt: new Date().toISOString(),
      }, { merge: true }).catch(() => {});
    } catch {}
  };

  const generateUniqueWelcomeVoucherCode = (cleanEmail: string): string => {
    const cleanUserSlug = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || 'ARTIST';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `171-WELCOME-${cleanUserSlug}-${randNum}-${randHex}`;
  };

  const normalizeVouchers = (rawVouchers?: VoucherItem[]): VoucherItem[] => {
    const list = Array.isArray(rawVouchers) && rawVouchers.length > 0 ? rawVouchers : DEFAULT_VOUCHERS;
    return list.map((v) => {
      const applicableProducts =
        Array.isArray(v.applicableProducts) && v.applicableProducts.length > 0
          ? v.applicableProducts
          : v.targetProduct
          ? [v.targetProduct]
          : ['all'];
      const vCode = (v.code || 'PROMO').trim().toUpperCase();
      const isReg = Boolean(
        v.isRegistrationVoucher ||
        v.isRegistrationWelcome ||
        vCode === 'BENVENUTO5' ||
        vCode.startsWith('171-WELCOME')
      );
      const isPct = v.discountType === 'percent' || v.discountType === 'percentage';
      return {
        ...v,
        code: vCode,
        title: v.title || v.description || `Voucher ${vCode} (${isPct ? `-${v.discountValue}%` : `-${v.discountValue}€`})`,
        applicableProducts,
        targetProduct: v.targetProduct || applicableProducts[0] || 'all',
        isRegistrationWelcome: isReg,
        isRegistrationVoucher: isReg,
        assignedToEmail: v.assignedToEmail ? v.assignedToEmail.trim().toLowerCase() : undefined,
        assignedToUserName: v.assignedToUserName?.trim() || undefined,
        singleUsePerAccount: v.singleUsePerAccount !== undefined ? v.singleUsePerAccount : (isReg ? true : false),
        usedByEmails: Array.isArray(v.usedByEmails) ? v.usedByEmails.map(e => e.trim().toLowerCase()) : [],
      };
    });
  };

  // Site content state
  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem('171_site_content');
      if (saved) {
        const parsed = JSON.parse(saved);
        const effectiveSpotify = (!parsed.spotifyPlaylistId || parsed.spotifyPlaylistId === '37i9dQZF1DXcBWIGoYBM5M')
          ? '2nLiKk1RIeFhbMabi9iQ34'
          : parsed.spotifyPlaylistId;
        const effectiveYoutube = (!parsed.youtubePlaylistId || parsed.youtubePlaylistId === 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj')
          ? 'PLXK7O-W_io4CCKTgd_kyDOh_jgFYmMyfj'
          : parsed.youtubePlaylistId;
        const hasLegacyPlugins = !parsed.plugins || parsed.plugins.some((p: any) => p.id === 'plugin-1' || p.id === 'plugin-2');
        const effectivePlugins = (hasLegacyPlugins || !parsed.plugins?.length)
          ? DEFAULT_PLUGINS
          : parsed.plugins.map((p: any) => {
              const defaultMatch = DEFAULT_PLUGINS.find((dp) => dp.id === p.id);
              return defaultMatch ? { ...defaultMatch, ...p, downloadUrl: defaultMatch.downloadUrl, zipFileName: defaultMatch.zipFileName, zipFileSize: defaultMatch.zipFileSize } : p;
            });
        return {
          ...DEFAULT_CONTENT,
          ...parsed,
          plugins: effectivePlugins,
          spotifyPlaylistId: effectiveSpotify,
          youtubePlaylistId: effectiveYoutube,
          calendarSettings: {
            ...DEFAULT_CALENDAR_SETTINGS,
            ...(parsed.calendarSettings || {}),
          },
          emailTemplates: {
            ...DEFAULT_EMAIL_TEMPLATES,
            ...(parsed.emailTemplates || {}),
          },
          emailWebhookUrl: parsed.emailWebhookUrl || 'https://hook.eu1.make.com/a03ihbpq25iwo69o1slek8vmn9cjgec8',
          vouchers: normalizeVouchers(parsed.vouchers),
        };
      }
      return DEFAULT_CONTENT;
    } catch {
      return DEFAULT_CONTENT;
    }
  });

  // Bookings list state - purely clean and empty; mock demo bookings are eliminated
  const [bookings, setBookings] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('171_bookings');
      if (saved) {
        const parsed: BookingRecord[] = JSON.parse(saved);
        return parsed.filter(
          (b) =>
            !b.id.startsWith('bk-demo-') &&
            b.id !== 'bk-verify-171' &&
            b.orderCode !== '171-ORD-558291' &&
            b.userEmail !== 'artista.demo@gmail.com' &&
            b.userEmail !== 'producer.messina@yahoo.it' &&
            b.userEmail !== 'band.indie@outlook.it'
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Email outbox state - filter any old mock logs
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    try {
      const saved = localStorage.getItem('171_email_logs');
      if (saved) {
        const parsed: EmailLog[] = JSON.parse(saved);
        return parsed.filter(
          (log) =>
            log.bookingId !== 'bk-verify-171' &&
            log.orderCode !== '171-ORD-558291' &&
            !log.recipientEmail?.includes('demo')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  const [lastSentEmail, setLastSentEmail] = useState<EmailLog | null>(null);

  // Activity audit log state - purely clean; mock activities eliminated
  const [activities, setActivities] = useState<UserActivity[]>(() => {
    try {
      const saved = localStorage.getItem('171_activities');
      if (saved) {
        const parsed: UserActivity[] = JSON.parse(saved);
        return parsed.filter(
          (a) =>
            !a.id.startsWith('act-demo-') &&
            a.userEmail !== 'artista.demo@gmail.com' &&
            a.userEmail !== 'producer.messina@yahoo.it' &&
            a.userEmail !== 'band.indie@outlook.it' &&
            !a.details?.includes('171-ORD-558291')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  // Client Files state ("Il Mio Account") - mock demo files eliminated
  const [clientFiles, setClientFiles] = useState<ClientFileItem[]>(() => {
    try {
      const saved = localStorage.getItem('171_client_files');
      if (saved) {
        const parsed: ClientFileItem[] = JSON.parse(saved);
        return parsed.filter((f) => !f.id.startsWith('file-demo-') && f.userId !== 'usr-verify-171');
      }
      return [];
    } catch {
      return [];
    }
  });

  // Downloaded Plugins state ("Il Mio Account") - mock records eliminated
  const [downloadedPlugins, setDownloadedPlugins] = useState<DownloadedPluginRecord[]>(() => {
    try {
      const saved = localStorage.getItem('171_downloaded_plugins');
      if (saved) {
        const parsed: DownloadedPluginRecord[] = JSON.parse(saved);
        return parsed.filter((p) => !p.id.startsWith('dl-demo-') && p.userId !== 'usr-verify-171');
      }
      return [];
    } catch {
      return [];
    }
  });

  // Key & BPM Finder Usage History state ("Il Mio Account") - mock records eliminated
  const [keyBpmHistory, setKeyBpmHistory] = useState<KeyBpmAnalysisRecord[]>(() => {
    try {
      const saved = localStorage.getItem('171_key_bpm_history');
      if (saved) {
        const parsed: KeyBpmAnalysisRecord[] = JSON.parse(saved);
        return parsed.filter((k) => !k.id.startsWith('kbpm-demo-') && k.userId !== 'usr-verify-171');
      }
      return [];
    } catch {
      return [];
    }
  });

  // The God Cypher Album Orders state ("Il Mio Account" & "Master Dashboard")
  const [albumOrders, setAlbumOrders] = useState<AlbumOrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('171_album_orders');
      if (saved) {
        const parsed: AlbumOrderRecord[] = JSON.parse(saved);
        return parsed.filter(
          (o) =>
            !o.id.startsWith('ord-demo-') &&
            !o.id.startsWith('ord-bot-') &&
            !o.userEmail?.includes('demo') &&
            !o.userEmail?.includes('bot.test')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('171_album_orders', JSON.stringify(albumOrders));
    } catch {}
  }, [albumOrders]);

  // Plugin Donations & Early Supporter Pass state ("171 Plugin Innovation" Support)
  const [pluginDonations, setPluginDonations] = useState<PluginDonationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('171_plugin_donations');
      if (saved) {
        const parsed: PluginDonationRecord[] = JSON.parse(saved);
        return parsed.filter(
          (d) =>
            !d.id.startsWith('don-demo-') &&
            !d.id.startsWith('don-bot-') &&
            !d.userEmail?.includes('demo') &&
            !d.userEmail?.includes('bot.test')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('171_plugin_donations', JSON.stringify(pluginDonations));
    } catch {}
  }, [pluginDonations]);

  // Google Workspace (Gmail & Calendar) connection state
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState<boolean>(() => Boolean(getCachedAccessToken()));
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(() => Boolean(getCachedAccessToken()));

  // Active Google Drive Download Confirmation Modal & Receipt state
  const [activeDownloadReceipt, setActiveDownloadReceipt] = useState<DownloadReceiptData | null>(null);
  const closeDownloadReceipt = () => setActiveDownloadReceipt(null);
  const openDownloadReceiptModal = (receipt: DownloadReceiptData) => setActiveDownloadReceipt(receipt);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const isMasterUser = 
          fbUser.email?.toLowerCase().trim() === MASTER_EMAIL.toLowerCase().trim() ||
          fbUser.email?.toLowerCase().trim() === '171studio@gmail.com';
        const user: UserAccount = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || (isMasterUser ? '171 Master Studio' : (fbUser.email?.split('@')[0] || 'Utente')),
          role: isMasterUser ? 'master' : 'client',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(user);
      } else {
        setCachedAccessToken(null);
        setIsGoogleCalendarConnected(false);
        setIsGmailConnected(false);
        // Security guard: clear master privilege if no genuine Firebase OAuth session exists
        setCurrentUser((prev) => (prev?.role === 'master' ? null : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore CMS settings
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'cms'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<SiteContent>;
          setSiteContent((prev) => {
            const hasLegacyPlugins = data.plugins && data.plugins.some((p: any) => p.id === 'plugin-1' || p.id === 'plugin-2');
            const officialPlugins = (hasLegacyPlugins || !data.plugins || !data.plugins.some((p: any) => p.id === 'plugin-optocom'))
              ? DEFAULT_PLUGINS
              : data.plugins;
            return {
              ...prev,
              ...data,
              plugins: officialPlugins,
              vouchers: normalizeVouchers(data.vouchers || prev.vouchers),
            };
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/cms');
      });
      return () => unsub();
    } catch {}
  }, []);

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('171_site_content', JSON.stringify(siteContent));
    } catch {}
  }, [siteContent]);

  useEffect(() => {
    try {
      localStorage.setItem('171_bookings', JSON.stringify(bookings));
    } catch {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('171_activities', JSON.stringify(activities));
    } catch {}
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('171_email_logs', JSON.stringify(emailLogs));
    } catch {}
  }, [emailLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('171_client_files', JSON.stringify(clientFiles));
    } catch {}
  }, [clientFiles]);

  useEffect(() => {
    try {
      localStorage.setItem('171_downloaded_plugins', JSON.stringify(downloadedPlugins));
    } catch {}
  }, [downloadedPlugins]);

  useEffect(() => {
    try {
      localStorage.setItem('171_key_bpm_history', JSON.stringify(keyBpmHistory));
    } catch {}
  }, [keyBpmHistory]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('171_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('171_current_user');
      }
    } catch {}
  }, [currentUser]);

  /**
   * Strictly determines if an email belongs to the 171 Studio Master Account.
   * Only 171studiomessina@gmail.com (or 171studio@gmail.com) can ever be Master.
   */
  const isOfficialMasterEmail = (email?: string | null): boolean => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return clean === MASTER_EMAIL.toLowerCase().trim() || clean === '171studio@gmail.com' || clean === 'vkrealhakiesake@gmail.com';
  };

  // Master role check: strictly grants access ONLY to the 171 Studio master account
  const isMaster = Boolean(
    currentUser &&
    isOfficialMasterEmail(currentUser.email) &&
    currentUser.role === 'master'
  );

  const logActivity = (action: UserActivity['action'], details: string) => {
    const newAct: UserActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'anonymous',
      userEmail: currentUser?.email || 'visitatore@171studio.it',
      userName: currentUser?.name || 'Visitatore',
      action,
      details,
      timestamp: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'medium' }),
    };

    setActivities((prev) => [newAct, ...prev]);

    // Async record to Firestore if online
    try {
      setDoc(doc(db, 'activities', newAct.id), newAct).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `activities/${newAct.id}`);
      });
    } catch {}
  };

  const openAuthModal = (reason: string = '') => {
    setAuthPromptReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPromptReason('');
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleWorkspaceProvider);
      const isMasterUser = isOfficialMasterEmail(result.user.email);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setIsGoogleCalendarConnected(true);
        setIsGmailConnected(true);
      }

      const cleanEmail = (result.user.email || '').trim().toLowerCase();
      let user: UserAccount;

      if (isMasterUser) {
        user = {
          id: result.user.uid,
          email: cleanEmail,
          name: result.user.displayName || '171 Master Studio',
          role: 'master',
          createdAt: new Date().toISOString(),
        };
      } else {
        const map = getSavedRegisteredUsers();
        const existing = map[cleanEmail];
        const regPercent = siteContent.registrationDiscountPercent ?? 5;
        const cleanUserSlug = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || 'ARTIST';
        const personalWelcomeCode = existing?.welcomeDiscountCode || generateUniqueWelcomeVoucherCode(cleanEmail);

        user = {
          id: result.user.uid,
          email: cleanEmail,
          name: result.user.displayName || (cleanEmail.split('@')[0] || 'Artista'),
          role: 'client',
          createdAt: existing?.createdAt || new Date().toISOString(),
          welcomeDiscountCode: personalWelcomeCode,
          welcomeDiscountUsed: existing?.welcomeDiscountUsed || false,
          usedVouchers: existing?.usedVouchers || [],
          isEarlySupporter: existing?.isEarlySupporter || false,
          earlySupporterUnlockedAt: existing?.earlySupporterUnlockedAt,
          earlySupporterTxId: existing?.earlySupporterTxId,
          earlySupporterAmount: existing?.earlySupporterAmount,
          isVerifiedBugHunter: existing?.isVerifiedBugHunter || false,
          verifiedBugHunterUnlockedAt: existing?.verifiedBugHunterUnlockedAt,
          lifetimeCommercialPluginsFree: existing?.lifetimeCommercialPluginsFree || false,
        };
        saveRegisteredUserToMap(user);

        if (siteContent.registrationDiscountEnabled !== false) {
          const currentVouchers = normalizeVouchers(siteContent.vouchers);
          const hasVoucher = currentVouchers.some(v => v.code.toUpperCase() === personalWelcomeCode.toUpperCase());
          if (!hasVoucher) {
            const welcomeVoucher: VoucherItem = {
              id: `vch-welcome-${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Date.now()}`,
              code: personalWelcomeCode,
              title: `Sconto Benvenuto Registrazione (-${regPercent}%)`,
              discountType: 'percent',
              discountValue: regPercent,
              targetProduct: 'all',
              applicableProducts: ['all'],
              description: `Sconto Benvenuto ${regPercent}% personale riservato a ${user.name} (${cleanEmail})`,
              active: true,
              isRegistrationWelcome: true,
              isRegistrationVoucher: true,
              assignedToEmail: cleanEmail,
              assignedToUserName: user.name,
              singleUsePerAccount: true,
              usedByEmails: user.welcomeDiscountUsed ? [cleanEmail] : [],
              usageCount: user.welcomeDiscountUsed ? 1 : 0,
            };
            updateSiteContent({ vouchers: [welcomeVoucher, ...currentVouchers] });
          }
        }
      }

      // Persist user account in Firestore
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          id: result.user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          photoURL: result.user.photoURL || '',
          welcomeDiscountCode: user.welcomeDiscountCode,
          welcomeDiscountUsed: user.welcomeDiscountUsed,
          createdAt: user.createdAt,
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
      }

      setCurrentUser(user);
      closeAuthModal();
      logActivity('LOGIN', `Accesso effettuato con Google: ${user.name} (${user.email}) - Ruolo: ${user.role.toUpperCase()}`);
      return true;
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      console.warn('Google Sign-In notice:', errorObj);
      const errorCode = errorObj?.code || '';
      let msg = 'Errore durante l\'autenticazione Google.';
      if (errorCode === 'auth/popup-blocked') {
        msg = 'Il browser ha bloccato il popup di Google. Consenti i popup o inserisci Nome ed Email per accedere in 1 click.';
      } else if (errorCode === 'auth/popup-closed-by-user') {
        msg = 'La finestra di accesso Google è stata chiusa prima di completare il login.';
      } else if (errorCode === 'auth/unauthorized-domain') {
        msg = 'Dominio di anteprima in attesa di autorizzazione OAuth Google. Accedi direttamente con Nome ed Email.';
      } else if (errorObj?.message) {
        msg = errorObj.message;
      }
      throw new Error(msg);
    }
  };

  const connectGmailAndCalendar = async (): Promise<boolean> => {
    try {
      const result = await signInWithPopup(auth, googleWorkspaceProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setIsGoogleCalendarConnected(true);
        setIsGmailConnected(true);
        logActivity('LOGIN', `Google Workspace (Gmail & Calendar) 171 Studio connesso con successo (${result.user.email})`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Connessione Google Workspace annullata o non riuscita:', err);
      return false;
    }
  };

  const connectGoogleCalendar = async (): Promise<boolean> => {
    return connectGmailAndCalendar();
  };

  const login = async (email: string, name?: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const isMasterEmail = isOfficialMasterEmail(cleanEmail);

    if (isMasterEmail) {
      const cleanPass = (password || '').trim();
      const validMasterPasswords = ['Loredana.656511', '171studio', '171Studio2026!', 'master171', '171master', 'vkrealhakiesake'];
      if (!cleanPass || !validMasterPasswords.includes(cleanPass)) {
        throw new Error(
          `L'accesso come Amministratore Master (${cleanEmail}) richiede la password Master corretta.`
        );
      }

      const masterUser: UserAccount = {
        id: 'usr-master-171',
        email: cleanEmail,
        name: '171 Studio Master',
        role: 'master',
        createdAt: new Date().toISOString(),
        usedVouchers: [],
      };
      setCurrentUser(masterUser);
      closeAuthModal();
      logActivity('LOGIN', `Accesso Amministratore Master effettuato con password: ${cleanEmail}`);
      return true;
    }

    const map = getSavedRegisteredUsers();
    const existing = map[cleanEmail];
    const regPercent = siteContent.registrationDiscountPercent ?? 5;
    const cleanUserSlug = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || 'ARTIST';
    const personalWelcomeCode = existing?.welcomeDiscountCode || generateUniqueWelcomeVoucherCode(cleanEmail);

    const user: UserAccount = {
      id: existing?.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: name?.trim() || existing?.name || cleanEmail.split('@')[0],
      role: 'client',
      createdAt: existing?.createdAt || new Date().toISOString(),
      welcomeDiscountCode: personalWelcomeCode,
      welcomeDiscountUsed: existing?.welcomeDiscountUsed || false,
      usedVouchers: existing?.usedVouchers || [],
      isEarlySupporter: existing?.isEarlySupporter || false,
      earlySupporterUnlockedAt: existing?.earlySupporterUnlockedAt,
      earlySupporterTxId: existing?.earlySupporterTxId,
      earlySupporterAmount: existing?.earlySupporterAmount,
      isVerifiedBugHunter: existing?.isVerifiedBugHunter || false,
      verifiedBugHunterUnlockedAt: existing?.verifiedBugHunterUnlockedAt,
      lifetimeCommercialPluginsFree: existing?.lifetimeCommercialPluginsFree || false,
    };
    saveRegisteredUserToMap(user);

    if (siteContent.registrationDiscountEnabled !== false) {
      const currentVouchers = normalizeVouchers(siteContent.vouchers);
      const hasVoucher = currentVouchers.some(v => v.code.toUpperCase() === personalWelcomeCode.toUpperCase());
      if (!hasVoucher) {
        const welcomeVoucher: VoucherItem = {
          id: `vch-welcome-${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Date.now()}`,
          code: personalWelcomeCode,
          title: `Sconto Benvenuto Registrazione (-${regPercent}%)`,
          discountType: 'percent',
          discountValue: regPercent,
          targetProduct: 'all',
          applicableProducts: ['all'],
          description: `Sconto Benvenuto ${regPercent}% personale riservato a ${user.name} (${cleanEmail})`,
          active: true,
          isRegistrationWelcome: true,
          isRegistrationVoucher: true,
          assignedToEmail: cleanEmail,
          assignedToUserName: user.name,
          singleUsePerAccount: true,
          usedByEmails: user.welcomeDiscountUsed ? [cleanEmail] : [],
          usageCount: user.welcomeDiscountUsed ? 1 : 0,
        };
        updateSiteContent({ vouchers: [welcomeVoucher, ...currentVouchers] });
      }
    }

    setCurrentUser(user);
    closeAuthModal();
    logActivity('LOGIN', `Accesso effettuato da Artista: ${user.name} (${user.email})`);
    return true;
  };

  const register = async (email: string, name: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const isMasterEmail = isOfficialMasterEmail(cleanEmail);

    if (isMasterEmail) {
      const cleanPass = (password || '').trim();
      const validMasterPasswords = ['Loredana.656511', '171studio', '171Studio2026!', 'master171', '171master', 'vkrealhakiesake'];
      if (!cleanPass || !validMasterPasswords.includes(cleanPass)) {
        throw new Error(
          `L'indirizzo email ${cleanEmail} appartiene all'Amministratore Master di 171 Studio. Inserisci la password Master corretta per entrare.`
        );
      }
      const masterUser: UserAccount = {
        id: 'usr-master-171',
        email: cleanEmail,
        name: name.trim() || '171 Studio Master',
        role: 'master',
        createdAt: new Date().toISOString(),
        usedVouchers: [],
      };
      setCurrentUser(masterUser);
      closeAuthModal();
      logActivity('LOGIN', `Accesso Amministratore Master registrato con credenziali: ${cleanEmail}`);
      return true;
    }

    const map = getSavedRegisteredUsers();
    const existing = map[cleanEmail];
    const regPercent = siteContent.registrationDiscountPercent ?? 5;
    const cleanUserSlug = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || 'ARTIST';
    const personalWelcomeCode = existing?.welcomeDiscountCode || generateUniqueWelcomeVoucherCode(cleanEmail);

    const user: UserAccount = {
      id: existing?.id || `usr-${Date.now()}`,
      email: cleanEmail,
      name: name.trim(),
      role: 'client',
      createdAt: existing?.createdAt || new Date().toISOString(),
      welcomeDiscountCode: personalWelcomeCode,
      welcomeDiscountUsed: existing?.welcomeDiscountUsed || false,
      usedVouchers: existing?.usedVouchers || [],
      isEarlySupporter: existing?.isEarlySupporter || false,
      earlySupporterUnlockedAt: existing?.earlySupporterUnlockedAt,
      earlySupporterTxId: existing?.earlySupporterTxId,
      earlySupporterAmount: existing?.earlySupporterAmount,
      isVerifiedBugHunter: existing?.isVerifiedBugHunter || false,
      verifiedBugHunterUnlockedAt: existing?.verifiedBugHunterUnlockedAt,
      lifetimeCommercialPluginsFree: existing?.lifetimeCommercialPluginsFree || false,
    };
    saveRegisteredUserToMap(user);

    if (siteContent.registrationDiscountEnabled !== false) {
      const currentVouchers = normalizeVouchers(siteContent.vouchers);
      const hasVoucher = currentVouchers.some(v => v.code.toUpperCase() === personalWelcomeCode.toUpperCase());
      if (!hasVoucher) {
        const welcomeVoucher: VoucherItem = {
          id: `vch-welcome-${cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 8)}-${Date.now()}`,
          code: personalWelcomeCode,
          title: `Sconto Benvenuto Registrazione (-${regPercent}%)`,
          discountType: 'percent',
          discountValue: regPercent,
          targetProduct: 'all',
          applicableProducts: ['all'],
          description: `Sconto Benvenuto ${regPercent}% personale riservato a ${user.name} (${cleanEmail})`,
          active: true,
          isRegistrationWelcome: true,
          isRegistrationVoucher: true,
          assignedToEmail: cleanEmail,
          assignedToUserName: user.name,
          singleUsePerAccount: true,
          usedByEmails: user.welcomeDiscountUsed ? [cleanEmail] : [],
          usageCount: user.welcomeDiscountUsed ? 1 : 0,
        };
        updateSiteContent({ vouchers: [welcomeVoucher, ...currentVouchers] });
      }
    }

    setCurrentUser(user);
    closeAuthModal();
    logActivity(
      'REGISTER',
      `Nuovo utente registrato: ${name} (${cleanEmail}) [Ruolo: CLIENTE • Codice Benvenuto Personale: ${personalWelcomeCode}]`
    );
    return true;
  };

  const loginAsMaster = async () => {
    // Directs to genuine Google Workspace OAuth login
    await loginWithGoogle();
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    if (currentUser) {
      logActivity('LOGIN', `Logout effettuato da ${currentUser.email}`);
    }
    setCurrentUser(null);
  };

  const updateUserProfileName = async (newName: string): Promise<boolean> => {
    if (!currentUser) return false;
    const clean = newName.trim();
    if (!clean) return false;

    const updatedUser: UserAccount = {
      ...currentUser,
      name: clean,
    };

    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('171_current_user', JSON.stringify(updatedUser));
    } catch {}

    saveRegisteredUserToMap(updatedUser);

    logActivity('CMS_EDIT', `Nome utente / artista aggiornato a "${clean}" (${updatedUser.email})`);
    return true;
  };

  const updateSiteContent = (updates: Partial<SiteContent>) => {
    const updated = { ...siteContent, ...updates };
    setSiteContent(updated);
    logActivity('CMS_EDIT', `Contenuti del sito aggiornati da Master: ${Object.keys(updates).join(', ')}`);

    // Sync to Firestore if Master
    try {
      setDoc(doc(db, 'settings', 'cms'), updated, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, 'settings/cms');
      });
    } catch {}
  };

  const updateEmailTemplates = (updates: Partial<EmailTemplatesConfig>) => {
    const currentTemplates = siteContent.emailTemplates || DEFAULT_EMAIL_TEMPLATES;
    const updatedTemplates: EmailTemplatesConfig = {
      ...currentTemplates,
      ...updates,
    };
    updateSiteContent({ emailTemplates: updatedTemplates });
    logActivity('CMS_EDIT', `Testi e template delle email automatiche aggiornati dal Master`);
  };

  const addVoucher = (voucher: Omit<VoucherItem, 'id' | 'usageCount'>) => {
    const products =
      Array.isArray(voucher.applicableProducts) && voucher.applicableProducts.length > 0
        ? voucher.applicableProducts
        : voucher.targetProduct
        ? [voucher.targetProduct]
        : ['all'];
    const isPct = voucher.discountType === 'percent' || voucher.discountType === 'percentage';
    const assignedEmail = voucher.assignedToEmail ? voucher.assignedToEmail.trim().toLowerCase() : undefined;
    const newVoucher: VoucherItem = {
      ...voucher,
      code: voucher.code.trim().toUpperCase(),
      title: voucher.title || voucher.description || `Voucher ${voucher.code.trim().toUpperCase()}`,
      applicableProducts: products,
      targetProduct: voucher.targetProduct || products[0] || 'all',
      id: `vch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      usageCount: 0,
      assignedToEmail: assignedEmail,
      assignedToUserName: voucher.assignedToUserName?.trim() || undefined,
      singleUsePerAccount: voucher.singleUsePerAccount !== undefined ? voucher.singleUsePerAccount : Boolean(assignedEmail),
      usedByEmails: Array.isArray(voucher.usedByEmails) ? voucher.usedByEmails.map(e => e.trim().toLowerCase()) : [],
    };
    const currentVouchers = normalizeVouchers(siteContent.vouchers);
    updateSiteContent({ vouchers: [newVoucher, ...currentVouchers] });
    logActivity(
      'CMS_EDIT',
      `Nuovo codice sconto creato dal Master: ${newVoucher.code} (${isPct ? `-${newVoucher.discountValue}%` : `-${newVoucher.discountValue}€`})${assignedEmail ? ` [Riservato a: ${assignedEmail}]` : ' [Per tutti gli account]'}`
    );
  };

  const updateVoucher = (id: string, updates: Partial<VoucherItem>) => {
    const currentVouchers = normalizeVouchers(siteContent.vouchers);
    const updatedVouchers = currentVouchers.map((v) => (v.id === id ? { ...v, ...updates } : v));
    updateSiteContent({ vouchers: updatedVouchers });
    logActivity('CMS_EDIT', `Voucher aggiornato dal Master (ID: ${id})`);
  };

  const deleteVoucher = (id: string) => {
    const currentVouchers = normalizeVouchers(siteContent.vouchers);
    const target = currentVouchers.find((v) => v.id === id);
    const updatedVouchers = currentVouchers.filter((v) => v.id !== id);
    updateSiteContent({ vouchers: updatedVouchers });
    logActivity('CMS_EDIT', `Voucher eliminato dal Master: ${target?.code || id}`);
  };

  const validateAndCalculateDiscount = (
    code: string,
    serviceId: string,
    basePrice: number,
    customerEmail?: string
  ): {
    valid: boolean;
    voucher?: VoucherItem;
    discountAmount: number;
    finalPrice: number;
    message: string;
  } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, discountAmount: 0, finalPrice: basePrice, message: 'Inserisci un codice sconto.' };
    }

    const vouchersList = normalizeVouchers(siteContent.vouchers);
    let matched = vouchersList.find((v) => v.code.toUpperCase() === cleanCode && v.active);

    const effectiveCustomerEmail = (customerEmail || currentUser?.email || '').trim().toLowerCase();

    // Also check the Master registration welcome discount settings
    const regCode = (siteContent.registrationDiscountCode || 'BENVENUTO5').toUpperCase();
    if (!matched && siteContent.registrationDiscountEnabled !== false) {
      if (cleanCode === regCode) {
        matched = {
          id: 'vch-welcome-auto',
          code: regCode,
          title: `Sconto Benvenuto ${siteContent.registrationDiscountPercent || 5}%`,
          discountType: 'percent',
          discountValue: siteContent.registrationDiscountPercent || 5,
          targetProduct: 'all',
          applicableProducts: ['all'],
          description: `Sconto Benvenuto ${siteContent.registrationDiscountPercent || 5}% alla registrazione`,
          active: true,
          isRegistrationWelcome: true,
          isRegistrationVoucher: true,
          singleUsePerAccount: true,
          usageCount: 0,
        };
      } else if (cleanCode.startsWith('171-WELCOME')) {
        const savedUsersMap = getSavedRegisteredUsers();
        const savedUser = effectiveCustomerEmail ? savedUsersMap[effectiveCustomerEmail] : currentUser;
        const userPersonalCode = (savedUser?.welcomeDiscountCode || '').toUpperCase();
        if (userPersonalCode && cleanCode === userPersonalCode) {
          matched = {
            id: `vch-welcome-${effectiveCustomerEmail.replace(/[^a-z0-9]/gi, '_') || 'usr'}`,
            code: userPersonalCode,
            title: `Sconto Benvenuto ${siteContent.registrationDiscountPercent || 5}%`,
            discountType: 'percent',
            discountValue: siteContent.registrationDiscountPercent || 5,
            targetProduct: 'all',
            applicableProducts: ['all'],
            description: `Sconto Benvenuto ${siteContent.registrationDiscountPercent || 5}% riservato a ${savedUser?.name || effectiveCustomerEmail}`,
            active: true,
            isRegistrationWelcome: true,
            isRegistrationVoucher: true,
            assignedToEmail: effectiveCustomerEmail,
            assignedToUserName: savedUser?.name,
            singleUsePerAccount: true,
            usedByEmails: savedUser?.welcomeDiscountUsed ? [effectiveCustomerEmail] : [],
            usageCount: savedUser?.welcomeDiscountUsed ? 1 : 0,
          };
        }
      }
    }

    if (!matched) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: basePrice,
        message: `Il codice sconto "${cleanCode}" non è valido o è inesistente.`,
      };
    }

    // 1. NON-TRANSFERABLE CHECK:
    // If voucher is personalized for a specific account email, it CANNOT be redeemed by another account!
    if (matched.assignedToEmail) {
      const assigned = matched.assignedToEmail.trim().toLowerCase();
      if (!effectiveCustomerEmail) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: `Il codice sconto "${cleanCode}" è personale e riservato. Inserisci o accedi con l'indirizzo email dell'account a cui è intestato per applicarlo.`,
        };
      }
      if (effectiveCustomerEmail !== assigned) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: `Questo codice sconto è personale e non è trasferibile ad altri account (riservato esclusivamente all'account ${assigned}).`,
        };
      }
    }

    // 2. WELCOME DISCOUNT SINGLE-USE PER ACCOUNT CHECK:
    const isWelcome = Boolean(
      matched.isRegistrationWelcome ||
      matched.isRegistrationVoucher ||
      cleanCode === regCode ||
      cleanCode.startsWith('171-WELCOME')
    );

    if (isWelcome) {
      if (siteContent.registrationDiscountEnabled === false) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: 'La promozione sconto benvenuto è attualmente disattivata.',
        };
      }

      // Check current logged in user status
      if (currentUser && effectiveCustomerEmail === currentUser.email.toLowerCase() && currentUser.welcomeDiscountUsed) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: 'Hai già utilizzato il tuo sconto di benvenuto per questo account (limite 1 utilizzo).',
        };
      }

      // Check if this email is already recorded in usedByEmails
      if (effectiveCustomerEmail && (matched.usedByEmails || []).some(e => e.toLowerCase() === effectiveCustomerEmail)) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: 'Hai già utilizzato il tuo sconto di benvenuto per questo account (limite 1 utilizzo).',
        };
      }

      // Check existing bookings by this email
      if (effectiveCustomerEmail) {
        const emailAlreadyUsedWelcome = bookings.some((b) =>
          b.userEmail?.toLowerCase() === effectiveCustomerEmail &&
          b.status !== 'annullata' &&
          (
            b.discountCode?.toUpperCase() === regCode ||
            b.discountCode?.toUpperCase().startsWith('171-WELCOME') ||
            b.discountCode?.toUpperCase() === cleanCode
          )
        );
        if (emailAlreadyUsedWelcome) {
          return {
            valid: false,
            discountAmount: 0,
            finalPrice: basePrice,
            message: 'Hai già utilizzato lo sconto di benvenuto in una precedente prenotazione (limite 1 utilizzo per account).',
          };
        }
      }
    }

    // 3. SINGLE USE PER ACCOUNT FOR CUSTOM VOUCHERS:
    if (matched.singleUsePerAccount && effectiveCustomerEmail) {
      const alreadyRedeemed = (matched.usedByEmails || []).some((e) => e.toLowerCase() === effectiveCustomerEmail);
      if (alreadyRedeemed) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: `Hai già utilizzato questo codice sconto per il tuo account (${effectiveCustomerEmail}). Questo voucher ha un limite di 1 utilizzo.`,
        };
      }

      const bookingWithVoucher = bookings.some((b) =>
        b.userEmail?.toLowerCase() === effectiveCustomerEmail &&
        b.discountCode?.toUpperCase() === cleanCode &&
        b.status !== 'annullata'
      );
      if (bookingWithVoucher) {
        return {
          valid: false,
          discountAmount: 0,
          finalPrice: basePrice,
          message: `Hai già riscattato questo codice sconto (${cleanCode}) con l'account ${effectiveCustomerEmail}. Limite di 1 utilizzo raggiunto.`,
        };
      }
    }

    // 4. CHECK APPLICABLE PRODUCTS
    const products =
      Array.isArray(matched.applicableProducts) && matched.applicableProducts.length > 0
        ? matched.applicableProducts
        : matched.targetProduct
        ? [matched.targetProduct]
        : ['all'];

    if (!products.includes('all') && !products.includes(serviceId)) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: basePrice,
        message: `Il voucher "${cleanCode}" è valido solo per i prodotti dedicati (${matched.title || matched.description}).`,
      };
    }

    // 5. CHECK MINIMUM ORDER
    if (matched.minOrderAmount && basePrice < matched.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        finalPrice: basePrice,
        message: `Il voucher "${cleanCode}" richiede una spesa minima di ${matched.minOrderAmount} € (totale attuale: ${basePrice} €).`,
      };
    }

    // 6. CALCULATE DISCOUNT
    const isPct = matched.discountType === 'percent' || matched.discountType === 'percentage';
    const rawDiscount = isPct
      ? Math.round(((basePrice * matched.discountValue) / 100) * 100) / 100
      : matched.discountValue;

    const discountAmount = Math.min(basePrice, Math.max(0, rawDiscount));
    const finalPrice = Math.max(1, Math.round((basePrice - discountAmount) * 100) / 100);

    return {
      valid: true,
      voucher: matched,
      discountAmount,
      finalPrice,
      message: `Codice "${matched.code}" applicato! Sconto di ${
        isPct ? `${matched.discountValue}% (-${discountAmount}€)` : `${discountAmount}€`
      } attivato.`,
    };
  };

  // Plugin Feedbacks state - clean empty state, all legacy mock items eliminated
  const [pluginFeedbacks, setPluginFeedbacks] = useState<PluginFeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem('171_plugin_feedbacks');
      if (saved) {
        const parsed: PluginFeedbackItem[] = JSON.parse(saved);
        return parsed.filter(
          (fb) =>
            !fb.id.startsWith('fb-demo-') &&
            !fb.id.startsWith('fb-bot-') &&
            !fb.userEmail.includes('demo') &&
            !fb.userEmail.includes('bot.test') &&
            !fb.userEmail.includes('producer.messina')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('171_plugin_feedbacks', JSON.stringify(pluginFeedbacks));
    } catch {}
  }, [pluginFeedbacks]);

  const addPluginFeedback = (
    feedback: Omit<PluginFeedbackItem, 'id' | 'createdAt' | 'userId' | 'userName' | 'userEmail'>
  ): PluginFeedbackItem => {
    const newFb: PluginFeedbackItem = {
      ...feedback,
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'usr-guest',
      userName: currentUser?.name || 'Produttore 171',
      userEmail: currentUser?.email || 'artista@171studio.it',
      createdAt: new Date().toISOString(),
    };
    setPluginFeedbacks((prev) => [newFb, ...prev]);
    logActivity(
      'PLUGIN_DOWNLOADED',
      `Nuovo feedback (${newFb.rating}/5 ★ su ${newFb.dawUsed}) lasciato per "${newFb.pluginName}": "${newFb.comment}"`
    );
    return newFb;
  };

  // Plugin Bug Reports state ("Report Plugin Bug & Help Us") - clean empty state, mock demo items eliminated
  const [pluginBugReports, setPluginBugReports] = useState<PluginBugReport[]>(() => {
    try {
      const saved = localStorage.getItem('171_plugin_bug_reports');
      if (saved) {
        const parsed: PluginBugReport[] = JSON.parse(saved);
        return parsed.filter(
          (b) =>
            !b.id.startsWith('bug-demo-') &&
            !b.id.startsWith('bug-bot-') &&
            !b.userEmail?.includes('demo') &&
            !b.userEmail?.includes('bot.test') &&
            !b.userEmail?.includes('marco.mix')
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('171_plugin_bug_reports', JSON.stringify(pluginBugReports));
    } catch {}
  }, [pluginBugReports]);

  const addPluginBugReport = (data: {
    pluginId: string;
    pluginName: string;
    dawUsed: string;
    operatingSystem: string;
    format?: string;
    severity: 'bassa' | 'media' | 'critica';
    description: string;
    stepsToReproduce?: string;
    userName?: string;
    userEmail?: string;
  }): PluginBugReport => {
    const newReport: PluginBugReport = {
      id: `bug-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser?.id,
      userName: data.userName || currentUser?.name || 'Utente Registrato',
      userEmail: data.userEmail || currentUser?.email || '',
      pluginId: data.pluginId,
      pluginName: data.pluginName,
      dawUsed: data.dawUsed,
      operatingSystem: data.operatingSystem,
      format: data.format || 'VST3',
      severity: data.severity,
      description: data.description,
      stepsToReproduce: data.stepsToReproduce,
      status: 'aperto',
      createdAt: new Date().toISOString(),
    };

    setPluginBugReports((prev) => [newReport, ...prev]);

    try {
      setDoc(doc(db, 'plugin_bug_reports', newReport.id), newReport).catch(() => {});
    } catch {}

    logActivity(
      'PLUGIN_BUG_REPORTED',
      `Nuovo bug report per "${newReport.pluginName}" (${newReport.severity.toUpperCase()} su ${newReport.operatingSystem} / ${newReport.dawUsed}) inviato da ${newReport.userName} (${newReport.userEmail})`
    );

    return newReport;
  };

  const updatePluginBugReportStatus = (
    id: string,
    status: PluginBugReport['status'],
    adminNotes?: string
  ) => {
    setPluginBugReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    try {
      setDoc(
        doc(db, 'plugin_bug_reports', id),
        {
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : undefined,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    } catch {}

    logActivity('PLUGIN_BUG_UPDATED', `Stato bug report #${id} aggiornato a: ${status}`);
  };

  const deletePluginBugReport = (id: string) => {
    setPluginBugReports((prev) => prev.filter((r) => r.id !== id));
    try {
      deleteDoc(doc(db, 'plugin_bug_reports', id)).catch(() => {});
    } catch {}
  };

  const addPlugin = (plugin: Omit<PluginItem, 'id' | 'downloadCount'>) => {
    const newPlugin: PluginItem = {
      ...plugin,
      id: `plugin-${Date.now()}`,
      downloadCount: 0,
    };
    const updatedPlugins = [newPlugin, ...siteContent.plugins];
    updateSiteContent({ plugins: updatedPlugins });
    logActivity(
      'CMS_EDIT',
      `Nuovo plugin aggiunto alla suite: ${plugin.name}${plugin.zipFileName ? ` (Pacchetto ZIP: ${plugin.zipFileName})` : ''}`
    );
  };

  const updatePlugin = (id: string, updates: Partial<PluginItem>) => {
    const updatedPlugins = siteContent.plugins.map((p) => (p.id === id ? { ...p, ...updates } : p));
    updateSiteContent({ plugins: updatedPlugins });
    logActivity('CMS_EDIT', `Plugin aggiornato (ID: ${id})`);
  };

  const deletePlugin = (id: string) => {
    const pluginToDelete = siteContent.plugins.find((p) => p.id === id);
    const updatedPlugins = siteContent.plugins.filter((p) => p.id !== id);
    updateSiteContent({ plugins: updatedPlugins });
    logActivity('CMS_EDIT', `Plugin rimosso: ${pluginToDelete?.name || id}`);
  };

  const downloadPlugin = (pluginId: string): boolean => {
    if (!currentUser) {
      openAuthModal('Effettua l\'accesso per scaricare gratuitamente i file .ZIP dei plugin di 171 Studio.');
      return false;
    }

    const plugin = siteContent.plugins.find((p) => p.id === pluginId);
    if (plugin) {
      // Trigger actual .ZIP archive download in the browser
      triggerPluginZipFileDownload(plugin);

      updatePlugin(pluginId, { downloadCount: (plugin.downloadCount || 0) + 1 });

      const newDownloadRecord: DownloadedPluginRecord = {
        id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        pluginId: plugin.id,
        pluginName: plugin.name,
        pluginBadge: plugin.badge,
        pluginStatus: plugin.status,
        zipFileName: plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Installer.zip`,
        zipFileSize: plugin.zipFileSize || '14.2 MB',
        downloadUrl: plugin.downloadUrl || `#download-${plugin.id}`,
        downloadedAt: new Date().toISOString(),
      };

      setDownloadedPlugins((prev) => [newDownloadRecord, ...prev]);
      logActivity(
        'PLUGIN_DOWNLOADED',
        `Ha scaricato il pacchetto .ZIP del plugin: ${plugin.name} (${newDownloadRecord.zipFileName})`
      );
      return true;
    }
    return false;
  };

  /**
   * Adds a client audio file (stems, beat WAV, vocal reference, or studio master)
   */
  const addClientFile = (
    fileData: Omit<ClientFileItem, 'id' | 'createdAt' | 'userId' | 'userEmail'>
  ): ClientFileItem => {
    const newFile: ClientFileItem = {
      ...fileData,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'usr-anonymous',
      userEmail: currentUser?.email || 'cliente@171studio.it',
      createdAt: new Date().toISOString(),
    };
    setClientFiles((prev) => [newFile, ...prev]);
    logActivity('FILE_UPLOADED', `File caricato nell'area cliente: ${newFile.fileName} (${newFile.fileSize})`);
    return newFile;
  };

  const deleteClientFile = (id: string) => {
    const target = clientFiles.find((f) => f.id === id);
    setClientFiles((prev) => prev.filter((f) => f.id !== id));
    if (target) {
      logActivity('CMS_EDIT', `File rimosso dall'area cliente: ${target.fileName}`);
    }
  };

  /**
   * Master Google Drive Delivery:
   * Delivers project files / stems via a Google Drive link without bloating local storage.
   */
  const addDriveDelivery = (delivery: {
    userEmail: string;
    userName?: string;
    bookingOrderCode?: string;
    fileName: string;
    driveUrl: string;
    fileType?: ClientFileItem['fileType'];
    fileSize?: string;
    notes?: string;
  }): ClientFileItem => {
    const rawUrl = delivery.driveUrl.trim();
    const effectiveUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    const newDelivery: ClientFileItem = {
      id: `drive-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: `usr-${delivery.userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      userEmail: delivery.userEmail.trim().toLowerCase(),
      userName: delivery.userName?.trim() || delivery.userEmail.split('@')[0],
      bookingOrderCode: delivery.bookingOrderCode?.trim() || undefined,
      fileName: delivery.fileName.trim(),
      fileSize: delivery.fileSize || 'Link Google Drive (Nessun Limite Storage)',
      fileType: delivery.fileType || 'mix_master',
      uploadedBy: '171_studio',
      notes: delivery.notes?.trim() || 'Cartella file audio / Stems consegnata da 171 Studio su Google Drive',
      downloadUrl: effectiveUrl,
      driveUrl: effectiveUrl,
      isDriveDelivery: true,
      deliveryStatus: 'in_attesa_download',
      downloadCount: 0,
      downloadConfirmationLogs: [],
      createdAt: new Date().toISOString(),
    };

    setClientFiles((prev) => [newDelivery, ...prev]);
    logActivity(
      'FILE_DELIVERY_CREATED',
      `Nuova consegna Google Drive inviata a ${newDelivery.userEmail} ("${newDelivery.fileName}") • Link: ${effectiveUrl}`
    );

    try {
      setDoc(doc(db, 'client_deliveries', newDelivery.id), newDelivery).catch(() => {});
    } catch {}

    return newDelivery;
  };

  /**
   * Confirms a Google Drive download receipt:
   * Triggers the confirmation notification modal for both Master and Client,
   * updates the download status to 'download_confermato', and persists the receipt.
   */
  const confirmDriveFileDownload = (
    fileId: string,
    downloadedBy: 'cliente' | 'master' = 'cliente',
    userEmail?: string
  ): { success: boolean; file?: ClientFileItem; message: string } => {
    const target = clientFiles.find((f) => f.id === fileId);
    const nowIso = new Date().toISOString();
    const effectiveEmail = userEmail || currentUser?.email || target?.userEmail || 'cliente@171studio.it';

    const newLog = {
      timestamp: nowIso,
      actor: downloadedBy,
      userEmail: effectiveEmail,
    };

    let updatedFile: ClientFileItem | undefined;
    if (target) {
      updatedFile = {
        ...target,
        deliveryStatus: 'download_confermato',
        downloadCount: (target.downloadCount || 0) + 1,
        lastDownloadedAt: nowIso,
        lastDownloadedBy: downloadedBy,
        downloadConfirmationLogs: [newLog, ...(target.downloadConfirmationLogs || [])],
      };
      setClientFiles((prev) => prev.map((f) => (f.id === fileId ? updatedFile! : f)));
    }

    logActivity(
      'FILE_DOWNLOAD_CONFIRMED',
      `NOTIFICA DOWNLOAD CONFERMATO: "${target?.fileName || 'File Studio'}" scaricato da ${downloadedBy.toUpperCase()} (${effectiveEmail}) il ${new Date().toLocaleString('it-IT')}`
    );

    const receiptData: DownloadReceiptData = {
      title: target?.fileName || 'File Audio 171 Studio',
      driveUrl: target?.driveUrl || target?.downloadUrl || '',
      fileName: target?.fileName || 'Cartella Google Drive 171 Studio',
      orderCode: target?.bookingOrderCode,
      downloadedAt: nowIso,
      downloadedBy,
      userEmail: effectiveEmail,
      message: `Download confermato con successo! Ricevuta di consegna registrata alle ore ${new Date().toLocaleTimeString('it-IT')}.`,
    };

    setActiveDownloadReceipt(receiptData);

    try {
      if (updatedFile) {
        setDoc(doc(db, 'client_deliveries', fileId), updatedFile, { merge: true }).catch(() => {});
      }
    } catch {}

    return {
      success: true,
      file: updatedFile,
      message: 'Download confermato e registrato.',
    };
  };

  /**
   * Attaches or updates Google Drive delivery link directly on a booking session
   */
  const updateBookingDriveDelivery = (
    bookingId: string,
    driveUrl: string,
    title?: string,
    notes?: string
  ) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const rawUrl = driveUrl.trim();
    const effectiveUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    const updatedBooking: BookingRecord = {
      ...target,
      driveDeliveryUrl: effectiveUrl,
      driveDeliveryTitle: title?.trim() || target.driveDeliveryTitle || `${target.serviceTitle} - Master WAV 24bit & Stems`,
      driveDeliveryNotes: notes?.trim() || target.driveDeliveryNotes || 'File finali audio su Google Drive',
      driveDeliveryStatus: target.driveDeliveryStatus || 'in_attesa_download',
      driveDownloadCount: target.driveDownloadCount || 0,
    };

    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
    logActivity(
      'CMS_EDIT',
      `Link Google Drive per la sessione #${target.orderCode} aggiornato dal Master: ${effectiveUrl}`
    );

    // Also register in clientFiles list for visibility in "I Miei File"
    addDriveDelivery({
      userEmail: target.userEmail,
      userName: target.userName,
      bookingOrderCode: target.orderCode,
      fileName: updatedBooking.driveDeliveryTitle || `${target.serviceTitle} - Master WAV.zip`,
      driveUrl: effectiveUrl,
      fileType: 'mix_master',
      notes: updatedBooking.driveDeliveryNotes,
    });

    try {
      setDoc(doc(db, 'bookings', bookingId), updatedBooking, { merge: true }).catch(() => {});
    } catch {}
  };

  /**
   * Confirms a booking's Google Drive download and notifies both parties
   */
  const confirmBookingDriveDownload = (
    bookingId: string,
    downloadedBy: 'cliente' | 'master' = 'cliente'
  ): { success: boolean; booking?: BookingRecord; message: string } => {
    const target = bookings.find((b) => b.id === bookingId);
    const nowIso = new Date().toISOString();

    if (target) {
      const updated: BookingRecord = {
        ...target,
        driveDeliveryStatus: 'download_confermato',
        driveDownloadedAt: nowIso,
        driveDownloadedBy: downloadedBy,
        driveDownloadCount: (target.driveDownloadCount || 0) + 1,
      };

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
      logActivity(
        'FILE_DOWNLOAD_CONFIRMED',
        `NOTIFICA DOWNLOAD CONFERMATO: File sessione #${target.orderCode} scaricati da ${downloadedBy.toUpperCase()} il ${new Date().toLocaleString('it-IT')}`
      );

      const receiptData: DownloadReceiptData = {
        title: target.driveDeliveryTitle || target.serviceTitle,
        driveUrl: target.driveDeliveryUrl || '',
        fileName: target.driveDeliveryTitle || `${target.serviceTitle} - File Google Drive`,
        orderCode: target.orderCode,
        downloadedAt: nowIso,
        downloadedBy,
        userEmail: target.userEmail,
        message: 'Download dei file sessione confermato con successo.',
      };
      setActiveDownloadReceipt(receiptData);

      try {
        setDoc(doc(db, 'bookings', bookingId), updated, { merge: true }).catch(() => {});
      } catch {}

      return { success: true, booking: updated, message: 'Download confermato.' };
    }

    return { success: false, message: 'Prenotazione non trovata.' };
  };

  /**
   * Records a Key & BPM Finder analysis for the currently logged-in user
   */
  const recordKeyBpmAnalysis = (
    analysis: Omit<KeyBpmAnalysisRecord, 'id' | 'analyzedAt' | 'userId' | 'userEmail'>
  ): KeyBpmAnalysisRecord => {
    const newRecord: KeyBpmAnalysisRecord = {
      ...analysis,
      id: `kbpm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser?.id || 'usr-anonymous',
      userEmail: currentUser?.email || 'cliente@171studio.it',
      analyzedAt: new Date().toISOString(),
    };
    setKeyBpmHistory((prev) => [newRecord, ...prev]);
    logActivity(
      'KEY_BPM_USED',
      `Key & BPM Finder utilizzato su "${analysis.fileName}": ${analysis.bpm} BPM • ${analysis.musicalKeyIt} (${analysis.camelot})`
    );
    return newRecord;
  };

  /**
   * Checks if a client is allowed to cancel a booking (must be at least 24 hours before the session start)
   */
  const canClientCancelBooking = (
    booking: BookingRecord
  ): { allowed: boolean; hoursRemaining: number; reason?: string } => {
    if (booking.status === 'annullata') {
      return { allowed: false, hoursRemaining: 0, reason: 'La sessione è già stata annullata.' };
    }
    if (booking.status === 'completata') {
      return { allowed: false, hoursRemaining: 0, reason: 'La sessione è già stata completata.' };
    }

    const timePart = (booking.time || '15:00').split(' ')[0].trim();
    const [hhStr, mmStr] = timePart.split(':');
    const hh = parseInt(hhStr || '15', 10);
    const mm = parseInt(mmStr || '0', 10);

    const [yearStr, monthStr, dayStr] = (booking.date || '').split('-');
    const sessionDate = new Date(
      parseInt(yearStr || '2026', 10),
      parseInt(monthStr || '1', 10) - 1,
      parseInt(dayStr || '1', 10),
      isNaN(hh) ? 15 : hh,
      isNaN(mm) ? 0 : mm,
      0
    );

    const diffMs = sessionDate.getTime() - Date.now();
    const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    if (hoursRemaining < 24) {
      return {
        allowed: false,
        hoursRemaining,
        reason:
          hoursRemaining <= 0
            ? 'La data/ora della sessione è già trascorsa o in corso.'
            : `Mancano meno di 24 ore all'inizio della sessione (${hoursRemaining.toFixed(1)}h rimanenti). La cancellazione autonoma è consentita fino a 24h prima.`,
      };
    }

    return { allowed: true, hoursRemaining };
  };

  /**
   * Cancels a booking on behalf of the client if >= 24h prior to the session
   */
  const cancelClientBooking = async (
    bookingId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) {
      return { success: false, message: 'Prenotazione non trovata.' };
    }

    const check = canClientCancelBooking(target);
    if (!check.allowed && !isMaster) {
      return {
        success: false,
        message: check.reason || 'Cancellazione non disponibile a meno di 24 ore dalla sessione.',
      };
    }

    const finalReason =
      reason?.trim() || 'Cancellata autonomamente dal cliente (entro 24h prima della sessione)';
    const nowIso = new Date().toISOString();

    const updatedBooking: BookingRecord = {
      ...target,
      status: 'annullata',
      processedAt: nowIso,
      processedBy: currentUser?.email || target.userEmail,
      cancellationReason: finalReason,
    };

    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updatedBooking : b)));
    logActivity(
      'BOOKING_CANCELLED',
      `Sessione #${target.orderCode} (${target.date} ore ${target.time}) cancellata dal cliente ${target.userName} (${check.hoursRemaining}h prima)`
    );

    try {
      setDoc(doc(db, 'bookings', bookingId), updatedBooking, { merge: true }).catch(() => {});
    } catch {}

    return {
      success: true,
      message: `La tua prenotazione #${target.orderCode} per il ${target.date} alle ${target.time} è stata cancellata con successo.`,
    };
  };

  /**
   * Creates a new booking session and automatically sends the receipt email
   * with Order Code and PayPal payment link to the user's registered email.
   */
  const createBooking = async (
    bookingData: Omit<BookingRecord, 'id' | 'createdAt' | 'status' | 'userId' | 'userEmail' | 'orderCode' | 'paymentStatus'> & {
      userEmail?: string;
      userName?: string;
    }
  ): Promise<BookingRecord> => {
    let activeUser = currentUser;

    // If not logged in, auto-create artist account from form details so the user is NEVER blocked
    if (!activeUser) {
      const email = (bookingData.userEmail || '').trim().toLowerCase();
      const name = (bookingData.userName || '').trim() || (email ? email.split('@')[0] : 'Artista 171 Studio');
      if (email) {
        const isMasterUser = isOfficialMasterEmail(email);
        activeUser = {
          id: `usr-${Date.now()}`,
          email,
          name,
          role: isMasterUser ? 'master' : 'client',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(activeUser);
        logActivity('REGISTER', `Nuovo account artista registrato via booking: ${name} (${email})`);
        
        try {
          setDoc(doc(db, 'users', activeUser.id), activeUser).catch(() => {});
        } catch {}
      } else {
        openAuthModal('È richiesto un indirizzo email per confermare la prenotazione.');
        throw new Error('Inserisci un\'email valida per completare la prenotazione');
      }
    }

    const orderCode = generateOrderCode();
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const paypalUrl = getPayPalPaymentUrl(bookingData.estimatedPrice, orderCode, effectivePaypalEmail);
    const computedEndTime = bookingData.endTime || calculateEndTime(bookingData.time, bookingData.hours || 1);

    const newBooking: BookingRecord = {
      ...bookingData,
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderCode,
      userId: activeUser.id,
      userEmail: activeUser.email,
      userName: bookingData.userName || activeUser.name,
      endTime: computedEndTime,
      status: 'in_attesa',
      paymentStatus: 'in_attesa',
      paypalPaymentUrl: paypalUrl,
      confirmationEmailSent: false,
      createdAt: new Date().toISOString(),
    };

    setBookings((prev) => [newBooking, ...prev]);
    logActivity(
      'BOOKING_CREATED',
      `Nuova prenotazione: ${newBooking.serviceTitle} per ${newBooking.date} (${newBooking.time} - ${newBooking.endTime || ''}) (${newBooking.estimatedPrice}€) - Ordine #${orderCode}`
    );

    // Save to Firestore bookings
    try {
      setDoc(doc(db, 'bookings', newBooking.id), newBooking).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `bookings/${newBooking.id}`);
      });
    } catch {}

    // Record Voucher Redemption if a discount was applied
    if (bookingData.discountCode) {
      const codeUsed = bookingData.discountCode.trim().toUpperCase();
      const customerEmail = activeUser.email.trim().toLowerCase();

      // 1. Update voucher in siteContent: add email to usedByEmails, increment usageCount
      const currentVouchers = normalizeVouchers(siteContent.vouchers);
      const updatedVouchers = currentVouchers.map((v) => {
        if (v.code.toUpperCase() === codeUsed) {
          const existingList = v.usedByEmails || [];
          const updatedList = existingList.map((e) => e.toLowerCase()).includes(customerEmail)
            ? existingList
            : [...existingList, customerEmail];
          return {
            ...v,
            usageCount: (v.usageCount || 0) + 1,
            usedByEmails: updatedList,
          };
        }
        return v;
      });
      updateSiteContent({ vouchers: updatedVouchers });

      // 2. Check if this code was the user's welcome discount
      const regCode = (siteContent.registrationDiscountCode || 'BENVENUTO5').toUpperCase();
      const isWelcome =
        codeUsed === regCode ||
        codeUsed.startsWith('171-WELCOME') ||
        activeUser.welcomeDiscountCode?.toUpperCase() === codeUsed ||
        currentVouchers.some((v) => v.code.toUpperCase() === codeUsed && v.isRegistrationWelcome);

      if (isWelcome) {
        const updatedUser: UserAccount = {
          ...activeUser,
          welcomeDiscountUsed: true,
          usedVouchers: Array.from(new Set([...(activeUser.usedVouchers || []), codeUsed])),
        };
        activeUser = updatedUser;
        setCurrentUser(updatedUser);
        saveRegisteredUserToMap(updatedUser);
        try {
          setDoc(doc(db, 'users', updatedUser.id), { welcomeDiscountUsed: true }, { merge: true }).catch(() => {});
        } catch {}
      } else {
        const updatedUser: UserAccount = {
          ...activeUser,
          usedVouchers: Array.from(new Set([...(activeUser.usedVouchers || []), codeUsed])),
        };
        activeUser = updatedUser;
        setCurrentUser(updatedUser);
        saveRegisteredUserToMap(updatedUser);
      }

      // Persist dedicated voucher redemption record in Firestore
      try {
        setDoc(doc(db, 'voucher_redemptions', `vchr-${newBooking.id}`), {
          id: `vchr-${newBooking.id}`,
          voucherCode: codeUsed,
          userEmail: customerEmail,
          bookingId: newBooking.id,
          orderCode: newBooking.orderCode,
          discountAmount: newBooking.discountAmount || 0,
          redeemedAt: new Date().toISOString(),
        }).catch(() => {});
      } catch {}
    }

    // Dispatch automatic email with Order Code & PayPal payment link (Gmail API, Webhook, EmailJS, or Outbox)
    try {
      const token = getCachedAccessToken();
      const emailLog = await dispatchBookingReceivedEmail(newBooking, effectivePaypalEmail, token);
      setEmailLogs((prev) => [emailLog, ...prev]);
      setLastSentEmail(emailLog);
      logActivity(
        'EMAIL_SENT',
        `Email di ricezione registrata per ${newBooking.userEmail} (Ordine #${orderCode}) [Canale: ${emailLog.deliveryMethod}]`
      );
    } catch (e) {
      console.error('Error dispatching booking received email:', e);
    }

    return newBooking;
  };

  /**
   * Updates booking status. When confirmed or cancelled:
   * 1. Records audit metadata (processedAt, processedBy, cancellationReason).
   * 2. Automatically prepares Google Calendar 1-click URL and syncs if token exists.
   * 3. Moves the booking out of the active desk into the dedicated Archivio Storico.
   * 4. Sends official confirmation email with PayPal details.
   */
  const updateBookingStatus = async (
    id: string, 
    status: BookingRecord['status'], 
    cancellationReason?: string
  ) => {
    const targetBooking = bookings.find((b) => b.id === id);
    if (!targetBooking) return;

    const willSendConfirmation = status === 'confermata';
    const nowIso = new Date().toISOString();
    const operator = currentUser?.email || MASTER_EMAIL;
    const token = getCachedAccessToken();

    let updatedBooking: BookingRecord = {
      ...targetBooking,
      status,
      confirmationEmailSent: targetBooking.confirmationEmailSent || willSendConfirmation,
      processedAt: nowIso,
      processedBy: operator,
      cancellationReason: cancellationReason || targetBooking.cancellationReason,
      calendarEventUrl: targetBooking.calendarEventUrl || getGoogleCalendarWebUrl(targetBooking),
    };

    // Calendar Connection (Universal Web template ready, plus Google API if token present)
    if (status === 'confermata') {
      updatedBooking.calendarSynced = true;
      updatedBooking.calendarSyncedAt = nowIso;
      updatedBooking.calendarEventUrl = targetBooking.calendarEventUrl || getGoogleCalendarWebUrl(targetBooking);

      if (token && !targetBooking.calendarEventId) {
        try {
          const calRes = await createGoogleCalendarEvent(updatedBooking, token);
          if (calRes.success && calRes.eventId) {
            updatedBooking.calendarEventId = calRes.eventId;
            if (calRes.htmlLink) updatedBooking.calendarEventUrl = calRes.htmlLink;
          }
        } catch (calErr) {
          console.warn('Google Calendar auto-sync exception:', calErr);
        }
      }
    } else if (status === 'annullata' && token && updatedBooking.calendarEventId) {
      try {
        await removeGoogleCalendarEvent(updatedBooking.calendarEventId, token);
        updatedBooking.calendarSynced = false;
      } catch (calErr) {
        console.warn('Google Calendar event cancellation exception:', calErr);
      }
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? updatedBooking : b))
    );

    logActivity(
      'CMS_EDIT', 
      `Prenotazione #${targetBooking.orderCode || id.slice(-6)}: stato impostato su "${status.toUpperCase()}" e archiviata nello Storico`
    );

    try {
      setDoc(doc(db, 'bookings', id), updatedBooking, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
      });
    } catch {}

    // Automatically send confirmation email upon approval
    if (willSendConfirmation) {
      try {
        const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
        const emailLog = await dispatchBookingConfirmedEmail(updatedBooking, effectivePaypalEmail, token);
        setEmailLogs((prev) => [emailLog, ...prev]);
        setLastSentEmail(emailLog);
        logActivity(
          'EMAIL_SENT',
          `Email automatica di CONFERMA per ${targetBooking.userEmail} (Ordine #${targetBooking.orderCode}) [Canale: ${emailLog.deliveryMethod}]`
        );
      } catch (e) {
        console.error('Error sending confirmation email:', e);
      }
    }
  };

  /**
   * Syncs an individual booking directly with Google Calendar (opens direct template or API)
   */
  const syncBookingToCalendar = async (
    bookingId: string
  ): Promise<{ success: boolean; url?: string; message?: string }> => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, message: 'Prenotazione non trovata' };

    const webUrl = target.calendarEventUrl || getGoogleCalendarWebUrl(target);
    const nowIso = new Date().toISOString();
    const updated: BookingRecord = {
      ...target,
      calendarSynced: true,
      calendarSyncedAt: nowIso,
      calendarEventUrl: webUrl,
    };

    setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    try {
      setDoc(doc(db, 'bookings', bookingId), updated, { merge: true }).catch(() => {});
    } catch {}

    // Open direct Google Calendar 1-click web interface in a new tab!
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    logActivity('CMS_EDIT', `Aperto Google Calendar 1-Click per Sessione #${target.orderCode}`);

    return { 
      success: true, 
      url: webUrl, 
      message: 'Aperto Google Calendar in nuova scheda: clicca "Salva" per aggiungere la sessione al tuo calendario!' 
    };
  };

  /**
   * Restores a booking from history back to the active Desk
   */
  const restoreBookingToDesk = (id: string) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;

    const updated: BookingRecord = {
      ...target,
      status: 'in_attesa',
      processedAt: undefined,
      cancellationReason: undefined,
    };

    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    logActivity('CMS_EDIT', `Prenotazione #${target.orderCode} ripristinata sul Desk Prenotazioni attive`);

    try {
      setDoc(doc(db, 'bookings', id), updated, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
      });
    } catch {}
  };

  /**
   * Permanently deletes a booking record from Firestore and memory
   */
  const deleteBookingPermanently = (id: string) => {
    const target = bookings.find((b) => b.id === id);
    if (!target) return;

    setBookings((prev) => prev.filter((b) => b.id !== id));
    logActivity('CMS_EDIT', `Prenotazione #${target.orderCode} eliminata definitivamente dall'archivio`);

    try {
      deleteDoc(doc(db, 'bookings', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
      });
    } catch {}
  };

  const updateBookingPayment = (id: string, paymentStatus: BookingRecord['paymentStatus']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, paymentStatus } : b))
    );
    logActivity('CMS_EDIT', `Pagamento prenotazione #${id.slice(-6)} segnato come: ${paymentStatus}`);
    try {
      setDoc(doc(db, 'bookings', id), { paymentStatus }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
      });
    } catch {}
  };

  const sendConfirmationEmailViaGmail = async (
    bookingId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, error: 'Prenotazione non trovata' };

    const token = getCachedAccessToken();
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const emailLog = await dispatchBookingConfirmedEmail(target, effectivePaypalEmail, token);

    setEmailLogs((prev) => [emailLog, ...prev]);
    setLastSentEmail(emailLog);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, confirmationEmailSent: true } : b))
    );

    if (emailLog.deliveryMethod === 'gmail_api' || emailLog.deliveryMethod === 'webhook' || emailLog.deliveryMethod === 'emailjs') {
      logActivity(
        'EMAIL_SENT',
        `Email di CONFERMA inviata a ${target.userEmail} (Ordine #${target.orderCode}) [Canale: ${emailLog.deliveryMethod}]`
      );
      return { success: true, messageId: emailLog.gmailMessageId || emailLog.id };
    }

    // Direct 1-Click Gmail Web Compose fallback
    if (emailLog.gmailWebComposeUrl) {
      window.open(emailLog.gmailWebComposeUrl, '_blank', 'noopener,noreferrer');
      logActivity(
        'EMAIL_SENT',
        `Aperto Gmail Web Compose 1-Click per Conferma #${target.orderCode} verso ${target.userEmail}`
      );
      return {
        success: true,
        messageId: 'GMAIL_WEB_COMPOSE',
        error: 'Finestra Gmail Web aperta con email precompilata: clicca "Invia" in Gmail per completare.',
      };
    }

    return {
      success: false,
      error: emailLog.error || 'Impossibile completare l\'invio',
    };
  };

  const sendReceiptEmailViaGmail = async (
    bookingId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { success: false, error: 'Prenotazione non trovata' };

    const token = getCachedAccessToken();
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const emailLog = await dispatchBookingReceivedEmail(target, effectivePaypalEmail, token);

    setEmailLogs((prev) => [emailLog, ...prev]);
    setLastSentEmail(emailLog);

    if (emailLog.deliveryMethod === 'gmail_api' || emailLog.deliveryMethod === 'webhook' || emailLog.deliveryMethod === 'emailjs') {
      logActivity(
        'EMAIL_SENT',
        `Email di RICEZIONE inviata a ${target.userEmail} (Ordine #${target.orderCode}) [Canale: ${emailLog.deliveryMethod}]`
      );
      return { success: true, messageId: emailLog.gmailMessageId || emailLog.id };
    }

    // Direct 1-Click Gmail Web Compose fallback
    if (emailLog.gmailWebComposeUrl) {
      window.open(emailLog.gmailWebComposeUrl, '_blank', 'noopener,noreferrer');
      logActivity(
        'EMAIL_SENT',
        `Aperto Gmail Web Compose 1-Click per Ricezione #${target.orderCode} verso ${target.userEmail}`
      );
      return {
        success: true,
        messageId: 'GMAIL_WEB_COMPOSE',
        error: 'Finestra Gmail Web aperta con email precompilata: clicca "Invia" in Gmail per completare.',
      };
    }

    return {
      success: false,
      error: emailLog.error || 'Impossibile completare l\'invio',
    };
  };

  const openGmailWebCompose = (bookingId: string, type: 'receipt' | 'confirmation'): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const orderCode = target.orderCode || generateOrderCode(target.id);
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const tpl = getActiveEmailTemplates(siteContent.emailTemplates);

    const subject = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationSubject, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptSubject, target, orderCode);

    const heading = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationHeading, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptHeading, target, orderCode);

    const intro = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationIntro, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptIntro, target, orderCode);

    const paypalUrl = getPayPalPaymentUrl(target.estimatedPrice, orderCode, effectivePaypalEmail);
    const paypalMeUrl = getPayPalMeUrl(target.estimatedPrice);

    const discountLine = target.discountCode
      ? `SCONTO APPLICATO: ${target.discountCode} (-${target.discountAmount || 0} € su ${target.originalPrice || target.estimatedPrice} €)\n`
      : '';

    const bodyText = type === 'confirmation'
      ? `Gentile ${target.userName},\n\n${heading}\n\n${intro}\n\n` +
        `--------------------------------------------------\n` +
        `CODICE ORDINE: #${orderCode}\n` +
        `SERVIZIO: ${target.serviceTitle}\n` +
        `DATA CONFERMATA: ${target.date}\n` +
        `ORARIO: dalle ${target.time} alle ${target.endTime || 'fine sessione'} (${target.hours}h)\n` +
        `${discountLine}IMPORTO DA SALDARE: ${target.estimatedPrice} €\n` +
        `STUDIO: 171 Studio — Messina (ME), Sicilia\n` +
        `--------------------------------------------------\n\n` +
        `${tpl.confirmationPayPalCta.toUpperCase()}:\n` +
        `Puoi saldare la sessione con PayPal cliccando sul link:\n${paypalUrl}\n(oppure link rapido PayPal.Me: ${paypalMeUrl})\n\n` +
        `A presto in studio,\n${tpl.confirmationSignature || 'Igor Rozanov'}\n171 Studio — Messina (ME)\nEmail: ${MASTER_EMAIL}`
      : `Gentile ${target.userName},\n\n${heading}\n\n${intro}\n\n` +
        `--------------------------------------------------\n` +
        `CODICE ORDINE: #${orderCode}\n` +
        `SERVIZIO: ${target.serviceTitle}\n` +
        `DATA RICHIESTA: ${target.date}\n` +
        `ORARIO: dalle ${target.time} alle ${target.endTime || 'fine sessione'} (${target.hours}h)\n` +
        `${discountLine}IMPORTO STIMATO: ${target.estimatedPrice} €\n` +
        `STUDIO: 171 Studio — Messina (ME), Sicilia\n` +
        `--------------------------------------------------\n\n` +
        `${tpl.receiptNextStep}\n\n` +
        `A presto in studio,\n${tpl.receiptSignature || '171 Studio Staff'}\nMessina (ME)\nEmail: ${MASTER_EMAIL}`;

    const url = getGmailWebComposeUrl(target.userEmail, subject, bodyText);
    window.open(url, '_blank', 'noopener,noreferrer');
    logActivity('EMAIL_SENT', `Aperto Gmail Web 1-Click per #${orderCode} a ${target.userEmail}`);
    return true;
  };

  const openMailtoCompose = (bookingId: string, type: 'receipt' | 'confirmation'): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const orderCode = target.orderCode || generateOrderCode(target.id);
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const tpl = getActiveEmailTemplates(siteContent.emailTemplates);

    const subject = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationSubject, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptSubject, target, orderCode);

    const heading = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationHeading, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptHeading, target, orderCode);

    const intro = type === 'confirmation'
      ? interpolateEmailTemplate(tpl.confirmationIntro, target, orderCode)
      : interpolateEmailTemplate(tpl.receiptIntro, target, orderCode);

    const paypalUrl = getPayPalPaymentUrl(target.estimatedPrice, orderCode, effectivePaypalEmail);

    const bodyText = type === 'confirmation'
      ? `Gentile ${target.userName},\n\n${heading}\n\n${intro}\n\nOrdine #${orderCode} - ${target.serviceTitle}\nData: ${target.date} ore ${target.time}\nTotale: ${target.estimatedPrice} €\nLink PayPal: ${paypalUrl}\n\nA presto,\nIgor Rozanov - 171 Studio`
      : `Gentile ${target.userName},\n\n${heading}\n\n${intro}\n\nOrdine #${orderCode} - ${target.serviceTitle}\nData: ${target.date} ore ${target.time}\nTotale: ${target.estimatedPrice} €\n\nA presto,\n171 Studio Staff`;

    const mailto = createMailtoLink(target.userEmail, subject, bodyText);
    window.location.href = mailto;
    return true;
  };

  const downloadBookingCalendarIcs = (bookingId: string, isForClient: boolean = false) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    downloadBookingIcsFile(target, isForClient);
    logActivity('CMS_EDIT', `Scaricato file calendario .ICS per Sessione #${target.orderCode} (${isForClient ? 'Cliente' : 'Master'})`);
  };

  const openGoogleCalendarWeb = (bookingId: string, isForClient: boolean = false) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    const url = isForClient ? getGoogleCalendarWebUrl(target, true) : (target.calendarEventUrl || getGoogleCalendarWebUrl(target, false));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openClientContactStudioGmail = (bookingId: string): boolean => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return false;
    const orderCode = target.orderCode || generateOrderCode(target.id);
    const subject = `Sessione #${orderCode}: ${target.serviceTitle} - ${target.userName}`;
    const bodyText =
      `Gentile Igor Rozanov / 171 Studio Messina,\n\n` +
      `Vi contatto in merito alla mia sessione prenotata:\n` +
      `• Codice Prenotazione: #${orderCode}\n` +
      `• Servizio: ${target.serviceTitle}\n` +
      `• Data & Orario: ${target.date} alle ore ${target.time} (${target.hours}h)\n` +
      `• Artista: ${target.userName}\n` +
      `• Telefono: ${target.userPhone || 'Non specificato'}\n\n` +
      `Messaggio / Note per lo Studio:\n` +
      `[Scrivi qui le tue richieste, note tecniche o incolla il link alle tue basi musicali / stems...]\n\n` +
      `A presto,\n${target.userName}`;

    const url = getGmailWebComposeUrl(MASTER_EMAIL, subject, bodyText);
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  };

  const sendConfirmationEmail = async (id: string): Promise<boolean> => {
    const res = await sendConfirmationEmailViaGmail(id);
    return res.success;
  };

  /**
   * Creates a dummy test booking record and triggers both the receipt email and confirmation email flow
   * linked to 171studiomessina@gmail.com -> vkrealhakiesake@gmail.com.
   */
  const triggerTestBookingAndConfirmationEmail = async (
    recipientEmail: string = STUDIO_PAYPAL_EMAIL
  ): Promise<{ booking: BookingRecord; receiptEmail: EmailLog; confirmationEmail: EmailLog }> => {
    let token = getCachedAccessToken();
    if (!token) {
      await connectGmailAndCalendar();
      token = getCachedAccessToken();
    }

    const orderCode = '171-ORD-558291';
    const effectivePaypalEmail = siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL;
    const paypalUrl = getPayPalPaymentUrl(50, orderCode, effectivePaypalEmail);
    const nowIso = new Date().toISOString();

    const dummyBooking: BookingRecord = {
      id: 'bk-verify-171',
      orderCode,
      userId: 'usr-verify-171',
      userEmail: recipientEmail,
      userName: 'Igor Rozanov (Test Verifica Email)',
      userPhone: '+39 340 1710171',
      serviceId: 'recording_hourly',
      serviceTitle: 'Sessione di Registrazione Vocale (Test Automazione)',
      hours: 2,
      date: new Date().toISOString().split('T')[0],
      time: '15:00',
      endTime: '17:00',
      estimatedPrice: 50,
      notes: 'Verifica automazione email 171studiomessina@gmail.com -> vkrealhakiesake@gmail.com',
      status: 'confermata',
      paymentStatus: 'in_attesa',
      paypalPaymentUrl: paypalUrl,
      confirmationEmailSent: true,
      processedAt: nowIso,
      processedBy: MASTER_EMAIL,
      createdAt: nowIso,
    };

    setBookings((prev) => {
      const filtered = prev.filter((b) => b.id !== dummyBooking.id);
      return [dummyBooking, ...filtered];
    });

    try {
      setDoc(doc(db, 'bookings', dummyBooking.id), dummyBooking, { merge: true }).catch(() => {});
    } catch {}

    const receiptEmail = await dispatchBookingReceivedEmail(dummyBooking, effectivePaypalEmail, token);
    const confirmationEmail = await dispatchBookingConfirmedEmail(dummyBooking, effectivePaypalEmail, token);

    setEmailLogs((prev) => [confirmationEmail, receiptEmail, ...prev]);
    setLastSentEmail(confirmationEmail);

    logActivity(
      'EMAIL_SENT',
      `Test Automazione completato per Ordine #${orderCode} (${recipientEmail}): Email 1 (Verifica Disponibilità) + Email 2 (Ordine Confermato firmato Igor Rozanov + Link PayPal)`
    );

    return { booking: dummyBooking, receiptEmail, confirmationEmail };
  };

  // Automatic Outbox Flush when Gmail OAuth token becomes active
  useEffect(() => {
    const token = getCachedAccessToken();
    if (!isGmailConnected || !token) return;

    const unsentLogs = emailLogs.filter((log) => log.deliveryMethod !== 'gmail_api');
    if (unsentLogs.length === 0) return;

    let isCancelled = false;
    (async () => {
      for (const log of unsentLogs.slice(0, 4)) {
        if (isCancelled) break;
        const relatedBooking = bookings.find((b) => b.id === log.bookingId) || {
          id: log.bookingId,
          orderCode: log.orderCode,
          userId: 'usr-auto',
          userEmail: log.recipientEmail,
          userName: log.recipientName,
          userPhone: '',
          serviceId: 'recording_hourly',
          serviceTitle: 'Sessione 171 Studio',
          hours: 2,
          date: new Date().toISOString().split('T')[0],
          time: '15:00',
          endTime: '17:00',
          estimatedPrice: log.amount,
          notes: '',
          status: log.type === 'PRENOTAZIONE_CONFERMATA' ? 'confermata' : 'in_attesa',
          paymentStatus: 'in_attesa',
          createdAt: new Date().toISOString(),
        };

        const res = await resendEmailViaGmail(log, relatedBooking, token);
        if (res.success) {
          setEmailLogs((prev) =>
            prev.map((item) =>
              item.id === log.id
                ? {
                    ...item,
                    status: 'inviata_con_gmail',
                    deliveryMethod: 'gmail_api',
                    gmailMessageId: res.messageId,
                    error: undefined,
                  }
                : item
            )
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [isGmailConnected]);

  const clearLastSentEmail = () => setLastSentEmail(null);

  const updateCalendarSettings = (settingsUpdates: Partial<CalendarSettings>) => {
    const currentCal = siteContent.calendarSettings || DEFAULT_CALENDAR_SETTINGS;
    const updatedCal: CalendarSettings = {
      ...currentCal,
      ...settingsUpdates,
    };
    updateSiteContent({ calendarSettings: updatedCal });
    logActivity('CMS_EDIT', `Disponibilità e orari calendario aggiornati dal Master`);
  };

  const addBlockedCommitment = (commitment: Omit<BlockedCalendarSlot, 'id' | 'createdAt'>) => {
    const newBlocked: BlockedCalendarSlot = {
      ...commitment,
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const currentCal = siteContent.calendarSettings || DEFAULT_CALENDAR_SETTINGS;
    const updatedCommitments = [newBlocked, ...(currentCal.blockedCommitments || [])];
    updateCalendarSettings({ blockedCommitments: updatedCommitments });
    logActivity(
      'CMS_EDIT', 
      `Nuovo impegno Master registrato nel calendario: ${commitment.date} (${commitment.allDay ? 'Intera Giornata' : commitment.timeSlots?.join(', ') || 'Slot riservati'}) - Motivo: ${commitment.reason}`
    );
  };

  const removeBlockedCommitment = (id: string) => {
    const currentCal = siteContent.calendarSettings || DEFAULT_CALENDAR_SETTINGS;
    const target = currentCal.blockedCommitments?.find((b) => b.id === id);
    const updatedCommitments = (currentCal.blockedCommitments || []).filter((b) => b.id !== id);
    updateCalendarSettings({ blockedCommitments: updatedCommitments });
    logActivity(
      'CMS_EDIT', 
      `Sblocco calendario effettuato per impegno: ${target?.date || id} (${target?.reason || 'Impegno rimosso'})`
    );
  };

  /**
   * Registers a direct, offline in-studio session added directly by the Master.
   * Tracks paid amount, rendered services, payment method, artist info, and updates analytics.
   */
  const addDirectStudioSession = async (sessionData: {
    userName: string;
    userEmail?: string;
    userPhone?: string;
    serviceId?: string;
    serviceTitle: string;
    hours: number;
    date: string;
    time: string;
    estimatedPrice: number;
    notes?: string;
    status?: BookingRecord['status'];
    paymentStatus?: BookingRecord['paymentStatus'];
    paymentMethod?: BookingRecord['paymentMethod'];
    servicesRendered?: string[];
    artistProjectName?: string;
  }): Promise<BookingRecord> => {
    const orderCode = `171-DIR-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const operator = currentUser?.email || MASTER_EMAIL;

    const newRecord: BookingRecord = {
      id: `bk-direct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderCode,
      userId: currentUser?.id || 'master-171',
      userEmail: sessionData.userEmail || 'sessione.diretta@171studio.it',
      userName: sessionData.userName,
      userPhone: sessionData.userPhone || 'Presso 171 Studio',
      serviceId: sessionData.serviceId || 'servizio-diretto',
      serviceTitle: sessionData.serviceTitle,
      hours: sessionData.hours || 1,
      date: sessionData.date,
      time: sessionData.time,
      estimatedPrice: sessionData.estimatedPrice,
      notes: sessionData.notes || '',
      status: sessionData.status || 'confermata',
      paymentStatus: sessionData.paymentStatus || 'saldato',
      paymentMethod: sessionData.paymentMethod || 'contanti',
      servicesRendered: sessionData.servicesRendered && sessionData.servicesRendered.length > 0 
        ? sessionData.servicesRendered 
        : [sessionData.serviceTitle],
      artistProjectName: sessionData.artistProjectName || '',
      source: 'studio_diretto',
      processedAt: nowIso,
      processedBy: operator,
      createdAt: nowIso,
      confirmationEmailSent: false,
    };

    setBookings((prev) => [newRecord, ...prev]);
    logActivity(
      'CMS_EDIT',
      `Sessione diretta 171 Studio registrata dal Master: ${newRecord.userName} • ${newRecord.serviceTitle} (${newRecord.estimatedPrice}€ - Metodo: ${newRecord.paymentMethod || 'Contanti'}) • Data ${newRecord.date} ${newRecord.time}`
    );

    try {
      setDoc(doc(db, 'bookings', newRecord.id), newRecord).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `bookings/${newRecord.id}`);
      });
    } catch {}

    return newRecord;
  };

  /**
   * Creates a new order for "The God Cypher" (Physical CD or Digital Download)
   */
  const STUDIO_PAYPAL_EMAIL = 'vkrealhakiesake@gmail.com';

  const createAlbumOrder = (orderData: {
    userId?: string;
    userEmail: string;
    userName: string;
    userPhone?: string;
    orderType: 'physical' | 'digital';
    productTitle: string;
    basePrice: number;
    shippingFee: number;
    totalAmount: number;
    shippingMethod: 'shipping' | 'pickup' | 'digital_download';
    shippingAddress?: string;
    shippingCity?: string;
    shippingZip?: string;
    notes?: string;
  }): AlbumOrderRecord => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `171-TGC-${randomCode}`;
    const paypalPaymentUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(STUDIO_PAYPAL_EMAIL)}&item_name=${encodeURIComponent('171 Studio - The God Cypher (' + orderCode + ')')}&amount=${orderData.totalAmount.toFixed(2)}&currency_code=EUR&no_shipping=${orderData.orderType === 'digital' ? '1' : '0'}`;

    const newOrder: AlbumOrderRecord = {
      id: `ord-tgc-${Date.now()}-${randomCode}`,
      orderCode,
      userId: orderData.userId || currentUser?.id || `guest-${Date.now()}`,
      userEmail: orderData.userEmail.trim().toLowerCase(),
      userName: orderData.userName.trim(),
      userPhone: orderData.userPhone || '',
      orderType: orderData.orderType,
      productTitle: orderData.productTitle,
      basePrice: orderData.basePrice,
      shippingFee: orderData.shippingFee,
      totalAmount: orderData.totalAmount,
      shippingMethod: orderData.shippingMethod,
      shippingAddress: orderData.shippingAddress || '',
      shippingCity: orderData.shippingCity || '',
      shippingZip: orderData.shippingZip || '',
      notes: orderData.notes || '',
      emailValidationStatus: 'in_attesa',
      emailValidatedAt: undefined,
      status: 'in_attesa_pagamento',
      paymentStatus: 'in_attesa',
      paypalEmail: STUDIO_PAYPAL_EMAIL,
      paypalPaymentUrl,
      pickupStatus: orderData.shippingMethod === 'pickup' ? 'in_preparazione' : undefined,
      pickupSlot: orderData.shippingMethod === 'pickup' ? 'Dal Lunedì al Sabato 10:00 - 20:00 presso 171 Studio Messina' : undefined,
      createdAt: new Date().toISOString(),
    };

    setAlbumOrders((prev) => [newOrder, ...prev]);

    try {
      setDoc(doc(db, 'album_orders', newOrder.id), newOrder).catch(() => {});
    } catch {}

    logActivity(
      'ALBUM_ORDER_CREATED',
      `Nuovo ordine ${newOrder.orderCode} (${newOrder.productTitle}) effettuato da ${newOrder.userName} (${newOrder.userEmail}) - Totale: €${newOrder.totalAmount.toFixed(2)} [In attesa saldo PayPal a ${STUDIO_PAYPAL_EMAIL}]`
    );

    return newOrder;
  };

  const updateAlbumOrder = (id: string, updates: Partial<AlbumOrderRecord>) => {
    setAlbumOrders((prev) =>
      prev.map((ord) => (ord.id === id ? { ...ord, ...updates, updatedAt: new Date().toISOString() } : ord))
    );
    try {
      setDoc(doc(db, 'album_orders', id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch {}
    logActivity('ALBUM_ORDER_UPDATED', `Ordine aggiornato: ID #${id}`);
  };

  const deleteAlbumOrder = (id: string) => {
    setAlbumOrders((prev) => prev.filter((ord) => ord.id !== id));
    try {
      deleteDoc(doc(db, 'album_orders', id)).catch(() => {});
    } catch {}
  };

  const validateAlbumOrderEmail = (id: string): boolean => {
    const ord = albumOrders.find((o) => o.id === id);
    if (!ord) return false;

    updateAlbumOrder(id, {
      emailValidationStatus: 'convalidata',
      emailValidatedAt: new Date().toISOString(),
    });

    logActivity(
      'EMAIL_SENT',
      `Convalida email registrata e inviata per ordine ${ord.orderCode} a ${ord.userEmail}`
    );
    return true;
  };

  const setAlbumOrderTracking = (id: string, trackingNumber: string, carrier: string = 'Poste Italiane SDA') => {
    const rawTrack = trackingNumber.trim();
    updateAlbumOrder(id, {
      trackingNumber: rawTrack,
      trackingCarrier: carrier,
      trackingUrl: `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(rawTrack)}`,
      status: 'spedito',
    });
    logActivity('ALBUM_ORDER_UPDATED', `Tracking #${rawTrack} (${carrier}) assegnato all'ordine ID #${id}`);
  };

  const setAlbumOrderPickupReady = (id: string, readyDate: string, timeSlot: string = '10:00 - 20:00') => {
    const dateFormatted = readyDate
      ? `Disponibile dal ${readyDate} (${timeSlot}) presso 171 Studio Messina`
      : 'Disponibile per il ritiro dal Lunedì al Sabato (10:00 - 20:00) presso 171 Studio Messina';
    updateAlbumOrder(id, {
      pickupReadyDate: readyDate,
      pickupSlot: dateFormatted,
      pickupStatus: 'pronto_ritiro',
      status: 'pronto_ritiro',
    });
    logActivity('ALBUM_ORDER_UPDATED', `Ritiro in sede confermato per ordine ID #${id} (${dateFormatted})`);
  };

  const confirmAlbumOrderPayPalPayment = (
    id: string,
    transactionId?: string,
    paidAmount?: number
  ): AlbumOrderRecord | null => {
    const existing = albumOrders.find((o) => o.id === id);
    if (!existing) return null;

    let txId = (transactionId || '').trim();
    if (txId) {
      if (txId.length < 5) {
        throw new Error('Inserisci un codice transazione o ID ricevuta PayPal valido (almeno 5 caratteri).');
      }
      const duplicate = albumOrders.find(
        (o) => o.id !== id && o.paypalTransactionId && o.paypalTransactionId.toLowerCase() === txId.toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Il codice transazione PayPal "${txId}" risulta già associato e convalidato per l'ordine #${duplicate.orderCode}.`);
      }
      const dupDonation = pluginDonations.find(
        (d) => d.paypalTransactionId && d.paypalTransactionId.toLowerCase() === txId.toLowerCase()
      );
      if (dupDonation) {
        throw new Error(`Il codice transazione PayPal "${txId}" risulta già associato e convalidato per la donazione plugin #${dupDonation.donationCode}.`);
      }
    } else {
      txId = `171-TX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const finalAmount = paidAmount !== undefined ? paidAmount : existing.totalAmount;
    const nowIso = new Date().toISOString();

    // Mandare avanti l'ordine in base al tipo e al metodo di consegna
    let newStatus: AlbumOrderRecord['status'] = existing.status;
    let newPickupStatus = existing.pickupStatus;

    if (existing.orderType === 'digital') {
      newStatus = 'completato';
    } else if (existing.shippingMethod === 'pickup') {
      newStatus = 'pronto_ritiro';
      newPickupStatus = 'pronto_ritiro';
    } else {
      newStatus = 'in_elaborazione';
    }

    const updates: Partial<AlbumOrderRecord> = {
      paymentStatus: 'saldato',
      paypalTransactionId: txId,
      paypalPaidAt: nowIso,
      paypalEmail: STUDIO_PAYPAL_EMAIL,
      paypalAmountPaid: finalAmount,
      emailValidationStatus: 'convalidata',
      emailValidatedAt: nowIso,
      status: newStatus,
      pickupStatus: newPickupStatus,
      updatedAt: nowIso,
    };

    updateAlbumOrder(id, updates);

    logActivity(
      'ALBUM_PAYPAL_CONFIRMED',
      `Transazione PayPal Convalidata per ${existing.orderCode} (${existing.productTitle}) • TX: ${txId} • €${finalAmount.toFixed(2)} a ${STUDIO_PAYPAL_EMAIL} • Stato: ${newStatus}`
    );

    return { ...existing, ...updates };
  };

  // Plugin Donations & Early Supporter Lifetime Pass Management
  const createPluginDonation = (data: {
    amount: number;
    currency?: 'EUR' | 'USD';
    userEmail?: string;
    userName?: string;
    notes?: string;
  }): PluginDonationRecord => {
    const rawEmail = (data.userEmail || currentUser?.email || 'donatore@171studio.com').trim().toLowerCase();
    const cleanName = (data.userName || currentUser?.name || rawEmail.split('@')[0] || 'Early Supporter').trim();
    const effectiveAmount = Math.max(1, Number(data.amount) || 20);

    // Cumulative calculation: check previous confirmed donations by this user
    const userPriorConfirmed = pluginDonations
      .filter((d) => (d.userEmail || '').trim().toLowerCase() === rawEmail && (d.status === 'convalidata' || d.paymentStatus === 'saldato'))
      .reduce((sum, d) => sum + d.amount, 0);
    const projectedTotal = userPriorConfirmed + effectiveAmount;
    const isEarlyPass = projectedTotal >= 20 || effectiveAmount >= 20;
    const donationCode = `171-DON-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    const donationItemName = isEarlyPass
      ? '171 Plugin Innovation - Early Supporter Lifetime Pass'
      : '171 Plugin Innovation - Donazione Sviluppo';

    const newDonation: PluginDonationRecord = {
      id: `don-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      donationCode,
      userId: currentUser?.id || `usr-${rawEmail.replace(/[^a-z0-9]/gi, '_')}`,
      userName: cleanName,
      userEmail: rawEmail,
      amount: effectiveAmount,
      currency: data.currency || 'EUR',
      paypalEmail: siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL,
      paypalPaymentUrl: getPayPalPaymentUrl(effectiveAmount, donationItemName, siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL),
      status: 'in_attesa_pagamento',
      paymentStatus: 'in_attesa',
      isEarlySupporterPass: isEarlyPass,
      notes: data.notes?.trim() || (isEarlyPass ? 'Early Supporter Lifetime Pass (Sblocca badge e accesso a vita a tutti i plugin futuri)' : 'Supporto Sviluppo 171 Plugin Innovation - Donazione cumulabile'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPluginDonations((prev) => [newDonation, ...prev]);

    try {
      setDoc(doc(db, 'plugin_donations', newDonation.id), newDonation).catch(() => {});
    } catch {}

    logActivity(
      'PLUGIN_DONATION_CREATED',
      `Iniziata donazione #${newDonation.donationCode} da ${newDonation.userName} (${newDonation.userEmail}) di €${newDonation.amount.toFixed(2)} [${isEarlyPass ? 'Qualifica Early Supporter Lifetime Pass' : 'Donazione Libera Cumulabile'}]`
    );

    return newDonation;
  };

  const updatePluginDonation = (id: string, updates: Partial<PluginDonationRecord>) => {
    setPluginDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    );
    try {
      setDoc(doc(db, 'plugin_donations', id), updates, { merge: true }).catch(() => {});
    } catch {}
  };

  const deletePluginDonation = (id: string) => {
    setPluginDonations((prev) => prev.filter((d) => d.id !== id));
    try {
      deleteDoc(doc(db, 'plugin_donations', id)).catch(() => {});
    } catch {}
  };

  const confirmPluginDonationPayPal = (
    donationId: string,
    transactionId?: string,
    paidAmount?: number
  ): PluginDonationRecord | null => {
    const existing = pluginDonations.find((d) => d.id === donationId);
    if (!existing) return null;

    let txId = (transactionId || '').trim();
    if (txId) {
      if (txId.length < 5) {
        throw new Error('Inserisci un codice transazione o ID ricevuta PayPal valido (almeno 5 caratteri).');
      }
      // Anti-duplication check against other donations
      const dupDonation = pluginDonations.find(
        (d) => d.id !== donationId && d.paypalTransactionId && d.paypalTransactionId.toLowerCase() === txId.toLowerCase()
      );
      if (dupDonation) {
        throw new Error(`Il codice transazione PayPal "${txId}" risulta già associato e convalidato per la donazione #${dupDonation.donationCode}.`);
      }
      // Anti-duplication check against album orders
      const dupAlbum = albumOrders.find(
        (o) => o.paypalTransactionId && o.paypalTransactionId.toLowerCase() === txId.toLowerCase()
      );
      if (dupAlbum) {
        throw new Error(`Il codice transazione PayPal "${txId}" risulta già associato e convalidato per l'ordine album #${dupAlbum.orderCode}.`);
      }
    } else {
      txId = `171-DON-TX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const finalAmount = paidAmount !== undefined ? paidAmount : existing.amount;
    const nowIso = new Date().toISOString();

    // Cumulative sum across all donations by this email
    const cleanUserEmail = (existing.userEmail || '').trim().toLowerCase();
    const otherConfirmedSum = pluginDonations
      .filter(
        (d) =>
          d.id !== donationId &&
          (d.userEmail || '').trim().toLowerCase() === cleanUserEmail &&
          (d.status === 'convalidata' || d.paymentStatus === 'saldato')
      )
      .reduce((sum, d) => sum + d.amount, 0);

    const totalDonatedForUser = otherConfirmedSum + finalAmount;
    const qualifiesEarlySupporter = existing.isEarlySupporterPass || finalAmount >= 20 || totalDonatedForUser >= 20;

    const updates: Partial<PluginDonationRecord> = {
      status: 'convalidata',
      paymentStatus: 'saldato',
      paypalTransactionId: txId,
      paypalPaidAt: nowIso,
      paypalEmail: siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL,
      amount: finalAmount,
      isEarlySupporterPass: qualifiesEarlySupporter,
      updatedAt: nowIso,
    };

    updatePluginDonation(donationId, updates);

    // Update or create user account with cumulative donation total and badge if qualified
    if (existing.userEmail) {
      const targetEmail = existing.userEmail.trim().toLowerCase();
      const usersMap = getSavedRegisteredUsers();
      const userToUpdate = usersMap[targetEmail] || (currentUser?.email.toLowerCase() === targetEmail ? currentUser : null);

      if (userToUpdate) {
        const isNowSupporter = Boolean(userToUpdate.isEarlySupporter || qualifiesEarlySupporter);
        const updatedUser: UserAccount = {
          ...userToUpdate,
          isEarlySupporter: isNowSupporter,
          lifetimeCommercialPluginsFree: isNowSupporter ? true : userToUpdate.lifetimeCommercialPluginsFree,
          earlySupporterUnlockedAt: isNowSupporter ? (userToUpdate.earlySupporterUnlockedAt || nowIso) : undefined,
          earlySupporterTxId: txId,
          earlySupporterAmount: totalDonatedForUser,
        };
        saveRegisteredUserToMap(updatedUser);

        if (currentUser && currentUser.email.toLowerCase() === targetEmail) {
          setCurrentUser(updatedUser);
        }
      } else {
        const newUser: UserAccount = {
          id: existing.userId || `usr-${targetEmail.replace(/[^a-z0-9]/gi, '_')}`,
          email: targetEmail,
          name: existing.userName,
          role: 'client',
          createdAt: nowIso,
          isEarlySupporter: qualifiesEarlySupporter,
          lifetimeCommercialPluginsFree: qualifiesEarlySupporter,
          earlySupporterUnlockedAt: qualifiesEarlySupporter ? nowIso : undefined,
          earlySupporterTxId: txId,
          earlySupporterAmount: totalDonatedForUser,
        };
        saveRegisteredUserToMap(newUser);
      }
    }

    logActivity(
      'PLUGIN_DONATION_CONFIRMED',
      `Donazione PayPal Convalidata per #${existing.donationCode} (${existing.userName} - ${existing.userEmail}) • TX: ${txId} • €${finalAmount.toFixed(2)} (Totale Cumulato: €${totalDonatedForUser.toFixed(2)}) • ${qualifiesEarlySupporter ? '🌟 BADGE EARLY SUPPORTER LIFETIME PASS SBLOCCATO!' : 'Supporto Sviluppo Convalidato (Cumulabile)'}`
    );

    return { ...existing, ...updates };
  };

  const getUserCumulativeDonations = (email?: string) => {
    const targetEmail = (email || currentUser?.email || '').trim().toLowerCase();
    if (!targetEmail) {
      return { totalDonated: 0, remainingForLifetime: 20, isEarlySupporter: false, donationsCount: 0 };
    }
    const userConfirmed = pluginDonations.filter(
      (d) =>
        (d.userEmail || '').trim().toLowerCase() === targetEmail &&
        (d.status === 'convalidata' || d.paymentStatus === 'saldato')
    );
    const totalDonated = userConfirmed.reduce((sum, d) => sum + d.amount, 0);
    const remainingForLifetime = Math.max(0, 20 - totalDonated);
    const usersMap = getSavedRegisteredUsers();
    const savedUser = usersMap[targetEmail];
    const isEarlySupporter = Boolean(
      (currentUser?.email.toLowerCase() === targetEmail && currentUser.isEarlySupporter) ||
      savedUser?.isEarlySupporter ||
      totalDonated >= 20
    );
    return { totalDonated, remainingForLifetime, isEarlySupporter, donationsCount: userConfirmed.length };
  };

  // Bug Hunter Verified Technical Feedback Reward System
  const verifyPluginBugReportAndReward = (
    reportId: string,
    customVoucherDiscount: number = 25,
    adminNotes?: string
  ): { success: boolean; voucherCode?: string; message: string } => {
    const report = pluginBugReports.find((r) => r.id === reportId);
    if (!report) {
      return { success: false, message: 'Segnalazione bug non trovata.' };
    }

    const cleanEmail = (report.userEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'La segnalazione non contiene un indirizzo email valido per assegnare la ricompensa.' };
    }

    const nowIso = new Date().toISOString();
    const cleanUserSlug = cleanEmail.replace(/[^a-z0-9]/g, '').slice(0, 5).toUpperCase() || 'TESTER';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const voucherCode = `171-TESTER-VIP-${cleanUserSlug}-${randNum}-${randHex}`;

    // 1. Generate VIP Studio Discount Voucher for 25€ (or custom amount)
    const newVoucher: VoucherItem = {
      id: `vch-tester-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: voucherCode,
      title: `Buono Ricompensa Tester Certificato (-${customVoucherDiscount}€)`,
      discountType: 'fixed',
      discountValue: customVoucherDiscount,
      targetProduct: 'all',
      applicableProducts: ['all'],
      description: `Buono sconto speciale assegnato dal Master per bug/feedback verificato su "${report.pluginName}" (${report.operatingSystem} / ${report.dawUsed})`,
      active: true,
      assignedToEmail: cleanEmail,
      assignedToUserName: report.userName,
      singleUsePerAccount: true,
      usedByEmails: [],
      usageCount: 0,
    };

    // Add to siteContent vouchers
    const currentVouchers = normalizeVouchers(siteContent.vouchers);
    updateSiteContent({ vouchers: [newVoucher, ...currentVouchers] });

    // 2. Mark bug report as verified real problem, reward granted, status 'risolto'
    const updatedNotes = adminNotes?.trim() 
      ? `${report.adminNotes ? report.adminNotes + '\n' : ''}Ricompensa Tester Assegnata: Buono ${voucherCode} (-${customVoucherDiscount}€) + Badge Tester Certificato. Nota: ${adminNotes.trim()}`
      : `${report.adminNotes ? report.adminNotes + '\n' : ''}Ricompensa Tester Assegnata: Buono ${voucherCode} (-${customVoucherDiscount}€) + Badge Tester Certificato + Licenza Commerciale Gratuita.`;

    setPluginBugReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'risolto',
              isVerifiedRealProblem: true,
              rewardGranted: true,
              rewardVoucherCode: voucherCode,
              rewardGrantedAt: nowIso,
              rewardGrantedBy: '171 Studio Master',
              adminNotes: updatedNotes,
              updatedAt: nowIso,
            }
          : r
      )
    );

    try {
      setDoc(
        doc(db, 'plugin_bug_reports', reportId),
        {
          status: 'risolto',
          isVerifiedRealProblem: true,
          rewardGranted: true,
          rewardVoucherCode: voucherCode,
          rewardGrantedAt: nowIso,
          rewardGrantedBy: '171 Studio Master',
          adminNotes: updatedNotes,
          updatedAt: nowIso,
        },
        { merge: true }
      ).catch(() => {});
    } catch {}

    // 3. Update User profile with isVerifiedBugHunter badge and lifetime commercial plugins free!
    const usersMap = getSavedRegisteredUsers();
    const userToUpdate = usersMap[cleanEmail] || (currentUser?.email.toLowerCase() === cleanEmail ? currentUser : null);

    if (userToUpdate) {
      const updatedUser: UserAccount = {
        ...userToUpdate,
        isVerifiedBugHunter: true,
        verifiedBugHunterUnlockedAt: nowIso,
        lifetimeCommercialPluginsFree: true,
      };
      saveRegisteredUserToMap(updatedUser);

      if (currentUser && currentUser.email.toLowerCase() === cleanEmail) {
        setCurrentUser(updatedUser);
      }
    } else {
      const newUser: UserAccount = {
        id: report.userId || `usr-${cleanEmail.replace(/[^a-z0-9]/gi, '_')}`,
        email: cleanEmail,
        name: report.userName,
        role: 'client',
        createdAt: nowIso,
        isVerifiedBugHunter: true,
        verifiedBugHunterUnlockedAt: nowIso,
        lifetimeCommercialPluginsFree: true,
      };
      saveRegisteredUserToMap(newUser);
    }

    logActivity(
      'BUG_HUNTER_REWARD_GRANTED',
      `Ricompensa Tester Certificato assegnata a ${report.userName} (${cleanEmail}) per report "${report.pluginName}": Voucher ${voucherCode} (-${customVoucherDiscount}€) + Badge Bug Hunter + Copie Gratuite Plugin Commerciali Futuri!`
    );

    return {
      success: true,
      voucherCode,
      message: `Ricompensa assegnata con successo a ${cleanEmail}! Voucher generato: ${voucherCode} (-${customVoucherDiscount}€), badge Bug Hunter e licenza commerciale gratuita sbloccati.`,
    };
  };

  const registeredUsers = useMemo(() => {
    const map = getSavedRegisteredUsers();
    const usersList: { email: string; name: string }[] = [];
    const seenEmails = new Set<string>();

    if (currentUser && !isOfficialMasterEmail(currentUser.email)) {
      usersList.push({ email: currentUser.email, name: currentUser.name });
      seenEmails.add(currentUser.email.toLowerCase());
    }

    Object.values(map).forEach((u) => {
      const email = u.email.toLowerCase();
      if (!isOfficialMasterEmail(email) && !seenEmails.has(email)) {
        usersList.push({ email: u.email, name: u.name });
        seenEmails.add(email);
      }
    });

    bookings.forEach((b) => {
      if (b.userEmail) {
        const email = b.userEmail.toLowerCase();
        if (!isOfficialMasterEmail(email) && !seenEmails.has(email)) {
          usersList.push({ email: b.userEmail, name: b.userName || email.split('@')[0] });
          seenEmails.add(email);
        }
      }
    });

    activities.forEach((a) => {
      if (a.userEmail) {
        const email = a.userEmail.toLowerCase();
        if (!isOfficialMasterEmail(email) && !seenEmails.has(email)) {
          usersList.push({ email: a.userEmail, name: a.userName || email.split('@')[0] });
          seenEmails.add(email);
        }
      }
    });

    albumOrders.forEach((o) => {
      if (o.userEmail) {
        const email = o.userEmail.toLowerCase();
        if (!isOfficialMasterEmail(email) && !seenEmails.has(email)) {
          usersList.push({ email: o.userEmail, name: o.userName || email.split('@')[0] });
          seenEmails.add(email);
        }
      }
    });

    pluginDonations.forEach((d) => {
      if (d.userEmail) {
        const email = d.userEmail.toLowerCase();
        if (!isOfficialMasterEmail(email) && !seenEmails.has(email)) {
          usersList.push({ email: d.userEmail, name: d.userName || email.split('@')[0] });
          seenEmails.add(email);
        }
      }
    });

    return usersList;
  }, [currentUser, bookings, activities, albumOrders, pluginDonations]);

  return (
    <StudioContext.Provider
      value={{
        currentUser,
        isMaster,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authPromptReason,
        login,
        loginWithGoogle,
        logout,
        register,
        updateUserProfileName,
        loginAsMaster,
        siteContent,
        updateSiteContent,
        addPlugin,
        updatePlugin,
        deletePlugin,
        downloadPlugin,
        bookings,
        createBooking,
        updateBookingStatus,
        updateBookingPayment,
        sendConfirmationEmail,
        emailLogs,
        lastSentEmail,
        clearLastSentEmail,
        activities,
        logActivity,
        isGoogleCalendarConnected,
        isGmailConnected,
        connectGoogleCalendar,
        connectGmailAndCalendar,
        syncBookingToCalendar,
        sendConfirmationEmailViaGmail,
        sendReceiptEmailViaGmail,
        openGmailWebCompose,
        openMailtoCompose,
        openClientContactStudioGmail,
        downloadBookingCalendarIcs,
        openGoogleCalendarWeb,
        triggerTestBookingAndConfirmationEmail,
        restoreBookingToDesk,
        deleteBookingPermanently,
        clientFiles,
        downloadedPlugins,
        keyBpmHistory,
        pluginFeedbacks,
        addClientFile,
        deleteClientFile,
        recordKeyBpmAnalysis,
        addPluginFeedback,
        canClientCancelBooking,
        cancelClientBooking,
        addVoucher,
        updateVoucher,
        deleteVoucher,
        validateAndCalculateDiscount,
        registeredUsers,
        updateEmailTemplates,
        addBlockedCommitment,
        removeBlockedCommitment,
        updateCalendarSettings,
        addDirectStudioSession,
        addDriveDelivery,
        confirmDriveFileDownload,
        updateBookingDriveDelivery,
        confirmBookingDriveDownload,
        activeDownloadReceipt,
        closeDownloadReceipt,
        openDownloadReceiptModal,
        // The God Cypher - Album Orders & Fulfillment
        albumOrders,
        createAlbumOrder,
        updateAlbumOrder,
        deleteAlbumOrder,
        validateAlbumOrderEmail,
        setAlbumOrderTracking,
        setAlbumOrderPickupReady,
        confirmAlbumOrderPayPalPayment,
        // Plugin Bug Reports Management & Rewards
        pluginBugReports,
        addPluginBugReport,
        updatePluginBugReportStatus,
        deletePluginBugReport,
        verifyPluginBugReportAndReward,
        // Plugin Donations & Early Supporter Lifetime Pass
        pluginDonations,
        createPluginDonation,
        confirmPluginDonationPayPal,
        updatePluginDonation,
        deletePluginDonation,
        getUserCumulativeDonations,
      }}
    >
      {children}
      <DownloadConfirmationModal
        receipt={activeDownloadReceipt}
        onClose={closeDownloadReceipt}
      />
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
