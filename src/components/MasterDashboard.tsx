import React, { useState } from 'react';
import { 
  Shield, Edit3, Cpu, Calendar, Activity, Save, Plus, Trash2, 
  Check, ArrowLeft, RefreshCw, Disc, Youtube, Mail, Phone, MapPin, 
  ExternalLink, Sparkles, User, Clock, FileText, CheckCircle2,
  DollarSign, CreditCard, Send, Copy, AlertCircle, Eye, ChevronDown, ChevronUp,
  Inbox, Archive, Search, RotateCcw, Printer, X, BarChart3, TrendingUp,
  Upload, Download, FolderArchive, FolderOpen, Tag, Gift, Percent, MessageSquare, Star,
  Sliders, Music, Monitor, Smartphone, Tablet, Truck, Bug, Wrench, Globe, Heart, Users
} from 'lucide-react';
import { useStudio, isIgnoredUserEmail } from '../context/StudioContext';
import { PageId } from '../types';
import { HeroHome } from './HeroHome';
import { BookingSessionPage } from './BookingSessionPage';
import { AboutPage } from './AboutPage';
import { PluginsPage } from './PluginsPage';
import { AudioToolsPage } from './AudioToolsPage';
import { ClientAccountPage } from './ClientAccountPage';
import { TheGodCypherPage } from './TheGodCypherPage';
import {
  PluginItem,
  SiteContent,
  BookingRecord,
  EmailLog,
  ClientFileItem,
  MASTER_EMAIL,
  STUDIO_PAYPAL_EMAIL,
  DEFAULT_EMAIL_TEMPLATES,
  EmailTemplatesConfig,
  VoucherItem,
  AlbumTrack,
  DEFAULT_ALBUM_CONFIG,
  DEFAULT_ALBUM_TRACKS,
  DEFAULT_FRONTPAGE_SPECS,
  DEFAULT_PAGE_VALUES,
  DEFAULT_PLUGIN_BENEFITS,
} from '../types/cms';
import { 
  getPayPalPaymentUrl, 
  getPayPalMeUrl, 
  triggerPluginZipFileDownload,
  sendEmailViaWebhook,
  getGmailWebComposeUrl
} from '../utils/emailService';
import { getGoogleCalendarWebUrl } from '../utils/googleCalendarService';
import { BookingAnalyticsDashboard } from './BookingAnalyticsDashboard';
import { MasterCalendarControl } from './MasterCalendarControl';
import { SERVICE_OPTIONS } from '../utils/pricing';

interface MasterDashboardProps {
  onClose: () => void;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({ onClose }) => {
  const { 
    siteContent, updateSiteContent, addPlugin, updatePlugin, deletePlugin,
    bookings, updateBookingStatus, updateBookingPayment, sendConfirmationEmail,
    activities, currentUser, emailLogs, isMaster,
    isGoogleCalendarConnected, isGmailConnected, connectGoogleCalendar, connectGmailAndCalendar,
    syncBookingToCalendar, sendConfirmationEmailViaGmail, sendReceiptEmailViaGmail,
    triggerTestBookingAndConfirmationEmail,
    restoreBookingToDesk, deleteBookingPermanently, addDirectStudioSession,
    pluginFeedbacks, addVoucher, updateVoucher, deleteVoucher, updateEmailTemplates,
    clientFiles, addDriveDelivery, confirmDriveFileDownload, deleteClientFile,
    updateBookingDriveDelivery, confirmBookingDriveDownload, openDownloadReceiptModal,
    albumOrders, createAlbumOrder, updateAlbumOrder, deleteAlbumOrder, validateAlbumOrderEmail,
    setAlbumOrderTracking, setAlbumOrderPickupReady, confirmAlbumOrderPayPalPayment,
    pluginBugReports, updatePluginBugReportStatus, deletePluginBugReport, verifyPluginBugReportAndReward,
    pluginDonations, confirmPluginDonationPayPal, updatePluginDonation, deletePluginDonation,
    registeredUsers,
    openGmailWebCompose, openMailtoCompose, downloadBookingCalendarIcs, openGoogleCalendarWeb
  } = useStudio();

  const [activeTab, setActiveTab] = useState<'preview' | 'cms' | 'pricing' | 'vouchers' | 'calendar' | 'desk' | 'deliveries' | 'album_orders' | 'plugin_bug_reports' | 'plugin_donations' | 'history' | 'analytics' | 'emails' | 'plugins' | 'audit' | 'users'>('desk');
  const [previewTabDevice, setPreviewTabDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTabPage, setPreviewTabPage] = useState<PageId>('home');
  const [copiedLocalUrl, setCopiedLocalUrl] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Plugin Bug Reports Management State (Master Account)
  const [bugReportFilter, setBugReportFilter] = useState<'all' | 'aperti' | 'in_esame' | 'risolti' | 'critici'>('all');
  const [bugReportSearch, setBugReportSearch] = useState<string>('');
  const [editingAdminNotesId, setEditingAdminNotesId] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');
  const [bugActionNotice, setBugActionNotice] = useState<string | null>(null);

  // Plugin Donations & Early Supporters Management State (Master Account)
  const [donationFilter, setDonationFilter] = useState<'all' | 'early_supporters' | 'convalidate' | 'in_attesa'>('all');
  const [donationSearch, setDonationSearch] = useState<string>('');
  const [verifyingDonationId, setVerifyingDonationId] = useState<string | null>(null);
  const [manualDonationTxInput, setManualDonationTxInput] = useState<string>('');
  const [donationActionNotice, setDonationActionNotice] = useState<string | null>(null);
  
  // Google Drive Deliveries Management State
  const [showAddDriveDelivery, setShowAddDriveDelivery] = useState(false);
  const [selectedBookingForDrive, setSelectedBookingForDrive] = useState<BookingRecord | null>(null);
  const [driveFormRecipientEmail, setDriveFormRecipientEmail] = useState('');
  const [driveFormRecipientName, setDriveFormRecipientName] = useState('');
  const [driveFormOrderCode, setDriveFormOrderCode] = useState('');
  const [driveFormUrl, setDriveFormUrl] = useState('');
  const [driveFormFileName, setDriveFormFileName] = useState('');
  const [driveFormFileType, setDriveFormFileType] = useState<ClientFileItem['fileType']>('mix_master');
  const [driveFormNotes, setDriveFormNotes] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'tutte' | 'in_attesa' | 'confermate'>('tutte');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliverySubTab, setDeliverySubTab] = useState<'progetti_aperti' | 'file_ricevuti' | 'tutte_consegne'>('progetti_aperti');
  
  // The God Cypher Album Orders Management State
  const [albumOrdersSearch, setAlbumOrdersSearch] = useState('');
  const [albumOrdersFilter, setAlbumOrdersFilter] = useState<'all' | 'da_spedire' | 'ritiro_studio' | 'digital' | 'convalidati'>('all');
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [trackingCarrierInput, setTrackingCarrierInput] = useState('Poste Italiane SDA');
  const [editingPickupId, setEditingPickupId] = useState<string | null>(null);
  const [pickupDateInput, setPickupDateInput] = useState('');
  const [pickupTimeSlotInput, setPickupTimeSlotInput] = useState('10:00 - 20:00');
  const [orderActionNotice, setOrderActionNotice] = useState<string | null>(null);
  
