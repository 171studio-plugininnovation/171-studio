export interface PluginItem {
  id: string;
  name: string;
  badge: string;
  status: 'DISPONIBILE' | 'BETA IN TESTING' | 'IN SVILUPPO' | 'PROTOTIPO DSP';
  description: string;
  downloadCount: number;
  imageUrl?: string;
  downloadUrl?: string;
  zipFileName?: string;
  zipFileSize?: string;
  zipDataUrl?: string;
  version?: string;
  technologies?: string[];
  formats?: string[];
  highlights?: string[];
  architecture?: string;
}

export interface PluginFeedbackItem {
  id: string;
  pluginId: string;
  pluginName: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  dawUsed: string;
  comment: string;
  // Verified Real Problem & Reward System
  isVerifiedRealProblem?: boolean;
  rewardGranted?: boolean;
  rewardVoucherCode?: string;
  rewardGrantedAt?: string;
  createdAt: string;
}

export interface PluginBugReport {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  pluginId: string;
  pluginName: string;
  dawUsed: string;
  operatingSystem: string;
  format?: string; // VST3, AU, AAX, Standalone
  severity: 'bassa' | 'media' | 'critica';
  description: string;
  stepsToReproduce?: string;
  status: 'aperto' | 'in_esame' | 'risolto' | 'archiviato';
  adminNotes?: string;
  // Verified Real Problem & Reward System
  isVerifiedRealProblem?: boolean;
  rewardGranted?: boolean;
  rewardVoucherCode?: string;
  rewardGrantedAt?: string;
  rewardGrantedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmailTemplatesConfig {
  receiptSubject: string;
  receiptHeading: string;
  receiptIntro: string;
  receiptNextStep: string;
  receiptSignature: string;
  confirmationSubject: string;
  confirmationHeading: string;
  confirmationIntro: string;
  confirmationPayPalCta: string;
  confirmationSignature: string;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplatesConfig = {
  receiptSubject: '[171 STUDIO] Grazie della tua prenotazione! Staff in verifica disponibilità - Ordine #{codice_ordine}',
  receiptHeading: 'Grazie della tua prenotazione!',
  receiptIntro: 'Il nostro staff sta verificando la disponibilità dello studio per la sessione richiesta.',
  receiptNextStep: 'Una volta che il Master confermerà la disponibilità dello studio dal pannello di controllo, riceverai una seconda email con l\'Ordine Confermato, i dettagli finali e il link per il saldo anticipato con PayPal prima di arrivare in studio.',
  receiptSignature: '171 Studio Staff — Messina, Sicilia',
  confirmationSubject: '[171 STUDIO] Ordine confermato! Grazie per averci scelto - Ordine #{codice_ordine}',
  confirmationHeading: 'Ordine confermato! Grazie per averci scelto.',
  confirmationIntro: 'Siamo felici di confermarti la sessione a 171 Studio. Tutti gli orari sono stati bloccati sul nostro calendario ufficiale per accoglierti al meglio.',
  confirmationPayPalCta: 'Paga prima di arrivare in studio',
  confirmationSignature: 'Igor Rozanov',
};

export interface VoucherItem {
  id: string;
  code: string;
  title?: string;
  discountType: 'percent' | 'percentage' | 'fixed';
  discountValue: number;
  targetProduct?: string;
  applicableProducts?: string[];
  minOrderAmount?: number;
  description: string;
  active: boolean;
  isRegistrationWelcome?: boolean;
  isRegistrationVoucher?: boolean;
  usageCount: number;
  assignedToEmail?: string; // Specific email if voucher is personalized for one account
  assignedToUserId?: string;
  assignedToUserName?: string;
  singleUsePerAccount?: boolean; // If true, can only be used once per account
  usedByEmails?: string[]; // List of emails that have redeemed this voucher
  expiresAt?: string;
}

export const DEFAULT_VOUCHERS: VoucherItem[] = [
  {
    id: 'vch-welcome-5',
    code: 'BENVENUTO5',
    title: 'Sconto Benvenuto Registrazione (-5%)',
    discountType: 'percent',
    discountValue: 5,
    targetProduct: 'all',
    applicableProducts: ['all'],
    description: 'Sconto Benvenuto 5% automatico alla registrazione su tutte le sessioni e prodotti',
    active: true,
    isRegistrationWelcome: true,
    isRegistrationVoucher: true,
    singleUsePerAccount: true,
    usedByEmails: [],
    usageCount: 0,
  },
  {
    id: 'vch-mix-15',
    code: 'MIXMASTER15',
    title: 'Promo Mix & Master (-15%)',
    discountType: 'percent',
    discountValue: 15,
    targetProduct: 'mix_master',
    applicableProducts: ['mix_master'],
    description: 'Voucher -15% dedicato al servizio Mix & Master in Studio',
    active: true,
    isRegistrationWelcome: false,
    isRegistrationVoucher: false,
    singleUsePerAccount: false,
    usedByEmails: [],
    usageCount: 0,
  },
  {
    id: 'vch-studio-10',
    code: '171VIP10',
    title: 'Voucher VIP Studio (-10€)',
    discountType: 'fixed',
    discountValue: 10,
    targetProduct: 'all',
    applicableProducts: ['all'],
    description: 'Buono sconto fisso da 10€ su qualsiasi sessione in studio',
    active: true,
    isRegistrationWelcome: false,
    isRegistrationVoucher: false,
    singleUsePerAccount: false,
    usedByEmails: [],
    usageCount: 0,
  },
];

export interface CalendarSlotDef {
  id: string;
  time: string; // HH:MM (e.g. "15:00")
  label: string; // e.g. "15:00 - 17:00"
  period: 'pomeriggio' | 'sera' | 'mattina';
  durationLabel?: string;
  enabled?: boolean;
}

export interface BlockedCalendarSlot {
  id: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  timeSlots?: string[]; // e.g. ['15:00', '17:00']
  reason: string; // e.g. "Impegno personale master"
  createdAt: string;
}

export interface CalendarSettings {
  defaultStartHour: string; // "15:00"
  defaultEndHour: string; // "20:00"
  availableSlots: CalendarSlotDef[];
  blockedCommitments: BlockedCalendarSlot[];
  calendarNotice?: string;
  daysOff?: number[]; // e.g. [0] for Sunday, or []
}

export const DEFAULT_WEEKLY_TIME_SLOTS: CalendarSlotDef[] = [
  { id: 'slot-1500', time: '15:00', label: '15:00 - 17:00', period: 'pomeriggio', durationLabel: 'Fascia Pomeriggio', enabled: true },
  { id: 'slot-1600', time: '16:00', label: '16:00 - 18:00', period: 'pomeriggio', enabled: true },
  { id: 'slot-1700', time: '17:00', label: '17:00 - 19:00', period: 'pomeriggio', enabled: true },
  { id: 'slot-1800', time: '18:00', label: '18:00 - 20:00', period: 'sera', durationLabel: 'Fino a Chiusura (20:00)', enabled: true },
];

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
  defaultStartHour: '15:00',
  defaultEndHour: '20:00',
  availableSlots: DEFAULT_WEEKLY_TIME_SLOTS,
  blockedCommitments: [],
  calendarNotice: 'Orario di disponibilità studio: tutti i giorni dalle 15:00 alle 20:00. Prenotazione in tempo reale.',
  daysOff: [],
};

export interface AlbumTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  bpm?: number;
}

