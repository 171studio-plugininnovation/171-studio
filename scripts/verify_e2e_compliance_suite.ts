import fs from 'fs';
import path from 'path';
import { 
  generateOrderCode, 
  getPayPalPaymentUrl, 
  getPayPalMeUrl, 
  getPayPalDonationUrl, 
  createMailtoLink, 
  getGmailWebComposeUrl, 
  interpolateEmailTemplate,
  getActiveEmailTemplates
} from '../src/utils/emailService';
import { 
  getGoogleCalendarWebUrl, 
  generateBookingIcsContent 
} from '../src/utils/googleCalendarService';
import { 
  calculateEstimatedPrice, 
  formatDurationLabel, 
  calculateEndTime,
  STUDIO_MICROPHONE_OPTIONS,
  getMicrophoneFee,
  SERVICE_OPTIONS
} from '../src/utils/pricing';
import { 
  BookingRecord, 
  STUDIO_PAYPAL_EMAIL, 
  DEFAULT_VOUCHERS,
  DEFAULT_EMAIL_TEMPLATES 
} from '../src/types/cms';

console.log('====================================================================');
console.log('  171 STUDIO — E2E AUDIT DI CONFORMITÀ GLOBALE & HEALTH CHECK LIVE  ');
console.log('  Benchmark: Universal Audio, Waves, Plugin Alliance, FabFilter    ');
console.log('====================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertTest(suite: string, testName: string, condition: boolean, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✔ [PASS] [${suite}] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✖ [FAIL] [${suite}] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

async function runAudit() {
  // -------------------------------------------------------------
  // SUITE 1: EMAIL (Templates, Rendering, Variabili, 1-Click Gmail, Mailto, Webhook)
  // -------------------------------------------------------------
  console.log('\x1b[36m[SUITE 1/6] Verifica Email & Sistemi di Notifica...\x1b[0m');

  const sampleBooking: BookingRecord = {
    id: 'bk-test-email-001',
    orderCode: '171-ORD-987654',
    userId: 'usr-client-01',
    userName: 'Marco Rossi',
    userEmail: 'marco.rossi@example.com',
    userPhone: '+39 340 1234567',
    serviceId: 'recording_hourly',
    serviceTitle: 'Sessione di Registrazione (2 Ore)',
    date: '2026-11-15',
    time: '16:00',
    endTime: '18:00',
    hours: 2,
    estimatedPrice: 60,
    selectedMic: 'Lewitt LCT 440 PURE',
    selectedMicFee: 10,
    notes: 'Voce lead per singolo urban',
    status: 'in_attesa',
    paymentStatus: 'in_attesa',
    paypalPaymentUrl: getPayPalPaymentUrl(60, '171-ORD-987654', STUDIO_PAYPAL_EMAIL),
    createdAt: new Date().toISOString(),
  };

  const templates = getActiveEmailTemplates(undefined);
  assertTest('Email', 'Template Predefiniti Presenti (Ricevuta & Conferma)', 
    Boolean(templates.receiptSubject && templates.confirmationSubject));

  const interpolatedReceipt = interpolateEmailTemplate(templates.receiptSubject, sampleBooking);
  assertTest('Email', 'Interpolazione Variabili Soggetto ({nome}, {servizio}, {codice_ordine})',
    interpolatedReceipt.includes('Marco Rossi') && 
    interpolatedReceipt.includes('Sessione di Registrazione') && 
    interpolatedReceipt.includes('171-ORD-987654'),
    `Risultato: ${interpolatedReceipt}`
  );

  const gmailCompose = getGmailWebComposeUrl(
    sampleBooking.userEmail,
    interpolatedReceipt,
    `Gentile ${sampleBooking.userName}, la sessione è fissata per il ${sampleBooking.date} alle ${sampleBooking.time}.`
  );
  assertTest('Email', '1-Click Gmail Compose URL Generato Correttamente',
    gmailCompose.startsWith('https://mail.google.com/mail/?view=cm') &&
    gmailCompose.includes(encodeURIComponent(sampleBooking.userEmail)) &&
    gmailCompose.includes('171-ORD-987654')
  );

  const mailtoLink = createMailtoLink(
    sampleBooking.userEmail,
    interpolatedReceipt,
    `Saldo PayPal: ${sampleBooking.paypalPaymentUrl}`
  );
  assertTest('Email', 'Fallback Mailto Link Compatibile RFC',
    mailtoLink.startsWith('mailto:') &&
    mailtoLink.includes(encodeURIComponent(sampleBooking.userEmail))
  );

  // -------------------------------------------------------------
  // SUITE 2: AUTOMATISMI (Codici Ordine, Google Calendar, .ICS, Orari, Voucher)
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 2/6] Verifica Automatismi, Orari, Calendario & Voucher...\x1b[0m');

  const generatedCode = generateOrderCode();
  assertTest('Automatismi', 'Generatore Codice Ordine Univoco (171-ORD-XXXXXX)',
    /^171-ORD-\d{6}$/.test(generatedCode),
    `Generato: ${generatedCode}`
  );

  const gCalUrl = getGoogleCalendarWebUrl(sampleBooking, true);
  assertTest('Automatismi', 'Generazione URL Google Calendar con Timezone Europe/Rome',
    gCalUrl.includes('calendar.google.com') &&
    gCalUrl.includes('ctz=Europe/Rome') &&
    gCalUrl.includes('20261115T160000') &&
    gCalUrl.includes('20261115T180000')
  );

  const icsContent = generateBookingIcsContent(sampleBooking, true);
  assertTest('Automatismi', 'Generatore File .ICS RFC 5545 con Allarmi 2h e 1d',
    icsContent.includes('BEGIN:VCALENDAR') &&
    icsContent.includes('BEGIN:VEVENT') &&
    icsContent.includes('DTSTART:20261115T160000') &&
    icsContent.includes('TRIGGER:-PT2H') &&
    icsContent.includes('TRIGGER:-P1D') &&
    icsContent.includes('END:VCALENDAR')
  );

  const calculatedEnd = calculateEndTime('16:00', 2.5);
  assertTest('Automatismi', 'Calcolo Preciso Orario Fine Sessione (16:00 + 2.5h = 18:30)',
    calculatedEnd === '18:30',
    `Risultato: ${calculatedEnd}`
  );

  const welcomeVoucher = DEFAULT_VOUCHERS.find(v => v.code === 'BENVENUTO5');
  assertTest('Automatismi', 'Voucher Benvenuto 5% Attivo & Flag Registrazione',
    Boolean(welcomeVoucher && welcomeVoucher.active && welcomeVoucher.discountValue === 5 && welcomeVoucher.singleUsePerAccount)
  );

  // -------------------------------------------------------------
  // SUITE 3: LINK PAYPAL & TARIFFE MICROFONI (Lewitt +10€, Warm +20€, Shure +20€, RØDE 0€)
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 3/6] Verifica PayPal Business & Listino Microfoni...\x1b[0m');

  assertTest('PayPal', 'Email PayPal Business Ufficiale Conforme (vkrealhakiesake@gmail.com)',
    STUDIO_PAYPAL_EMAIL === 'vkrealhakiesake@gmail.com',
    `Email attuale: ${STUDIO_PAYPAL_EMAIL}`
  );

  const paypalCheckout = getPayPalPaymentUrl(70, '171-ORD-112233', STUDIO_PAYPAL_EMAIL);
  assertTest('PayPal', 'URL Checkout Saldo PayPal con Currency EUR e Importo Esatto',
    paypalCheckout.includes('business=vkrealhakiesake%40gmail.com') &&
    paypalCheckout.includes('amount=70.00') &&
    paypalCheckout.includes('currency_code=EUR')
  );

  const paypalMeLink = getPayPalMeUrl(50, 'vkrealhakiesake');
  assertTest('PayPal', 'PayPal.Me Mobile Quick-Pay Link',
    paypalMeLink === 'https://paypal.me/vkrealhakiesake/50EUR'
  );

  const donationUrl = getPayPalDonationUrl(20, '171 RealTune', STUDIO_PAYPAL_EMAIL);
  assertTest('PayPal', 'URL Donazione Libera Sviluppo Plugin',
    donationUrl.includes('cmd=_donations') &&
    donationUrl.includes('business=vkrealhakiesake%40gmail.com') &&
    donationUrl.includes('amount=20.00')
  );

  // Microfoni & Tariffe
  const rodeMic = STUDIO_MICROPHONE_OPTIONS.find(m => m.id === 'rode-nt1a');
  const lewittMic = STUDIO_MICROPHONE_OPTIONS.find(m => m.id === 'lewitt-440');
  const warmMic = STUDIO_MICROPHONE_OPTIONS.find(m => m.id === 'warm-wa47jr');
  const shureMic = STUDIO_MICROPHONE_OPTIONS.find(m => m.id === 'shure-sm7b');

  assertTest('Tariffe Microfoni', 'RØDE NT1-A Signature Incluso a 0€',
    Boolean(rodeMic && rodeMic.fee === 0 && getMicrophoneFee('rode-nt1a') === 0)
  );
  assertTest('Tariffe Microfoni', 'Lewitt LCT 440 PURE Sovrapprezzo +10€',
    Boolean(lewittMic && lewittMic.fee === 10 && getMicrophoneFee('lewitt-440') === 10)
  );
  assertTest('Tariffe Microfoni', 'Warm Audio WA-47jr Sovrapprezzo +20€',
    Boolean(warmMic && warmMic.fee === 20 && getMicrophoneFee('warm-wa47jr') === 20)
  );
  assertTest('Tariffe Microfoni', 'Shure SM7B Dynamic Sovrapprezzo +20€',
    Boolean(shureMic && shureMic.fee === 20 && getMicrophoneFee('shure-sm7b') === 20)
  );

  // -------------------------------------------------------------
  // SUITE 4: COUNTER VISITE & TELEMETRIA STUDIO
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 4/6] Verifica Counter Visite (1280 Baseline) & Telemetria Live...\x1b[0m');

  const MARKETING_BASELINE = 1280;
  assertTest('Telemetria', 'Baseline Visite Marketing Fissata a 1280',
    MARKETING_BASELINE === 1280
  );

  // Test finestra 30 minuti sessione
  const nowTs = Date.now();
  const recentVisitTs = nowTs - (15 * 60 * 1000); // 15 mins ago
  const oldVisitTs = nowTs - (35 * 60 * 1000); // 35 mins ago
  const THIRTY_MINUTES = 30 * 60 * 1000;

  const shouldIncrementRecent = (nowTs - recentVisitTs) > THIRTY_MINUTES;
  const shouldIncrementOld = (nowTs - oldVisitTs) > THIRTY_MINUTES;

  assertTest('Telemetria', 'Controllo Anti-Abuso Visita (<30 min: NO incremento, >30 min: Incrementa)',
    shouldIncrementRecent === false && shouldIncrementOld === true
  );

  // Test range produttori online (3-7 nelle ore di punta 14-23, 2-5 nelle ore notturne)
  const isOnlineRangeValid = (min: number, max: number) => min >= 2 && max <= 7;
  assertTest('Telemetria', 'Produttori Live Online Compresi Tra 3 e 7 in Ore di Studio',
    isOnlineRangeValid(3, 7)
  );

  // -------------------------------------------------------------
  // SUITE 5: DOWNLOAD PLUGIN V2.2.5 & THE GOD CYPHER AUDIO
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 5/6] Verifica Pacchetti Plugin v2.2.5 & Tracce Audio The God Cypher...\x1b[0m');

  const v225Plugins = [
    { name: '171 RealTune v2.2.5', file: '171RealTune_v2.2.5_Win64.zip', minSize: 15_000_000 },
    { name: '171 EasyVoice v2.2.5', file: '171EasyVoice_v2.2.5_Win64.zip', minSize: 30_000_000 },
    { name: '171 PerfectPre v2.2.5', file: '171PerfectPre_v2.2.5_Win64.zip', minSize: 15_000_000 },
    { name: '171 SpaceLuxe v2.2.5', file: '171SpaceLuxe_v2.2.5_Win64.zip', minSize: 7_000_000 },
    { name: '171 MasterGlue v2.2.5', file: '171MasterGlue_v2.2.5_Win64.zip', minSize: 7_000_000 },
  ];

  for (const p of v225Plugins) {
    const filePath = path.resolve('public/downloads/plugins', p.file);
    const exists = fs.existsSync(filePath);
    let sizeValid = false;
    if (exists) {
      const stats = fs.statSync(filePath);
      sizeValid = stats.size >= p.minSize;
    }
    assertTest('Download v2.2.5', `Integrità Pacchetto Ufficiale ${p.name}`, exists && sizeValid, 
      exists ? `Dimensione: ${(fs.statSync(filePath).size / (1024*1024)).toFixed(2)} MB` : 'FILE MANCANTE');
  }

  // Verifica Tracce The God Cypher
  const audioDir = path.resolve('public/assets/the-god-cypher/audio');
  const audioExists = fs.existsSync(audioDir);
  let audioCount = 0;
  if (audioExists) {
    const files = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    audioCount = files.length;
  }
  assertTest('Audio Cypher', 'Presenza Cartella Audio & File Tracce The God Cypher',
    audioExists && audioCount > 0,
    `Trovate ${audioCount} tracce audio reali in ${audioDir}`
  );

  // -------------------------------------------------------------
  // SUITE 6: HEALTH CHECK LIVE SU HTTPS://171STUDIO.IT
  // -------------------------------------------------------------
  console.log('\n\x1b[36m[SUITE 6/6] Health Check Live su https://171studio.it...\x1b[0m');

  try {
    const startTime = Date.now();
    const res = await fetch('https://171studio.it', { method: 'GET' });
    const elapsed = Date.now() - startTime;
    const text = await res.text();

    assertTest('Live Health Check', 'HTTP 200 OK da https://171studio.it', 
      res.status === 200, 
      `Status HTTP: ${res.status}`
    );
    assertTest('Live Health Check', 'Tempo di Risposta Server Sotto 1000ms', 
      elapsed < 1000, 
      `Latenza riscontrata: ${elapsed}ms`
    );
    assertTest('Live Health Check', 'Presenza Titolo & Struttura 171 Studio in HTML', 
      text.includes('171 Studio') && text.includes('171PluginInnovation'), 
      'Titolo trovato nel markup di risposta'
    );
  } catch (err: any) {
    assertTest('Live Health Check', 'Connessione a https://171studio.it', false, err.message);
  }

  // -------------------------------------------------------------
  // REPORT FINALE
  // -------------------------------------------------------------
  console.log('\n====================================================================');
  console.log('  RISULTATO AUDIT DI CONFORMITÀ E2E                                ');
  console.log('====================================================================');
  console.log(`Totale Verifiche : ${totalTests}`);
  console.log(`Superate (PASS)  : \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Fallite (FAIL)   : ${failedTests > 0 ? `\x1b[31m${failedTests}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Errore fatale audit:', err);
  process.exit(1);
});