  // Local editable form state for CMS with subtabs
  const [cmsSubTab, setCmsSubTab] = useState<'frontpage' | 'chi-siamo' | 'plugin-innovation' | 'prenota-sessione' | 'album'>('frontpage');
  const [formData, setFormData] = useState<SiteContent>(() => ({
    ...siteContent,
    frontpageSpecs: siteContent.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS,
    aboutValues: siteContent.aboutValues || DEFAULT_PAGE_VALUES,
    pluginBenefits: siteContent.pluginBenefits || DEFAULT_PLUGIN_BENEFITS,
    albumPlayer: siteContent.albumPlayer || DEFAULT_ALBUM_CONFIG,
    emailWebhookUrl: siteContent.emailWebhookUrl || 'https://hook.eu1.make.com/a03ihbpq25iwo69o1slek8vmn9cjgec8',
    emailjsServiceId: siteContent.emailjsServiceId || '',
    emailjsTemplateIdReceipt: siteContent.emailjsTemplateIdReceipt || '',
    emailjsTemplateIdConfirmation: siteContent.emailjsTemplateIdConfirmation || '',
    emailjsPublicKey: siteContent.emailjsPublicKey || '',
  }));
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);
  const [deskActionNotice, setDeskActionNotice] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'tutte' | 'confermata' | 'completata' | 'annullata'>('tutte');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedBookingDossier, setSelectedBookingDossier] = useState<BookingRecord | null>(null);
  const [syncingBookingId, setSyncingBookingId] = useState<string | null>(null);
  const [calendarNotice, setCalendarNotice] = useState<string | null>(null);
  const [isTestingGmail, setIsTestingGmail] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestNotice, setWebhookTestNotice] = useState<string | null>(null);

  // Direct offline studio session state
  const [showAddDirectSession, setShowAddDirectSession] = useState(false);
  const [directArtistName, setDirectArtistName] = useState('');
  const [directArtistProject, setDirectArtistProject] = useState('');
  const [directArtistEmail, setDirectArtistEmail] = useState('');
  const [directArtistPhone, setDirectArtistPhone] = useState('');
  const [directServiceTitle, setDirectServiceTitle] = useState('Registrazione Vocale');
  const [directServicesTags, setDirectServicesTags] = useState<string[]>(['Registrazione Vocale']);
  const [directPrice, setDirectPrice] = useState<number>(50);
  const [directHours, setDirectHours] = useState<number>(2);
  const [directDate, setDirectDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [directTime, setDirectTime] = useState<string>('15:00');
  const [directPaymentMethod, setDirectPaymentMethod] = useState<'contanti' | 'pos_carta' | 'bonifico' | 'paypal' | 'altro'>('contanti');
  const [directPaymentStatus, setDirectPaymentStatus] = useState<'saldato' | 'pagamento_in_studio' | 'in_attesa'>('saldato');
  const [directStatus, setDirectStatus] = useState<'confermata' | 'completata'>('completata');
  const [directNotes, setDirectNotes] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');

  // New plugin modal/form state + .ZIP Archive upload state
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginBadge, setNewPluginBadge] = useState('AUDIO DSP');
  const [newPluginStatus, setNewPluginStatus] = useState<PluginItem['status']>('DISPONIBILE');
  const [newPluginDesc, setNewPluginDesc] = useState('');
  const [newPluginUrl, setNewPluginUrl] = useState('');
  const [newPluginVersion, setNewPluginVersion] = useState('v1.0.0');
  const [newPluginZipName, setNewPluginZipName] = useState('');
  const [newPluginZipSize, setNewPluginZipSize] = useState('');
  const [newPluginZipDataUrl, setNewPluginZipDataUrl] = useState('');
  const [showAddPlugin, setShowAddPlugin] = useState(false);
  const [uploadingZipForPluginId, setUploadingZipForPluginId] = useState<string | null>(null);

  // Editable Email Templates state
  const [emailTemplatesForm, setEmailTemplatesForm] = useState<EmailTemplatesConfig>(() => ({
    ...DEFAULT_EMAIL_TEMPLATES,
    ...(siteContent.emailTemplates || {}),
  }));

  // Voucher creation state
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherTitle, setNewVoucherTitle] = useState('');
  const [newVoucherDesc, setNewVoucherDesc] = useState('');
  const [newVoucherType, setNewVoucherType] = useState<'percentage' | 'fixed'>('percentage');
  const [newVoucherValue, setNewVoucherValue] = useState<number>(10);
  const [newVoucherMinOrder, setNewVoucherMinOrder] = useState<number>(0);
  const [newVoucherApplicableProducts, setNewVoucherApplicableProducts] = useState<string[]>(['all']);
  const [newVoucherRecipientType, setNewVoucherRecipientType] = useState<'all' | 'specific'>('all');
  const [newVoucherAssignedEmail, setNewVoucherAssignedEmail] = useState('');
  const [newVoucherSingleUse, setNewVoucherSingleUse] = useState<boolean>(true);

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleNewPluginZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewPluginZipName(file.name);
    setNewPluginZipSize(formatBytes(file.size));

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewPluginZipDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExistingPluginZipUpload = (plugin: PluginItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingZipForPluginId(plugin.id);
    const sizeLabel = formatBytes(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      updatePlugin(plugin.id, {
        zipFileName: file.name,
        zipFileSize: sizeLabel,
        zipDataUrl: dataUrl,
        status: 'DISPONIBILE',
      });
      setUploadingZipForPluginId(null);
      setDeskActionNotice(`Cartella archivio "${file.name}" (${sizeLabel}) caricata con successo per il plugin ${plugin.name}! Ora disponibile per il download gratuito dei clienti.`);
      setTimeout(() => setDeskActionNotice(null), 6000);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCMS = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSiteContent(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleResetFrontpage = () => {
    const updated = {
      ...formData,
      studioName: '171 STUDIO',
      studioBadge: 'RECORDING & MASTERING SUITE',
      heroTagline: 'Lo studio di registrazione e mastering acusticamente trattato a Messina, con tecnologia di ripresa a feedback diretto.',
      frontpageHeroSubtitle: 'Ambiente di ripresa a feedback continuo, catena 192kHz e suite proprietaria 171 Plugin Innovatio.',
      frontpageSpecs: [...DEFAULT_FRONTPAGE_SPECS],
      frontpageNavChiSiamoDesc: 'Scopri la filosofia acustica, la registrazione a stretto contatto con feedback diretto e lo spazio di 171 Studio.',
      frontpageNavPrenotaDesc: 'Pianifica la tua sessione in studio: registrazione vocale, missaggio, mastering e produzioni su misura.',
      frontpageNavPluginsDesc: 'I nostri plugin DSP progettati per elevare il workflow, la purezza vocale e il calore analogico del mix moderno.',
      spotifyPlaylistId: '2nLiKk1RIeFhbMabi9iQ34',
      youtubePlaylistId: 'PLXK7O-W_io4CCKTgd_kyDOh_jgFYmMyfj',
    };
    setFormData(updated);
    updateSiteContent(updated);
    setDeskActionNotice('Testi della Frontpage ripristinati ai valori di fabbrica e sincronizzati su Firestore!');
    setTimeout(() => setDeskActionNotice(null), 4000);
  };

  const handleResetAbout = () => {
    const updated = {
      ...formData,
      aboutBadge: 'IDENTITÀ & VISIONE SONORA',
      aboutTitle: 'Chi Siamo',
      aboutIntro: "171 Studio è il punto di riferimento a Messina per la registrazione vocale, il mix e il mastering moderno. Nato per dare voce e potenza sonora alla musica contemporanea, lo studio unisce standard tecnici avanzati a una sincera passione per l'arte e per chi la crea.",
      aboutPhilosophyTitle: 'Registrazione nella Stessa Stanza: Il Feedback Diretto',
      aboutPhilosophy: "A 171 Studio non troverai la tradizionale cabina vocale con vetro separatore: registriamo l'artista direttamente nella stessa stanza trattata acusticamente con l'ingegnere del suono. Questo approccio elimina ogni fredda barriera, permettendo un dialogo immediato, correzioni in tempo reale e una sintonia creativa che eleva la resa emotiva di ogni take vocale.",
      aboutValues: [...DEFAULT_PAGE_VALUES],
      aboutCtaTitle: 'VUOI REGISTRARE O PARLARE DEL TUO PROGETTO?',
      aboutCtaDesc: 'Vieni a trovarci in studio a Messina o prenota subito la tua sessione.',
      contactEmail: '171studiomessina@gmail.com',
      contactPhone: '+39 347 123 4567',
      contactAddress: 'Via Garibaldi 171, 98122 Messina (ME)',
    };
    setFormData(updated);
    updateSiteContent(updated);
    setDeskActionNotice('Testi di "Chi Siamo" ripristinati ai valori di fabbrica e sincronizzati su Firestore!');
    setTimeout(() => setDeskActionNotice(null), 4000);
  };

  const handleResetPlugins = () => {
    const updated = {
      ...formData,
      pluginIntroBadge: 'SOFTWARE DSP & INGEGNERIA AUDIO • 100% FREEWARE',
      pluginIntroTitle: '171 Plugin Innovatio',
      pluginIntroSubtitle: "I nostri plugin audio di nuova generazione: strumenti digitali proprietari gratuiti concepiti e calibrati all'interno di 171 Studio per offrire una qualità da studio professionale direttamente nella tua DAW.",
      pluginAboutSectionTitle: "Cos'è 171 Plugin Innovatio",
      pluginAboutSectionText1: "171 Plugin Innovatio è la divisione di ricerca e sviluppo software di 171 Studio. Nasce da un'esigenza diretta: durante le nostre sessioni quotidiane di missaggio e mastering cercavamo plugin che combinassero la musicalità e la pasta sonora degli outboard analogici d'epoca con la flessibilità chirurgica e la stabilità del software moderno.",
      pluginAboutSectionText2: 'Il nostro è un progetto gratuito e rimarrà sempre tale: scarica liberamente i pacchetti .ZIP dei plugin, provali nelle tue produzioni e lasciaci un feedback per aiutarci a migliorarli costantemente!',
      pluginBenefitsTitle: 'Quali Benefici Offrono i Nostri Plugin',
      pluginBenefits: [...DEFAULT_PLUGIN_BENEFITS],
    };
    setFormData(updated);
    updateSiteContent(updated);
    setDeskActionNotice('Testi di "171 Plugin Innovation" ripristinati ai valori di fabbrica e sincronizzati su Firestore!');
    setTimeout(() => setDeskActionNotice(null), 4000);
  };

  const handleResetBooking = () => {
    const updated = {
      ...formData,
      bookingBadge: 'BOOKING ONLINE IN TEMPO REALE',
      bookingTitle: 'Prenota la tua Sessione',
      bookingSubtitle: 'Seleziona la durata con la barra oraria, scegli la tua fascia preferita (pomeriggio o sera) e prenota il tuo slot ideale tra le 15:00 e le 20:00.',
      bookingNotesPlaceholder: 'Descrivi il genere musicale, se porti una base tua, link provini/demo o esigenze particolari...',
      bookingPaymentNotice: 'Paga prima di arrivare in studio con PayPal oppure salda direttamente in studio al termine della sessione.',
    };
    setFormData(updated);
    updateSiteContent(updated);
    setDeskActionNotice('Testi di "Prenota Sessione" ripristinati ai valori di fabbrica e sincronizzati su Firestore!');
    setTimeout(() => setDeskActionNotice(null), 4000);
  };

  const handleAddSpec = () => {
    const current = formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS;
    const newSpec = {
      id: `spec-${Date.now()}`,
      label: 'NUOVA SPECIFICA',
      title: 'Dettaglio Studio',
    };
    setFormData({ ...formData, frontpageSpecs: [...current, newSpec] });
  };

  const handleRemoveSpec = (idx: number) => {
    const current = formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS;
    if (current.length <= 1) return;
    setFormData({ ...formData, frontpageSpecs: current.filter((_, i) => i !== idx) });
  };

  const handleAddAboutValue = () => {
    const current = formData.aboutValues || DEFAULT_PAGE_VALUES;
    const newVal = {
      id: `val-${Date.now()}`,
      tag: 'NUOVO PILASTRO',
      title: 'Titolo del Valore',
      description: 'Descrizione del principio fondamentale e metodo di lavoro dello studio.',
    };
    setFormData({ ...formData, aboutValues: [...current, newVal] });
  };

  const handleRemoveAboutValue = (idx: number) => {
    const current = formData.aboutValues || DEFAULT_PAGE_VALUES;
    if (current.length <= 1) return;
    setFormData({ ...formData, aboutValues: current.filter((_, i) => i !== idx) });
  };

  const handleAddPluginBenefit = () => {
    const current = formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS;
    const newBen = {
      id: `ben-${Date.now()}`,
      tag: 'NUOVO VANTAGGIO',
      title: 'Titolo Vantaggio',
      desc: 'Descrizione dell\'algoritmo DSP, prestazioni e resa sonora moderna.',
    };
    setFormData({ ...formData, pluginBenefits: [...current, newBen] });
  };

  const handleRemovePluginBenefit = (idx: number) => {
    const current = formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS;
    if (current.length <= 1) return;
    setFormData({ ...formData, pluginBenefits: current.filter((_, i) => i !== idx) });
  };

  const handleSaveEmailTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailTemplates(emailTemplatesForm);
    setDeskActionNotice('Testi e oggetti delle Email Automatiche salvati e applicati con successo!');
    setTimeout(() => setDeskActionNotice(null), 5000);
  };

  const handleResetEmailTemplates = () => {
    setEmailTemplatesForm({ ...DEFAULT_EMAIL_TEMPLATES });
    updateEmailTemplates({ ...DEFAULT_EMAIL_TEMPLATES });
    setDeskActionNotice('Testi delle Email Automatiche ripristinati ai valori predefiniti di 171 Studio.');
    setTimeout(() => setDeskActionNotice(null), 4000);
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode.trim() || !newVoucherTitle.trim()) return;

    const selectedProducts = newVoucherApplicableProducts.length > 0 ? newVoucherApplicableProducts : ['all'];
    const assignedEmail = newVoucherRecipientType === 'specific' ? newVoucherAssignedEmail.trim().toLowerCase() : undefined;

    addVoucher({
      code: newVoucherCode.trim().toUpperCase(),
      title: newVoucherTitle.trim(),
      description: newVoucherDesc.trim() || `Sconto ${newVoucherValue}${newVoucherType === 'percentage' ? '%' : '€'} sui prodotti selezionati`,
      discountType: newVoucherType === 'percentage' ? 'percent' : 'fixed',
      discountValue: Number(newVoucherValue) || 5,
      applicableProducts: selectedProducts,
      targetProduct: selectedProducts[0] || 'all',
      minOrderAmount: Number(newVoucherMinOrder) > 0 ? Number(newVoucherMinOrder) : undefined,
      active: true,
      assignedToEmail: assignedEmail,
      singleUsePerAccount: newVoucherSingleUse,
      usedByEmails: [],
    });

    setDeskActionNotice(
      `Voucher sconto "${newVoucherCode.trim().toUpperCase()}" creato con successo! ${assignedEmail ? `(Riservato all'account: ${assignedEmail})` : '(Valido per tutti)'}`
    );
    setTimeout(() => setDeskActionNotice(null), 4500);
    setNewVoucherCode('');
    setNewVoucherTitle('');
    setNewVoucherDesc('');
    setNewVoucherAssignedEmail('');
    setNewVoucherRecipientType('all');
    setNewVoucherSingleUse(true);
    setShowAddVoucher(false);
  };

  const handleCreatePlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName.trim() || !newPluginDesc.trim()) return;

    const safeFileName =
      newPluginZipName.trim() ||
      `${newPluginName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_Installer.zip`;

    addPlugin({
      name: newPluginName.trim(),
      badge: newPluginBadge.trim().toUpperCase(),
      status: newPluginStatus,
      description: newPluginDesc.trim(),
      downloadUrl: newPluginUrl.trim() || '#',
      version: newPluginVersion.trim() || 'v1.0.0',
      zipFileName: safeFileName,
      zipFileSize: newPluginZipSize || '14.2 MB',
      zipDataUrl: newPluginZipDataUrl || undefined,
    });

    setDeskActionNotice(`Plugin "${newPluginName.trim()}" con pacchetto "${safeFileName}" aggiunto al catalogo!`);
    setTimeout(() => setDeskActionNotice(null), 5000);

    setNewPluginName('');
    setNewPluginDesc('');
    setNewPluginUrl('');
    setNewPluginZipName('');
    setNewPluginZipSize('');
    setNewPluginZipDataUrl('');
    setShowAddPlugin(false);
  };

  const handleAddDirectTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !directServicesTags.includes(trimmed)) {
      setDirectServicesTags([...directServicesTags, trimmed]);
    }
  };

  const handleRemoveDirectTag = (tag: string) => {
    setDirectServicesTags(directServicesTags.filter((t) => t !== tag));
  };

  const handleCreateDirectSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directArtistName.trim()) return;

    const finalServices = directServicesTags.length > 0 ? directServicesTags : [directServiceTitle];

    await addDirectStudioSession({
      userName: directArtistName.trim(),
      artistProjectName: directArtistProject.trim(),
      userEmail: directArtistEmail.trim() || undefined,
      userPhone: directArtistPhone.trim() || undefined,
      serviceTitle: directServiceTitle,
      servicesRendered: finalServices,
      estimatedPrice: Number(directPrice) || 0,
      hours: Number(directHours) || 1,
      date: directDate,
      time: directTime,
      paymentMethod: directPaymentMethod,
      paymentStatus: directPaymentStatus,
      status: directStatus,
      notes: directNotes.trim(),
    });

    setDeskActionNotice(`Sessione diretta per "${directArtistName}" (${directPrice}€) registrata con successo nello storico.`);
    setTimeout(() => setDeskActionNotice(null), 4000);

    setDirectArtistName('');
    setDirectArtistProject('');
    setDirectArtistEmail('');
    setDirectArtistPhone('');
    setDirectNotes('');
    setShowAddDirectSession(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  const pendingBookings = bookings.filter((b) => b.status === 'in_attesa');
  const historicalBookings = bookings.filter((b) => b.status !== 'in_attesa');

  const filteredHistoricalBookings = historicalBookings.filter((b) => {
    if (historyFilter !== 'tutte' && b.status !== historyFilter) {
      return false;
    }

    if (historySearch.trim()) {
      const q = historySearch.toLowerCase().trim();
      const matchName = b.userName.toLowerCase().includes(q);
      const matchEmail = b.userEmail.toLowerCase().includes(q);
      const matchOrder = b.orderCode?.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
      const matchPhone = b.userPhone?.toLowerCase().includes(q);
      const matchService = b.serviceTitle?.toLowerCase().includes(q);
      return matchName || matchEmail || matchOrder || matchPhone || matchService;
    }

    return true;
  });

  const handleConfirmFromDesk = async (b: BookingRecord) => {
    await updateBookingStatus(b.id, 'confermata');
    openGmailWebCompose(b.id, 'confirmation');
    setDeskActionNotice(`✅ Sessione #${b.orderCode} (${b.userName}) CONFERMATA! Aperta finestra Gmail Web con destinatario (${b.userEmail}), link PayPal (${b.estimatedPrice}€) e firma Igor Rozanov pre-compilati.`);
    setTimeout(() => setDeskActionNotice(null), 8000);
  };

  const handleTestWebhook = async () => {
    const url = formData.emailWebhookUrl?.trim();
    if (!url) {
      setWebhookTestNotice('⚠️ Inserisci prima un URL webhook valido (es. Make.com, Zapier o Formspree).');
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestNotice(null);
    try {
      const res = await sendEmailViaWebhook(url, {
        event: 'test_notification',
        timestamp: new Date().toISOString(),
        studioEmail: MASTER_EMAIL,
        recipientEmail: STUDIO_PAYPAL_EMAIL,
        recipientName: 'Test Ricevente 171 Studio',
        orderCode: 'TEST-' + Math.floor(1000 + Math.random() * 9000),
        subject: 'Test Connessione Webhook 171 Studio Messina',
        body: 'Questo è un messaggio di test per verificare che il webhook riceva correttamente le notifiche di prenotazione senza Google OAuth.',
        amount: 50,
        paypalEmail: siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL,
      });
      if (res.success) {
        setWebhookTestNotice('✅ Webhook verificato con successo! Il server endpoint ha risposto con codice HTTP 200.');
      } else {
        setWebhookTestNotice(`❌ Errore durante la chiamata webhook: ${res.error || 'Server non raggiungibile'}`);
      }
    } catch (err: any) {
      setWebhookTestNotice(`❌ Errore di rete: ${err?.message || 'Connessione fallita'}`);
    } finally {
      setIsTestingWebhook(false);
      setTimeout(() => setWebhookTestNotice(null), 8000);
    }
  };

  const handleTriggerTestEmailFlow = async () => {
    setIsTestingGmail(true);
    try {
      const res = await triggerTestBookingAndConfirmationEmail(STUDIO_PAYPAL_EMAIL);
      if (res.confirmationEmail.deliveryMethod === 'gmail_api') {
        setDeskActionNotice(
          `✅ Email Reali inviate con successo da ${MASTER_EMAIL} a ${STUDIO_PAYPAL_EMAIL}! (Ordine #${res.booking.orderCode} - Gmail ID: ${res.confirmationEmail.gmailMessageId})`
        );
      } else {
        setDeskActionNotice(
          `Prenotazione Test #${res.booking.orderCode} generata! Clicca "Connetti Gmail 171 Studio" per autorizzare l'invio reale sulla casella ${STUDIO_PAYPAL_EMAIL}.`
        );
      }
    } finally {
      setIsTestingGmail(false);
      setTimeout(() => setDeskActionNotice(null), 8000);
    }
  };

  const handleCancelFromDesk = async (b: BookingRecord) => {
    const reason = window.prompt("Motivo annullamento (opzionale per lo storico):", "Richiesta dall'artista o orario non disponibile");
    await updateBookingStatus(b.id, 'annullata', reason || undefined);
    setDeskActionNotice(`Sessione #${b.orderCode} (${b.userName}) ANNULLATA e spostata nello Storico.`);
    setTimeout(() => setDeskActionNotice(null), 5000);
  };

  const handleSyncCalendarSingle = async (b: BookingRecord) => {
    setSyncingBookingId(b.id);
    try {
      const result = await syncBookingToCalendar(b.id);
      if (result.success) {
        setCalendarNotice(`Sessione #${b.orderCode} sincronizzata con Google Calendar!`);
        if (result.url && !isGoogleCalendarConnected) {
          window.open(result.url, '_blank');
        }
      } else {
        setCalendarNotice(`Avviso: ${result.message || 'Errore sincronizzazione'}`);
      }
    } finally {
      setSyncingBookingId(null);
      setTimeout(() => setCalendarNotice(null), 5000);
    }
  };

  if (!isMaster) {
    return (
      <div className="relative z-20 min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-neutral-900/90 border border-red-500/50 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold uppercase">
            ACCESSO NEGATO • SOLO ACCOUNT MASTER
          </span>
          <h2 className="text-xl font-heading font-black text-white">
            Pannello Riservato al Master
          </h2>
          <p className="text-xs font-mono text-neutral-300 leading-relaxed">
            Il modulo CMS e le impostazioni del database Firestore sono riservati esclusivamente all'account Master autorizzato (<strong className="text-amber-400">{MASTER_EMAIL}</strong>).
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider font-mono transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Torna al Sito Pubblico
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-20 min-h-screen bg-neutral-950 text-white flex flex-col pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Admin Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-xl shadow-2xl mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase">
                MASTER STUDIO BUILDER & CMS
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Accesso Verificato: {currentUser?.email || MASTER_EMAIL}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
              Pannello di Amministrazione 171 Studio
            </h1>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Gestione completa contenuti, tariffe, prenotazioni, invio email automatiche e pagamenti PayPal ({siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/10"
            title="Apri l'anteprima live in tempo reale del sito"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Eye className="w-4 h-4" />
            <span>Guarda Modifiche Live</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddDirectSession(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuova Sessione Fuori Sito</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna al Sito</span>
          </button>
        </div>
      </div>

      {/* Gmail Automation Connection & Real Test Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isGmailConnected
          ? 'bg-emerald-950/30 border-emerald-500/40'
          : 'bg-amber-950/30 border-amber-500/50'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isGmailConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Automazione Gmail Ufficiale ({MASTER_EMAIL})
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                isGmailConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isGmailConnected ? '● CONNESSA (INVIO REALE ATTIVO)' : '● RICHIEDE AUTORIZZAZIONE GMAIL'}
              </span>
            </div>
            <p className="text-xs text-neutral-300 font-mono mt-1">
              {isGmailConnected
                ? `Le email di ricezione ("Il nostro staff sta verificando la disponibilità") e di conferma ("Ordine confermato! Grazie per averci scelto" firmato Igor Rozanov + link PayPal) partono direttamente da ${MASTER_EMAIL}.`
                : `Collega l'account Google di ${MASTER_EMAIL} con 1 clic per abilitare l'invio reale delle email automatiche tramite Gmail API verso i clienti (es. ${STUDIO_PAYPAL_EMAIL}).`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={async () => {
              const ok = await connectGmailAndCalendar();
              if (ok) {
                setDeskActionNotice(`Account Gmail ${MASTER_EMAIL} connesso! Tutte le email in coda vengono ora spedite automaticamente.`);
                setTimeout(() => setDeskActionNotice(null), 5000);
              }
            }}
            className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              isGmailConnected
                ? 'bg-neutral-900 hover:bg-neutral-800 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{isGmailConnected ? 'Riconnetti Gmail 171 Studio' : 'Connetti Gmail 171 Studio'}</span>
          </button>

          <button
            type="button"
            disabled={isTestingGmail}
            onClick={handleTriggerTestEmailFlow}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isTestingGmail ? 'Invio in corso...' : `Test Invio Reale a ${STUDIO_PAYPAL_EMAIL}`}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-xs font-mono text-neutral-400 uppercase block">Prenotazioni Totali</span>
          <span className="text-3xl font-heading font-black text-amber-400 mt-1 block">
            {bookings.length}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {bookings.filter(b => b.status === 'in_attesa').length} in attesa di approvazione
          </span>
        </div>

        <div 
          onClick={() => setActiveTab('users')}
          className="p-4 rounded-2xl bg-neutral-900/60 border border-blue-500/30 bg-blue-500/5 cursor-pointer hover:border-blue-400 hover:bg-blue-500/10 transition-all group"
          title="Clicca per aprire la gestione completa degli utenti registrati"
        >
          <span className="text-xs font-mono text-blue-300 uppercase block group-hover:text-blue-200">Account Registrati</span>
          <span className="text-3xl font-heading font-black text-blue-400 mt-1 block group-hover:scale-105 transition-transform">
            {registeredUsers.length}
          </span>
          <span className="text-[10px] text-blue-300/70 font-mono">
            Utenti attivi • Clicca per vedere la lista
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-xs font-mono text-neutral-400 uppercase block">Email Automatiche</span>
          <span className="text-3xl font-heading font-black text-emerald-400 mt-1 block">
            {emailLogs.length}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">Inviate agli Artisti</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-xs font-mono text-neutral-400 uppercase block">PayPal Studio</span>
          <span className="text-xs font-mono text-white mt-1 block truncate font-bold" title={siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}>
            {siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}
          </span>
          <span className="text-[10px] text-amber-400 font-mono">Pronto per pagamenti</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <span className="text-xs font-mono text-neutral-400 uppercase block">Plugin Catalogo</span>
          <span className="text-3xl font-heading font-black text-white mt-1 block">
            {siteContent.plugins.length}
          </span>
          <span className="text-[10px] text-amber-400 font-mono">Suite Innovatio</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 col-span-2 sm:col-span-1">
          <span className="text-xs font-mono text-neutral-400 uppercase block">Audit Log Live</span>
          <span className="text-3xl font-heading font-black text-white mt-1 block">
            {activities.length}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Attività Tracciate</span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-3 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
              : 'text-emerald-400 hover:text-white hover:bg-neutral-900 border border-emerald-500/30'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Anteprima Live Sito</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'cms'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Contenuti & Testi (CMS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Tariffe & PayPal Builder</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Voucher & Sconto 5%</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
            {(siteContent.vouchers || []).filter(v => v.active).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Orari & Impegni Calendario</span>
          {siteContent.calendarSettings?.blockedCommitments && siteContent.calendarSettings.blockedCommitments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-300 text-[10px] font-bold">
              {siteContent.calendarSettings.blockedCommitments.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('desk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'desk'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Desk Prenotazioni</span>
          {pendingBookings.length > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-bold animate-pulse">
              {pendingBookings.length} nuove
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-500 text-[10px]">
              0
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'deliveries'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Consegna File Drive</span>
          {clientFiles.filter(f => f.isDriveDelivery && f.deliveryStatus !== 'download_confermato').length > 0 ? (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold animate-pulse">
              {clientFiles.filter(f => f.isDriveDelivery && f.deliveryStatus !== 'download_confermato').length} in attesa
            </span>
          ) : (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 text-[10px]">
              {clientFiles.filter(f => f.isDriveDelivery).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('album_orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'album_orders'
              ? 'bg-red-700 text-white font-bold shadow-md shadow-red-900/50'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Disc className="w-4 h-4 text-red-500" />
          <span>Ordini "The God Cypher"</span>
          {albumOrders.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700/60 text-[10px] font-bold">
              {albumOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Storico & Archivio</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 text-[10px] font-mono">
            {historicalBookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Trend</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'emails'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Registro Email Automatiche</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            {emailLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plugins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'plugins'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>171 Plugin Innovatio</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plugin_bug_reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'plugin_bug_reports'
              ? 'bg-red-700 text-white font-bold shadow-md shadow-red-900/50'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Bug className="w-4 h-4 text-red-400" />
          <span>Plugin Bug Reports</span>
          {pluginBugReports.filter((b) => b.status !== 'risolto').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-700/60 text-[10px] font-bold animate-pulse">
              {pluginBugReports.filter((b) => b.status !== 'risolto').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plugin_donations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'plugin_donations'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Heart className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Donazioni & Supporter</span>
          {pluginDonations.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-neutral-900 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              {pluginDonations.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Log Eventi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utenti Registrati</span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
            {registeredUsers.length}
          </span>
        </button>
      </div>

      {/* Desk and Calendar Action Feedback Banners */}
      {deskActionNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{deskActionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeskActionNotice(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {calendarNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{calendarNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setCalendarNotice(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {savedNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Modifiche salvate e sincronizzate con successo nel Database di 171 Studio!</span>
        </div>
      )}

      {/* TAB PREVIEW: ANTEPRIMA LIVE IN TEMPO REALE DEL SITO */}
      {activeTab === 'preview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Control Bar for Preview */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-emerald-500/40 backdrop-blur-xl space-y-4 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <Eye className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Live Site Simulator • In Tempo Reale
                    </span>
                    <span className="text-xs font-mono text-neutral-400">
                      Port 3000
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                    Anteprima Live del Sito in Tempo Reale
                  </h3>
                  <p className="text-xs font-mono text-neutral-400">
                    Visualizza istantaneamente come appare il sito per i tuoi clienti con tutti i testi, prezzi e file aggiornati.
                  </p>
                </div>
              </div>

              {/* Direct Link & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const currentSiteUrl = window.location.origin + window.location.pathname;
                    navigator.clipboard.writeText(currentSiteUrl);
                    setCopiedLocalUrl(true);
                    setTimeout(() => setCopiedLocalUrl(false), 2500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Copia URL Sito"
                >
                  {copiedLocalUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copiato!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia Link Sito</span>
                    </>
                  )}
                </button>

                <a
                  href={window.location.origin + window.location.pathname}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Apri a Schermo Intero</span>
                </a>
              </div>
            </div>

            {/* Page Selector & Device Viewport Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Page Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'home', label: 'Home (Frontpage)' },
                  { id: 'the-god-cypher', label: 'The God Cypher (Album)' },
                  { id: 'prenota-sessione', label: 'Prenota Sessione' },
                  { id: 'chi-siamo', label: 'Chi Siamo' },
                  { id: 'plugin-innovation', label: 'Plugin Innovation' },
                  { id: 'strumenti-online', label: 'Key & BPM Finder' },
                  { id: 'il-mio-account', label: 'Il Mio Account (My Files)' },
                ].map((pg) => {
                  const isActive = previewTabPage === pg.id;
                  return (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => setPreviewTabPage(pg.id as PageId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                          : 'bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                      }`}
                    >
                      {pg.label}
                    </button>
                  );
                })}
              </div>

              {/* Viewport Toggle */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setPreviewTabDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewTabDevice === 'desktop'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTabDevice('tablet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewTabDevice === 'tablet'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTabDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewTabDevice === 'mobile'
                      ? 'bg-emerald-500 text-black font-bold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (390px)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Live Screen Container */}
          <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950 border border-neutral-800 flex justify-center shadow-2xl overflow-hidden min-h-[700px]">
            {previewTabDevice === 'desktop' ? (
              <div className="w-full bg-neutral-950 rounded-2xl border border-neutral-800/80 p-2 sm:p-4 overflow-x-hidden">
                {previewTabPage === 'home' && <HeroHome onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'the-god-cypher' && <TheGodCypherPage onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'prenota-sessione' && <BookingSessionPage onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'chi-siamo' && <AboutPage onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'plugin-innovation' && <PluginsPage onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'strumenti-online' && <AudioToolsPage onNavigate={setPreviewTabPage} />}
                {previewTabPage === 'il-mio-account' && <ClientAccountPage onNavigate={setPreviewTabPage} />}
              </div>
            ) : previewTabDevice === 'tablet' ? (
              <div className="w-full max-w-[768px] min-h-[900px] bg-neutral-950 rounded-[32px] border-[8px] border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-amber-500/30">
                <div className="bg-neutral-900 px-4 py-2 flex items-center justify-between border-b border-neutral-800 text-[10px] font-mono text-neutral-400 select-none">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    iPad Simulator (768px)
                  </span>
                  <span>171 Studio Messina</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {previewTabPage === 'home' && <HeroHome onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'the-god-cypher' && <TheGodCypherPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'prenota-sessione' && <BookingSessionPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'chi-siamo' && <AboutPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'plugin-innovation' && <PluginsPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'strumenti-online' && <AudioToolsPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'il-mio-account' && <ClientAccountPage onNavigate={setPreviewTabPage} />}
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[390px] min-h-[820px] bg-neutral-950 rounded-[44px] border-[8px] border-neutral-800 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative ring-1 ring-amber-500/30">
                <div className="w-full bg-neutral-900 pt-2 pb-1.5 px-6 flex items-center justify-between border-b border-neutral-800 text-[10px] font-mono text-neutral-400 select-none">
                  <span className="font-bold text-white">9:41</span>
                  <div className="w-20 h-4 bg-black rounded-full" />
                  <span className="text-emerald-400 font-bold">5G 100%</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {previewTabPage === 'home' && <HeroHome onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'the-god-cypher' && <TheGodCypherPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'prenota-sessione' && <BookingSessionPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'chi-siamo' && <AboutPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'plugin-innovation' && <PluginsPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'strumenti-online' && <AudioToolsPage onNavigate={setPreviewTabPage} />}
                  {previewTabPage === 'il-mio-account' && <ClientAccountPage onNavigate={setPreviewTabPage} />}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: CMS TESTI E CONTENUTI PER TUTTE LE PAGINE */}
      {activeTab === 'cms' && (
        <form onSubmit={handleSaveCMS} className="space-y-6">
          {/* Top CMS Header & Database Sync Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Content Management System (CMS Live)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Firestore Sync: settings/cms
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  Mappatura e modifica in tempo reale di tutti i testi di Frontpage, Chi Siamo, Plugin Innovation e Prenota Sessione.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (cmsSubTab === 'frontpage') handleResetFrontpage();
                  else if (cmsSubTab === 'chi-siamo') handleResetAbout();
                  else if (cmsSubTab === 'plugin-innovation') handleResetPlugins();
                  else if (cmsSubTab === 'prenota-sessione') handleResetBooking();
                }}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                title="Ripristina i testi di fabbrica per la pagina selezionata"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Ripristina Default</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salva su Firestore</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs selector for pages */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            {[
              { id: 'frontpage', label: '1. Frontpage (Home)', icon: Sparkles },
              { id: 'chi-siamo', label: '2. Chi Siamo', icon: User },
              { id: 'plugin-innovation', label: '3. 171 Plugin Innovation', icon: Cpu },
              { id: 'prenota-sessione', label: '4. Prenota Sessione', icon: Calendar },
              { id: 'album', label: '5. Album "The God Cypher"', icon: Disc },
            ].map((sub) => {
              const SubIcon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setCmsSubTab(sub.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    cmsSubTab === sub.id
                      ? 'bg-amber-500 text-black font-extrabold shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUBTAB 1: FRONTPAGE (HOME) */}
          {cmsSubTab === 'frontpage' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Live Preview Card for Frontpage */}
              <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/90 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                      Anteprima Live Frontpage (Home)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Aggiornamento istantaneo durante la digitazione
                  </span>
                </div>

                {/* Miniature rendered home view */}
                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-center space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold uppercase tracking-widest">
                    <span>{formData.studioBadge || 'RECORDING & MASTERING SUITE'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                    {formData.studioName || '171 STUDIO'}
                  </h2>
                  <p className="text-sm font-light text-neutral-300 max-w-xl mx-auto leading-relaxed">
                    {formData.heroTagline || 'Lo studio di registrazione e mastering acusticamente trattato a Messina, con tecnologia di ripresa a feedback diretto.'}
                  </p>
                  {formData.frontpageHeroSubtitle && (
                    <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto">
                      {formData.frontpageHeroSubtitle}
                    </p>
                  )}

                  {/* Miniature Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 max-w-2xl mx-auto">
                    {(formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS).map((spec, i) => (
                      <div key={spec.id || i} className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-left">
                        <span className="text-[9px] font-mono text-amber-400 uppercase block truncate">{spec.label}</span>
                        <span className="text-xs font-semibold text-white truncate block">{spec.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* 3 Nav Cards Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left">
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">1. Chi Siamo</span>
                      <p className="text-[11px] text-neutral-300 line-clamp-2">
                        {formData.frontpageNavChiSiamoDesc || 'Scopri la filosofia acustica e lo spazio.'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-amber-500/40 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">2. Prenota Sessione</span>
                      <p className="text-[11px] text-neutral-300 line-clamp-2">
                        {formData.frontpageNavPrenotaDesc || 'Pianifica la tua sessione in studio in tempo reale.'}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">3. 171 Plugin Innovation</span>
                      <p className="text-[11px] text-neutral-300 line-clamp-2">
                        {formData.frontpageNavPluginsDesc || 'I nostri plugin DSP freeware per la tua DAW.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form: Hero Tagline & Headings */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Frontpage: Intestazione & Tagline</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Nome Studio Ufficiale
                    </label>
                    <input
                      type="text"
                      value={formData.studioName}
                      onChange={(e) => setFormData({ ...formData, studioName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Badge Sottotitolo Hero
                    </label>
                    <input
                      type="text"
                      value={formData.studioBadge}
                      onChange={(e) => setFormData({ ...formData, studioBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Tagline Hero (Testo principale sotto al logo)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.heroTagline}
                    onChange={(e) => setFormData({ ...formData, heroTagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Sottotitolo Aggiuntivo Hero (Opzionale)
                  </label>
                  <input
                    type="text"
                    value={formData.frontpageHeroSubtitle || ''}
                    placeholder="Ambiente di ripresa a feedback continuo, catena 192kHz e suite proprietaria 171 Plugin Innovatio."
                    onChange={(e) => setFormData({ ...formData, frontpageHeroSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Quick Studio Specs on Frontpage */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-400" />
                      <span>Frontpage: I Blocchi Specifiche Studio (Quick Specs)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Personalizza i riquadri di riepilogo rapido visualizzati sotto il logo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Specifica</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS).map((spec, idx) => (
                    <div key={spec.id || idx} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          Blocco #{idx + 1}
                        </span>
                        {(formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Rimuovi blocco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Etichetta Superiore (es. RECORDING ROOM)
                        </label>
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) => {
                            const newSpecs = [...(formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS)];
                            newSpecs[idx] = { ...newSpecs[idx], label: e.target.value };
                            setFormData({ ...formData, frontpageSpecs: newSpecs });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Titolo / Sottotitolo (es. Vocal & Instruments)
                        </label>
                        <input
                          type="text"
                          value={spec.title}
                          onChange={(e) => {
                            const newSpecs = [...(formData.frontpageSpecs || DEFAULT_FRONTPAGE_SPECS)];
                            newSpecs[idx] = { ...newSpecs[idx], title: e.target.value };
                            setFormData({ ...formData, frontpageSpecs: newSpecs });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Cards on Frontpage */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <span>Frontpage: Testi delle 3 Schede di Navigazione Principali</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Descrizione Scheda "Chi Siamo"
                    </label>
                    <textarea
                      rows={2}
                      value={formData.frontpageNavChiSiamoDesc || ''}
                      placeholder="Scopri la filosofia acustica, la registrazione a stretto contatto con feedback diretto e lo spazio di 171 Studio."
                      onChange={(e) => setFormData({ ...formData, frontpageNavChiSiamoDesc: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Descrizione Scheda "Prenota Sessione"
                    </label>
                    <textarea
                      rows={2}
                      value={formData.frontpageNavPrenotaDesc || ''}
                      placeholder="Pianifica la tua sessione in studio: registrazione vocale, missaggio, mastering e produzioni su misura."
                      onChange={(e) => setFormData({ ...formData, frontpageNavPrenotaDesc: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Descrizione Scheda "171 Plugin Innovation"
                    </label>
                    <textarea
                      rows={2}
                      value={formData.frontpageNavPluginsDesc || ''}
                      placeholder="I nostri plugin DSP progettati per elevare il workflow, la purezza vocale e il calore analogico del mix moderno."
                      onChange={(e) => setFormData({ ...formData, frontpageNavPluginsDesc: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Playlists */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Disc className="w-5 h-5 text-amber-400" />
                  <span>Frontpage: Playlist Spotify & YouTube ("I Nostri Lavori")</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      ID Playlist Spotify
                    </label>
                    <input
                      type="text"
                      value={formData.spotifyPlaylistId}
                      onChange={(e) => setFormData({ ...formData, spotifyPlaylistId: e.target.value.trim() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      ID Playlist YouTube
                    </label>
                    <input
                      type="text"
                      value={formData.youtubePlaylistId}
                      onChange={(e) => setFormData({ ...formData, youtubePlaylistId: e.target.value.trim() })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: CHI SIAMO */}
          {cmsSubTab === 'chi-siamo' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Live Preview Card for Chi Siamo */}
              <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/90 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                      Anteprima Live "Chi Siamo"
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Aggiornamento in tempo reale
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span>{formData.aboutBadge || 'IDENTITÀ & VISIONE SONORA'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                    {formData.aboutTitle || 'Chi Siamo'}
                  </h2>
                  <p className="text-xs sm:text-sm font-light text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                    {formData.aboutIntro || '171 Studio è il punto di riferimento a Messina per la registrazione vocale...'}
                  </p>

                  {/* Philosophy callout */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 text-left max-w-2xl mx-auto space-y-1.5">
                    <span className="text-xs font-heading font-bold text-white block">
                      {formData.aboutPhilosophyTitle || 'Registrazione nella Stessa Stanza: Il Feedback Diretto'}
                    </span>
                    <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                      {formData.aboutPhilosophy || "A 171 Studio non troverai la tradizionale cabina vocale con vetro separatore..."}
                    </p>
                  </div>

                  {/* 4 Values Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left max-w-3xl mx-auto">
                    {(formData.aboutValues || DEFAULT_PAGE_VALUES).map((val, idx) => (
                      <div key={val.id || idx} className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-1">
                        <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider block font-bold">{val.tag}</span>
                        <span className="text-xs font-heading font-bold text-white block">{val.title}</span>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{val.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bottom CTA preview */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-3xl mx-auto">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                        {formData.aboutCtaTitle || 'VUOI REGISTRARE O PARLARE DEL TUO PROGETTO?'}
                      </span>
                      <span className="text-xs text-neutral-300">
                        {formData.aboutCtaDesc || 'Vieni a trovarci in studio a Messina o prenota subito la tua sessione.'}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-500 text-black font-bold text-[10px] uppercase font-mono shrink-0">
                      Prenota Sessione
                    </span>
                  </div>
                </div>
              </div>

              {/* Form: Titles & Philosophy */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  <span>Chi Siamo: Titoli & Filosofia Acustica</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Badge Superiore
                    </label>
                    <input
                      type="text"
                      value={formData.aboutBadge || ''}
                      placeholder="IDENTITÀ & VISIONE SONORA"
                      onChange={(e) => setFormData({ ...formData, aboutBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Titolo Pagina
                    </label>
                    <input
                      type="text"
                      value={formData.aboutTitle}
                      onChange={(e) => setFormData({ ...formData, aboutTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Testo Introduttivo (Manifesto di 171 Studio)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.aboutIntro}
                    onChange={(e) => setFormData({ ...formData, aboutIntro: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Titolo Sezione Filosofia ("Registrazione nella Stessa Stanza")
                  </label>
                  <input
                    type="text"
                    value={formData.aboutPhilosophyTitle}
                    onChange={(e) => setFormData({ ...formData, aboutPhilosophyTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Descrizione Filosofia & Feedback Diretto Senza Vocal Booth
                  </label>
                  <textarea
                    rows={4}
                    value={formData.aboutPhilosophy}
                    onChange={(e) => setFormData({ ...formData, aboutPhilosophy: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Core Values / Pilastri Editor */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <span>Chi Siamo: I Valori Fondamentali (Pilastri dello Studio)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Definisci i principi cardine su acustica, trasparenza e workflow dello studio.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAboutValue}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Pilastro</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(formData.aboutValues || DEFAULT_PAGE_VALUES).map((val, idx) => (
                    <div key={val.id || idx} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          Pilastro #{idx + 1}
                        </span>
                        {(formData.aboutValues || DEFAULT_PAGE_VALUES).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAboutValue(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Rimuovi pilastro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Tag Badge (es. NESSUNA BARRIERA)
                        </label>
                        <input
                          type="text"
                          value={val.tag}
                          onChange={(e) => {
                            const newVals = [...(formData.aboutValues || DEFAULT_PAGE_VALUES)];
                            newVals[idx] = { ...newVals[idx], tag: e.target.value };
                            setFormData({ ...formData, aboutValues: newVals });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Titolo del Valore
                        </label>
                        <input
                          type="text"
                          value={val.title}
                          onChange={(e) => {
                            const newVals = [...(formData.aboutValues || DEFAULT_PAGE_VALUES)];
                            newVals[idx] = { ...newVals[idx], title: e.target.value };
                            setFormData({ ...formData, aboutValues: newVals });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Descrizione Estesa
                        </label>
                        <textarea
                          rows={3}
                          value={val.description}
                          onChange={(e) => {
                            const newVals = [...(formData.aboutValues || DEFAULT_PAGE_VALUES)];
                            newVals[idx] = { ...newVals[idx], description: e.target.value };
                            setFormData({ ...formData, aboutValues: newVals });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA & Contacts in Chi Siamo */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-400" />
                  <span>Chi Siamo: Banner CTA Inferiore & Recapiti</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Titolo Banner CTA
                    </label>
                    <input
                      type="text"
                      value={formData.aboutCtaTitle || ''}
                      placeholder="VUOI REGISTRARE O PARLARE DEL TUO PROGETTO?"
                      onChange={(e) => setFormData({ ...formData, aboutCtaTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Descrizione Banner CTA
                    </label>
                    <input
                      type="text"
                      value={formData.aboutCtaDesc || ''}
                      placeholder="Vieni a trovarci in studio a Messina o prenota subito la tua sessione."
                      onChange={(e) => setFormData({ ...formData, aboutCtaDesc: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Email Ufficiale Studio
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Telefono / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Indirizzo & Città
                    </label>
                    <input
                      type="text"
                      value={formData.contactAddress}
                      onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: 171 PLUGIN INNOVATIO */}
          {cmsSubTab === 'plugin-innovation' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Live Preview Card for 171 Plugin Innovation */}
              <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/90 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                      Anteprima Live "171 Plugin Innovation"
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Aggiornamento in tempo reale
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span>{formData.pluginIntroBadge || 'SOFTWARE DSP & INGEGNERIA AUDIO • 100% FREEWARE'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                    {formData.pluginIntroTitle || '171 Plugin Innovatio'}
                  </h2>
                  <p className="text-xs sm:text-sm font-light text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                    {formData.pluginIntroSubtitle || "I nostri plugin audio di nuova generazione: strumenti digitali proprietari gratuiti..."}
                  </p>

                  {/* Manifesto R&D Box */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 text-left max-w-2xl mx-auto space-y-1.5">
                    <span className="text-xs font-heading font-bold text-white block">
                      {formData.pluginAboutSectionTitle || "Cos'è 171 Plugin Innovatio"}
                    </span>
                    <p className="text-[11px] text-neutral-300 font-light leading-relaxed">
                      {formData.pluginAboutSectionText1 || "171 Plugin Innovatio è la divisione di ricerca e sviluppo software di 171 Studio..."}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-light leading-relaxed pt-1 border-t border-neutral-800/80">
                      {formData.pluginAboutSectionText2 || 'Il nostro è un progetto gratuito e rimarrà sempre tale...'}
                    </p>
                  </div>

                  {/* 4 Benefits Preview */}
                  <div className="pt-2 text-left max-w-3xl mx-auto space-y-2">
                    <span className="text-xs font-mono uppercase text-neutral-400 block font-bold text-center">
                      {formData.pluginBenefitsTitle || 'Quali Benefici Offrono i Nostri Plugin'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS).map((ben, idx) => (
                        <div key={ben.id || idx} className="p-3.5 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-1">
                          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider block font-bold">{ben.tag}</span>
                          <span className="text-xs font-heading font-bold text-white block">{ben.title}</span>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{ben.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form: Titles & Intro */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400" />
                  <span>171 Plugin Innovation: Titoli & Presentazione</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Badge Superiore
                    </label>
                    <input
                      type="text"
                      value={formData.pluginIntroBadge || ''}
                      placeholder="SOFTWARE DSP & INGEGNERIA AUDIO • 100% FREEWARE"
                      onChange={(e) => setFormData({ ...formData, pluginIntroBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Titolo Principale
                    </label>
                    <input
                      type="text"
                      value={formData.pluginIntroTitle || ''}
                      placeholder="171 Plugin Innovatio"
                      onChange={(e) => setFormData({ ...formData, pluginIntroTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Sottotitolo / Descrizione Generale
                  </label>
                  <textarea
                    rows={3}
                    value={formData.pluginIntroSubtitle || ''}
                    placeholder="I nostri plugin audio di nuova generazione: strumenti digitali proprietari gratuiti concepiti e calibrati all'interno di 171 Studio per offrire una qualità da studio professionale direttamente nella tua DAW."
                    onChange={(e) => setFormData({ ...formData, pluginIntroSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Sezione Cos'è 171 Plugin Innovatio */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>Sezione "Cos'è 171 Plugin Innovatio" (Manifesto R&D)</span>
                </h3>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Titolo del Riquadro
                  </label>
                  <input
                    type="text"
                    value={formData.pluginAboutSectionTitle || ''}
                    placeholder="Cos'è 171 Plugin Innovatio"
                    onChange={(e) => setFormData({ ...formData, pluginAboutSectionTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Paragrafo 1: Origine & Ricerca del Suono Analogico
                  </label>
                  <textarea
                    rows={3}
                    value={formData.pluginAboutSectionText1 || ''}
                    placeholder="171 Plugin Innovatio è la divisione di ricerca e sviluppo software di 171 Studio..."
                    onChange={(e) => setFormData({ ...formData, pluginAboutSectionText1: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Paragrafo 2: Filosofia Freeware & Invito al Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={formData.pluginAboutSectionText2 || ''}
                    placeholder="Il nostro è un progetto gratuito e rimarrà sempre tale..."
                    onChange={(e) => setFormData({ ...formData, pluginAboutSectionText2: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Benefici Plugin */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-400" />
                      <span>I Vantaggi Competitivi dei Nostri Plugin</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Evidenzia le prestazioni DSP a zero latenza e il calore sonoro.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPluginBenefit}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Vantaggio</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Titolo Sezione Benefici
                  </label>
                  <input
                    type="text"
                    value={formData.pluginBenefitsTitle || ''}
                    placeholder="Quali Benefici Offrono i Nostri Plugin"
                    onChange={(e) => setFormData({ ...formData, pluginBenefitsTitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS).map((ben, idx) => (
                    <div key={ben.id || idx} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          Vantaggio #{idx + 1}
                        </span>
                        {(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePluginBenefit(idx)}
                            className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                            title="Rimuovi vantaggio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Tag Badge (es. ANALOG TONE DSP)
                        </label>
                        <input
                          type="text"
                          value={ben.tag}
                          onChange={(e) => {
                            const newBens = [...(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS)];
                            newBens[idx] = { ...newBens[idx], tag: e.target.value };
                            setFormData({ ...formData, pluginBenefits: newBens });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Titolo Vantaggio
                        </label>
                        <input
                          type="text"
                          value={ben.title}
                          onChange={(e) => {
                            const newBens = [...(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS)];
                            newBens[idx] = { ...newBens[idx], title: e.target.value };
                            setFormData({ ...formData, pluginBenefits: newBens });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-neutral-500 mb-1">
                          Descrizione Tecnica
                        </label>
                        <textarea
                          rows={3}
                          value={ben.desc}
                          onChange={(e) => {
                            const newBens = [...(formData.pluginBenefits || DEFAULT_PLUGIN_BENEFITS)];
                            newBens[idx] = { ...newBens[idx], desc: e.target.value };
                            setFormData({ ...formData, pluginBenefits: newBens });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: PRENOTA SESSIONE */}
          {cmsSubTab === 'prenota-sessione' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Live Preview Card for Prenota Sessione */}
              <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/90 border border-amber-500/30 backdrop-blur-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider">
                      Anteprima Live "Prenota Sessione"
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Aggiornamento in tempo reale
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span>{formData.bookingBadge || 'BOOKING ONLINE IN TEMPO REALE'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
                    {formData.bookingTitle || 'Prenota la tua Sessione'}
                  </h2>
                  <p className="text-xs sm:text-sm font-light text-neutral-300 max-w-xl mx-auto leading-relaxed">
                    {formData.bookingSubtitle || 'Seleziona la durata con la barra oraria, scegli la tua fascia preferita (pomeriggio o sera)...'}
                  </p>

                  {/* Notes Placeholder Preview */}
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-left max-w-xl mx-auto space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Campo Note Artista:</span>
                    <span className="text-xs text-neutral-400 italic block">
                      "{formData.bookingNotesPlaceholder || 'Descrivi il genere musicale, se porti una base tua, link provini/demo o esigenze particolari...'}"
                    </span>
                  </div>

                  {/* Payment notice preview */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left max-w-xl mx-auto flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200">
                      {formData.bookingPaymentNotice || "Paga prima di arrivare in studio con PayPal oppure salda direttamente in studio al termine della sessione."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form: Prenota Sessione Fields */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Prenota Sessione: Titoli & Istruzioni per gli Artisti</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Badge Superiore
                    </label>
                    <input
                      type="text"
                      value={formData.bookingBadge || ''}
                      placeholder="BOOKING ONLINE IN TEMPO REALE"
                      onChange={(e) => setFormData({ ...formData, bookingBadge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Titolo Pagina
                    </label>
                    <input
                      type="text"
                      value={formData.bookingTitle || ''}
                      placeholder="Prenota la tua Sessione"
                      onChange={(e) => setFormData({ ...formData, bookingTitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Sottotitolo / Istruzioni di Prenotazione
                  </label>
                  <textarea
                    rows={2}
                    value={formData.bookingSubtitle || ''}
                    placeholder="Seleziona la durata con la barra oraria, scegli la tua fascia preferita (pomeriggio o sera) e prenota il tuo slot ideale tra le 15:00 e le 20:00."
                    onChange={(e) => setFormData({ ...formData, bookingSubtitle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Placeholder Campo "Note Aggiuntive"
                  </label>
                  <input
                    type="text"
                    value={formData.bookingNotesPlaceholder || ''}
                    placeholder="Descrivi il genere musicale, se porti una base tua, link provini/demo o esigenze particolari..."
                    onChange={(e) => setFormData({ ...formData, bookingNotesPlaceholder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Avviso Condizioni Pagamento & PayPal
                  </label>
                  <input
                    type="text"
                    value={formData.bookingPaymentNotice || ''}
                    placeholder="Paga prima di arrivare in studio con PayPal oppure salda direttamente in studio al termine della sessione."
                    onChange={(e) => setFormData({ ...formData, bookingPaymentNotice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 5: ALBUM "THE GOD CYPHER" & AUDIO PLAYER */}
          {cmsSubTab === 'album' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      <Disc className="w-5 h-5 text-amber-400" />
                      <span>Album Ufficiale: "The God Cypher" (In Riproduzione Continua)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-1">
                      Sostituisce il vecchio ronzio del VU Meter con la riproduzione continua dell'album a ripetizione.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold">
                    RIPRODUZIONE A RIPETIZIONE ATTIVA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Titolo Album
                    </label>
                    <input
                      type="text"
                      value={formData.albumPlayer?.albumTitle || 'The God Cypher'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          albumPlayer: {
                            ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                            albumTitle: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                      Artista / Collettivo
                    </label>
                    <input
                      type="text"
                      value={formData.albumPlayer?.albumArtist || '171 Studio'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          albumPlayer: {
                            ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                            albumArtist: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                    Sottotitolo / Note Album
                  </label>
                  <input
                    type="text"
                    value={formData.albumPlayer?.albumSubtitle || ''}
                    placeholder="Album Ufficiale 171 Studio — In Riproduzione Continua a Ripetizione"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        albumPlayer: {
                          ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                          albumSubtitle: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Tracklist Manager for The God Cypher */}
              <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                      <Music className="w-5 h-5 text-amber-400" />
                      <span>Tracklist di "The God Cypher" ({(formData.albumPlayer?.tracks || []).length} Tracce)</span>
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Puoi personalizzare i titoli delle tracce e inserire link audio diretti (.mp3/.wav/stream) se disponibili.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const curTracks = formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS;
                      const newTrack: AlbumTrack = {
                        id: `tgc-${Date.now()}`,
                        title: `Nuova Traccia ${curTracks.length + 1}`,
                        artist: formData.albumPlayer?.albumArtist || '171 Studio',
                        duration: '3:00',
                        bpm: 92,
                      };
                      setFormData({
                        ...formData,
                        albumPlayer: {
                          ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                          tracks: [...curTracks, newTrack],
                        },
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi Traccia</span>
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {(formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS).map((trk: AlbumTrack, idx: number) => (
                    <div
                      key={trk.id || idx}
                      className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          Traccia #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const curTracks = formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS;
                            if (curTracks.length <= 1) return;
                            const filtered = curTracks.filter((_: AlbumTrack, i: number) => i !== idx);
                            setFormData({
                              ...formData,
                              albumPlayer: {
                                ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                                tracks: filtered,
                              },
                            });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Rimuovi traccia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">
                            Titolo Traccia
                          </label>
                          <input
                            type="text"
                            value={trk.title}
                            onChange={(e) => {
                              const curTracks = [...(formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS)];
                              curTracks[idx] = { ...curTracks[idx], title: e.target.value };
                              setFormData({
                                ...formData,
                                albumPlayer: {
                                  ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                                  tracks: curTracks,
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">
                            Artista
                          </label>
                          <input
                            type="text"
                            value={trk.artist}
                            onChange={(e) => {
                              const curTracks = [...(formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS)];
                              curTracks[idx] = { ...curTracks[idx], artist: e.target.value };
                              setFormData({
                                ...formData,
                                albumPlayer: {
                                  ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                                  tracks: curTracks,
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-neutral-500 mb-1">
                            Durata (es. 3:18)
                          </label>
                          <input
                            type="text"
                            value={trk.duration}
                            onChange={(e) => {
                              const curTracks = [...(formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS)];
                              curTracks[idx] = { ...curTracks[idx], duration: e.target.value };
                              setFormData({
                                ...formData,
                                albumPlayer: {
                                  ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                                  tracks: curTracks,
                                },
                              });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 mb-1">
                          Link File Audio / Stream MP3 (Opzionale, altrimenti usa il generatore audio cypher nativo)
                        </label>
                        <input
                          type="url"
                          placeholder="https://... o lascia vuoto per motore cypher autentico"
                          value={trk.audioUrl || ''}
                          onChange={(e) => {
                            const curTracks = [...(formData.albumPlayer?.tracks || DEFAULT_ALBUM_TRACKS)];
                            curTracks[idx] = { ...curTracks[idx], audioUrl: e.target.value.trim() || undefined };
                            setFormData({
                              ...formData,
                              albumPlayer: {
                                ...(formData.albumPlayer || DEFAULT_ALBUM_CONFIG),
                                tracks: curTracks,
                              },
                            });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Persistent Global Save Button at bottom of CMS */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/40 backdrop-blur-md sticky bottom-4 z-20 shadow-2xl">
            <span className="text-xs font-mono text-neutral-300">
              Modifiche in corso su <strong className="text-amber-400 uppercase">{cmsSubTab}</strong>. Clicca per sincronizzare:
            </span>
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Salva e Pubblica Tutti i Contenuti su Firestore</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TARIFFE & PAYPAL BUILDER */}
      {activeTab === 'pricing' && (
        <form onSubmit={handleSaveCMS} className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>Configurazione Pagamenti PayPal & Saldo Anticipato</span>
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Gli utenti possono saldare la sessione prima di arrivare in studio con PayPal.
                </p>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                PAYPAL ATTIVO
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-amber-400 font-bold mb-1.5">
                  Account PayPal Beneficiario (per ricezione pagamenti delle sessioni)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={formData.paypalEmail}
                    onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value.trim() })}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white font-mono focus:border-amber-400 outline-none"
                    placeholder="vkrealhakiesake@gmail.com"
                  />
                  <a
                    href={getPayPalPaymentUrl(50, '171-TEST', formData.paypalEmail || STUDIO_PAYPAL_EMAIL)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-200 hover:text-white flex items-center justify-center gap-2 transition-all border border-neutral-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Testa Link Checkout (50€)</span>
                  </a>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono mt-1 block">
                  Le richieste di pagamento generate nelle email e nella pagina di conferma punteranno automaticamente a questo account.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div>
                  <h4 className="text-base font-heading font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Listino Completo Prezzi & Tariffe di Tutti i Prodotti (8 Prodotti / Pacchetti)</span>
                  </h4>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">
                    Modifica il prezzo di qualsiasi servizio o pacchetto: i calcoli del preventivo, la barra oraria e il listino pubblico si aggiorneranno all'istante.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const resetPrices = {
                      hourlyRecordingPrice: 25,
                      mixMasterPrice: 50,
                      soloMasterPrice: 40,
                      soloMixOnlinePrice: 60,
                      branoCompletoNonEsclusivoPrice: 150,
                      branoCompletoEsclusivoPrice: 200,
                      produzioneNonEsclusivaPrice: 50,
                      produzioneEsclusivaPrice: 150,
                      beatProductionPrice: 150,
                    };
                    setFormData({ ...formData, ...resetPrices });
                    updateSiteContent(resetPrices);
                    setDeskActionNotice('Prezzi di tutti i prodotti ripristinati ai valori standard di 171 Studio!');
                    setTimeout(() => setDeskActionNotice(null), 4000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ripristina Prezzi Default</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Sessione di Registrazione (Tariffa Oraria) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                        1. RECORDING
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Oraria</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Sessione di Registrazione (Tariffa Oraria Studio)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Registrazione vocale o strumentale (vale anche come tariffa oraria per ore extra).
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.hourlyRecordingPrice ?? 25}
                      onChange={(e) => setFormData({ ...formData, hourlyRecordingPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-amber-400 text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-neutral-300">€ / ora</span>
                  </div>
                </div>

                {/* 2. Mix & Master in Studio */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        2. MIX & MASTER
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Base + Ore</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Mix & Master in Studio (Quota Base)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Quota base Mix & Master a cui si sommano le ore di studio ({formData.hourlyRecordingPrice ?? 25}€/h).
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.mixMasterPrice ?? 50}
                      onChange={(e) => setFormData({ ...formData, mixMasterPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ + {formData.hourlyRecordingPrice ?? 25}€/h</span>
                  </div>
                </div>

                {/* 3. Solo Master */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        3. MASTERING
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Fisso</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Solo Master Traccia
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Finalizzazione professionale, bilanciamento dinamico e loudness streaming/radio.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.soloMasterPrice ?? 40}
                      onChange={(e) => setFormData({ ...formData, soloMasterPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ a brano</span>
                  </div>
                </div>

                {/* 4. Solo Mix Online */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                        4. MIX ONLINE
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Fisso</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Solo Mix Online
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Missaggio completo con stems inviati online e revisioni concordate a distanza.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.soloMixOnlinePrice ?? 60}
                      onChange={(e) => setFormData({ ...formData, soloMixOnlinePrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ a brano</span>
                  </div>
                </div>

                {/* 5. Brano Completo (Base Non Esclusiva) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                        5. PACCHETTO BRANO
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">3h REC incl.</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Brano Completo (Base Non Esclusiva)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Base non esclusiva, 3 ore di registrazione in studio, Mix & Master inclusi.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.branoCompletoNonEsclusivoPrice ?? 150}
                      onChange={(e) => setFormData({ ...formData, branoCompletoNonEsclusivoPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ (3h REC incl.)</span>
                  </div>
                </div>

                {/* 6. Brano Completo (Base Esclusiva) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold">
                        6. PACCHETTO VIP
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">3h REC incl.</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Brano Completo (Base Esclusiva Totale)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Base in esclusiva totale al 100%, 3 ore di REC, Mix & Master definitivi.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.branoCompletoEsclusivoPrice ?? 200}
                      onChange={(e) => setFormData({ ...formData, branoCompletoEsclusivoPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ (3h REC incl.)</span>
                  </div>
                </div>

                {/* 7. Produzione Beat / Base (Diritti senza Esclusiva) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                        7. PRODUZIONE BEAT
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">No Esclusiva</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Produzione Beat / Base (Senza Esclusiva)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Creazione e licenza di produzione musicale con diritti di pubblicazione non esclusivi.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.produzioneNonEsclusivaPrice ?? 50}
                      onChange={(e) => setFormData({ ...formData, produzioneNonEsclusivaPrice: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ / beat</span>
                  </div>
                </div>

                {/* 8. Produzione Beat / Base (Esclusiva Totale) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                        8. BEAT ESCLUSIVO
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">Esclusiva 100%</span>
                    </div>
                    <label className="block text-xs font-heading font-bold text-white mt-1.5">
                      Produzione Beat / Base (Esclusiva Totale)
                    </label>
                    <span className="text-[11px] text-neutral-400 font-light mt-1 block">
                      Produzione su misura creata ad hoc con cessione dei diritti in esclusiva assoluta.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-neutral-900">
                    <input
                      type="number"
                      min={1}
                      value={formData.produzioneEsclusivaPrice ?? formData.beatProductionPrice ?? 150}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData,
                          produzioneEsclusivaPrice: val,
                          beatProductionPrice: val,
                        });
                      }}
                      className="w-24 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-amber-400 text-lg font-bold text-white text-center outline-none font-mono"
                    />
                    <span className="text-xs font-mono text-amber-400">€ / esclusiva</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-800">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salva Prezzi di Tutti i Prodotti & PayPal</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB: VOUCHER, CODICI SCONTO & SCONTO 5% REGISTRAZIONE */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          {/* 5% Automatic Registration Discount Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/40 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    PROMOZIONE AUTOMATICA NUOVI REGISTRATI
                  </span>
                  <h3 className="text-xl font-heading font-bold text-white">
                    Sconto Benvenuto alla Registrazione ({siteContent.registrationDiscountPercent ?? 5}%)
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Ogni cliente che si registra sul sito riceve automaticamente nel proprio account il codice sconto applicabile in fase di prenotazione.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = siteContent.registrationDiscountEnabled === false ? true : false;
                  updateSiteContent({ registrationDiscountEnabled: nextState });
                  setDeskActionNotice(
                    nextState
                      ? 'Sconto automatico alla registrazione ATTIVATO!'
                      : 'Sconto automatico alla registrazione DISATTIVATO.'
                  );
                  setTimeout(() => setDeskActionNotice(null), 4000);
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  siteContent.registrationDiscountEnabled !== false
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white'
                }`}
              >
                {siteContent.registrationDiscountEnabled !== false ? '● ATTIVO (CLICCA PER DISATTIVARE)' : '○ DISATTIVATO (CLICCA PER ATTIVARE)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                  Codice Sconto Registrazione
                </label>
                <input
                  type="text"
                  value={formData.registrationDiscountCode || siteContent.registrationDiscountCode || 'BENVENUTO5'}
                  onChange={(e) => setFormData({ ...formData, registrationDiscountCode: e.target.value.toUpperCase().trim() })}
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono font-bold text-amber-400 uppercase focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1.5">
                  Percentuale Sconto (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={formData.registrationDiscountPercent ?? siteContent.registrationDiscountPercent ?? 5}
                    onChange={(e) => setFormData({ ...formData, registrationDiscountPercent: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono font-bold text-white focus:border-amber-400 outline-none"
                  />
                  <span className="text-amber-400 font-mono font-bold">%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newCode = (formData.registrationDiscountCode || 'BENVENUTO5').toUpperCase().trim();
                  const newPct = Number(formData.registrationDiscountPercent) || 5;
                  const updatedVouchers = (siteContent.vouchers || []).map((v) =>
                    v.isRegistrationVoucher || v.isRegistrationWelcome || v.id === 'vch-welcome-5'
                      ? {
                          ...v,
                          code: newCode,
                          discountValue: newPct,
                          title: `Sconto Benvenuto Registrazione (-${newPct}%)`,
                          description: `Sconto Benvenuto ${newPct}% automatico alla registrazione su tutte le sessioni e prodotti`,
                        }
                      : v
                  );
                  updateSiteContent({
                    registrationDiscountCode: newCode,
                    registrationDiscountPercent: newPct,
                    vouchers: updatedVouchers,
                  });
                  setDeskActionNotice(`Impostazioni Sconto Registrazione (${newCode} -${newPct}%) aggiornate!`);
                  setTimeout(() => setDeskActionNotice(null), 4000);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salva Sconto Registrazione</span>
              </button>
            </div>
          </div>

          {/* Product Vouchers & Custom Discount Codes */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <span>Gestione Voucher & Codici Sconto sui Prodotti</span>
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Crea voucher personalizzati (in % o in €) validi su tutti i servizi o su prodotti specifici (es. Mix & Master, Beat Esclusivo, Registrazione).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddVoucher(!showAddVoucher)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crea Nuovo Voucher Sconto</span>
              </button>
            </div>

            {showAddVoucher && (
              <form onSubmit={handleCreateVoucher} className="p-6 rounded-2xl bg-neutral-950 border border-amber-500/40 space-y-4">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold block">
                  Nuovo Codice Sconto / Voucher Promozionale
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Codice Voucher *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. ESTATE15, BEAT20"
                      value={newVoucherCode}
                      onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-mono font-bold text-amber-400 uppercase outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Nome / Titolo Promo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Promo Mix & Master"
                      value={newVoucherTitle}
                      onChange={(e) => setNewVoucherTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Tipo di Sconto
                    </label>
                    <select
                      value={newVoucherType}
                      onChange={(e) => setNewVoucherType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white outline-none focus:border-amber-400"
                    >
                      <option value="percentage">Percentuale (%)</option>
                      <option value="fixed">Importo Fisso (€)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Valore Sconto ({newVoucherType === 'percentage' ? '%' : '€'}) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={newVoucherValue}
                      onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-mono font-bold text-emerald-400 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Descrizione per il Cliente
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Sconto valido sulle sessioni di Mix & Master"
                      value={newVoucherDesc}
                      onChange={(e) => setNewVoucherDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                      Spesa Minima Ordine (€ - Opzionale)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newVoucherMinOrder}
                      onChange={(e) => setNewVoucherMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                    Prodotti / Servizi su cui è Applicabile lo Sconto:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setNewVoucherApplicableProducts(['all'])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                        newVoucherApplicableProducts.includes('all')
                          ? 'bg-amber-500 text-black font-bold border-amber-400'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      ✓ Tutti i Prodotti & Servizi
                    </button>

                    {SERVICE_OPTIONS.map((srv) => {
                      const isSelected = newVoucherApplicableProducts.includes(srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            const withoutAll = newVoucherApplicableProducts.filter((p) => p !== 'all');
                            if (withoutAll.includes(srv.id)) {
                              const next = withoutAll.filter((p) => p !== srv.id);
                              setNewVoucherApplicableProducts(next.length > 0 ? next : ['all']);
                            } else {
                              setNewVoucherApplicableProducts([...withoutAll, srv.id]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-black font-bold border-amber-400'
                              : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                          }`}
                        >
                          {srv.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Destinatario Account & Opzione Monouso (Sconti Personalizzati) */}
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Destinatario Sconto Personalizzato & Limiti Account</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                        Assegna a un Account Specifico
                      </label>
                      <select
                        value={newVoucherRecipientType === 'all' ? 'all' : (registeredUsers.some(u => u.email.toLowerCase() === newVoucherAssignedEmail.toLowerCase()) ? newVoucherAssignedEmail : 'custom')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'all') {
                            setNewVoucherRecipientType('all');
                            setNewVoucherAssignedEmail('');
                          } else if (val === 'custom') {
                            setNewVoucherRecipientType('specific');
                            setNewVoucherAssignedEmail('');
                          } else {
                            setNewVoucherRecipientType('specific');
                            setNewVoucherAssignedEmail(val);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-white outline-none focus:border-amber-400"
                      >
                        <option value="all">🌐 Tutti gli Account (Voucher Pubblico)</option>
                        {registeredUsers.length > 0 && (
                          <optgroup label="Clienti Registrati">
                            {registeredUsers.map((u) => (
                              <option key={u.email} value={u.email}>
                                👤 {u.name} ({u.email})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <option value="custom">✏️ Inserisci un'altra email a mano...</option>
                      </select>
                    </div>

                    {newVoucherRecipientType === 'specific' && (
                      <div>
                        <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                          Email Account Cliente Riservatario *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="cliente@esempio.com"
                          value={newVoucherAssignedEmail}
                          onChange={(e) => setNewVoucherAssignedEmail(e.target.value.toLowerCase().trim())}
                          className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-amber-500/50 text-xs font-mono text-amber-300 outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newVoucherSingleUse}
                        onChange={(e) => setNewVoucherSingleUse(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-950 border-neutral-700"
                      />
                      <span className="text-xs font-mono text-neutral-300">
                        <strong>Monouso per account:</strong> utilizzabile 1 sola volta da ciascun account cliente
                      </span>
                    </label>

                    {newVoucherRecipientType === 'specific' && newVoucherAssignedEmail && (
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/40 font-bold">
                        🔒 Non trasferibile: vincolato a {newVoucherAssignedEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVoucher(false)}
                    className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase cursor-pointer"
                  >
                    Salva & Attiva Voucher
                  </button>
                </div>
              </form>
            )}

            {/* Existing Vouchers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(siteContent.vouchers || []).map((v) => {
                const products =
                  Array.isArray(v.applicableProducts) && v.applicableProducts.length > 0
                    ? v.applicableProducts
                    : v.targetProduct
                    ? [v.targetProduct]
                    : ['all'];
                const isPercentage = v.discountType === 'percentage' || v.discountType === 'percent';
                const isWelcomeVoucher = Boolean(v.isRegistrationVoucher || v.isRegistrationWelcome);
                const isPersonalized = Boolean(v.assignedToEmail);

                return (
                  <div
                    key={v.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                      v.active
                        ? isPersonalized
                          ? 'bg-neutral-950/90 border-purple-500/40 shadow-lg shadow-purple-500/5'
                          : 'bg-neutral-950/90 border-amber-500/40'
                        : 'bg-neutral-950/40 border-neutral-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-sm font-black tracking-wider">
                            {v.code}
                          </span>
                          {isWelcomeVoucher && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-mono uppercase font-bold">
                              ★ Benvenuto
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-heading font-black text-emerald-400">
                          {isPercentage ? `-${v.discountValue}%` : `-${v.discountValue} €`}
                        </span>
                      </div>

                      <h4 className="text-sm font-heading font-bold text-white mb-1">
                        {v.title || (isWelcomeVoucher ? `Sconto Benvenuto (-${v.discountValue}%)` : `Voucher ${v.code}`)}
                      </h4>
                      <p className="text-xs text-neutral-400 font-light mb-3">
                        {v.description}
                      </p>

                      <div className="text-[11px] font-mono text-neutral-400 space-y-2">
                        {/* Target Account Badge */}
                        <div className="pt-1">
                          {isPersonalized ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px]">
                              <User className="w-3 h-3 text-purple-400" />
                              <span>Riservato: <strong>{v.assignedToEmail}</strong></span>
                              <span className="text-[9px] text-purple-400 font-bold">(Non trasferibile)</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px]">
                              <Globe className="w-3 h-3 text-neutral-500" />
                              <span>Valido per tutti i clienti</span>
                            </div>
                          )}
                        </div>

                        <div>
                          Prodotti:{' '}
                          <span className="text-neutral-200">
                            {products.includes('all')
                              ? 'Tutti i Servizi & Prodotti'
                              : products
                                  .map((pid) => SERVICE_OPTIONS.find((s) => s.id === pid)?.title || pid)
                                  .join(', ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span>
                            Regola:{' '}
                            <strong className={v.singleUsePerAccount ? 'text-amber-400' : 'text-neutral-300'}>
                              {v.singleUsePerAccount ? 'Monouso per account (1 volta)' : 'Utilizzi multipli'}
                            </strong>
                          </span>
                          {v.minOrderAmount ? (
                            <span>Min: <strong className="text-amber-300">{v.minOrderAmount} €</strong></span>
                          ) : null}
                        </div>

                        <div className="pt-1 border-t border-neutral-800/80">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Utilizzi registrati:</span>
                            <span className="text-emerald-400 font-bold">{v.usageCount || 0}</span>
                          </div>
                          {v.usedByEmails && v.usedByEmails.length > 0 && (
                            <div className="mt-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                              <span className="text-neutral-500 block mb-0.5 font-bold uppercase text-[9px]">Riscattato da ({v.usedByEmails.length}):</span>
                              <span className="text-emerald-300 break-all">{v.usedByEmails.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => updateVoucher(v.id, { active: !v.active })}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase cursor-pointer ${
                          v.active
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {v.active ? '✓ Attivo' : 'Disattivato'}
                      </button>

                      {!isWelcomeVoucher && (
                        <button
                          type="button"
                          onClick={() => deleteVoucher(v.id)}
                          className="p-2 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-red-400 transition-colors cursor-pointer"
                          title="Elimina Voucher"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB: GESTIONE ORARI & IMPEGNI CALENDARIO */}
      {activeTab === 'calendar' && (
        <MasterCalendarControl />
      )}

      {/* TAB 3: DESK PRENOTAZIONI OPERATIVO (SOLO NUOVE IN ATTESA) */}
      {activeTab === 'desk' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xl font-heading font-bold text-white">
                  Desk Prenotazioni Operativo (Nuove Richieste)
                </h3>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Le sessioni appena prenotate arrivano qui. Una volta <strong className="text-emerald-400">confermate</strong> o <strong className="text-red-400">annullate</strong>, vengono rimosse dal desk e spostate automaticamente nello <strong>Storico & Archivio</strong> assieme all'invio email e alla sincronizzazione con Google Calendar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddDirectSession(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuova Sessione Fuori Sito</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Vai allo Storico ({historicalBookings.length})</span>
              </button>
            </div>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-heading font-bold text-white">
                  Desk Operativo Pulito
                </h4>
                <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto mt-1">
                  Non ci sono prenotazioni in attesa di decisione. Tutte le sessioni precedentemente confermate o annullate sono archiviate nello Storico Completo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>Consulta Storico Sessioni ({historicalBookings.length})</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((b) => {
                const paypalCheckoutUrl = b.paypalPaymentUrl || getPayPalPaymentUrl(b.estimatedPrice, b.orderCode || b.id, siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL);
                const orderCodeDisplay = b.orderCode || `#${b.id.slice(-6).toUpperCase()}`;

                return (
                  <div 
                    key={b.id}
                    className="p-6 rounded-3xl bg-neutral-900/90 border border-amber-500/50 hover:border-amber-400 shadow-xl shadow-amber-500/5 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />

                    <div className="space-y-2.5 flex-1 pl-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-heading font-bold text-lg text-white">
                          {b.userName}
                        </span>
                        
                        <span className="px-2.5 py-0.5 rounded-md bg-neutral-950 text-amber-300 font-mono text-xs border border-amber-500/40 font-bold">
                          {orderCodeDisplay}
                        </span>

                        <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
                          In Attesa di Revisione
                        </span>

                        <span className="text-[10px] font-mono text-neutral-400">
                          Ricevuta il: {new Date(b.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-300 font-mono space-y-1.5 bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p><span className="text-neutral-500">Servizio:</span> <strong className="text-amber-400">{b.serviceTitle}</strong></p>
                          <p><span className="text-neutral-500">Data & Orario:</span> <span className="text-white font-semibold">{b.date} alle {b.time}</span> ({b.hours} ore)</p>
                          <p><span className="text-neutral-500">Email:</span> <span className="text-neutral-200">{b.userEmail}</span></p>
                          <p><span className="text-neutral-500">Telefono:</span> <span className="text-neutral-200">{b.userPhone || 'Non specificato'}</span></p>
                        </div>

                        <div className="pt-2 border-t border-neutral-900 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="text-neutral-500">Tariffa Calcolata:</span>{' '}
                            <strong className="text-emerald-400 font-bold text-base">{b.estimatedPrice} €</strong>
                          </div>
                          <span className="text-[11px] text-amber-400 font-mono">
                            Destinatario PayPal: {siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}
                          </span>
                        </div>

                        {b.notes && (
                          <p className="pt-1 text-neutral-300 italic border-t border-neutral-900/60 mt-1">
                            Note progetto: "{b.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Desk Immediate Actions: Conferma (moves to Storico) or Annulla (moves to Storico) */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 w-full lg:w-auto shrink-0">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleConfirmFromDesk(b)}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                          title="Conferma la prenotazione, invia l'email con codice ordine e link PayPal, sincronizza su Google Calendar e sposta nello Storico"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Conferma Disponibilità & Invia Email</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelFromDesk(b)}
                          className="px-3.5 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/40 text-xs font-mono uppercase transition-all cursor-pointer"
                          title="Rifiuta o annulla la prenotazione e spostala nello Storico"
                        >
                          Annulla
                        </button>
                      </div>

                      {/* Quick copy PayPal & View full Dossier */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paypalCheckoutUrl, b.id)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-neutral-800 text-xs font-mono flex items-center gap-1.5 transition-all"
                          title="Copia link pagamento PayPal"
                        >
                          {copiedOrderId === b.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copiato!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>PayPal ({b.estimatedPrice}€)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBookingForDrive(b);
                            setDriveFormRecipientEmail(b.userEmail);
                            setDriveFormRecipientName(b.userName);
                            setDriveFormOrderCode(b.orderCode);
                            setDriveFormFileName(b.driveDeliveryTitle || `${b.serviceTitle} - Master WAV 24bit.zip`);
                            setDriveFormUrl(b.driveDeliveryUrl || '');
                            setDriveFormNotes(b.driveDeliveryNotes || `Master finale sessione #${b.orderCode} (Igor Rozanov - 171 Studio)`);
                            setActiveTab('deliveries');
                            setShowAddDriveDelivery(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Invia file tramite link Google Drive con notifica di conferma download"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>{b.driveDeliveryUrl ? 'Drive Collegato' : '+ Invia Drive'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedBookingDossier(b)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Apri scheda dettagliata cliente"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </div>

                      {/* 1-Click Fast Actions for Email & Calendar */}
                      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => openGmailWebCompose(b.id, 'receipt')}
                          className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-blue-300 border border-neutral-800 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Apri email di ricezione/preventivo già compilata su Gmail Web"
                        >
                          <Mail className="w-3 h-3 text-blue-400" />
                          <span>Gmail Ricevuta</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openGoogleCalendarWeb(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-neutral-800 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Aggiungi a Google Calendar (1 Click)"
                        >
                          <Calendar className="w-3 h-3 text-amber-400" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadBookingCalendarIcs(b.id)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                          title="Scarica .ICS per Apple Calendar o Outlook"
                        >
                          <Download className="w-3 h-3 text-neutral-400" />
                          <span>.ICS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: CONSEGNA FILE CLIENTI VIA GOOGLE DRIVE */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Header Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-neutral-900/80 border border-emerald-500/40 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CONSEGNA CLOUD MASTER • ESCLUSIVAMENTE GOOGLE DRIVE LINK</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Nessun limite di storage sul server
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                  Gestione Consegne Audio & File Progetti
                </h3>
                <p className="text-xs text-neutral-300 font-mono max-w-3xl leading-relaxed">
                  Divisione chiara tra i <strong className="text-amber-400">file inviati dai clienti</strong> (stems, basi WAV) e i <strong className="text-emerald-400">progetti presi in carico da consegnare</strong>. Le consegne ai clienti avvengono <strong className="text-white underline">esclusivamente tramite Google Drive link</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddDriveDelivery(!showAddDriveDelivery);
                    if (!showAddDriveDelivery && !driveFormUrl) {
                      setDriveFormFileType('mix_master');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddDriveDelivery ? 'Chiudi Modulo' : '+ Nuova Consegna Google Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openDownloadReceiptModal({
                      title: 'Test Consegna 171 Studio',
                      driveUrl: 'https://drive.google.com/drive/folders/171_STUDIO_DEMO_DRIVE_FOLDER',
                      fileName: '171Studio_Master_Test_24bit_WAV.zip',
                      orderCode: '171-ORD-558291',
                      downloadedAt: new Date().toISOString(),
                      downloadedBy: 'master',
                      userEmail: MASTER_EMAIL,
                      message: 'Simulazione notifica di conferma download completata!',
                    });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                  title="Testa la comparsa della notifica di conferma download"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Notifica Download</span>
                </button>
              </div>
            </div>

            {/* MANDATORY DRIVE LINK NOTICE BANNER */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start sm:items-center gap-3 text-xs font-mono text-emerald-200">
              <FolderOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase text-white block">
                  REGOLA DI CONSEGNA: SOLO ED ESCLUSIVAMENTE LINK GOOGLE DRIVE
                </span>
                <span className="text-neutral-300 text-[11px] block">
                  A 171 Studio la consegna dei Master finali (WAV 24-bit 96kHz) e degli Stems avviene unicamente incollando il link pubblico/condiviso della cartella Google Drive. In questo modo i file non occupano spazio sul database e l'artista scarica direttamente a banda piena. Quando il cliente apre il link, viene registrata automaticamente la ricevuta di download.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          {(() => {
            const clientSentFiles = clientFiles.filter(f => f.uploadedBy === 'cliente');
            const inChargeBookings = bookings.filter(b => b.status === 'in_attesa' || b.status === 'confermata');
            const awaitingDeliveryBookings = inChargeBookings.filter(b => !b.driveDeliveryUrl);
            const driveDeliveries = clientFiles.filter(f => f.isDriveDelivery || f.driveUrl);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div 
                  onClick={() => setDeliverySubTab('progetti_aperti')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    deliverySubTab === 'progetti_aperti'
                      ? 'bg-neutral-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">Progetti Presi in Carico</span>
                  <span className="text-2xl font-heading font-black text-white mt-1 block">
                    {inChargeBookings.length}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {awaitingDeliveryBookings.length} in attesa di invio link Drive
                  </span>
                </div>

                <div 
                  onClick={() => setDeliverySubTab('file_ricevuti')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    deliverySubTab === 'file_ricevuti'
                      ? 'bg-neutral-900 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">File Inviati dai Clienti</span>
                  <span className="text-2xl font-heading font-black text-amber-400 mt-1 block">
                    {clientSentFiles.length}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Stems, WAV e basi per sessioni</span>
                </div>

                <div 
                  onClick={() => setDeliverySubTab('tutte_consegne')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    deliverySubTab === 'tutte_consegne'
                      ? 'bg-neutral-900 border-blue-500/60 shadow-lg shadow-blue-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">Consegne Drive Inviate</span>
                  <span className="text-2xl font-heading font-black text-blue-400 mt-1 block">
                    {driveDeliveries.length}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono">Link Google Drive condivisi</span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-emerald-500/30">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase block">Download Confermati</span>
                  <span className="text-2xl font-heading font-black text-emerald-400 mt-1 block">
                    {driveDeliveries.filter(f => f.deliveryStatus === 'download_confermato').length}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Conferma e ricevuta registrate</span>
                </div>
              </div>
            );
          })()}

          {/* MAIN THREE-WAY SUBTAB SWITCHER */}
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-800 pb-4">
            <button
              type="button"
              onClick={() => setDeliverySubTab('progetti_aperti')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                deliverySubTab === 'progetti_aperti'
                  ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Progetti Aperti & Presi in Carico (File da mandare io)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                deliverySubTab === 'progetti_aperti' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {bookings.filter(b => b.status === 'in_attesa' || b.status === 'confermata').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliverySubTab('file_ricevuti')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                deliverySubTab === 'file_ricevuti'
                  ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>File Inviati dai Clienti (Stems / Basi Ricevuti)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                deliverySubTab === 'file_ricevuti' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {clientFiles.filter(f => f.uploadedBy === 'cliente').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliverySubTab('tutte_consegne')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                deliverySubTab === 'tutte_consegne'
                  ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Archivio Consegne Drive Inviate</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                deliverySubTab === 'tutte_consegne' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {clientFiles.filter(f => f.isDriveDelivery || f.driveUrl).length}
              </span>
            </button>
          </div>

          {/* New Drive Delivery Form Modal/Accordion */}
          {showAddDriveDelivery && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!driveFormUrl.trim() || !driveFormRecipientEmail.trim() || !driveFormFileName.trim()) {
                  setDeskActionNotice('Compila tutti i campi obbligatori (Email, Nome File e Link Google Drive).');
                  setTimeout(() => setDeskActionNotice(null), 4000);
                  return;
                }

                addDriveDelivery({
                  userEmail: driveFormRecipientEmail.trim().toLowerCase(),
                  userName: driveFormRecipientName.trim() || driveFormRecipientEmail.split('@')[0],
                  bookingOrderCode: driveFormOrderCode.trim() || undefined,
                  fileName: driveFormFileName.trim(),
                  driveUrl: driveFormUrl.trim(),
                  fileType: driveFormFileType,
                  notes: driveFormNotes.trim() || undefined,
                });

                if (driveFormOrderCode.trim()) {
                  const matchBooking = bookings.find(b => b.orderCode === driveFormOrderCode.trim());
                  if (matchBooking) {
                    updateBookingDriveDelivery(matchBooking.id, driveFormUrl.trim(), driveFormFileName.trim(), driveFormNotes.trim());
                  }
                }

                setDeskActionNotice(`Consegna file via Google Drive registrata con successo per ${driveFormRecipientEmail.trim()}! Il cliente può ora scaricarla dal portale.`);
                setTimeout(() => setDeskActionNotice(null), 6000);

                setShowAddDriveDelivery(false);
                setDriveFormRecipientEmail('');
                setDriveFormRecipientName('');
                setDriveFormOrderCode('');
                setDriveFormUrl('');
                setDriveFormFileName('');
                setDriveFormNotes('');
                setSelectedBookingForDrive(null);
              }}
              className="p-6 sm:p-7 rounded-3xl bg-neutral-950 border border-emerald-500/50 space-y-5 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-base font-heading font-bold text-white uppercase tracking-wider">
                    Nuova Consegna File al Cliente tramite Google Drive
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDriveDelivery(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fast Booking Selector */}
              {bookings.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
                  <label className="block text-amber-400 font-bold uppercase mb-1.5">
                    Seleziona un Progetto Aperto per pre-compilare i dati del cliente:
                  </label>
                  <select
                    value={driveFormOrderCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      setDriveFormOrderCode(selectedCode);
                      const targetB = bookings.find(b => b.orderCode === selectedCode);
                      if (targetB) {
                        setDriveFormRecipientEmail(targetB.userEmail);
                        setDriveFormRecipientName(targetB.userName);
                        setDriveFormFileName(`${targetB.userName.replace(/\s+/g, '_')}_${targetB.serviceTitle.replace(/\s+/g, '_')}_Master24bit.zip`);
                        if (targetB.driveDeliveryUrl) setDriveFormUrl(targetB.driveDeliveryUrl);
                        if (targetB.driveDeliveryNotes) setDriveFormNotes(targetB.driveDeliveryNotes);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-white outline-none focus:border-amber-400"
                  >
                    <option value="">-- Seleziona sessione dall'elenco --</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.orderCode}>
                        #{b.orderCode} • {b.userName} ({b.userEmail}) — {b.serviceTitle} ({b.date}) {b.driveDeliveryUrl ? '✓ Link già inviato' : '🔴 Da inviare'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Email Destinatario Cliente *
                  </label>
                  <input
                    type="email"
                    required
                    value={driveFormRecipientEmail}
                    onChange={(e) => setDriveFormRecipientEmail(e.target.value)}
                    placeholder="Es. artista@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Nome Artista / Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={driveFormRecipientName}
                    onChange={(e) => setDriveFormRecipientName(e.target.value)}
                    placeholder="Es. Igor Rozanov"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Codice Ordine Sessione (Opzionale)
                  </label>
                  <input
                    type="text"
                    value={driveFormOrderCode}
                    onChange={(e) => setDriveFormOrderCode(e.target.value)}
                    placeholder="Es. 171-ORD-558291"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs font-mono">
                <div className="sm:col-span-8">
                  <label className="block text-emerald-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Link Google Drive (Solo Link Drive Valido) *</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={driveFormUrl}
                    onChange={(e) => setDriveFormUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-emerald-500/40 text-emerald-300 outline-none focus:border-emerald-400 font-mono"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Incolla il link di condivisione della cartella o file Google Drive con accesso abilitato per il cliente.
                  </span>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-neutral-400 uppercase mb-1">
                    Tipologia File
                  </label>
                  <select
                    value={driveFormFileType}
                    onChange={(e) => setDriveFormFileType(e.target.value as ClientFileItem['fileType'])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="mix_master">Mix & Master Finale (WAV 24-bit)</option>
                    <option value="stems_progetto">Stems Multitraccia (.ZIP)</option>
                    <option value="base_wav">Base Strumentale Beat (.WAV)</option>
                    <option value="registrazione_vocale">Take Vocali / Provini</option>
                    <option value="analisi_dsp">Report Analisi DSP / Key & BPM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Nome File / Titolo Pacchetto *
                  </label>
                  <input
                    type="text"
                    required
                    value={driveFormFileName}
                    onChange={(e) => setDriveFormFileName(e.target.value)}
                    placeholder="Es. The_God_Cypher_Master_24bit_WAV.zip"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Note Tecniche per il Cliente
                  </label>
                  <input
                    type="text"
                    value={driveFormNotes}
                    onChange={(e) => setDriveFormNotes(e.target.value)}
                    placeholder="Es. Master finale calibrato per streaming (-14 LUFS) pronto per Spotify & Apple Music"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriveDelivery(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono uppercase cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Invia Link Google Drive al Cliente</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 1: PROGETTI APERTI E PRESI IN CARICO (FILE CHE DEVO MANDARE IO) */}
          {deliverySubTab === 'progetti_aperti' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                    <span>Progetti Aperti & Presi in Carico (File da Mandare)</span>
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono">
                    Elenco delle sessioni attive dello studio. Controlla quali progetti hanno già il link Google Drive inviato e quali sono ancora in attesa della tua consegna.
                  </p>
                </div>
              </div>

              {(() => {
                const activeProjects = bookings.filter(b => b.status === 'in_attesa' || b.status === 'confermata');
                
                if (activeProjects.length === 0) {
                  return (
                    <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3 font-mono">
                      <Calendar className="w-10 h-10 text-neutral-600 mx-auto" />
                      <p className="text-neutral-400 text-sm">
                        Nessun progetto aperto al momento. Quando un artista prenota o crei una sessione, apparirà qui per la consegna del link Drive.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-4">
                    {activeProjects.map((project) => {
                      const hasDrive = Boolean(project.driveDeliveryUrl);
                      const isConfirmed = project.driveDeliveryStatus === 'download_confermato';

                      return (
                        <div
                          key={project.id}
                          className={`p-5 sm:p-6 rounded-2xl bg-neutral-950 border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 ${
                            hasDrive 
                              ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                              : 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                          }`}
                        >
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-700 text-amber-400 font-mono text-xs font-bold">
                                #{project.orderCode}
                              </span>

                              {hasDrive ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  <span>LINK DRIVE INVIATO AL CLIENTE</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>DA INVIARE • LINK DRIVE IN LAVORAZIONE</span>
                                </span>
                              )}

                              {hasDrive && isConfirmed && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                                  ✓ Download Confermato dal Cliente
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg font-heading font-bold text-white">
                              {project.serviceTitle}
                            </h4>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-300">
                              <span className="text-neutral-400">
                                Artista: <strong className="text-white">{project.userName}</strong> ({project.userEmail})
                              </span>
                              <span>
                                Data: <strong className="text-white">{project.date}</strong> alle <strong className="text-white">{project.time}</strong>
                              </span>
                              <span>
                                Quota: <strong className="text-emerald-400">{project.estimatedPrice}€</strong>
                              </span>
                            </div>

                            {/* Active Drive Link Preview if present */}
                            {hasDrive && (
                              <div className="mt-2 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-emerald-300 select-all break-all flex items-center justify-between gap-2">
                                <div className="truncate flex items-center gap-2">
                                  <FolderOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="truncate">{project.driveDeliveryUrl}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(project.driveDeliveryUrl || '');
                                      setDeskActionNotice('Link Google Drive copiato!');
                                      setTimeout(() => setDeskActionNotice(null), 3000);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] uppercase font-bold"
                                    title="Copia link"
                                  >
                                    Copia
                                  </button>
                                  <a
                                    href={project.driveDeliveryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] uppercase font-bold hover:bg-emerald-500/30"
                                  >
                                    Apri
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Action Button for this Project */}
                          <div className="shrink-0 self-stretch sm:self-auto flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDriveFormOrderCode(project.orderCode);
                                setDriveFormRecipientEmail(project.userEmail);
                                setDriveFormRecipientName(project.userName);
                                setDriveFormFileName(`${project.userName.replace(/\s+/g, '_')}_${project.serviceTitle.replace(/\s+/g, '_')}_Master24bit.zip`);
                                if (project.driveDeliveryUrl) setDriveFormUrl(project.driveDeliveryUrl);
                                if (project.driveDeliveryNotes) setDriveFormNotes(project.driveDeliveryNotes);
                                setShowAddDriveDelivery(true);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                hasDrive
                                  ? 'bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/20'
                              }`}
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>{hasDrive ? 'Aggiorna Link Google Drive' : '+ Invia Link Drive per questo Progetto'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW 2: FILE INVIATI DAI CLIENTI (STEMS / BASI / PROVINI RICEVUTI) */}
          {deliverySubTab === 'file_ricevuti' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span>File Inviati dai Clienti (Stems, Basi WAV & Take Vocali)</span>
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono">
                    File caricati direttamente dagli artisti dal loro account per le prossime sessioni in studio.
                  </p>
                </div>
              </div>

              {(() => {
                const clientFilesReceived = clientFiles.filter(f => f.uploadedBy === 'cliente');

                if (clientFilesReceived.length === 0) {
                  return (
                    <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3 font-mono">
                      <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
                      <p className="text-neutral-400 text-sm">
                        Nessun file o stem caricato finora dai clienti.
                      </p>
                      <p className="text-neutral-500 text-xs">
                        Quando un cliente registrato carica le sue basi o stems da "Il Mio Account", appariranno qui pronte per il download.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clientFilesReceived.map((file) => (
                      <div
                        key={file.id}
                        className="p-5 rounded-2xl bg-neutral-950 border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              CARICATO DAL CLIENTE
                            </span>
                            <span className="text-xs font-mono text-neutral-400">{file.fileSize}</span>
                          </div>

                          <div>
                            <h4 className="text-base font-heading font-bold text-white break-all">
                              {file.fileName}
                            </h4>
                            <div className="text-xs font-mono text-neutral-400 mt-1">
                              Artista: <strong className="text-white">{file.userName || file.userEmail.split('@')[0]}</strong> ({file.userEmail})
                              {file.bookingOrderCode && <span className="text-amber-400 block">Ordine: #{file.bookingOrderCode}</span>}
                            </div>
                          </div>

                          {file.notes && (
                            <p className="text-xs font-mono text-neutral-300 bg-neutral-900/70 p-3 rounded-xl border border-neutral-800">
                              <strong className="text-amber-400 block mb-0.5">Note dell'Artista:</strong>
                              {file.notes}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2 text-xs font-mono">
                          <span className="text-neutral-500 text-[11px]">
                            Ricevuto il {new Date(file.createdAt).toLocaleDateString('it-IT')}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const content = `171 STUDIO MESSINA - RICEZIONE FILE CLIENTE\nNome: ${file.fileName}\nArtista: ${file.userName} (${file.userEmail})\nData: ${new Date(file.createdAt).toLocaleString('it-IT')}\nNote: ${file.notes || 'N/D'}`;
                                const blob = new Blob([content], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${file.fileName}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Scarica File</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Vuoi rimuovere il file "${file.fileName}"?`)) {
                                  deleteClientFile(file.id);
                                  setDeskActionNotice('File rimosso.');
                                  setTimeout(() => setDeskActionNotice(null), 3000);
                                }
                              }}
                              className="p-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                              title="Elimina file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW 3: ARCHIVIO TUTTE LE CONSEGNE DRIVE INVIATE */}
          {deliverySubTab === 'tutte_consegne' && (
            <div className="space-y-4">
              {/* Filter Bar & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('tutte')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      deliveryFilter === 'tutte'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Tutte le Consegne ({clientFiles.filter(f => f.isDriveDelivery || f.driveUrl).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('in_attesa')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      deliveryFilter === 'in_attesa'
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    In Attesa di Download ({clientFiles.filter(f => (f.isDriveDelivery || f.driveUrl) && f.deliveryStatus !== 'download_confermato').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryFilter('confermate')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      deliveryFilter === 'confermate'
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Download Confermati ({clientFiles.filter(f => (f.isDriveDelivery || f.driveUrl) && f.deliveryStatus === 'download_confermato').length})
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={deliverySearch}
                    onChange={(e) => setDeliverySearch(e.target.value)}
                    placeholder="Cerca per artista, email, ordine o file..."
                    className="w-full sm:w-64 pl-8 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* List of Drive Deliveries */}
              {(() => {
                const driveFiles = clientFiles.filter(f => {
                  if (!f.isDriveDelivery && !f.driveUrl) return false;
                  if (deliveryFilter === 'in_attesa' && f.deliveryStatus === 'download_confermato') return false;
                  if (deliveryFilter === 'confermate' && f.deliveryStatus !== 'download_confermato') return false;
                  if (deliverySearch.trim()) {
                    const q = deliverySearch.toLowerCase();
                    return (
                      f.fileName.toLowerCase().includes(q) ||
                      f.userEmail.toLowerCase().includes(q) ||
                      (f.userName && f.userName.toLowerCase().includes(q)) ||
                      (f.bookingOrderCode && f.bookingOrderCode.toLowerCase().includes(q))
                    );
                  }
                  return true;
                });

                if (driveFiles.length === 0) {
                  return (
                    <div className="p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-3 font-mono">
                      <FolderOpen className="w-10 h-10 text-neutral-600 mx-auto" />
                      <p className="text-neutral-400 text-sm">
                        Nessuna consegna file Google Drive trovata per i filtri selezionati.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddDriveDelivery(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold uppercase text-xs"
                      >
                        + Effettua la prima consegna con Google Drive
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {driveFiles.map((file) => {
                      const isConfirmed = file.deliveryStatus === 'download_confermato';
                      const driveLink = file.driveUrl || file.downloadUrl || '#';

                      return (
                        <div
                          key={file.id}
                          className={`p-5 rounded-2xl bg-neutral-950 border transition-all flex flex-col justify-between gap-4 ${
                            isConfirmed
                              ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                              : 'border-blue-500/40 shadow-lg shadow-blue-500/5'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center gap-1.5">
                                <FolderOpen className="w-3 h-3 text-emerald-400" />
                                <span>GOOGLE DRIVE LINK</span>
                                {file.bookingOrderCode && <strong className="text-amber-400">#{file.bookingOrderCode}</strong>}
                              </span>

                              {/* Live Confirmation Status Badge */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border flex items-center gap-1 ${
                                  isConfirmed
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                                }`}
                              >
                                {isConfirmed ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>DOWNLOAD CONFERMATO ({file.downloadCount || 1}x)</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-blue-400" />
                                    <span>IN ATTESA DI DOWNLOAD</span>
                                  </>
                                )}
                              </span>
                            </div>

                            {/* File Name & Recipient Info */}
                            <div>
                              <h4 className="text-base font-heading font-bold text-white break-all flex items-center gap-2">
                                <span>{file.fileName}</span>
                              </h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 mt-1">
                                <span className="text-neutral-200">
                                  Artista: <strong className="text-white">{file.userName || file.userEmail.split('@')[0]}</strong>
                                </span>
                                <span className="text-neutral-400">({file.userEmail})</span>
                              </div>
                            </div>

                            {file.notes && (
                              <p className="text-xs font-mono text-neutral-300 bg-neutral-900/70 p-3 rounded-xl border border-neutral-800">
                                {file.notes}
                              </p>
                            )}

                            {/* Drive URL Link Bar */}
                            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-blue-300 select-all break-all flex items-center justify-between gap-2">
                              <span className="truncate">{driveLink}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(driveLink);
                                  setDeskActionNotice('Link Google Drive copiato negli appunti!');
                                  setTimeout(() => setDeskActionNotice(null), 3500);
                                }}
                                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] uppercase font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                                title="Copia link Google Drive"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copia</span>
                              </button>
                            </div>

                            {/* Confirmation Timestamp Details */}
                            {isConfirmed && file.lastDownloadedAt && (
                              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                                <span>Data e Ora di Scaricamento:</span>
                                <strong>
                                  {new Date(file.lastDownloadedAt).toLocaleDateString('it-IT')} alle {new Date(file.lastDownloadedAt).toLocaleTimeString('it-IT')}
                                  {file.lastDownloadedBy ? ` (${file.lastDownloadedBy})` : ''}
                                </strong>
                              </div>
                            )}
                          </div>

                          {/* Card Action Buttons */}
                          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <span className="text-neutral-500 text-[11px]">
                              Inviato il {new Date(file.createdAt).toLocaleDateString('it-IT')}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(driveLink, '_blank', 'noopener,noreferrer');
                                  confirmDriveFileDownload(file.id, 'master', currentUser?.email || MASTER_EMAIL);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer text-xs"
                                title="Apri file su Drive e attiva notifica di conferma download"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>Scarica / Testa Link</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Vuoi rimuovere la consegna "${file.fileName}"?`)) {
                                    deleteClientFile(file.id);
                                    setDeskActionNotice('Consegna file rimossa con successo.');
                                    setTimeout(() => setDeskActionNotice(null), 3500);
                                  }
                                }}
                                className="p-1.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                                title="Elimina consegna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB: ORDINI & STATISTICHE "THE GOD CYPHER" (SOLO MASTER ACCOUNT) */}
      {activeTab === 'album_orders' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Feedback banner */}
          {orderActionNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center justify-between">
              <span>{orderActionNotice}</span>
              <button 
                type="button" 
                onClick={() => setOrderActionNotice(null)}
                className="text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Top Header & Overview */}
          <div className="p-6 sm:p-7 rounded-3xl bg-neutral-900/90 border border-red-700/60 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60">
                  PANNELLO MASTER • STATISTICHE & VENDITE ALBUM
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Ordini "The God Cypher"
              </h3>
              <p className="text-sm text-neutral-300 font-light mt-0.5">
                Monitoraggio vendite CD Deluxe (€9.99), download digitali (€4.99), tracciamento spedizioni e gestione ritiri in sede.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const randomCode = Math.floor(1000 + Math.random() * 9000);
                  const demoOrder = {
                    userEmail: 'cliente.demo@email.it',
                    userName: 'Marco Demo',
                    userPhone: '+39 347 1234567',
                    orderType: 'physical' as const,
                    productTitle: 'The God Cypher — CD Deluxe Pack',
                    basePrice: 9.99,
                    shippingFee: 5.00,
                    totalAmount: 14.99,
                    shippingMethod: 'shipping' as const,
                    shippingAddress: 'Via Garibaldi 45',
                    shippingCity: 'Messina',
                    shippingZip: '98122',
                    notes: 'Spedizione rapida richiesta',
                  };
                  createAlbumOrder(demoOrder);
                  setOrderActionNotice(`Ordine di prova #171-TGC-${randomCode} generato con successo.`);
                  setTimeout(() => setOrderActionNotice(null), 4000);
                }}
                className="px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-mono uppercase tracking-wider cursor-pointer"
                title="Crea un ordine di prova per testare il flusso"
              >
                + Ordine Test Demo
              </button>
            </div>
          </div>

          {/* REAL-TIME STATS CARDS */}
          {(() => {
            const totalRevenue = albumOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            const physicalOrders = albumOrders.filter(o => o.orderType === 'physical');
            const digitalOrders = albumOrders.filter(o => o.orderType === 'digital');
            const shippingOrders = physicalOrders.filter(o => o.shippingMethod === 'shipping');
            const pickupOrders = physicalOrders.filter(o => o.shippingMethod === 'pickup');
            const toShipOrders = shippingOrders.filter(o => o.status !== 'spedito');
            const readyPickupOrders = pickupOrders.filter(o => o.status === 'pronto_ritiro');
            const validatedEmails = albumOrders.filter(o => o.emailValidationStatus === 'convalidata');

            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                
                {/* Total Revenue */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>Incasso Totale</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">
                    €{totalRevenue.toFixed(2)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    {albumOrders.length} ordini registrati
                  </div>
                </div>

                {/* Physical CD Orders */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>CD Fisici (€9.99)</span>
                    <Disc className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">
                    {physicalOrders.length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-1">
                    {shippingOrders.length} spediti • {pickupOrders.length} ritiri
                  </div>
                </div>

                {/* Digital Download Orders */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>Digitali (€4.99 / €2.99)</span>
                    <Download className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">
                    {digitalOrders.length}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1">
                    {digitalOrders.filter(o => o.basePrice >= 4).length} Master • {digitalOrders.filter(o => o.basePrice < 4).length} MP3
                  </div>
                </div>

                {/* Da Spedire */}
                <div className={`p-4 rounded-2xl border shadow-lg ${
                  toShipOrders.length > 0 
                    ? 'bg-red-950/40 border-red-600/70' 
                    : 'bg-neutral-900/90 border-neutral-800'
                }`}>
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>Da Spedire</span>
                    <Truck className={`w-4 h-4 ${toShipOrders.length > 0 ? 'text-red-400 animate-bounce' : 'text-neutral-500'}`} />
                  </div>
                  <div className={`text-2xl font-heading font-black ${toShipOrders.length > 0 ? 'text-red-400' : 'text-white'}`}>
                    {toShipOrders.length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-1">
                    Richiede tracking
                  </div>
                </div>

                {/* Ritiro in Sede */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>Ritiri in Sede</span>
                    <MapPin className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">
                    {pickupOrders.length}
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 mt-1">
                    {readyPickupOrders.length} pronti per ritiro
                  </div>
                </div>

                {/* Email Convalidate */}
                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-mono mb-1">
                    <span>Email Convalidate</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-heading font-black text-white">
                    {validatedEmails.length}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 mt-1">
                    di {albumOrders.length} totali
                  </div>
                </div>

              </div>
            );
          })()}

          {/* FILTERS & SEARCH BAR */}
          <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all', label: `Tutti (${albumOrders.length})` },
                { id: 'da_spedire', label: `Da Spedire (${albumOrders.filter(o => o.shippingMethod === 'shipping' && o.status !== 'spedito').length})` },
                { id: 'ritiro_studio', label: `Ritiri in Sede (${albumOrders.filter(o => o.shippingMethod === 'pickup').length})` },
                { id: 'digital', label: `Digitali (${albumOrders.filter(o => o.orderType === 'digital').length})` },
                { id: 'convalidati', label: `Email Convalidate (${albumOrders.filter(o => o.emailValidationStatus === 'convalidata').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAlbumOrdersFilter(f.id as typeof albumOrdersFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    albumOrdersFilter === f.id
                      ? 'bg-red-700 text-white font-bold shadow-md'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca ordine, nome, email..."
                value={albumOrdersSearch}
                onChange={(e) => setAlbumOrdersSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ORDERS LIST */}
          <div className="space-y-4">
            {(() => {
              const filtered = albumOrders.filter((order) => {
                if (albumOrdersFilter === 'da_spedire' && (order.shippingMethod !== 'shipping' || order.status === 'spedito')) return false;
                if (albumOrdersFilter === 'ritiro_studio' && order.shippingMethod !== 'pickup') return false;
                if (albumOrdersFilter === 'digital' && order.orderType !== 'digital') return false;
                if (albumOrdersFilter === 'convalidati' && order.emailValidationStatus !== 'convalidata') return false;

                if (albumOrdersSearch.trim()) {
                  const q = albumOrdersSearch.toLowerCase().trim();
                  return (
                    order.orderCode.toLowerCase().includes(q) ||
                    order.userName.toLowerCase().includes(q) ||
                    order.userEmail.toLowerCase().includes(q) ||
                    (order.shippingCity && order.shippingCity.toLowerCase().includes(q)) ||
                    (order.trackingNumber && order.trackingNumber.toLowerCase().includes(q))
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                    <Disc className="w-12 h-12 text-neutral-600 mx-auto" />
                    <h4 className="text-lg font-heading font-bold text-white">Nessun ordine trovato</h4>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Gli ordini effettuati sulla pagina "The God Cypher" appariranno qui in tempo reale con tutte le opzioni per inserire il numero di tracciamento o la data di ritiro.
                    </p>
                  </div>
                );
              }

              return filtered.map((order) => (
                <div
                  key={order.id}
                  className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-red-800/50 transition-all shadow-xl space-y-4"
                >
                  {/* Row 1: Header & Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-red-400 bg-red-950/80 px-3 py-1 rounded-full border border-red-700/60">
                        ORDINE #{order.orderCode}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {new Date(order.createdAt).toLocaleString('it-IT')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Product Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        order.orderType === 'physical'
                          ? 'bg-red-900/40 text-red-300 border border-red-700/60'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                      }`}>
                        {order.orderType === 'physical' ? 'CD Fisico Deluxe' : 'Download Digitale Master'}
                      </span>

                      {/* Email Validation Status */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                        order.emailValidationStatus === 'convalidata'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                      }`}>
                        <Mail className="w-3 h-3" />
                        <span>{order.emailValidationStatus === 'convalidata' ? 'Email Convalidata' : 'Email da Convalidare'}</span>
                      </span>

                      {/* Shipping/Pickup status badge */}
                      {order.shippingMethod === 'shipping' && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                          order.status === 'spedito'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-red-950 text-red-300 border border-red-700/60 animate-pulse'
                        }`}>
                          <Truck className="w-3 h-3" />
                          <span>{order.status === 'spedito' ? 'Spedito con Tracking' : 'Da Spedire'}</span>
                        </span>
                      )}

                      {order.shippingMethod === 'pickup' && (
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                          order.status === 'completato'
                            ? 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                            : order.pickupStatus === 'pronto_ritiro'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                        }`}>
                          <MapPin className="w-3 h-3" />
                          <span>
                            {order.status === 'completato' 
                              ? 'Ritirato in Sede' 
                              : order.pickupStatus === 'pronto_ritiro' 
                              ? 'Pronto per il Ritiro' 
                              : 'In Preparazione Ritiro'}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Customer & Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    {/* Customer */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">CLIENTE:</span>
                      <div className="text-white font-bold text-sm">{order.userName}</div>
                      <div className="text-neutral-300">{order.userEmail}</div>
                      {order.userPhone && <div className="text-neutral-400">Tel: {order.userPhone}</div>}
                    </div>

                    {/* Delivery / Shipping details */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">MODALITÀ CONSEGNA:</span>
                      {order.shippingMethod === 'shipping' ? (
                        <>
                          <div className="text-amber-400 font-bold">Spedizione con Corriere Espresso (+€5.00)</div>
                          <div className="text-white">{order.shippingAddress || 'Indirizzo non specificato'}</div>
                          <div className="text-neutral-400">{order.shippingCity} {order.shippingZip}</div>
                        </>
                      ) : order.shippingMethod === 'pickup' ? (
                        <>
                          <div className="text-emerald-400 font-bold">Ritiro a Mano in Sede (Gratuito)</div>
                          <div className="text-neutral-300">171 Studio Messina • Via 171 Studio</div>
                          <div className="text-neutral-400">{order.pickupSlot || 'Dal Lunedì al Sabato 10:00 - 20:00'}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-cyan-400 font-bold">Download Digitale Immediato</div>
                          <div className="text-neutral-400">14 Tracce WAV 24b + MP3 320k + Grafiche</div>
                        </>
                      )}
                    </div>

                    {/* Price Breakdown & PayPal */}
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-2 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">TOTALE INCASSO:</span>
                        <div className="text-2xl font-black text-white font-heading">€{order.totalAmount.toFixed(2)}</div>
                        <div className="text-[10px] text-neutral-400">
                          Base: €{order.basePrice.toFixed(2)} {order.shippingFee > 0 ? `+ Spedizione: €${order.shippingFee.toFixed(2)}` : ''}
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-800 text-[10px] space-y-0.5">
                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{order.paymentStatus === 'saldato' ? 'Saldato via PayPal' : 'In attesa saldo PayPal'}</span>
                        </div>
                        <div className="text-neutral-400 truncate">
                          Destinatario: <strong className="text-amber-400">{order.paypalEmail || 'vkrealhakiesake@gmail.com'}</strong>
                        </div>
                        {order.paypalTransactionId && (
                          <div className="text-neutral-300 font-mono select-all truncate">
                            TX: <strong className="text-emerald-400">{order.paypalTransactionId}</strong>
                          </div>
                        )}
                        {order.paypalPaidAt && (
                          <div className="text-[9px] text-neutral-500">
                            Data: {new Date(order.paypalPaidAt).toLocaleString('it-IT')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Action Controls (Tracking, Pickup schedule, Email validation, PayPal confirmation) */}
                  <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Left Actions: Email validation, PayPal confirm & Specific fulfillment controls */}
                    <div className="flex flex-wrap items-center gap-2">

                      {/* PayPal Manual Confirmation if pending */}
                      {order.paymentStatus !== 'saldato' && (
                        <button
                          type="button"
                          onClick={() => {
                            const enteredTx = window.prompt(
                              `Conferma ricezione pagamento su vkrealhakiesake@gmail.com per Ordine #${order.orderCode} (€${order.totalAmount.toFixed(2)}).\n\nInserisci l'ID Transazione / Codice Ricevuta PayPal:`,
                              order.paypalTransactionId || ''
                            );
                            if (enteredTx === null) return;
                            try {
                              confirmAlbumOrderPayPalPayment(order.id, enteredTx.trim() || undefined);
                              setOrderActionNotice(`Pagamento PayPal registrato per #${order.orderCode} (€${order.totalAmount.toFixed(2)} a vkrealhakiesake@gmail.com).`);
                              setTimeout(() => setOrderActionNotice(null), 4000);
                            } catch (err: any) {
                              alert(err?.message || 'Errore durante la registrazione del pagamento.');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#ffc439] hover:bg-[#f4b82d] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Conferma Saldo PayPal</span>
                        </button>
                      )}
                      
                      {/* Email Validation Button */}
                      {order.emailValidationStatus !== 'convalidata' ? (
                        <button
                          type="button"
                          onClick={() => {
                            validateAlbumOrderEmail(order.id);
                            setOrderActionNotice(`Email di convalida registrata per l'ordine #${order.orderCode} (${order.userEmail}).`);
                            setTimeout(() => setOrderActionNotice(null), 4000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Convalida Email Ordine</span>
                        </button>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Email Convalidata {order.emailValidatedAt ? `il ${new Date(order.emailValidatedAt).toLocaleDateString('it-IT')}` : ''}</span>
                        </div>
                      )}

                      {/* Shipping Tracking Controls */}
                      {order.shippingMethod === 'shipping' && (
                        <>
                          {order.trackingNumber ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-700 text-xs font-mono text-neutral-300">
                                🚚 Tracking: <strong className="text-emerald-400">{order.trackingNumber}</strong> ({order.trackingCarrier || 'Poste SDA'})
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrackingId(order.id);
                                  setTrackingNumberInput(order.trackingNumber || '');
                                  setTrackingCarrierInput(order.trackingCarrier || 'Poste Italiane SDA');
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono cursor-pointer"
                              >
                                Modifica Tracking
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTrackingId(order.id);
                                setTrackingNumberInput('');
                                setTrackingCarrierInput('Poste Italiane SDA');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Assegna Numero Tracciamento</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Pickup Readiness Controls */}
                      {order.shippingMethod === 'pickup' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPickupId(order.id);
                              setPickupDateInput(order.pickupReadyDate || new Date().toISOString().split('T')[0]);
                              setPickupTimeSlotInput('10:00 - 20:00');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Imposta Data Ritiro in Sede</span>
                          </button>

                          {order.status !== 'completato' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateAlbumOrder(order.id, { status: 'completato' });
                                setOrderActionNotice(`Ordine #${order.orderCode} segnato come ritirato con successo.`);
                                setTimeout(() => setOrderActionNotice(null), 4000);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs cursor-pointer"
                            >
                              Segna come Ritirato
                            </button>
                          )}
                        </>
                      )}

                    </div>

                    {/* Right Action: Delete */}
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Sei sicuro di voler eliminare l'ordine #${order.orderCode}?`)) {
                            deleteAlbumOrder(order.id);
                          }
                        }}
                        className="p-1.5 rounded-xl bg-neutral-950 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                        title="Elimina ordine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* Inline Modal/Editor: Assign Tracking Number */}
                  {editingTrackingId === order.id && (
                    <div className="mt-3 p-4 rounded-2xl bg-black border border-red-700/60 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                        <span>ASSEGNA NUMERO DI TRACCIAMENTO — ORDINE #{order.orderCode}</span>
                        <button onClick={() => setEditingTrackingId(null)} className="text-neutral-400 hover:text-white">✕</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Numero di Tracciamento *</label>
                          <input
                            type="text"
                            placeholder="es. POSTE-IT-98234129 o 1Z9999999999999999"
                            value={trackingNumberInput}
                            onChange={(e) => setTrackingNumberInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Corriere</label>
                          <select
                            value={trackingCarrierInput}
                            onChange={(e) => setTrackingCarrierInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:border-red-500 focus:outline-none"
                          >
                            <option value="Poste Italiane SDA">Poste Italiane SDA</option>
                            <option value="GLS Express">GLS Express</option>
                            <option value="DHL Express">DHL Express</option>
                            <option value="BRT Bartolini">BRT Bartolini</option>
                            <option value="UPS Express">UPS Express</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingTrackingId(null)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-mono"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!trackingNumberInput.trim()) return;
                            setAlbumOrderTracking(order.id, trackingNumberInput.trim(), trackingCarrierInput);
                            setEditingTrackingId(null);
                            setOrderActionNotice(`Numero di tracciamento #${trackingNumberInput.trim()} assegnato all'ordine #${order.orderCode} e stato aggiornato a SPEDITO.`);
                            setTimeout(() => setOrderActionNotice(null), 4000);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider"
                        >
                          Salva & Segna come Spedito
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Modal/Editor: Set Local Pickup Readiness */}
                  {editingPickupId === order.id && (
                    <div className="mt-3 p-4 rounded-2xl bg-black border border-amber-500/60 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-white">
                        <span>IMPOSTA QUANDO È POSSIBILE IL RITIRO PRESSO LO STUDIO — ORDINE #{order.orderCode}</span>
                        <button onClick={() => setEditingPickupId(null)} className="text-neutral-400 hover:text-white">✕</button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Data Disponibilità Ritiro *</label>
                          <input
                            type="date"
                            value={pickupDateInput}
                            onChange={(e) => setPickupDateInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">Fascia Oraria Ritiro</label>
                          <input
                            type="text"
                            placeholder="es. 10:00 - 20:00 (Lunedì - Sabato)"
                            value={pickupTimeSlotInput}
                            onChange={(e) => setPickupTimeSlotInput(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingPickupId(null)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-mono"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAlbumOrderPickupReady(order.id, pickupDateInput, pickupTimeSlotInput);
                            setEditingPickupId(null);
                            setOrderActionNotice(`Ritiro in sede confermato per l'ordine #${order.orderCode}: disponibile dal ${pickupDateInput} ore ${pickupTimeSlotInput}.`);
                            setTimeout(() => setOrderActionNotice(null), 4000);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase tracking-wider"
                        >
                          Conferma Disponibilità Ritiro in Studio
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ));
            })()}
          </div>

        </div>
      )}

      {/* TAB: GESTIONE PLUGIN BUG REPORTS (SOLO MASTER ACCOUNT) */}
      {activeTab === 'plugin_bug_reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Action notification banner */}
          {bugActionNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center justify-between">
              <span>{bugActionNotice}</span>
              <button 
                type="button" 
                onClick={() => setBugActionNotice(null)}
                className="text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Header Title & Subtitle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-700/60">
                  LABORATORIO DSP 171 • BUG TRACKER
                </span>
                {pluginBugReports.filter(b => b.status !== 'risolto').length > 0 && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 animate-pulse">
                    ● {pluginBugReports.filter(b => b.status !== 'risolto').length} Segnalazioni Attive
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                Plugin Bug Reports & Feedback Tecnico
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Gestisci le anomalie segnalate dagli utenti nei plugin 171 Studio. Imposta lo stato, comunica note e pianifica le patch di rilascio.
              </p>
            </div>
          </div>

          {/* Statistics summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Totale Segnalazioni</span>
              <div className="text-2xl font-heading font-black text-white">{pluginBugReports.length}</div>
              <div className="text-[10px] font-mono text-neutral-400 mt-1">Tutti i report inviati</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">Da Esaminare</span>
              <div className="text-2xl font-heading font-black text-amber-300">
                {pluginBugReports.filter(b => b.status === 'aperto').length}
              </div>
              <div className="text-[10px] font-mono text-amber-400/80 mt-1">Nuovi report non letti</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-cyan-400 block mb-1">In Esame</span>
              <div className="text-2xl font-heading font-black text-cyan-300">
                {pluginBugReports.filter(b => b.status === 'in_esame').length}
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80 mt-1">In analisi da Igor Rozanov</div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">Risolti / Patch</span>
              <div className="text-2xl font-heading font-black text-emerald-300">
                {pluginBugReports.filter(b => b.status === 'risolto').length}
              </div>
              <div className="text-[10px] font-mono text-emerald-400/80 mt-1">Bug risolti o fixati</div>
            </div>

            <div className={`p-4 rounded-2xl border shadow-lg ${
              pluginBugReports.some(b => b.severity === 'critica' && b.status !== 'risolto')
                ? 'bg-red-950/40 border-red-600/70'
                : 'bg-neutral-900/90 border-neutral-800'
            }`}>
              <span className="text-[10px] font-mono uppercase text-red-400 block mb-1 font-bold">Critici (Crash DAW)</span>
              <div className="text-2xl font-heading font-black text-red-400">
                {pluginBugReports.filter(b => b.severity === 'critica').length}
              </div>
              <div className="text-[10px] font-mono text-neutral-400 mt-1">
                {pluginBugReports.filter(b => b.severity === 'critica' && b.status !== 'risolto').length} ancora aperti
              </div>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'all', label: `Tutti (${pluginBugReports.length})` },
                { id: 'aperti', label: `Aperti (${pluginBugReports.filter(b => b.status === 'aperto').length})` },
                { id: 'in_esame', label: `In Esame (${pluginBugReports.filter(b => b.status === 'in_esame').length})` },
                { id: 'risolti', label: `Risolti (${pluginBugReports.filter(b => b.status === 'risolto').length})` },
                { id: 'critici', label: `Critici / Crash (${pluginBugReports.filter(b => b.severity === 'critica').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBugReportFilter(f.id as typeof bugReportFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    bugReportFilter === f.id
                      ? 'bg-red-700 text-white font-bold shadow-md'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca plugin, utente, DAW..."
                value={bugReportSearch}
                onChange={(e) => setBugReportSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bug Reports Cards List */}
          <div className="space-y-4">
            {(() => {
              const filtered = pluginBugReports.filter((report) => {
                if (bugReportFilter === 'aperti' && report.status !== 'aperto') return false;
                if (bugReportFilter === 'in_esame' && report.status !== 'in_esame') return false;
                if (bugReportFilter === 'risolti' && report.status !== 'risolto') return false;
                if (bugReportFilter === 'critici' && report.severity !== 'critica') return false;

                if (bugReportSearch.trim()) {
                  const q = bugReportSearch.toLowerCase().trim();
                  return (
                    report.pluginName.toLowerCase().includes(q) ||
                    report.userName.toLowerCase().includes(q) ||
                    report.userEmail.toLowerCase().includes(q) ||
                    report.dawUsed.toLowerCase().includes(q) ||
                    report.operatingSystem.toLowerCase().includes(q) ||
                    report.description.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                    <Bug className="w-12 h-12 text-neutral-600 mx-auto" />
                    <h4 className="text-lg font-heading font-bold text-white">Nessuna segnalazione trovata</h4>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Non ci sono bug report con i filtri selezionati. I report inviati dagli artisti appariranno qui con tutte le informazioni tecniche.
                    </p>
                  </div>
                );
              }

              return filtered.map((report) => (
                <div
                  key={report.id}
                  className="p-5 sm:p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 hover:border-red-800/50 transition-all shadow-xl space-y-4"
                >
                  {/* Top Bar: Plugin, Badges & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-white bg-red-950/80 px-3 py-1 rounded-full border border-red-700/60">
                        {report.pluginName}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {new Date(report.createdAt).toLocaleString('it-IT')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Format & DAW */}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-950 text-neutral-300 border border-neutral-800">
                        {report.format || 'VST3'} • {report.dawUsed}
                      </span>

                      {/* Severity Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        report.severity === 'critica'
                          ? 'bg-red-950 text-red-300 border border-red-600'
                          : report.severity === 'media'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600'
                          : 'bg-blue-950 text-blue-300 border border-blue-600'
                      }`}>
                        Gravità: {report.severity}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        report.status === 'risolto'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : report.status === 'in_esame'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                          : 'bg-amber-950 text-amber-300 border border-amber-600'
                      }`}>
                        {report.status === 'risolto' && '✓ Risolto / Patch Pronta'}
                        {report.status === 'in_esame' && '⏳ In Esame nel Lab'}
                        {report.status === 'aperto' && '● Aperto / Da Esaminare'}
                        {report.status === 'archiviato' && 'Archiviato'}
                      </span>
                    </div>
                  </div>

                  {/* Body: User Details & Technical Environment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">SEGNALATO DA:</span>
                      <div className="text-white font-bold text-sm">{report.userName}</div>
                      <div className="text-neutral-300 flex items-center gap-1.5">
                        <span>{report.userEmail}</span>
                        <a
                          href={`mailto:${report.userEmail}?subject=${encodeURIComponent(`171 Studio - Riscontro su Bug Report ${report.pluginName}`)}`}
                          className="text-amber-400 hover:text-white"
                          title="Rispondi via email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">AMBIENTE TECNICO:</span>
                      <div className="text-white">OS: <strong className="text-amber-300">{report.operatingSystem}</strong></div>
                      <div className="text-neutral-300">DAW: <strong className="text-white">{report.dawUsed}</strong></div>
                      <div className="text-neutral-400">Formato: {report.format || 'VST3 (64-bit)'}</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">PRIORITÀ SVILUPPO:</span>
                      <div className={`text-base font-bold font-heading ${
                        report.severity === 'critica' ? 'text-red-400' : report.severity === 'media' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {report.severity === 'critica' ? 'Priorità Alta (Crash DAW)' : report.severity === 'media' ? 'Priorità Media (Audio Glitch)' : 'Priorità Bassa (GUI/Typo)'}
                      </div>
                      <div className="text-[10px] text-neutral-500">ID Report: #{report.id}</div>
                    </div>
                  </div>

                  {/* Anomaly Description ("Che cosa succedeva") */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 space-y-2 text-xs font-mono">
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">
                      CHE COSA SUCCEDEVA (DESCRIZIONE):
                    </span>
                    <p className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {report.description}
                    </p>

                    {report.stepsToReproduce && (
                      <div className="mt-2 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
                        <span className="text-[10px] uppercase font-bold text-neutral-300 block mb-1">
                          Passaggi per riprodurre:
                        </span>
                        <div className="whitespace-pre-wrap bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                          {report.stepsToReproduce}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes Section */}
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        NOTE DELLO SVILUPPATORE 171 STUDIO (VISIBILI AL CLIENTE):
                      </span>
                      {editingAdminNotesId !== report.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdminNotesId(report.id);
                            setAdminNotesInput(report.adminNotes || '');
                          }}
                          className="text-[11px] text-amber-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{report.adminNotes ? 'Modifica Nota' : 'Aggiungi Nota'}</span>
                        </button>
                      )}
                    </div>

                    {editingAdminNotesId === report.id ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={adminNotesInput}
                          onChange={(e) => setAdminNotesInput(e.target.value)}
                          placeholder="es. Bug confermato in riproduzione su FL Studio 21. Fix implementato nel branch release, patch disponibile nel prossimo aggiornamento..."
                          className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs outline-none focus:border-amber-400 resize-none"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingAdminNotesId(null)}
                            className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs cursor-pointer hover:bg-neutral-700"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updatePluginBugReportStatus(report.id, report.status, adminNotesInput.trim());
                              setEditingAdminNotesId(null);
                              setBugActionNotice(`Nota sviluppatore salvata per il report #${report.id}.`);
                              setTimeout(() => setBugActionNotice(null), 4000);
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs cursor-pointer"
                          >
                            Salva Nota
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-300 italic text-[11px]">
                        {report.adminNotes || 'Nessuna nota tecnica ancora inserita.'}
                      </p>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Reward button for verified bug */}
                      {report.rewardGranted ? (
                        <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950 to-cyan-950 border border-emerald-500/70 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ricompensa Assegnata: Buono {report.rewardVoucherCode} (-25€) & Badge Bug Hunter</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Vuoi approvare questo bug come "Problema Reale Verificato" e assegnare all'account ${report.userEmail} un Voucher da 25€, il Badge Tester Certificato e la licenza gratuita a vita dei futuri plugin?`)) {
                              const res = verifyPluginBugReportAndReward(report.id, 25);
                              if (res.success) {
                                setBugActionNotice(res.message);
                                setTimeout(() => setBugActionNotice(null), 6000);
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span>Approva Feedback Verificato & Assegna Ricompensa (25€ + Badge)</span>
                        </button>
                      )}

                      {report.status !== 'in_esame' && (
                        <button
                          type="button"
                          onClick={() => {
                            updatePluginBugReportStatus(report.id, 'in_esame');
                            setBugActionNotice(`Report #${report.id} segnato come "In Esame".`);
                            setTimeout(() => setBugActionNotice(null), 4000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <span>Segna In Esame</span>
                        </button>
                      )}

                      {report.status !== 'risolto' && (
                        <button
                          type="button"
                          onClick={() => {
                            updatePluginBugReportStatus(report.id, 'risolto');
                            setBugActionNotice(`Report #${report.id} segnato come "Risolto".`);
                            setTimeout(() => setBugActionNotice(null), 4000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Segna Risolto</span>
                        </button>
                      )}

                      {report.status === 'risolto' && (
                        <button
                          type="button"
                          onClick={() => {
                            updatePluginBugReportStatus(report.id, 'aperto');
                            setBugActionNotice(`Report #${report.id} riaperto.`);
                            setTimeout(() => setBugActionNotice(null), 4000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span>Riapri Segnalazione</span>
                        </button>
                      )}

                      {report.status !== 'archiviato' && (
                        <button
                          type="button"
                          onClick={() => {
                            updatePluginBugReportStatus(report.id, 'archiviato');
                            setBugActionNotice(`Report #${report.id} archiviato.`);
                            setTimeout(() => setBugActionNotice(null), 4000);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 font-mono text-xs cursor-pointer"
                        >
                          <span>Archivia</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Sei sicuro di voler eliminare la segnalazione #${report.id}?`)) {
                          deletePluginBugReport(report.id);
                          setBugActionNotice(`Report #${report.id} eliminato.`);
                          setTimeout(() => setBugActionNotice(null), 4000);
                        }
                      }}
                      className="p-2 rounded-xl bg-neutral-950 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                      title="Elimina bug report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ));
            })()}
          </div>

        </div>
      )}

      {/* TAB: GESTIONE DONAZIONI PLUGIN & EARLY SUPPORTERS (SOLO MASTER ACCOUNT) */}
      {activeTab === 'plugin_donations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Action notification banner */}
          {donationActionNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center justify-between">
              <span>{donationActionNotice}</span>
              <button 
                type="button" 
                onClick={() => setDonationActionNotice(null)}
                className="text-emerald-400 hover:text-white font-bold ml-4"
              >
                Chiudi
              </button>
            </div>
          )}

          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="text-xl font-heading font-bold text-white">
                  Donazioni Plugin & Early Supporters
                </h3>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Monitoraggio transazioni PayPal, registrazione donazioni e sblocco Lifetime Pass (&ge; 20€) per 171 Plugin Innovation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                PayPal: <strong>{siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}</strong>
              </span>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Totale Donazioni</span>
              <span className="text-2xl font-heading font-black text-white">{pluginDonations.length}</span>
              <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">Tutti i record registrati</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-amber-500/40">
              <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">🌟 Early Supporters (&ge;20€)</span>
              <span className="text-2xl font-heading font-black text-amber-400">
                {(() => {
                  const emails = Array.from(new Set(pluginDonations.map(d => (d.userEmail || '').trim().toLowerCase()).filter(Boolean)));
                  const cumulativeQualifiers = emails.filter(email => {
                    const sum = pluginDonations
                      .filter(d => (d.userEmail || '').trim().toLowerCase() === email && (d.status === 'convalidata' || d.paymentStatus === 'saldato'))
                      .reduce((s, d) => s + d.amount, 0);
                    return sum >= 20;
                  }).length;
                  const directPasses = pluginDonations.filter(d => d.isEarlySupporterPass && (d.status === 'convalidata' || d.paymentStatus === 'saldato')).length;
                  return Math.max(cumulativeQualifiers, directPasses);
                })()}
              </span>
              <span className="text-[10px] font-mono text-amber-300 block mt-0.5">Con Lifetime Pass a vita (cumulati &ge;20€)</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-emerald-500/40">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">Convalidate (Saldate)</span>
              <span className="text-2xl font-heading font-black text-emerald-400">
                {pluginDonations.filter(d => d.status === 'convalidata' || d.paymentStatus === 'saldato').length}
              </span>
              <span className="text-[10px] font-mono text-emerald-300 block mt-0.5">Pagamento verificato</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-1">Incasso Donazioni Totale</span>
              <span className="text-2xl font-heading font-black text-white">
                €{pluginDonations
                  .filter(d => d.status === 'convalidata' || d.paymentStatus === 'saldato')
                  .reduce((sum, d) => sum + d.amount, 0)
                  .toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 block mt-0.5">Ricevuti su PayPal</span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `Tutte (${pluginDonations.length})` },
                { id: 'early_supporters', label: `Early Supporters (${pluginDonations.filter(d => d.isEarlySupporterPass || d.amount >= 20).length})` },
                { id: 'convalidate', label: `Convalidate (${pluginDonations.filter(d => d.status === 'convalidata' || d.paymentStatus === 'saldato').length})` },
                { id: 'in_attesa', label: `In Attesa (${pluginDonations.filter(d => d.status === 'in_attesa_pagamento' && d.paymentStatus !== 'saldato').length})` },
              ].map((filterTab) => (
                <button
                  key={filterTab.id}
                  type="button"
                  onClick={() => setDonationFilter(filterTab.id as typeof donationFilter)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    donationFilter === filterTab.id
                      ? 'bg-amber-500 text-black font-bold shadow-md'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {filterTab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                placeholder="Cerca per codice, email, TX..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Donations List */}
          <div className="space-y-3">
            {(() => {
              const filtered = pluginDonations.filter((don) => {
                if (donationFilter === 'early_supporters' && !don.isEarlySupporterPass && don.amount < 20) return false;
                if (donationFilter === 'convalidate' && don.status !== 'convalidata' && don.paymentStatus !== 'saldato') return false;
                if (donationFilter === 'in_attesa' && (don.status === 'convalidata' || don.paymentStatus === 'saldato')) return false;

                if (donationSearch.trim()) {
                  const q = donationSearch.toLowerCase();
                  const matchCode = don.donationCode.toLowerCase().includes(q);
                  const matchEmail = don.userEmail.toLowerCase().includes(q);
                  const matchName = don.userName.toLowerCase().includes(q);
                  const matchTx = (don.paypalTransactionId || '').toLowerCase().includes(q);
                  if (!matchCode && !matchEmail && !matchName && !matchTx) return false;
                }

                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center font-mono text-xs text-neutral-500">
                    Nessuna donazione trovata per i filtri selezionati.
                  </div>
                );
              }

              return filtered.map((don) => {
                const isSaldato = don.status === 'convalidata' || don.paymentStatus === 'saldato';
                const userCleanEmail = (don.userEmail || '').trim().toLowerCase();
                const donorConfirmed = pluginDonations.filter(
                  (d) => (d.userEmail || '').trim().toLowerCase() === userCleanEmail && (d.status === 'convalidata' || d.paymentStatus === 'saldato')
                );
                const donorCumulativeSum = donorConfirmed.reduce((sum, d) => sum + d.amount, 0);
                const isEarly = don.isEarlySupporterPass || don.amount >= 20 || donorCumulativeSum >= 20;

                return (
                  <div
                    key={don.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all text-xs font-mono space-y-3 ${
                      isSaldato
                        ? 'bg-neutral-900/70 border-neutral-800'
                        : 'bg-gradient-to-r from-amber-950/25 via-neutral-900 to-neutral-950 border-amber-500/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">#{don.donationCode}</span>
                        <span className="text-neutral-400 text-[11px]">
                          {new Date(don.createdAt).toLocaleString('it-IT')}
                        </span>
                        {isEarly && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                            🌟 Early Supporter (Lifetime Pass)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-base font-heading font-black text-white">
                          €{don.amount.toFixed(2)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isSaldato
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                          }`}
                        >
                          {isSaldato ? '✓ Saldato / Convalidato' : '● In Attesa Convalida'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 text-[10px] uppercase block">Donatore:</span>
                        <strong className="text-white">{don.userName}</strong> ({don.userEmail})
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500 text-[10px] uppercase block">Totale Cumulato Utente:</span>
                        <span className="text-amber-400 font-bold">€{donorCumulativeSum.toFixed(2)}</span>
                        <span className="text-neutral-400 text-[11px]"> / €20.00 ({donorConfirmed.length} saldate)</span>
                      </div>
                    </div>

                    {don.notes && (
                      <div className="text-neutral-400 italic text-[11px] bg-black/40 p-2 rounded-lg border border-neutral-800">
                        "{don.notes}"
                      </div>
                    )}

                    {/* Transaction Details or Quick Verification for Master */}
                    <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
                      {isSaldato ? (
                        <div className="flex flex-wrap items-center gap-3 text-[11px]">
                          <span className="text-neutral-400">
                            TX PayPal: <strong className="text-emerald-400 font-mono">{don.paypalTransactionId || 'VERIFICATA'}</strong>
                          </span>
                          {don.paypalPaidAt && (
                            <span className="text-neutral-500">
                              (Convalidata: {new Date(don.paypalPaidAt).toLocaleString('it-IT')})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            placeholder="Codice Transazione PayPal (es. 9XY81742...)"
                            value={verifyingDonationId === don.id ? manualDonationTxInput : ''}
                            onFocus={() => {
                              setVerifyingDonationId(don.id);
                              setManualDonationTxInput('');
                            }}
                            onChange={(e) => {
                              setVerifyingDonationId(don.id);
                              setManualDonationTxInput(e.target.value);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-black border border-neutral-700 text-white text-xs font-mono focus:border-amber-500 focus:outline-none min-w-[240px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const tx = (verifyingDonationId === don.id ? manualDonationTxInput : '').trim();
                              try {
                                const confirmed = confirmPluginDonationPayPal(don.id, tx || undefined, don.amount);
                                if (confirmed) {
                                  setDonationActionNotice(
                                    `Donazione #${don.donationCode} convalidata con successo! ${confirmed.isEarlySupporterPass ? 'Badge Early Supporter Lifetime Pass attivato sul profilo.' : ''}`
                                  );
                                  setTimeout(() => setDonationActionNotice(null), 5000);
                                  setVerifyingDonationId(null);
                                  setManualDonationTxInput('');
                                }
                              } catch (err: any) {
                                alert(err.message || 'Errore nella convalida della donazione.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase cursor-pointer"
                          >
                            Convalida Saldo & Assegna Badge
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Sei sicuro di voler eliminare la donazione #${don.donationCode}?`)) {
                            deletePluginDonation(don.id);
                            setDonationActionNotice(`Donazione #${don.donationCode} eliminata.`);
                            setTimeout(() => setDonationActionNotice(null), 4000);
                          }
                        }}
                        className="p-2 rounded-xl bg-neutral-950 hover:bg-red-950/60 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors cursor-pointer"
                        title="Elimina donazione"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}

      {/* TAB 4: STORICO & ARCHIVIO COMPLETO SESSIONI */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-heading font-bold text-white">
                  Storico & Archivio Completo Sessioni
                </h3>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Tutte le sessioni confermate, completate o annullate con riepilogo dati cliente, tracking PayPal e sincronizzazione con Google Calendar di 171 Studio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddDirectSession(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nuova Sessione Fuori Sito</span>
              </button>

              {/* Google Calendar Connection Status Badge & Action */}
              <div className="flex items-center gap-2 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
                  <span className={`w-2 h-2 rounded-full ${isGoogleCalendarConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="text-neutral-300">
                    Google Calendar: {isGoogleCalendarConnected ? 'Connesso' : 'Pronto (OAuth)'}
                  </span>
                </div>

                {!isGoogleCalendarConnected && (
                  <button
                    type="button"
                    onClick={connectGoogleCalendar}
                    className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    title="Connetti Google Calendar per abilitare la sincronizzazione automatica bidirezionale"
                  >
                    Connetti Calendar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar & Sub-Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cerca per artista, codice ordine (#171-ORD-...), email o telefono..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white font-mono placeholder:text-neutral-600 focus:border-amber-400 outline-none"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              {(['tutte', 'confermata', 'completata', 'annullata'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setHistoryFilter(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    historyFilter === tab
                      ? 'bg-amber-500 text-black font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {tab === 'tutte' ? 'Tutte nello Storico' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Historical KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <span className="text-neutral-500 uppercase block">Archiviate</span>
              <span className="text-xl font-heading font-bold text-white mt-0.5 block">{historicalBookings.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <span className="text-emerald-500 uppercase block">Confermate</span>
              <span className="text-xl font-heading font-bold text-emerald-400 mt-0.5 block">
                {historicalBookings.filter(b => b.status === 'confermata').length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <span className="text-blue-500 uppercase block">Completate</span>
              <span className="text-xl font-heading font-bold text-blue-400 mt-0.5 block">
                {historicalBookings.filter(b => b.status === 'completata').length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800">
              <span className="text-amber-500 uppercase block">Volume Incassi</span>
              <span className="text-xl font-heading font-bold text-amber-400 mt-0.5 block">
                {historicalBookings.filter(b => b.status !== 'annullata').reduce((acc, b) => acc + (b.estimatedPrice || 0), 0)} €
              </span>
            </div>
          </div>

          {/* List of Historical Bookings */}
          {filteredHistoricalBookings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-500 font-mono text-xs">
              {historicalBookings.length === 0 
                ? 'Nessuna sessione archiviata nello storico. Quando confermerai o annullerai una richiesta dal Desk Prenotazioni, apparirà qui con tutti i dettagli.'
                : 'Nessun risultato trovato per i filtri selezionati.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistoricalBookings.map((b) => {
                const paypalCheckoutUrl = b.paypalPaymentUrl || getPayPalPaymentUrl(b.estimatedPrice, b.orderCode || b.id, siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL);
                const orderCodeDisplay = b.orderCode || `#${b.id.slice(-6).toUpperCase()}`;
                const calendarUrl = b.calendarEventUrl || getGoogleCalendarWebUrl(b);

                return (
                  <div
                    key={b.id}
                    className="p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-heading font-bold text-lg text-white">
                          {b.userName}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-md bg-neutral-950 text-amber-300 font-mono text-xs border border-neutral-700 font-bold">
                          {orderCodeDisplay}
                        </span>

                        {/* Status badge */}
                        <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                          b.status === 'confermata' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                          b.status === 'completata' ? 'bg-blue-950 text-blue-400 border-blue-500/40' :
                          'bg-red-950 text-red-400 border-red-500/40'
                        }`}>
                          {b.status}
                        </span>

                        {/* Direct Studio Session Badge */}
                        {b.source === 'studio_diretto' ? (
                          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1 font-bold">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>DIRETTA IN STUDIO</span>
                          </span>
                        ) : null}

                        {/* Payment badge & method */}
                        <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                          b.paymentStatus === 'saldato' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                          b.paymentStatus === 'pagamento_in_studio' ? 'bg-amber-950 text-amber-300 border-amber-500/30' :
                          'bg-neutral-800 text-neutral-300 border-neutral-700'
                        }`}>
                          {b.paymentStatus === 'saldato' ? '✓ Saldato' : b.paymentStatus === 'pagamento_in_studio' ? 'In Studio' : 'In attesa'}
                          {b.paymentMethod && ` (${b.paymentMethod.replace('_', ' ')})`}
                        </span>

                        {/* Google Calendar Status badge */}
                        {b.calendarSynced ? (
                          <a
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono hover:bg-emerald-500/30 transition-colors"
                            title="Apri evento in Google Calendar"
                          >
                            <Calendar className="w-3 h-3 text-emerald-400" />
                            <span>In Google Calendar</span>
                            <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncCalendarSingle(b)}
                            disabled={syncingBookingId === b.id}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-700 hover:border-amber-500/40 text-[10px] font-mono transition-colors cursor-pointer"
                            title="Sincronizza sessione su Google Calendar"
                          >
                            <Calendar className="w-3 h-3 text-amber-400" />
                            <span>{syncingBookingId === b.id ? 'Sincronizzazione...' : 'Sincronizza Calendar'}</span>
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-neutral-300 font-mono space-y-1">
                        <p>
                          <span className="text-neutral-500">Servizio / Lavorazione:</span> <strong className="text-amber-400">{b.serviceTitle}</strong>
                          {b.artistProjectName && (
                            <span className="text-neutral-400 ml-2">[{b.artistProjectName}]</span>
                          )}
                        </p>
                        {b.servicesRendered && b.servicesRendered.length > 0 && (
                          <div className="flex flex-wrap gap-1 py-0.5">
                            {b.servicesRendered.map((s, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-neutral-950 text-amber-300/90 border border-neutral-800">
                                • {s}
                              </span>
                            ))}
                          </div>
                        )}
                        <p><span className="text-neutral-500">Data & Orario:</span> <span className="text-white font-semibold">{b.date} alle {b.time}</span> ({b.hours}h di sessione)</p>
                        <p><span className="text-neutral-500">Contatti:</span> <span className="text-neutral-200">{b.userEmail}</span> | <span>{b.userPhone || 'Presso 171 Studio'}</span></p>
                        <p><span className="text-neutral-500">Importo Concordato / Pagato:</span> <strong className="text-emerald-400 font-bold text-sm">{b.estimatedPrice} €</strong></p>
                        
                        {b.cancellationReason && (
                          <p className="text-red-400 bg-red-950/40 border border-red-500/30 p-2 rounded-lg">
                            Motivo annullamento: {b.cancellationReason}
                          </p>
                        )}

                        {b.processedAt && (
                          <p className="text-[10px] text-neutral-500 pt-1">
                            Archiviata il: {new Date(b.processedAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })} da {b.processedBy || MASTER_EMAIL}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Historical Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 w-full lg:w-auto">
                      <div className="flex items-center gap-2">
                        {/* Open Complete Dossier */}
                        <button
                          type="button"
                          onClick={() => setSelectedBookingDossier(b)}
                          className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-mono uppercase flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-700"
                          title="Visualizza scheda completa sessione con tutti i dettagli e opzione stampa"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Scheda Completa</span>
                        </button>

                        {/* Re-send email */}
                        <button
                          type="button"
                          onClick={() => sendConfirmationEmail(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono uppercase flex items-center gap-1 transition-all border border-neutral-800"
                          title="Re-invia email con codice e link PayPal all'artista"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          <span>Re-invia</span>
                        </button>

                        {/* 1-Click Gmail Web */}
                        <button
                          type="button"
                          onClick={() => openGmailWebCompose(b.id, 'confirmation')}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-mono uppercase flex items-center gap-1 transition-all cursor-pointer"
                          title="Apri email di conferma già compilata su Gmail Web (1 Click)"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-400" />
                          <span>Gmail Web</span>
                        </button>

                        {/* 1-Click Universal Calendar .ICS */}
                        <button
                          type="button"
                          onClick={() => downloadBookingCalendarIcs(b.id)}
                          className="p-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all cursor-pointer"
                          title="Scarica file .ICS per Apple Calendar o Outlook"
                        >
                          <Download className="w-3.5 h-3.5 text-neutral-400" />
                        </button>

                        {/* Mark completed */}
                        <button
                          type="button"
                          onClick={() => updateBookingStatus(b.id, b.status === 'completata' ? 'confermata' : 'completata')}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/40 text-xs font-mono uppercase transition-all cursor-pointer"
                          title="Segna come completata o riapri"
                        >
                          {b.status === 'completata' ? 'Riapri' : 'Completata'}
                        </button>
                      </div>

                      {/* Payment & Restore actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(paypalCheckoutUrl, b.id)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-amber-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                          title="Copia il link diretto di pagamento PayPal con l'importo esatto"
                        >
                          {copiedOrderId === b.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Link Copiato!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>PayPal ({b.estimatedPrice}€)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateBookingPayment(b.id, b.paymentStatus === 'saldato' ? 'in_attesa' : 'saldato')}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono uppercase border transition-all ${
                            b.paymentStatus === 'saldato'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                          }`}
                        >
                          {b.paymentStatus === 'saldato' ? '✓ Saldato' : 'Segna Saldato'}
                        </button>

                        {/* Restore to Desk */}
                        <button
                          type="button"
                          onClick={() => {
                            restoreBookingToDesk(b.id);
                            setDeskActionNotice(`Sessione #${b.orderCode} ripristinata nel Desk Prenotazioni attive.`);
                          }}
                          className="p-2 rounded-xl bg-neutral-950 hover:bg-amber-500 hover:text-black text-neutral-400 border border-neutral-800 transition-colors cursor-pointer"
                          title="Ripristina al Desk Operativo (In Attesa)"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete permanently */}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Vuoi eliminare definitivamente la sessione #${b.orderCode} di ${b.userName}?`)) {
                              deleteBookingPermanently(b.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-neutral-950 hover:bg-red-500 hover:text-white text-neutral-500 border border-neutral-800 transition-colors cursor-pointer"
                          title="Elimina definitivamente dall'archivio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: ANALYTICS & TREND PRENOTAZIONI CON RECHARTS */}
      {activeTab === 'analytics' && (
        <BookingAnalyticsDashboard bookings={bookings} />
      )}

      {/* TAB 4: REGISTRO EMAIL AUTOMATICHE & EDITOR TESTI EMAIL */}
      {activeTab === 'emails' && (
        <div className="space-y-8">
          {/* BANNER ARCHITETTURA INVIO SENZA GOOGLE OAUTH */}
          <div className="p-6 rounded-3xl bg-neutral-900/90 border border-blue-500/40 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-heading font-bold text-white">
                    Sistema Invio Email & Automazioni (Senza Google OAuth)
                  </h4>
                  <span className="text-[10px] font-mono text-blue-300">
                    Nessuna configurazione complessa di Google Cloud richiesta per l'invio e il calendario
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold">
                  ✓ GMAIL WEB 1-CLICK ATTIVO
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono font-bold">
                  ✓ CALENDARIO .ICS & WEB ATTIVO
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 font-mono leading-relaxed">
              Dato che il sito è distribuito come Single Page Application statica su GitHub Pages senza backend proprietario, le email e i calendari operano tramite:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-1">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <strong className="text-blue-400 block flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>1. Gmail Web (1 Click)</span>
                </strong>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Apre la tua casella <code className="text-white">mail.google.com</code> autenticata con destinatario, codice ordine, orari e link PayPal già formattati nel corpo. Premi solo "Invia"!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <strong className="text-emerald-400 block flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>2. App Posta (Mailto)</span>
                </strong>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Apre l'app predefinita del computer o smartphone (Apple Mail su iPhone/Mac, Outlook su Windows, Thunderbird).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <strong className="text-amber-400 block flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>3. Webhook / EmailJS</span>
                </strong>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  Opzionale: collega un webhook gratuito (Make, Zapier, Formspree) o EmailJS per invio 100% in background senza click manuali.
                </p>
              </div>
            </div>
          </div>

          {/* CONFIGURAZIONE WEBHOOK & EMAILJS (OPZIONALE) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  CONNETTORE ESTERNO OPZIONALE (AUTOMAZIONE ZERO-CLICK)
                </span>
                <h4 className="text-lg font-heading font-bold text-white flex items-center gap-2 mt-0.5">
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Configurazione Webhook & EmailJS</span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !formData.emailWebhookUrl}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-50 text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                  title="Invia una richiesta POST di prova all'URL specificato"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isTestingWebhook ? 'Verifica in corso...' : 'Testa Webhook Ora'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateSiteContent({
                      ...siteContent,
                      emailWebhookUrl: formData.emailWebhookUrl?.trim(),
                      emailjsServiceId: formData.emailjsServiceId?.trim(),
                      emailjsTemplateIdReceipt: formData.emailjsTemplateIdReceipt?.trim(),
                      emailjsTemplateIdConfirmation: formData.emailjsTemplateIdConfirmation?.trim(),
                      emailjsPublicKey: formData.emailjsPublicKey?.trim(),
                    });
                    setDeskActionNotice('✅ Configurazione Webhook & EmailJS salvata con successo nel CMS!');
                    setTimeout(() => setDeskActionNotice(null), 5000);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Configurazione</span>
                </button>
              </div>
            </div>

            {webhookTestNotice && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-amber-500/40 text-xs font-mono text-amber-300">
                {webhookTestNotice}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1 md:col-span-2">
                <label className="block text-[11px] uppercase text-neutral-400">
                  URL Webhook Automatico (Make.com / Zapier / Formspree / Cloudflare Worker)
                </label>
                <input
                  type="url"
                  placeholder="https://hook.eu2.make.com/... oppure https://formspree.io/f/..."
                  value={formData.emailWebhookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, emailWebhookUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-amber-400 outline-none font-mono"
                />
                <span className="text-[10px] text-neutral-500 block">
                  Quando un cliente prenota o il master conferma, verrà inviato un payload JSON completo a questo endpoint.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase text-neutral-400">
                  EmailJS Service ID (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="es. service_171studio"
                  value={formData.emailjsServiceId || ''}
                  onChange={(e) => setFormData({ ...formData, emailjsServiceId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase text-neutral-400">
                  EmailJS Public Key (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="es. user_xxxxxxxxxxxxxxx"
                  value={formData.emailjsPublicKey || ''}
                  onChange={(e) => setFormData({ ...formData, emailjsPublicKey: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase text-neutral-400">
                  EmailJS Template ID (Ricevuta Prenotazione)
                </label>
                <input
                  type="text"
                  placeholder="es. template_receipt_171"
                  value={formData.emailjsTemplateIdReceipt || ''}
                  onChange={(e) => setFormData({ ...formData, emailjsTemplateIdReceipt: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] uppercase text-neutral-400">
                  EmailJS Template ID (Conferma Master)
                </label>
                <input
                  type="text"
                  placeholder="es. template_confirmed_171"
                  value={formData.emailjsTemplateIdConfirmation || ''}
                  onChange={(e) => setFormData({ ...formData, emailjsTemplateIdConfirmation: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* MASTER EMAIL TEMPLATE EDITOR */}
          <form onSubmit={handleSaveEmailTemplates} className="p-6 sm:p-8 rounded-3xl bg-neutral-900/80 border border-amber-500/40 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  PERSONALIZZAZIONE TESTI EMAIL AUTOMATICHE (MASTER)
                </span>
                <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2 mt-0.5">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <span>Modifica il Testo delle Email Automatiche</span>
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Personalizza l'oggetto, il corpo del messaggio e la firma delle email automatiche inviate ai clienti. Variabili dinamiche supportate:{' '}
                  <code className="text-amber-300">{'{nome}'}</code>,{' '}
                  <code className="text-amber-300">{'{codice_ordine}'}</code>,{' '}
                  <code className="text-amber-300">{'{servizio}'}</code>,{' '}
                  <code className="text-amber-300">{'{data}'}</code>,{' '}
                  <code className="text-amber-300">{'{ora}'}</code>,{' '}
                  <code className="text-amber-300">{'{importo}'}</code>,{' '}
                  <code className="text-amber-300">{'{sconto}'}</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetEmailTemplates}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ripristina Default</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Testi Email</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email 1: Prenotazione Ricevuta */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                    1. Email Automatica alla Prenotazione (Verifica Disponibilità)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                    PRENOTAZIONE_RICEVUTA
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Oggetto Email 1
                  </label>
                  <input
                    type="text"
                    value={emailTemplatesForm.receiptSubject || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, receiptSubject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Intestazione Principale Email 1
                  </label>
                  <input
                    type="text"
                    value={emailTemplatesForm.receiptHeading || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, receiptHeading: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Messaggio Principale di Ricezione
                  </label>
                  <textarea
                    rows={3}
                    value={emailTemplatesForm.receiptIntro || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, receiptIntro: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Nota Prossimo Step / Chiusura Email 1
                  </label>
                  <textarea
                    rows={3}
                    value={emailTemplatesForm.receiptNextStep || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, receiptNextStep: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Email 2: Conferma Ordine Ufficiale */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold">
                    2. Email Automatica alla Conferma del Master (Con Link PayPal)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                    PRENOTAZIONE_CONFERMATA
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Oggetto Email 2 (Conferma Ordine)
                  </label>
                  <input
                    type="text"
                    value={emailTemplatesForm.confirmationSubject || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, confirmationSubject: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Testo Principale Conferma Sessione
                  </label>
                  <textarea
                    rows={3}
                    value={emailTemplatesForm.confirmationIntro || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, confirmationIntro: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Testo Pulsante / Invito Pagamento PayPal Anticipato
                  </label>
                  <input
                    type="text"
                    value={emailTemplatesForm.confirmationPayPalCta || ''}
                    onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, confirmationPayPalCta: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Nome Firma Ufficiale (Email Conferma)
                    </label>
                    <input
                      type="text"
                      value={emailTemplatesForm.confirmationSignature || ''}
                      onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, confirmationSignature: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-amber-400 font-bold focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                      Firma Staff (Email Ricezione)
                    </label>
                    <input
                      type="text"
                      value={emailTemplatesForm.receiptSignature || ''}
                      onChange={(e) => setEmailTemplatesForm({ ...emailTemplatesForm, receiptSignature: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-heading font-bold text-white">
                Registro Email Automatiche Inviate (Outbox)
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Tutte le email automatiche inviate all'email registrata dell'artista con codice ordine e richiesta di saldo PayPal ({siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}).
              </p>
            </div>

            <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
              Totale inviate: {emailLogs.length}
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-neutral-900/50 border border-neutral-800 text-neutral-500 font-mono text-xs">
              Nessuna email registrata nell'outbox. Le email verranno registrate automaticamente non appena un utente prenota o viene confermata una sessione.
            </div>
          ) : (
            <div className="space-y-4">
              {emailLogs.map((log) => (
                <div 
                  key={log.id}
                  className="p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/30 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        log.type === 'PRENOTAZIONE_CONFERMATA' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.type.replace('_', ' ')}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        log.deliveryMethod === 'gmail_api'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : log.deliveryMethod === 'webhook'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : log.deliveryMethod === 'emailjs'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}>
                        {log.deliveryMethod === 'gmail_api'
                          ? `✓ INVIATA VIA GMAIL API (${log.gmailMessageId || 'OK'})`
                          : log.deliveryMethod === 'webhook'
                          ? '✓ INVIATA VIA WEBHOOK'
                          : log.deliveryMethod === 'emailjs'
                          ? '✓ INVIATA VIA EMAILJS'
                          : '● IN CODA (CLICCA GMAIL WEB)'}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {log.subject}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-500">
                      Inviata il: {log.sentAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono text-neutral-300">
                    <div>
                      <span className="text-neutral-500 block">Mittente Ufficiale:</span>
                      <span className="text-amber-400 font-semibold">{log.senderEmail || MASTER_EMAIL}</span>
                    </div>

                    <div>
                      <span className="text-neutral-500 block">Destinatario:</span>
                      <span className="text-white font-semibold">{log.recipientName} ({log.recipientEmail})</span>
                    </div>

                    <div>
                      <span className="text-neutral-500 block">Codice Ordine:</span>
                      <span className="text-amber-400 font-bold">{log.orderCode}</span>
                    </div>

                    <div>
                      <span className="text-neutral-500 block">Richiesta Saldo PayPal:</span>
                      <span className="text-emerald-400 font-bold">{log.amount} € su {log.paypalEmail}</span>
                    </div>
                  </div>

                  {/* Body Preview toggle */}
                  <div className="pt-2">
                    <details className="text-xs font-mono text-neutral-400 group">
                      <summary className="cursor-pointer text-amber-400 hover:text-amber-300 select-none flex items-center gap-1">
                        <span>Mostra Testo Completo dell'Email Inviata</span>
                      </summary>
                      <pre className="mt-3 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {log.summary}
                      </pre>
                    </details>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    {/* 1-Click Gmail Web */}
                    <button
                      type="button"
                      onClick={() => {
                        if (log.gmailWebComposeUrl) {
                          window.open(log.gmailWebComposeUrl, '_blank');
                        } else {
                          openGmailWebCompose(log.bookingId, log.type === 'PRENOTAZIONE_CONFERMATA' ? 'confirmation' : 'receipt');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                      title="Apri email pre-compilata su mail.google.com in 1 click"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Invia con Gmail Web (1 Click)</span>
                    </button>

                    {/* Mailto link */}
                    <button
                      type="button"
                      onClick={() => {
                        if (log.mailtoUrl) {
                          window.location.href = log.mailtoUrl;
                        } else {
                          openMailtoCompose(log.bookingId, log.type === 'PRENOTAZIONE_CONFERMATA' ? 'confirmation' : 'receipt');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Apri con client di posta (Apple Mail / Outlook)"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>App Posta</span>
                    </button>

                    {/* Copy text */}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`Riepilogo Notifica 171 Studio Messina:\n\n${log.summary}\n\nLink Pagamento PayPal: ${log.paypalLink}`);
                        setDeskActionNotice(`✅ Testo notifica ordine #${log.orderCode} copiato negli appunti!`);
                        setTimeout(() => setDeskActionNotice(null), 4000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Copia testo per WhatsApp o chat privata"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copia Testo</span>
                    </button>

                    {/* Re-send via API / Webhook */}
                    <button
                      type="button"
                      onClick={async () => {
                        const res =
                          log.type === 'PRENOTAZIONE_CONFERMATA'
                            ? await sendConfirmationEmailViaGmail(log.bookingId)
                            : await sendReceiptEmailViaGmail(log.bookingId);
                        if (res.success) {
                          setDeskActionNotice(
                            `✅ Email inviata con successo via Webhook / API a ${log.recipientEmail}!`
                          );
                        } else {
                          setDeskActionNotice(`Avviso Invio: ${res.error}`);
                        }
                        setTimeout(() => setDeskActionNotice(null), 6000);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Invia via Webhook / API</span>
                    </button>

                    <a
                      href={log.paypalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-neutral-950 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verifica PayPal ({log.amount}€)</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GESTIONE PLUGIN INNOVATIO & UPLOAD CARTELLE .ZIP */}
      {activeTab === 'plugins' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-amber-400" />
                <span>Suite 171 Plugin Innovatio & Caricamento Cartelle .ZIP</span>
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                Carica le cartelle <strong className="text-amber-300">.ZIP</strong> dei plugin per il download gratuito dei clienti. Dopo ogni download si aprirà automaticamente la pagina di ringraziamento, feedback e donazione libera PayPal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddPlugin(!showAddPlugin)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuovo Plugin / Carica .ZIP</span>
            </button>
          </div>

          {showAddPlugin && (
            <form onSubmit={handleCreatePlugin} className="p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-amber-500/40 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <span className="text-xs font-mono uppercase text-amber-400 font-bold">
                  Aggiungi Nuovo Plugin & Carica Archivio .ZIP
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  Download Gratuito Clienti + Pagina Feedback/Donazione
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Nome Plugin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. 171 Tape Saturator"
                    value={newPluginName}
                    onChange={(e) => setNewPluginName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Badge Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Es. VOCAL FX, TAPE SATURATION"
                    value={newPluginBadge}
                    onChange={(e) => setNewPluginBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Versione Release
                  </label>
                  <input
                    type="text"
                    placeholder="v1.0.0"
                    value={newPluginVersion}
                    onChange={(e) => setNewPluginVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                    Stato
                  </label>
                  <select
                    value={newPluginStatus}
                    onChange={(e) => setNewPluginStatus(e.target.value as PluginItem['status'])}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-amber-400 font-mono text-xs"
                  >
                    <option value="DISPONIBILE">DISPONIBILE</option>
                    <option value="BETA IN TESTING">BETA IN TESTING</option>
                    <option value="IN SVILUPPO">IN SVILUPPO</option>
                    <option value="PROTOTIPO DSP">PROTOTIPO DSP</option>
                  </select>
                </div>
              </div>

              {/* .ZIP File Upload Box */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-dashed border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      Carica Cartella Compressa (.ZIP) del Plugin
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 block">
                      {newPluginZipName
                        ? `✓ File selezionato: ${newPluginZipName} (${newPluginZipSize})`
                        : 'Seleziona dal tuo computer la cartella .zip contenente VST3 / AU / Manuale.'}
                    </span>
                  </div>
                </div>

                <label className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>{newPluginZipName ? 'Cambia File .ZIP' : 'Sfoglia & Carica .ZIP'}</span>
                  <input
                    type="file"
                    accept=".zip,.rar,.7z,.pkg,.dmg,.exe,application/zip"
                    onChange={handleNewPluginZipSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
                  Descrizione Funzionalità Audio DSP *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descrivi l'elaborazione del segnale e lo scopo del plugin..."
                  value={newPluginDesc}
                  onChange={(e) => setNewPluginDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlugin(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-mono cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs font-mono uppercase cursor-pointer"
                >
                  Pubblica Plugin & .ZIP
                </button>
              </div>
            </form>
          )}

          {/* Plugin Cards with Direct .ZIP Upload / Update */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {siteContent.plugins.map((plugin) => (
              <div 
                key={plugin.id}
                className="p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">
                      {plugin.badge} • {plugin.version || 'v1.0.0'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {plugin.downloadCount || 0} Download
                    </span>
                  </div>

                  <h4 className="text-xl font-heading font-bold text-white mb-1">
                    {plugin.name}
                  </h4>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-block mb-3">
                    {plugin.status}
                  </span>

                  <p className="text-xs text-neutral-300 font-light leading-relaxed mb-4">
                    {plugin.description}
                  </p>

                  {/* Active .ZIP Package Info & Upload Button */}
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-neutral-400 flex items-center gap-1.5 truncate">
                        <FolderArchive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-white truncate">
                          {plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}.zip`}
                        </span>
                      </span>
                      <span className="text-emerald-400 shrink-0">
                        {plugin.zipFileSize || '14.2 MB'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold uppercase text-center flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingZipForPluginId === plugin.id
                            ? 'Caricamento...'
                            : plugin.zipDataUrl
                            ? 'Aggiorna Cartella .ZIP'
                            : 'Carica Cartella .ZIP'}
                        </span>
                        <input
                          type="file"
                          accept=".zip,.rar,.7z,.pkg,.dmg,.exe,application/zip"
                          onChange={(e) => handleExistingPluginZipUpload(plugin, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => triggerPluginZipFileDownload(plugin)}
                        className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
                        title="Scarica e testa il pacchetto .ZIP"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
                  <span className="text-[11px] font-mono text-neutral-500">
                    {plugin.zipDataUrl ? '✓ Archivio Master Caricato' : '✓ Pacchetto .ZIP Attivo'}
                  </span>

                  <button
                    type="button"
                    onClick={() => deletePlugin(plugin.id)}
                    className="p-2 rounded-xl bg-neutral-950 text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer"
                    title="Rimuovi plugin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Client Feedbacks collected from the Post-Download Thank You Page */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span>Feedback Ricevuti sui Plugin ({pluginFeedbacks.length})</span>
                </h4>
                <p className="text-xs text-neutral-400 font-mono">
                  Recensioni e suggerimenti inviati dagli utenti nella pagina post-download gratuito dei plugin.
                </p>
              </div>
            </div>

            {pluginFeedbacks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 text-center text-xs font-mono text-neutral-500">
                Nessun feedback ancora inviato. Appariranno qui non appena gli utenti lasceranno una recensione dopo il download gratuito.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pluginFeedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">{fb.pluginName}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${idx < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-200 italic">"{fb.comment}"</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
                      <span>
                        {fb.userName} ({fb.userEmail}) {fb.dawUsed ? `• DAW: ${fb.dawUsed}` : ''}
                      </span>
                      <span>{new Date(fb.createdAt).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: REGISTRO ATTIVITÀ UTENTI (AUDIT LOG) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-white">
              Registro Attività in Tempo Reale
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Tutte le azioni svolte sul sito (accessi, prenotazioni, invio email, download plugin, modifiche master) registrate per l'account master.
            </p>
          </div>

          <div className="rounded-3xl bg-neutral-900/60 border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800">
                  <tr>
                    <th className="p-4">Orario / Data</th>
                    <th className="p-4">Utente</th>
                    <th className="p-4">Azione</th>
                    <th className="p-4">Dettagli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="p-4 text-neutral-500 whitespace-nowrap">
                        {act.timestamp}
                      </td>
                      <td className="p-4 text-white">
                        <span className="font-semibold block">{act.userName}</span>
                        <span className="text-[10px] text-neutral-400">{act.userEmail}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.action === 'BOOKING_CREATED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          act.action === 'EMAIL_SENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          act.action === 'PLUGIN_DOWNLOADED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          act.action === 'LOGIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                          act.action === 'CMS_EDIT' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                          'bg-neutral-800 text-neutral-300'
                        }`}>
                          {act.action}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-300 font-light">
                        {act.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB UTENTI REGISTRATI (PANNELLO MASTER) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-neutral-900 border border-neutral-800">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                    Account e Artisti Registrati
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    {registeredUsers.length} utenti sincronizzati nel database di 171 Studio
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Cerca nome o email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl bg-black border border-neutral-800 text-xs font-mono text-white placeholder-neutral-500 focus:border-blue-500 outline-none w-56 sm:w-72"
                />
              </div>
              {userSearchQuery && (
                <button
                  type="button"
                  onClick={() => setUserSearchQuery('')}
                  className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white text-xs font-mono"
                  title="Pulisci ricerca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl">
            {registeredUsers.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-mono text-sm space-y-3">
                <Users className="w-10 h-10 mx-auto text-neutral-600 opacity-60" />
                <p className="text-white font-semibold text-base">Nessun utente o artista registrato al momento</p>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Il sito e il database Cloud Firestore sono attivi e sincronizzati. Non appena un cliente creerà il proprio account (con Google o Registrazione Email) oppure effettuerà una prenotazione in studio, apparirà automaticamente qui in tempo reale con tutte le relative statistiche.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-black/40 text-neutral-400 font-mono uppercase text-[10px] tracking-wider">
                      <th className="p-4">Utente / Artista</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-center">Prenotazioni</th>
                      <th className="p-4 text-center">Ordini Album</th>
                      <th className="p-4 text-center">Voucher Attivi</th>
                      <th className="p-4 text-right">Azioni Rapide</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {registeredUsers
                      .filter((u) => {
                        if (isIgnoredUserEmail(u.email)) return false;
                        if (!userSearchQuery) return true;
                        const q = userSearchQuery.toLowerCase();
                        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                      })
                      .map((u) => {
                        const userEmailClean = u.email.toLowerCase().trim();
                        const userBookings = bookings.filter((b) => (b.userEmail || '').toLowerCase().trim() === userEmailClean);
                        const userAlbumOrders = albumOrders.filter((o) => (o.userEmail || '').toLowerCase().trim() === userEmailClean);
                        const userVouchers = (siteContent.vouchers || []).filter(
                          (v) => (v.assignedToEmail || '').toLowerCase().trim() === userEmailClean
                        );

                        return (
                          <tr key={u.email} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                                  {u.name.slice(0, 2) || 'UT'}
                                </div>
                                <div>
                                  <span className="font-bold text-white text-sm block">{u.name}</span>
                                  <span className="text-[10px] text-neutral-500 font-mono">Artista Registrato</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-300 font-mono">{u.email}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.email);
                                    setDeskActionNotice(`Email ${u.email} copiata negli appunti!`);
                                    setTimeout(() => setDeskActionNotice(null), 3000);
                                  }}
                                  className="p-1 rounded text-neutral-500 hover:text-amber-400 transition-colors"
                                  title="Copia email"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              {userBookings.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                                  {userBookings.length} sessioni
                                </span>
                              ) : (
                                <span className="text-neutral-600 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {userAlbumOrders.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                                  {userAlbumOrders.length} ordini
                                </span>
                              ) : (
                                <span className="text-neutral-600 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {userVouchers.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                                  {userVouchers.map(v => v.code).join(', ')}
                                </span>
                              ) : (
                                <span className="text-neutral-600 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => window.open(getGmailWebComposeUrl(u.email, `171 Studio Messina — Contatto per ${u.name}`, `Gentile ${u.name},\n\n`), '_blank')}
                                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Apri Gmail Web per scrivere a questo utente"
                                >
                                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Email</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewVoucherRecipientType('specific');
                                    setNewVoucherAssignedEmail(u.email);
                                    setShowAddVoucher(true);
                                    setActiveTab('vouchers');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Crea voucher riservato per questo utente"
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                  <span>Voucher</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {selectedBookingDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-neutral-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase">
                    DOSSIER SESSIONE UFFICIALE
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {selectedBookingDossier.orderCode}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-1">
                  {selectedBookingDossier.serviceTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Stampa Scheda o Salva in PDF"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBookingDossier(null)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Badges Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full border font-bold ${
                selectedBookingDossier.status === 'confermata' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                selectedBookingDossier.status === 'completata' ? 'bg-blue-950 text-blue-400 border-blue-500/40' :
                selectedBookingDossier.status === 'in_attesa' ? 'bg-amber-950 text-amber-400 border-amber-500/40 animate-pulse' :
                'bg-red-950 text-red-400 border-red-500/40'
              }`}>
                Stato: {selectedBookingDossier.status}
              </span>

              <span className={`text-xs font-mono uppercase px-3 py-1 rounded-full border ${
                selectedBookingDossier.paymentStatus === 'saldato' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30 font-bold' :
                'bg-neutral-800 text-neutral-300 border-neutral-700'
              }`}>
                PayPal: {selectedBookingDossier.paymentStatus === 'saldato' ? 'Saldato' : 'In Sospeso / Da Saldare'}
              </span>

              {selectedBookingDossier.calendarSynced && (
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Sincronizzato in Google Calendar</span>
                </span>
              )}
            </div>

            {/* Client & Session Information Dossier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] block font-bold">
                  Dati Artista / Cliente
                </span>
                <p><span className="text-neutral-500">Nome:</span> <strong className="text-white">{selectedBookingDossier.userName}</strong></p>
                <p><span className="text-neutral-500">Email:</span> <span className="text-neutral-200">{selectedBookingDossier.userEmail}</span></p>
                <p><span className="text-neutral-500">Telefono:</span> <span className="text-neutral-200">{selectedBookingDossier.userPhone || 'Non specificato'}</span></p>
                <p><span className="text-neutral-500">ID Artista:</span> <span className="text-neutral-400">{selectedBookingDossier.userId}</span></p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-neutral-500 uppercase tracking-widest text-[10px] block font-bold">
                  Dettagli Sessione & Orario
                </span>
                <p><span className="text-neutral-500">Data Prenotata:</span> <strong className="text-amber-400">{selectedBookingDossier.date}</strong></p>
                <p><span className="text-neutral-500">Fascia Oraria:</span> <strong className="text-white">{selectedBookingDossier.time}</strong></p>
                <p><span className="text-neutral-500">Durata Studio:</span> <span className="text-neutral-200">{selectedBookingDossier.hours} ore</span></p>
                <p><span className="text-neutral-500">Location:</span> <span className="text-neutral-400">171 Studio - Messina</span></p>
              </div>
            </div>

            {/* Financial & PayPal Information */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-neutral-400 uppercase text-[10px] font-bold">
                  Riepilogo Finanziario & PayPal Studio
                </span>
                <strong className="text-emerald-400 text-lg font-bold">
                  {selectedBookingDossier.estimatedPrice} €
                </strong>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
                <p><span className="text-neutral-500">Beneficiario PayPal:</span> <span className="text-white font-bold">{siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL}</span></p>
                <p><span className="text-neutral-500">Metodo:</span> <span>Saldo anticipato PayPal o in studio</span></p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={selectedBookingDossier.paypalPaymentUrl || getPayPalPaymentUrl(selectedBookingDossier.estimatedPrice, selectedBookingDossier.orderCode, siteContent.paypalEmail || STUDIO_PAYPAL_EMAIL)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Apri Checkout PayPal ({selectedBookingDossier.estimatedPrice}€)</span>
                </a>

                <button
                  type="button"
                  onClick={() => updateBookingPayment(selectedBookingDossier.id, selectedBookingDossier.paymentStatus === 'saldato' ? 'in_attesa' : 'saldato')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
                >
                  {selectedBookingDossier.paymentStatus === 'saldato' ? 'Segna come Non Saldato' : '✓ Segna come Saldato'}
                </button>
              </div>
            </div>

            {/* Google Calendar & Universal Calendar Section */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono space-y-2">
              <span className="text-neutral-400 uppercase text-[10px] font-bold block">
                Google Calendar & Calendario Universale (.ICS)
              </span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-neutral-300">
                  {selectedBookingDossier.calendarSynced 
                    ? `Sincronizzato: ID Evento #${selectedBookingDossier.calendarEventId || 'primary'}`
                    : 'Disponibile per sincronizzazione immediata con 1 click (senza autorizzazioni).'}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openGoogleCalendarWeb(selectedBookingDossier.id)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Aggiungi automaticamente al tuo Google Calendar"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Aggiungi a Google Cal (1 Click)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadBookingCalendarIcs(selectedBookingDossier.id)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Scarica file .ICS universale compatibile con iPhone, Mac, Windows Outlook e Android"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Scarica .ICS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Email Dispatch Section (Senza Google OAuth) */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-blue-500/30 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-blue-400 uppercase text-[10px] font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invio Email al Cliente (Senza Google OAuth)</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Destinatario: {selectedBookingDossier.userEmail}
                </span>
              </div>

              <p className="text-neutral-300 text-[11px]">
                Invia con 1 click l'email di conferma o ricevuta con codice ordine e link PayPal già compilati:
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openGmailWebCompose(selectedBookingDossier.id, 'confirmation')}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Apre mail.google.com con il testo di conferma pronto per l'invio"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Invia Conferma via Gmail Web (1 Click)</span>
                </button>

                <button
                  type="button"
                  onClick={() => openGmailWebCompose(selectedBookingDossier.id, 'receipt')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Apre mail.google.com con il riepilogo/ricevuta pronto"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Invia Ricevuta via Gmail Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => openMailtoCompose(selectedBookingDossier.id, 'confirmation')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Invia tramite programma di posta del computer (Apple Mail / Outlook)"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>App Posta (Mailto)</span>
                </button>
              </div>
            </div>

            {/* Google Drive Delivery Section in Dossier */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-emerald-500/40 text-xs font-mono space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-emerald-400 uppercase text-[10px] font-bold flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Consegna File e Master via Google Drive</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedBookingDossier.driveDeliveryStatus === 'download_confermato'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : selectedBookingDossier.driveDeliveryUrl
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {selectedBookingDossier.driveDeliveryStatus === 'download_confermato'
                    ? `✓ Download Confermato (${selectedBookingDossier.driveDownloadedAt ? new Date(selectedBookingDossier.driveDownloadedAt).toLocaleDateString('it-IT') : ''})`
                    : selectedBookingDossier.driveDeliveryUrl
                    ? '⏳ In attesa di download'
                    : 'Non ancora consegnato'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  placeholder="Incolla link Google Drive per questa sessione..."
                  defaultValue={selectedBookingDossier.driveDeliveryUrl || ''}
                  id={`dossier-drive-input-${selectedBookingDossier.id}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs outline-none focus:border-emerald-400 font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById(`dossier-drive-input-${selectedBookingDossier.id}`) as HTMLInputElement;
                    if (input && input.value.trim()) {
                      updateBookingDriveDelivery(selectedBookingDossier.id, input.value.trim());
                      setDeskActionNotice(`Link Google Drive salvato per l'ordine #${selectedBookingDossier.orderCode}!`);
                      setTimeout(() => setDeskActionNotice(null), 4000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salva Link Drive</span>
                </button>
                {selectedBookingDossier.driveDeliveryUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(selectedBookingDossier.driveDeliveryUrl, '_blank');
                      confirmBookingDriveDownload(selectedBookingDossier.id, 'master');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs flex items-center gap-1 cursor-pointer border border-neutral-700 shrink-0"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Apri & Notifica</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Notes */}
            {selectedBookingDossier.notes && (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs font-mono space-y-1">
                <span className="text-neutral-500 uppercase text-[10px] font-bold block">Note e Specifiche Progetto Fornite dall'Artista</span>
                <p className="text-neutral-200 italic">"{selectedBookingDossier.notes}"</p>
              </div>
            )}

            {/* Audit History Timeline */}
            <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-[11px] font-mono space-y-1 text-neutral-400">
              <span className="text-neutral-500 uppercase text-[10px] font-bold block">Audit Trail & Tracciamento Storico</span>
              <p>• Creata il: {new Date(selectedBookingDossier.createdAt).toLocaleString('it-IT')}</p>
              {selectedBookingDossier.processedAt && (
                <p>• Gestita e archiviata il: {new Date(selectedBookingDossier.processedAt).toLocaleString('it-IT')} da {selectedBookingDossier.processedBy || MASTER_EMAIL}</p>
              )}
              {selectedBookingDossier.cancellationReason && (
                <p className="text-red-400">• Motivo Annullamento: {selectedBookingDossier.cancellationReason}</p>
              )}
              {selectedBookingDossier.calendarSyncedAt && (
                <p className="text-emerald-400">• Sincronizzata su Google Calendar il: {new Date(selectedBookingDossier.calendarSyncedAt).toLocaleString('it-IT')}</p>
              )}
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingDossier(null)}
                className="px-6 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                Chiudi Scheda
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: AGGIUNGI SESSIONE DIRETTA IN STUDIO (OFFLINE / FUORI SITO) */}
      {showAddDirectSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-neutral-900 border border-amber-500/40 p-6 sm:p-8 space-y-6 shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3 h-3" />
                  <span>REGISTRAZIONE MANUALE SESSIONE 171 STUDIO</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white mt-2">
                  Aggiungi Sessione Fuori Sito (Offline / Diretta)
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Inserisci sessioni concordate di persona, su WhatsApp o per telefono, con i servizi erogati e i prezzi pagati.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDirectSession(false)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectSession} className="space-y-4 text-xs font-mono">
              {/* Artista e Progetto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1 font-bold">
                    Nome Artista / Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={directArtistName}
                    onChange={(e) => setDirectArtistName(e.target.value)}
                    placeholder="Es. Marco Rossi / Darko 171"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Titolo Brano / Nome Progetto
                  </label>
                  <input
                    type="text"
                    value={directArtistProject}
                    onChange={(e) => setDirectArtistProject(e.target.value)}
                    placeholder="Es. Singolo 'Messina Trap' o Album EP"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Contatti Artista (Opzionali) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Email Artista (Opzionale)
                  </label>
                  <input
                    type="email"
                    value={directArtistEmail}
                    onChange={(e) => setDirectArtistEmail(e.target.value)}
                    placeholder="artista@email.it"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Telefono / WhatsApp (Opzionale)
                  </label>
                  <input
                    type="tel"
                    value={directArtistPhone}
                    onChange={(e) => setDirectArtistPhone(e.target.value)}
                    placeholder="+39 340 000 0000"
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Servizio Principale & Preset Rapidi */}
              <div>
                <label className="block uppercase text-neutral-400 mb-1 font-bold">
                  Servizio Principale Erogato *
                </label>
                <input
                  type="text"
                  required
                  value={directServiceTitle}
                  onChange={(e) => setDirectServiceTitle(e.target.value)}
                  placeholder="Es. Registrazione Vocale, Mix & Master Stereo..."
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:border-amber-400 outline-none font-bold"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Registrazione Vocale',
                    'Mix & Master Stereo',
                    'Produzione Beat Inedito',
                    'Vocal Tuning & Melodyne',
                    'Sessione Notturna Full',
                    'Doppiaggio & Voiceover',
                    'Mastering Analogico DDP',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDirectServiceTitle(preset);
                        handleAddDirectTag(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Servizi Erogati / Dettaglio Voci (Tag List) */}
              <div>
                <label className="block uppercase text-neutral-400 mb-1">
                  Elenco Servizi & Lavorazioni Erogate:
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-neutral-950 border border-neutral-800 min-h-[42px] items-center">
                  {directServicesTags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] flex items-center gap-1.5 font-bold"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDirectTag(tag)}
                        className="text-neutral-400 hover:text-red-400 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  
                  <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customTagInput.trim()) {
                            handleAddDirectTag(customTagInput);
                            setCustomTagInput('');
                          }
                        }
                      }}
                      placeholder="Aggiungi lavorazione e premi Invio..."
                      className="w-full bg-transparent text-white text-xs outline-none px-2 py-1 placeholder:text-neutral-600"
                    />
                    {customTagInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          handleAddDirectTag(customTagInput);
                          setCustomTagInput('');
                        }}
                        className="px-2 py-1 rounded bg-amber-500 text-black font-bold text-[10px]"
                      >
                        Aggiungi
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data, Orario e Durata Ore */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Data Sessione *
                  </label>
                  <input
                    type="date"
                    required
                    value={directDate}
                    onChange={(e) => setDirectDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Orario Inizio *
                  </label>
                  <input
                    type="text"
                    required
                    value={directTime}
                    onChange={(e) => setDirectTime(e.target.value)}
                    placeholder="15:00"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Ore Impiegate
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={directHours}
                    onChange={(e) => setDirectHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Prezzo Pagato, Metodo Pagamento e Stato */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-amber-500/30">
                <div>
                  <label className="block uppercase text-amber-400 font-bold mb-1">
                    Prezzo Pagato (€) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={directPrice}
                    onChange={(e) => setDirectPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-base font-bold text-emerald-400 focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Metodo di Pagamento
                  </label>
                  <select
                    value={directPaymentMethod}
                    onChange={(e) => setDirectPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="contanti">Contanti in Studio</option>
                    <option value="pos_carta">POS / Carta di Debito o Credito</option>
                    <option value="bonifico">Bonifico Bancario</option>
                    <option value="paypal">PayPal</option>
                    <option value="altro">Altro / Baratto</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Stato Pagamento
                  </label>
                  <select
                    value={directPaymentStatus}
                    onChange={(e) => setDirectPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="saldato">✓ Saldato Interamente</option>
                    <option value="pagamento_in_studio">Acconto / In Studio</option>
                    <option value="in_attesa">In Attesa di Ricezione</option>
                  </select>
                </div>
              </div>

              {/* Stato Sessione & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block uppercase text-neutral-400 mb-1">
                    Stato Sessione
                  </label>
                  <select
                    value={directStatus}
                    onChange={(e) => setDirectStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none"
                  >
                    <option value="confermata">Confermata (In Calendario)</option>
                    <option value="completata">Completata (Eseguita & Archiviata)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block uppercase text-neutral-400 mb-1">
                    Note Interne / Dettagli Tecnici
                  </label>
                  <input
                    type="text"
                    value={directNotes}
                    onChange={(e) => setDirectNotes(e.target.value)}
                    placeholder="Es. Microfono Neumann U87, pre-amplificatore valvolare..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddDirectSession(false)}
                  className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono uppercase transition-colors cursor-pointer"
                >
                  Annulla
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salva Sessione Fuori Sito ({directPrice}€)</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