export interface AlbumPlayerConfig {
  albumTitle: string;
  albumArtist: string;
  albumSubtitle: string;
  albumCoverUrl?: string;
  tracks: AlbumTrack[];
  repeatMode: boolean;
  volume: number;
}

export const DEFAULT_ALBUM_TRACKS: AlbumTrack[] = [
  {
    id: 'tgc-1',
    title: 'The God Cypher (Intro)',
    artist: '171 Studio feat. Messina Family',
    duration: '2:45',
    bpm: 92,
  },
  {
    id: 'tgc-2',
    title: '171 Messina Flow',
    artist: '171 Studio & Guest Emcees',
    duration: '3:18',
    bpm: 94,
  },
  {
    id: 'tgc-3',
    title: 'Analog Heat (171 DSP)',
    artist: '171 Studio Beatmakers',
    duration: '3:05',
    bpm: 90,
  },
  {
    id: 'tgc-4',
    title: 'Late Night at Studio 171',
    artist: 'Igor Rozanov & Artists',
    duration: '3:32',
    bpm: 95,
  },
  {
    id: 'tgc-5',
    title: 'Outro Cypher 171',
    artist: '171 Studio Collective',
    duration: '2:50',
    bpm: 91,
  },
];

export const DEFAULT_ALBUM_CONFIG: AlbumPlayerConfig = {
  albumTitle: 'The God Cypher',
  albumArtist: '171 Studio',
  albumSubtitle: 'Album Ufficiale 171 Studio — In Riproduzione Continua a Ripetizione',
  tracks: DEFAULT_ALBUM_TRACKS,
  repeatMode: true,
  volume: 0.75,
};

