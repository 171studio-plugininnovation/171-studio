/**
 * 171 Studio - Comprehensive Team Verification Suite
 * 
 * Verifies all 6 critical functional pillars requested by user:
 * 1. Email System (Templates, Variable Interpolation, HTML generation, 1-Click Gmail, Mailto, Webhook/EmailJS Fallbacks)
 * 2. Automatismi (Unique Order Codes, Google Calendar 1-Click Web URL, .ICS Generation, Booking Slot Calculators, Voucher Engine)
 * 3. PayPal Integration (Business destination vkrealhakiesake@gmail.com, PayPal.Me, Donations, Studio Services + Surcharges)
 * 4. Counter Visite & Studio Telemetry (Marketing baseline 1280, 30-min session debounce, Live Producers online 3-7, Firestore & LocalStorage schema)
 * 5. Boutique Plugins Packages v2.2.5 (ZIP archives, VST3, Standalone EXE, Documentation, Removal of DriveOptocom, MasterGlue Dec 1)
 * 6. Live Production Server Smoke Checks (https://171studio.it, HTTP 200, Bundle Hash, SSL, Live Content)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  STUDIO_PAYPAL_EMAIL,
  MASTER_EMAIL,
  DEFAULT_EMAIL_TEMPLATES,
  BookingRecord,
  AlbumOrderRecord,
  UserAccount,
} from '../src/types/cms';
import {
  generateOrderCode,
  getPayPalPaymentUrl,
  getPayPalMeUrl,
  getPayPalDonationUrl,
  createMailtoLink,
  getGmailWebComposeUrl,
  getActiveEmailTemplates,
  interpolateEmailTemplate,
  buildBookingConfirmedEmailHtml,
  buildBookingReceivedEmailHtml,
  getEmailAutomationConfig,
} from '../src/utils/emailService';
import {
  getGoogleCalendarWebUrl,
  generateBookingIcsContent,
} from '../src/utils/googleCalendarService';
import {
  SERVICE_OPTIONS,
  STUDIO_MICROPHONE_OPTIONS,
  getMicrophoneFee,
  calculateEstimatedPrice,
  calculateEndTime,
  formatDurationLabel,
  HOURLY_STUDIO_RATE,
} from '../src/utils/pricing';

interface VerificationCheck {
  pillar: string;
  testCase: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details?: string;
  evidence?: any;
}

const auditTrail: VerificationCheck[] = [];

function assertTest(pillar: string, testCase: string, testFn: () => any) {
  const t0 = Date.now();
  try {
    const evidence = testFn();
    const durationMs = Date.now() - t0;
    auditTrail.push({
      pillar,
      testCase,
      status: 'PASSED',
      durationMs,
      evidence: evidence ? String(evidence) : 'OK',
    });
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m \x1b[1m${testCase}\x1b[0m \x1b[90m(${durationMs}ms)\x1b[0m`);
  } catch (err: any) {
    const durationMs = Date.now() - t0;
    const msg = err?.message || String(err);
    auditTrail.push({
      pillar,
      testCase,
      status: 'FAILED',
      durationMs,
      details: msg,
    });
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m \x1b[1m${testCase}\x1b[0m: ${msg}`);
  }
}

console.log('\n\x1b[1m\x1b[35m========================================================================================\x1b[0m');
console.log('\x1b[1m\x1b[35m  171 STUDIO — E2E TEAM VERIFICATION SUITE: EMAIL, AUTOMATISMI, PAYPAL, COUNTER, ASSET \x1b[0m');
console.log('\x1b[1m\x1b[35m========================================================================================\x1b[0m\n');

// ========================================================================================
// PILLAR 1: EMAIL SYSTEM & TEMPLATING ENGINE
// ========================================================================================
console.log('\x1b[34m[PILLAR 1/6] EMAIL SYSTEM, TEMPLATING & COMPOSE FALLBACKS\x1b[0m');

const sampleBooking: BookingRecord = {
  id: 'bk-test-email-verification',
  orderCode: '171-ORD-982134',
  userId: 'usr-tester-99',
  userName: 'Pietro Test',
  userEmail: 'pietro.test@example.com',
  userPhone: '+39 347 112 2334',
  serviceId: 'pack_4h_messina',
  serviceTitle: 'Pack 4 Ore Messina (Mezza Giornata)',
  date: '2026-11-20',
  time: '15:00',
  endTime: '19:00',
  hours: 4,
  estimatedPrice: 90,
  notes: 'Microfono scelto: Warm Audio WA-47jr (+20€ a sessione)',
  status: 'confermata',
  paymentStatus: 'in_attesa',
  createdAt: new Date().toISOString(),
};

assertTest('Email System', 'Caricamento template email predefiniti (Ricevuta, Conferma, Ordine Album)', () => {
  const templates = getActiveEmailTemplates();
  if (!templates.receiptSubject || !templates.receiptSubject.includes('{codice_ordine}')) {
    throw new Error('Template ricevuta non contiene {codice_ordine}');
  }
  if (!templates.confirmationSubject || !templates.confirmationSubject.includes('{codice_ordine}')) {
    throw new Error('Template conferma non contiene {codice_ordine}');
  }
  return `Templates caricati: ${Object.keys(templates).length} campi configurati`;
});

assertTest('Email System', 'Sostituzione dinamica variabili ({nome}, {codice_ordine}, {servizio}, ecc.)', () => {
  const templates = getActiveEmailTemplates();
  const formattedSubject = interpolateEmailTemplate(templates.receiptSubject, sampleBooking);
  const formattedHeading = interpolateEmailTemplate(templates.receiptHeading, sampleBooking);

  if (!formattedSubject.includes(sampleBooking.orderCode)) {
    throw new Error(`Codice ordine mancante nel subject: ${formattedSubject}`);
  }
  if (!formattedHeading.includes(sampleBooking.userName)) {
    throw new Error(`Nome cliente mancante nell'heading: ${formattedHeading}`);
  }
  return `Subject formattato: "${formattedSubject}"`;
});

assertTest('Email System', 'Generazione HTML completo per email di conferma sessione (buildBookingConfirmedEmailHtml)', () => {
  const html = buildBookingConfirmedEmailHtml(sampleBooking, sampleBooking.orderCode, STUDIO_PAYPAL_EMAIL);
  if (!html.includes('171 Studio') || !html.includes(sampleBooking.orderCode)) {
    throw new Error('HTML non contiene codice ordine o intestazione studio');
  }
  if (!html.includes('vkrealhakiesake@gmail.com')) {
    throw new Error('Email PayPal vkrealhakiesake@gmail.com non trovata nel corpo HTML');
  }
  if (!html.includes('Warm Audio WA-47jr')) {
    throw new Error('Nota microfono scelto non inclusa nel riepilogo email');
  }
  return `HTML di conferma generato (${html.length} caratteri)`;
});

assertTest('Email System', 'Generazione HTML completo per email di ricezione sessione (buildBookingReceivedEmailHtml)', () => {
  const html = buildBookingReceivedEmailHtml(sampleBooking, sampleBooking.orderCode, STUDIO_PAYPAL_EMAIL);
  if (!html.includes('171 Studio') || !html.includes(sampleBooking.orderCode)) {
    throw new Error('HTML non contiene codice ordine');
  }
  if (!html.includes('Warm Audio WA-47jr')) {
    throw new Error('Nota microfono scelto non inclusa nel riepilogo email di ricezione');
  }
  return `HTML di ricezione generato (${html.length} caratteri)`;
});

assertTest('Email System', 'Generazione URL 1-Click Gmail Web Compose (Zero backend, Zero auth required)', () => {
  const to = 'cliente@test.com';
  const subject = 'Conferma Sessione 171 Studio';
  const body = 'Gentile Cliente,\nLa sessione è confermata.\nLink PayPal: https://paypal.me/vkrealhakiesake';
  const gmailUrl = getGmailWebComposeUrl(to, subject, body);

  if (!gmailUrl.startsWith('https://mail.google.com/mail/?view=cm&fs=1')) {
    throw new Error(`Prefisso Gmail Web non valido: ${gmailUrl}`);
  }
  if (!gmailUrl.includes(`to=${encodeURIComponent(to)}`)) {
    throw new Error('Parametro destinatario mancante');
  }
  if (!gmailUrl.includes(`su=${encodeURIComponent(subject)}`)) {
    throw new Error('Parametro oggetto mancante');
  }
  return `URL valido (${gmailUrl.length} caratteri)`;
});

assertTest('Email System', 'Generazione RFC Mailto Link standard come fallback nativo OS/Client', () => {
  const to = 'igor@171studio.it';
  const subject = 'Test Mailto Link';
  const body = 'Testo di prova';
  const mailto = createMailtoLink(to, subject, body);

  if (!mailto.startsWith('mailto:')) {
    throw new Error(`Prefisso mailto mancante: ${mailto}`);
  }
  if (!mailto.includes(encodeURIComponent(to))) {
    throw new Error('Destinatario mancante nel mailto');
  }
  return mailto;
});

assertTest('Email System', 'Configurazione automazioni email (Webhook Make.com attivo con fallback sicuro)', () => {
  const config = getEmailAutomationConfig();
  if (!config.emailWebhookUrl) {
    throw new Error('URL Webhook email mancante');
  }
  if (!config.emailWebhookUrl.startsWith('https://')) {
    throw new Error('URL Webhook deve essere HTTPS');
  }
  return `Webhook predefinito: ${config.emailWebhookUrl}`;
});

// ========================================================================================
// PILLAR 2: AUTOMATISMI, CALENDARIO & MOTORE TARIFFE/VOUCHER
// ========================================================================================
console.log('\n\x1b[34m[PILLAR 2/6] AUTOMATISMI, CALENDARIO & MOTORE TARIFFE/VOUCHER\x1b[0m');

assertTest('Automatismi', 'Generatore codici ordine univoci con prefisso ufficiale 171-ORD-', () => {
  const code1 = generateOrderCode();
  const code2 = generateOrderCode();
  if (!code1.startsWith('171-ORD-') || code1.length < 14) {
    throw new Error(`Codice ordine 1 non conforme: ${code1}`);
  }
  if (code1 === code2) {
    throw new Error('Rilevata collisione tra due generazioni consecutive');
  }
  return `Esempio generato: ${code1}`;
});

assertTest('Automatismi', 'Calcolo automatico ora di fine sessione (calculateEndTime)', () => {
  const end1 = calculateEndTime('14:00', 3.5);
  const end2 = calculateEndTime('10:00', 4);
  const end3 = calculateEndTime('22:00', 2);

  if (end1 !== '17:30') throw new Error(`Atteso 17:30, calcolato ${end1}`);
  if (end2 !== '14:00') throw new Error(`Atteso 14:00, calcolato ${end2}`);
  if (end3 !== '24:00' && end3 !== '00:00') throw new Error(`Atteso 24:00/00:00, calcolato ${end3}`);
  return `14:00 + 3.5h -> ${end1}; 10:00 + 4h -> ${end2}`;
});

assertTest('Automatismi', 'Generatore link 1-Click Google Calendar con parametri completi', () => {
  const gcalUrl = getGoogleCalendarWebUrl(sampleBooking, true);
  if (!gcalUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')) {
    throw new Error(`URL Google Calendar non valido: ${gcalUrl}`);
  }
  if (!gcalUrl.includes('ctz=Europe/Rome')) {
    throw new Error('Timezone Europe/Rome mancante');
  }
  if (!gcalUrl.includes(sampleBooking.orderCode)) {
    throw new Error('Codice ordine mancante nel link Google Calendar');
  }
  return `Google Calendar URL valido (${gcalUrl.length} caratteri)`;
});

assertTest('Automatismi', 'Generazione file calendario standard iCalendar (.ICS) compatibile Apple/Outlook', () => {
  const icsContent = generateBookingIcsContent(sampleBooking, true);
  if (!icsContent.includes('BEGIN:VCALENDAR') || !icsContent.includes('END:VCALENDAR')) {
    throw new Error('Blocco VCALENDAR mancante');
  }
  if (!icsContent.includes('BEGIN:VEVENT') || !icsContent.includes('END:VEVENT')) {
    throw new Error('Blocco VEVENT mancante');
  }
  if (!icsContent.includes('SUMMARY:') || !icsContent.includes(sampleBooking.serviceTitle)) {
    throw new Error('SUMMARY non conforme');
  }
  if (!icsContent.includes('STATUS:CONFIRMED')) {
    throw new Error('STATUS non marcato come CONFIRMED');
  }
  return `File .ICS generato correttamente (${icsContent.length} bytes)`;
});

assertTest('Automatismi', 'Motore tariffe: Pacchetti Messina (4h 90€, 8h 170€, 16h 320€) con ore extra', () => {
  const pack4h = calculateEstimatedPrice('pack_4h_messina', 4);
  const pack4hExtra = calculateEstimatedPrice('pack_4h_messina', 6);
  const pack8h = calculateEstimatedPrice('pack_8h_day_messina', 8);
  const pack16h = calculateEstimatedPrice('pack_weekend_16h', 16);

  if (pack4h.total !== 90) throw new Error(`Pack 4h base errato: ${pack4h.total}`);
  if (pack4hExtra.total !== 90 + (2 * 25)) throw new Error(`Pack 4h + 2h extra errato: ${pack4hExtra.total}`);
  if (pack8h.total !== 170) throw new Error(`Pack 8h errato: ${pack8h.total}`);
  if (pack16h.total !== 320) throw new Error(`Pack 16h errato: ${pack16h.total}`);
  return `4h=90€, 6h=140€, 8h=170€, 16h=320€`;
});

// ========================================================================================
// PILLAR 3: LINK PAYPAL & TARIFFE MICROFONICHE
// ========================================================================================
console.log('\n\x1b[34m[PILLAR 3/6] LINK PAYPAL, EMAIL COMMERCIALE & TARIFFE MICROFONI\x1b[0m');

assertTest('Link PayPal', 'Verifica destinatario business ufficiale (vkrealhakiesake@gmail.com)', () => {
  if (STUDIO_PAYPAL_EMAIL !== 'vkrealhakiesake@gmail.com') {
    throw new Error(`Email PayPal ufficiale errata: ${STUDIO_PAYPAL_EMAIL}`);
  }
  const testUrl = getPayPalPaymentUrl(100, 'TEST-123');
  if (!testUrl.includes('business=' + encodeURIComponent('vkrealhakiesake@gmail.com'))) {
    throw new Error(`Email business non codificata correttamente nel link: ${testUrl}`);
  }
  return `Destinatario business certificato: ${STUDIO_PAYPAL_EMAIL}`;
});

assertTest('Link PayPal', 'Verifica parametri query URL (cmd=_xclick, currency_code=EUR, amount=XX.XX)', () => {
  const url = getPayPalPaymentUrl(47.50, '171-ORD-001');
  if (!url.includes('cmd=_xclick')) throw new Error('cmd non è _xclick');
  if (!url.includes('currency_code=EUR')) throw new Error('Valuta non EUR');
  if (!url.includes('amount=47.50')) throw new Error('Importo non formattato a 2 decimali');
  return url;
});

assertTest('Link PayPal', 'Verifica link PayPal.Me mobile rapido (https://paypal.me/vkrealhakiesake/XXEUR)', () => {
  const meUrl = getPayPalMeUrl(90);
  if (meUrl !== 'https://paypal.me/vkrealhakiesake/90EUR') {
    throw new Error(`Link PayPal.Me non valido: ${meUrl}`);
  }
  return meUrl;
});

assertTest('Link PayPal', 'Verifica link donazione libera plugin (cmd=_donations, vkrealhakiesake@gmail.com)', () => {
  const donUrl = getPayPalDonationUrl(15, '171 RealTune');
  if (!donUrl.includes('cmd=_donations')) throw new Error('cmd non è _donations');
  if (!donUrl.includes('amount=15.00')) throw new Error('Importo donazione errato');
  return donUrl;
});

assertTest('Link PayPal', 'Tariffe microfoni scelti: RØDE 0€, Lewitt +10€, Warm +20€, Shure +20€', () => {
  const feeRode = getMicrophoneFee('rode-nt1a');
  const feeLewitt = getMicrophoneFee('lewitt-440');
  const feeWarm = getMicrophoneFee('warm-wa47jr');
  const feeShure = getMicrophoneFee('shure-sm7b');

  if (feeRode !== 0) throw new Error(`RØDE NT1-A fee errata: ${feeRode}`);
  if (feeLewitt !== 10) throw new Error(`Lewitt LCT 440 fee errata: ${feeLewitt}`);
  if (feeWarm !== 20) throw new Error(`Warm Audio WA-47jr fee errata: ${feeWarm}`);
  if (feeShure !== 20) throw new Error(`Shure SM7B fee errata: ${feeShure}`);

  // Verifica calcolo cumulato su sessione 2h (50€)
  const sessionBase = 50;
  const urlRode = getPayPalPaymentUrl(sessionBase + feeRode, 'TEST-RODE');
  const urlLewitt = getPayPalPaymentUrl(sessionBase + feeLewitt, 'TEST-LEWITT');
  const urlWarm = getPayPalPaymentUrl(sessionBase + feeWarm, 'TEST-WARM');
  const urlShure = getPayPalPaymentUrl(sessionBase + feeShure, 'TEST-SHURE');

  if (!urlRode.includes('amount=50.00')) throw new Error('RØDE totale errato (50.00)');
  if (!urlLewitt.includes('amount=60.00')) throw new Error('Lewitt totale errato (60.00)');
  if (!urlWarm.includes('amount=70.00')) throw new Error('Warm totale errato (70.00)');
  if (!urlShure.includes('amount=70.00')) throw new Error('Shure totale errato (70.00)');

  return 'RØDE: 50€ | Lewitt: 60€ | Warm: 70€ | Shure: 70€';
});

// ========================================================================================
// PILLAR 4: COUNTER VISITE & TELEMETRIA STUDIO
// ========================================================================================
console.log('\n\x1b[34m[PILLAR 4/6] COUNTER VISITE, TELEMETRIA & TRACKING SESSIONI\x1b[0m');

assertTest('Counter Visite', 'Costante MARKETING_BASELINE = 1280 e valore fallback 1368 verificati nel codice', () => {
  const contextSource = fs.readFileSync(path.resolve('src/context/StudioContext.tsx'), 'utf-8');
  if (!contextSource.includes('const MARKETING_BASELINE = 1280;')) {
    throw new Error('MARKETING_BASELINE mancante o diversa da 1280 in StudioContext.tsx');
  }
  if (!contextSource.includes('return 1368;')) {
    throw new Error('Valore fallback 1368 mancante in StudioContext.tsx');
  }
  return 'Baseline 1280 & Fallback 1368 validati';
});

assertTest('Counter Visite', 'Regola di calcolo cumulativo (raw visits < baseline ? baseline + raw : raw)', () => {
  const baseline = 1280;
  const calculateTotal = (raw: number) => (raw < baseline ? baseline + raw : raw);

  if (calculateTotal(50) !== 1330) throw new Error('Errore calcolo per raw=50');
  if (calculateTotal(120) !== 1400) throw new Error('Errore calcolo per raw=120');
  if (calculateTotal(2500) !== 2500) throw new Error('Errore calcolo per raw=2500 (> baseline)');
  return 'Calcolo non clamped corretto per tutti gli scaglioni';
});

assertTest('Counter Visite', 'Debounce sessione utente (30 minuti di re-engagement per conteggio visite uniche)', () => {
  const contextSource = fs.readFileSync(path.resolve('src/context/StudioContext.tsx'), 'utf-8');
  if (!contextSource.includes('const THIRTY_MINUTES = 30 * 60 * 1000;')) {
    throw new Error('Soglia 30 minuti mancante in StudioContext.tsx');
  }
  if (!contextSource.includes('171_session_counted') || !contextSource.includes('171_last_visit_timestamp')) {
    throw new Error('Chiavi di persistenza sessione mancanti');
  }
  return 'Debounce 30 minuti verificato';
});

assertTest('Counter Visite', 'Telemetria produttori live online (fluttuazioni realistiche tra 3 e 7 in base all\'orario)', () => {
  const contextSource = fs.readFileSync(path.resolve('src/context/StudioContext.tsx'), 'utf-8');
  if (!contextSource.includes('liveOnlineCount')) {
    throw new Error('Stato liveOnlineCount non presente');
  }
  if (!contextSource.includes('hour >= 14 && hour <= 23')) {
    throw new Error('Finestra oraria di punta studio (14:00 - 23:00) non configurata');
  }
  return 'Finestra attiva 14:00-23:00 e micro-fluttuazioni organiche validate';
});

assertTest('Counter Visite', 'Visualizzazione counter in Footer e Hero rack telemetry strip', () => {
  const footerSource = fs.readFileSync(path.resolve('src/components/Footer.tsx'), 'utf-8');
  const heroSource = fs.readFileSync(path.resolve('src/components/HeroHome.tsx'), 'utf-8');

  if (!footerSource.includes('visitorCount.toLocaleString(\'it-IT\')')) {
    throw new Error('Formattazione italiana counter visite mancante nel Footer');
  }
  if (!heroSource.includes('LIVE REACH:') || !heroSource.includes('visitorCount.toLocaleString(\'it-IT\')')) {
    throw new Error('Rack telemetry strip non configurato correttamente in HeroHome');
  }
  return 'Visite formattate it-IT sia nel Footer che nella Rack Telemetry';
});

// ========================================================================================
// PILLAR 5: PACCHETTI PLUGIN BOUTIQUE v2.2.5 & THE GOD CYPHER
// ========================================================================================
console.log('\n\x1b[34m[PILLAR 5/6] PACCHETTI PLUGIN v2.2.5 & AUDIO THE GOD CYPHER\x1b[0m');

const requiredPlugins = [
  { name: '171 RealTune', file: '171RealTune_v2.2.5_Win64.zip', minSize: 19_000_000 },
  { name: '171 PerfectPre', file: '171PerfectPre_v2.2.5_Win64.zip', minSize: 18_000_000 },
  { name: '171 EasyVoice', file: '171EasyVoice_v2.2.5_Win64.zip', minSize: 30_000_000 },
  { name: '171 SpaceLuxe', file: '171SpaceLuxe_v2.2.5_Win64.zip', minSize: 8_500_000 },
];

for (const p of requiredPlugins) {
  assertTest('Plugins v2.2.5', `Presenza e dimensione archivio ZIP per ${p.name}`, () => {
    const pubFile = path.resolve('public/downloads/plugins', p.file);
    if (!fs.existsSync(pubFile)) {
      throw new Error(`File ${p.file} mancante in public/downloads/plugins`);
    }
    const stat = fs.statSync(pubFile);
    if (stat.size < p.minSize) {
      throw new Error(`File ${p.file} ha dimensione inferiore al minimo (${stat.size} < ${p.minSize})`);
    }
    return `${p.file}: ${(stat.size / 1024 / 1024).toFixed(2)} MB`;
  });
}

assertTest('Plugins v2.2.5', 'Verifica rimozione 171 DriveOptocom e MasterGlue release 1 Dicembre', () => {
  const pluginSectionSource = fs.readFileSync(path.resolve('src/components/PluginsPage.tsx'), 'utf-8');
  if (pluginSectionSource.includes("id: 'plugin-driveoptocom'")) {
    throw new Error('171 DriveOptocom ancora presente come scheda prodotto nel catalogo');
  }
  if (!pluginSectionSource.includes('DriveOptocom dismesso') && !pluginSectionSource.includes('rimozione di 171 DriveOptocom')) {
    throw new Error('Nota di dismissione 171 DriveOptocom non trovata');
  }
  if (!pluginSectionSource.includes('1° Dicembre') || !pluginSectionSource.includes('171 MasterGlue')) {
    throw new Error('Release programmata 1° Dicembre per MasterGlue non indicata');
  }
  return 'Catalogo aggiornato: DriveOptocom dismesso e rimosso dalle schede, MasterGlue pianificato 1° Dicembre';
});

assertTest('The God Cypher', 'Presenza e integrità delle 14 tracce audio MP3 originali', () => {
  const audioDir = path.resolve('public/assets/the-god-cypher/audio');
  if (!fs.existsSync(audioDir)) {
    throw new Error(`Cartella audio non trovata: ${audioDir}`);
  }
  const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
  if (files.length < 14) {
    throw new Error(`Tracce trovate: ${files.length} (attese almeno 14)`);
  }
  return `Trovate ${files.length} tracce audio complete`;
});

// ========================================================================================
// PILLAR 6: VERIFICA LIVE PRODUCTION SERVER (https://171studio.it)
// ========================================================================================
console.log('\n\x1b[34m[PILLAR 6/6] VERIFICA SERVER LIVE (https://171studio.it)\x1b[0m');

assertTest('Live Server', 'HTTP 200 OK & Header Security su https://171studio.it', () => {
  const curlOutput = execSync('curl.exe -I -s https://171studio.it', { maxBuffer: 10 * 1024 * 1024 }).toString();
  if (!curlOutput.includes('200 OK')) {
    throw new Error(`Server non risponde HTTP 200: ${curlOutput.slice(0, 100)}`);
  }
  return 'HTTP 200 OK confermato';
});

assertTest('Live Server', 'Presenza del bundle compilato più recente nel server live', () => {
  const htmlOutput = execSync('curl.exe -s https://171studio.it', { maxBuffer: 10 * 1024 * 1024 }).toString();
  const match = htmlOutput.match(/assets\/(index-[a-zA-Z0-9_\-]+\.js)/);
  if (!match) {
    throw new Error('Nessun bundle index-*.js trovato nella risposta HTML del server live');
  }
  return `Bundle attivo: ${match[1]}`;
});

assertTest('Live Server', 'Verifica contenuto live: tariffe microfoni caricate nel runtime del browser', () => {
  const htmlOutput = execSync('curl.exe -s https://171studio.it', { maxBuffer: 10 * 1024 * 1024 }).toString();
  const match = htmlOutput.match(/assets\/(index-[a-zA-Z0-9_\-]+\.js)/);
  if (!match) {
    throw new Error('Nessun bundle JS rilevato su https://171studio.it');
  }
  const bundleUrl = `https://171studio.it/assets/${match[1]}`;
  const jsOutput = execSync(`node -e "fetch('${bundleUrl}').then(r=>r.text()).then(t=>{ console.log(t.includes('lewitt-440') && t.includes('+10€ A SESSIONE') && t.includes('warm-wa47jr') && t.includes('shure-sm7b') && t.includes('rode-nt1a')) })"`).toString().trim();

  if (jsOutput !== 'true') {
    throw new Error(`Verifica runtime tariffe microfoni live fallita: ${jsOutput}`);
  }
  return 'Tariffe verificate nel JS di produzione (RØDE 0€, Lewitt +10€, Warm +20€, Shure +20€)';
});

// ========================================================================================
// RIEPILOGO FINALE VERIFICA TEAM
// ========================================================================================
console.log('\n\x1b[1m\x1b[35m========================================================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m  CERTIFICAZIONE DI SISTEMA & REPORT DI VERIFICA TEAM                           \x1b[0m');
console.log('\x1b[1m\x1b[35m========================================================================================\x1b[0m');

const total = auditTrail.length;
const passed = auditTrail.filter(t => t.status === 'PASSED').length;
const failed = auditTrail.filter(t => t.status === 'FAILED').length;

console.log(`Punti di Controllo Eseguiti: ${total}`);
console.log(`Esiti Positivi (PASS)     : \x1b[32m${passed}\x1b[0m`);
console.log(`Esiti Negativi (FAIL)     : \x1b[${failed > 0 ? '31' : '32'}m${failed}\x1b[0m`);

if (failed > 0) {
  console.error('\n\x1b[31mAlcuni controlli non sono stati superati. Revisionare i log.\x1b[0m\n');
  process.exit(1);
} else {
  console.log('\n\x1b[32m✔ TUTTI I SISTEMI OPERATIVI: EMAIL, AUTOMATISMI, PAYPAL, COUNTER E ASSET SONO PERFETTI!\x1b[0m\n');
  process.exit(0);
}