export interface PageValueItem {
  id: string;
  tag: string;
  title: string;
  description: string;
}

export interface PluginBenefitItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
}

export interface FrontpageSpecItem {
  id: string;
  label: string;
  title: string;
}

export const DEFAULT_FRONTPAGE_SPECS: FrontpageSpecItem[] = [
  { id: 'spec-1', label: 'RECORDING ROOM', title: 'Vocal & Instruments' },
  { id: 'spec-2', label: 'MIX & MASTER', title: 'Analog & Digital' },
  { id: 'spec-3', label: '171 PLUGINS', title: 'Innovatio DSP' },
  { id: 'spec-4', label: 'FEEDBACK DIRETTO', title: 'Ambiente Trattato' },
];

export const DEFAULT_PAGE_VALUES: PageValueItem[] = [
  {
    id: 'val-1',
    tag: 'NESSUNA BARRIERA',
    title: 'Feedback Diretto & Umano',
    description: "A 171 Studio non usiamo un vocal booth separato con vetro: registriamo insieme nella stessa stanza acusticamente trattata. Questo permette una comunicazione istantanea, correzioni al volo e una reale sinergia energetica con l'artista.",
  },
  {
    id: 'val-2',
    tag: 'CATENA AUDIO 192kHz',
    title: 'Acustica di Precisione & Trasparenza',
    description: 'Trattamento acustico calibrato per garantire che ciò che ascolti durante la sessione rispecchi con assoluta fedeltà la resa su qualsiasi impianto, smartphone, cuffie o autoradio.',
  },
  {
    id: 'val-3',
    tag: 'AUDIO DSP PROPRIETARIO',
    title: 'Innovazione con 171 Plugin Innovatio',
    description: 'Non ci limitiamo a usare software standard: sviluppiamo internamente i nostri plugin audio proprietari per scolpire voci e mix con un carattere e un calore unici sul mercato.',
  },
  {
    id: 'val-4',
    tag: 'ONESTÀ ARTISTICA',
    title: 'Chiarezza & Accessibilità',
    description: "Listino prezzi chiaro e trasparente per ogni servizio. Il budget dell'artista viene rispettato con la massima dedizione professionale.",
  },
];

export const DEFAULT_PLUGIN_BENEFITS: PluginBenefitItem[] = [
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

export interface SiteContent {
  studioName: string;
  studioBadge: string;
  heroTagline: string;
  aboutTitle: string;
  aboutIntro: string;
  aboutPhilosophyTitle: string;
  aboutPhilosophy: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  spotifyPlaylistId: string;
  youtubePlaylistId: string;
  plugins: PluginItem[];
  // Studio Pricing & Payment Settings in Builder (All 8 Studio Products/Packages)
  hourlyRecordingPrice: number;
  mixMasterPrice: number;
  soloMasterPrice?: number;
  soloMixOnlinePrice?: number;
  branoCompletoNonEsclusivoPrice?: number;
  branoCompletoEsclusivoPrice?: number;
  produzioneNonEsclusivaPrice?: number;
  produzioneEsclusivaPrice?: number;
  beatProductionPrice: number;
  paypalEmail: string;
  allowOnlinePayment: boolean;
  calendarSettings?: CalendarSettings;
  // Customizable Email Templates & Vouchers/Discounts
  emailTemplates?: EmailTemplatesConfig;
  vouchers?: VoucherItem[];
  registrationDiscountEnabled?: boolean;
  registrationDiscountPercent?: number;
  registrationDiscountCode?: string;

  // --- CMS TEXTS & CONTENT FOR ALL PUBLIC PAGES ---
  // 1. Frontpage / Home
  frontpageHeroSubtitle?: string;
  frontpageSpecs?: FrontpageSpecItem[];
  frontpageNavChiSiamoDesc?: string;
  frontpageNavPrenotaDesc?: string;
  frontpageNavPluginsDesc?: string;

  // 2. Chi Siamo
  aboutBadge?: string;
  aboutValues?: PageValueItem[];
  aboutCtaTitle?: string;
  aboutCtaDesc?: string;

  // 3. 171 Plugin Innovation
  pluginIntroBadge?: string;
  pluginIntroTitle?: string;
  pluginIntroSubtitle?: string;
  pluginAboutSectionTitle?: string;
  pluginAboutSectionText1?: string;
  pluginAboutSectionText2?: string;
  pluginBenefitsTitle?: string;
  pluginBenefits?: PluginBenefitItem[];

  // 4. Prenota Sessione
  bookingBadge?: string;
  bookingTitle?: string;
  bookingSubtitle?: string;
  bookingNotesPlaceholder?: string;
  bookingPaymentNotice?: string;

  // 5. Official Album Player "The God Cypher"
  albumPlayer?: AlbumPlayerConfig;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'master' | 'client';
  createdAt: string;
  welcomeDiscountCode?: string;
  welcomeDiscountUsed?: boolean;
  usedVouchers?: string[];
  // Early Supporter Lifetime Pass ($20 / 20€ donation)
  isEarlySupporter?: boolean;
  earlySupporterUnlockedAt?: string;
  earlySupporterTxId?: string;
  earlySupporterAmount?: number;
  // Bug Hunter / Verified Technical Feedback
  isVerifiedBugHunter?: boolean;
  verifiedBugHunterUnlockedAt?: string;
  lifetimeCommercialPluginsFree?: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: 'LOGIN' | 'REGISTER' | 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'PLUGIN_DOWNLOADED' | 'KEY_BPM_USED' | 'FILE_UPLOADED' | 'FILE_DELIVERY_CREATED' | 'FILE_DOWNLOAD_CONFIRMED' | 'CMS_EDIT' | 'EMAIL_SENT' | 'ALBUM_ORDER_CREATED' | 'ALBUM_ORDER_UPDATED' | 'ALBUM_PAYPAL_CONFIRMED' | 'PLUGIN_BUG_REPORTED' | 'PLUGIN_BUG_UPDATED' | 'PLUGIN_DONATION_CREATED' | 'PLUGIN_DONATION_CONFIRMED' | 'BUG_HUNTER_REWARD_GRANTED';
  details: string;
  timestamp: string;
}

export interface ClientFileItem {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  bookingOrderCode?: string;
  fileName: string;
  fileSize: string;
  fileType: 'stems_progetto' | 'base_wav' | 'mix_master' | 'registrazione_vocale' | 'analisi_dsp';
  uploadedBy: 'cliente' | '171_studio';
  notes?: string;
  downloadUrl?: string;
  // Google Drive Delivery & Download Confirmation
  driveUrl?: string;
  isDriveDelivery?: boolean;
  deliveryStatus?: 'in_attesa_download' | 'download_confermato';
  downloadCount?: number;
  lastDownloadedAt?: string;
  lastDownloadedBy?: 'cliente' | 'master';
  downloadConfirmationLogs?: Array<{
    timestamp: string;
    actor: 'cliente' | 'master';
    userEmail: string;
  }>;
  createdAt: string;
}

export interface DownloadedPluginRecord {
  id: string;
  userId: string;
  userEmail: string;
  pluginId: string;
  pluginName: string;
  pluginBadge: string;
  pluginStatus: string;
  zipFileName?: string;
  zipFileSize?: string;
  downloadUrl?: string;
  downloadedAt: string;
}

export interface KeyBpmAnalysisRecord {
  id: string;
  userId: string;
  userEmail: string;
  fileName: string;
  fileSize: string;
  bpm: number;
  musicalKey: string;
  musicalKeyIt: string;
  camelot: string;
  confidence: number;
  analyzedAt: string;
}

export interface BookingRecord {
  id: string;
  orderCode: string; // e.g. 171-ORD-123456
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  serviceId: string;
  serviceTitle: string;
  hours: number;
  date: string;
  time: string;
  endTime?: string;
  originalPrice?: number;
  discountCode?: string;
  discountAmount?: number;
  discountPercent?: number;
  estimatedPrice: number;
  notes: string;
  status: 'in_attesa' | 'confermata' | 'completata' | 'annullata';
  paymentStatus: 'in_attesa' | 'saldato' | 'pagamento_in_studio';
  paypalPaymentUrl?: string;
  confirmationEmailSent?: boolean;
  calendarEventId?: string;
  calendarSynced?: boolean;
  calendarSyncedAt?: string;
  calendarEventUrl?: string;
  processedAt?: string;
  processedBy?: string;
  cancellationReason?: string;
  source?: 'web' | 'studio_diretto';
  paymentMethod?: 'contanti' | 'pos_carta' | 'bonifico' | 'paypal' | 'altro';
  servicesRendered?: string[];
  artistProjectName?: string;
  // Google Drive Delivery & Confirmation for Booking
  driveDeliveryUrl?: string;
  driveDeliveryTitle?: string;
  driveDeliveryNotes?: string;
  driveDeliveryStatus?: 'in_attesa_download' | 'download_confermato';
  driveDownloadedAt?: string;
  driveDownloadedBy?: 'cliente' | 'master';
  driveDownloadCount?: number;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  bookingId: string;
  orderCode: string;
  type: 'PRENOTAZIONE_RICEVUTA' | 'PRENOTAZIONE_CONFERMATA';
  senderEmail?: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  amount: number;
  paypalEmail: string;
  paypalLink: string;
  sentAt: string;
  status: 'inviata' | 'inviata_con_gmail' | 'in_attesa_invio_gmail' | 'errore';
  deliveryMethod?: 'gmail_api' | 'outbox' | 'manual';
  gmailMessageId?: string;
  gmailThreadId?: string;
  httpStatusCode?: number;
  errorCode?: string;
  error?: string;
  latencyMs?: number;
  oauthTokenPresent?: boolean;
  summary: string;
}

export const MASTER_EMAIL = '171studiomessina@gmail.com';
export const STUDIO_PAYPAL_EMAIL = 'vkrealhakiesake@gmail.com';

export interface AlbumOrderRecord {
  id: string;
  orderCode: string; // e.g. 171-TGC-7842
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  orderType: 'physical' | 'digital';
  productTitle: string; // "The God Cypher — CD Deluxe Pack" | "The God Cypher — Master Pack Digitale"
  basePrice: number; // 9.99 | 4.99
  shippingFee: number; // 5.00 for shipping, 0 for pickup or digital
  totalAmount: number; // 14.99 | 9.99 | 4.99
  shippingMethod: 'shipping' | 'pickup' | 'digital_download';
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  notes?: string;
  
  // Tracking & Fulfillment
  trackingNumber?: string; // e.g. "POSTE-IT-98231478"
  trackingCarrier?: string; // e.g. "Poste Italiane SDA" | "GLS" | "DHL"
  trackingUrl?: string; // URL for tracking
  
  // Pickup schedule ("quando è possibile il ritiro dello stesso presso lo studio")
  pickupReadyDate?: string; // e.g. "2026-10-26"
  pickupSlot?: string; // e.g. "Dal Lunedì al Sabato 10:00 - 20:00 presso 171 Studio, Messina"
  pickupStatus?: 'in_preparazione' | 'pronto_ritiro' | 'ritirato';
  
  // Email validation & status ("convalida email dell'ordine")
  emailValidationStatus: 'in_attesa' | 'convalidata' | 'inviata';
  emailValidatedAt?: string;
  
  // Order status
  status: 'in_attesa_pagamento' | 'in_elaborazione' | 'spedito' | 'pronto_ritiro' | 'completato' | 'annullato';
  paymentStatus: 'saldato' | 'in_attesa' | 'pagamento_al_ritiro';
  
  // PayPal Payment & Transaction Tracking
  paypalPaymentUrl?: string;
  paypalEmail?: string; // vkrealhakiesake@gmail.com
  paypalTransactionId?: string; // e.g. "PAYID-TGC-982134"
  paypalPaidAt?: string;
  paypalAmountPaid?: number;
  
  createdAt: string;
  updatedAt?: string;
}

export interface PluginDonationRecord {
  id: string;
  donationCode: string; // e.g. 171-DON-9241
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: 'EUR' | 'USD';
  paypalTransactionId?: string; // Must be validated (>= 5 chars & unique)
  paypalEmail: string; // vkrealhakiesake@gmail.com
  paypalPaymentUrl?: string;
  paypalPaidAt?: string;
  status: 'in_attesa_pagamento' | 'convalidata';
  paymentStatus: 'in_attesa' | 'saldato';
  isEarlySupporterPass: boolean; // true if amount >= 20
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}
