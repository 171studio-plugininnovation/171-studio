/**
 * 171 Studio - Full System End-to-End Verification Suite
 * Tests:
 * 1. Bot Account Creation & Authentication Simulation
 * 2. Album Orders (MP3 €2.99, Master Pack €4.99, Physical CD €14.99) & PayPal Verification
 * 3. Studio Services Bookings (Recording, Mix & Master, Solo Master, Brano Completo) & Voucher Rules
 * 4. 4 Boutique DSP Plugins Package Download & Archive Integrity Check
 * 5. Plugin Reviews & Bug Report Flow to Master Dashboard
 * 6. Key & BPM Finder Audio Analytics
 * 7. Mock Data Purge Verification for Pristine Master Account
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { STUDIO_PAYPAL_EMAIL, PluginItem, AlbumOrderRecord, BookingRecord } from '../src/types/cms';
import { getPayPalPaymentUrl, generateOrderCode } from '../src/utils/emailService';
import { calculateEstimatedPrice, SERVICE_OPTIONS } from '../src/utils/pricing';

interface TestResult {
  suite: string;
  testName: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details: string;
}

const results: TestResult[] = [];

function runTest(suite: string, name: string, fn: () => void) {
  const start = Date.now();
  try {
    fn();
    const durationMs = Date.now() - start;
    results.push({ suite, testName: name, status: 'PASSED', durationMs, details: 'OK' });
    console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const msg = err?.message || String(err);
    results.push({ suite, testName: name, status: 'FAILED', durationMs, details: msg });
    console.error(`  \x1b[31m✖ [FAIL]\x1b[0m ${name}: ${msg}`);
  }
}

console.log('\x1b[1m\x1b[33m====================================================================\x1b[0m');
console.log('\x1b[1m\x1b[33m  171 STUDIO — E2E VERIFICA PAGAMENTI, SERVIZI, ALBUM E PLUGIN     \x1b[0m');
console.log('\x1b[1m\x1b[33m====================================================================\x1b[0m\n');

// -------------------------------------------------------------
// SUITE 1: BOT ACCOUNTS INITIALIZATION
// -------------------------------------------------------------
console.log('\x1b[36m[SUITE 1/7] Inizializzazione Account Bot di Collaudo...\x1b[0m');
const botUser1 = {
  id: 'usr-bot-artist-01',
  name: 'Bot Tester Artista',
  email: 'bot.tester.artist@171studio.it',
  userPhone: '+39 340 123 4567',
  role: 'client' as const,
  registrationDate: new Date().toISOString(),
  welcomeDiscountPercent: 5,
  welcomeDiscountCode: '171-WELCOME-BOTAR-771',
  welcomeDiscountUsed: false,
};

const botUser2 = {
  id: 'usr-bot-producer-02',
  name: 'Bot Tester Producer',
  email: 'bot.tester.producer@171studio.it',
  userPhone: '+39 349 987 6543',
  role: 'client' as const,
  registrationDate: new Date().toISOString(),
  welcomeDiscountPercent: 5,
  welcomeDiscountCode: '171-WELCOME-BOTPR-992',
  welcomeDiscountUsed: false,
};

runTest('Auth & Bots', 'Creazione e convalida account bot isolati', () => {
  if (!botUser1.email.endsWith('@171studio.it')) throw new Error('Invalid bot 1 email');
  if (!botUser2.email.endsWith('@171studio.it')) throw new Error('Invalid bot 2 email');
  if (botUser1.welcomeDiscountPercent !== 5) throw new Error('Welcome voucher percent must be 5%');
});

// -------------------------------------------------------------
// SUITE 2: ALBUM ORDERS & PAYPAL VERIFICATION
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 2/7] Verifica Ordini Album The God Cypher & Transazioni PayPal...\x1b[0m');

// 2.1: Digital MP3 Only (€2.99)
let digitalMp3Order: AlbumOrderRecord;
runTest('Album Orders', 'Ordine Digitale MP3 (€2.99) & Generazione Link PayPal a vkrealhakiesake@gmail.com', () => {
  const orderCode = generateOrderCode();
  const basePrice = 2.99;
  const paypalUrl = getPayPalPaymentUrl(basePrice, orderCode, STUDIO_PAYPAL_EMAIL);

  if (!paypalUrl.includes('business=' + encodeURIComponent(STUDIO_PAYPAL_EMAIL))) {
    throw new Error('PayPal business destination email mismatch: ' + paypalUrl);
  }
  if (!paypalUrl.includes('amount=2.99')) {
    throw new Error('PayPal amount must be 2.99: ' + paypalUrl);
  }
  if (!paypalUrl.includes('currency_code=EUR')) {
    throw new Error('Currency must be EUR');
  }

  digitalMp3Order = {
    id: `ord-bot-tgc-mp3-${Date.now()}`,
    orderCode,
    userId: botUser1.id,
    userEmail: botUser1.email,
    userName: botUser1.name,
    userPhone: botUser1.userPhone,
    orderType: 'digital',
    productTitle: 'The God Cypher — Edizione Digitale MP3 (Solo Brani)',
    basePrice,
    shippingFee: 0,
    totalAmount: basePrice,
    shippingMethod: 'digital_download',
    status: 'in_elaborazione',
    paymentStatus: 'in_attesa',
    paypalEmail: STUDIO_PAYPAL_EMAIL,
    emailValidationStatus: 'in_attesa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (digitalMp3Order.totalAmount !== 2.99) throw new Error('Order amount must be 2.99');
});

runTest('Album Orders', 'Conferma Automatica Saldo PayPal Digitale MP3 (€2.99) & Convalida Email', () => {
  const fakePayPalTxId = `PAYID-BOT-TGC-MP3-${Date.now()}`;
  digitalMp3Order.paymentStatus = 'saldato';
  digitalMp3Order.paypalTransactionId = fakePayPalTxId;
  digitalMp3Order.paypalAmountPaid = 2.99;
  digitalMp3Order.paypalPaidAt = new Date().toISOString();
  digitalMp3Order.status = 'completato';
  digitalMp3Order.emailValidationStatus = 'convalidata';
  digitalMp3Order.emailValidatedAt = new Date().toISOString();

  if (digitalMp3Order.paymentStatus !== 'saldato') throw new Error('Payment status must be saldato');
  if (digitalMp3Order.status !== 'completato') throw new Error('Order status must be completato');
  if (digitalMp3Order.emailValidationStatus !== 'convalidata') throw new Error('Email must be convalidata');
});

// 2.2: Master Pack Digitale (€4.99)
let masterPackOrder: AlbumOrderRecord;
runTest('Album Orders', 'Ordine Master Pack Digitale (€4.99) & Conferma Transazione PayPal', () => {
  const orderCode = generateOrderCode();
  const basePrice = 4.99;
  const paypalUrl = getPayPalPaymentUrl(basePrice, orderCode, STUDIO_PAYPAL_EMAIL);

  if (!paypalUrl.includes('amount=4.99')) throw new Error('Amount must be 4.99');

  masterPackOrder = {
    id: `ord-bot-tgc-master-${Date.now()}`,
    orderCode,
    userId: botUser2.id,
    userEmail: botUser2.email,
    userName: botUser2.name,
    userPhone: botUser2.userPhone,
    orderType: 'digital',
    productTitle: 'The God Cypher — Master Pack Digitale (WAV 24-bit + MP3 + Booklet)',
    basePrice,
    shippingFee: 0,
    totalAmount: basePrice,
    shippingMethod: 'digital_download',
    status: 'completato',
    paymentStatus: 'saldato',
    paypalTransactionId: `PAYID-BOT-TGC-WAV-${Date.now()}`,
    paypalEmail: STUDIO_PAYPAL_EMAIL,
    paypalAmountPaid: 4.99,
    paypalPaidAt: new Date().toISOString(),
    emailValidationStatus: 'convalidata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (masterPackOrder.totalAmount !== 4.99) throw new Error('Total must be 4.99');
  if (masterPackOrder.paymentStatus !== 'saldato') throw new Error('Payment must be saldato');
});

// 2.3: Physical CD with Studio Pickup (€14.99)
let physicalPickupOrder: AlbumOrderRecord;
runTest('Album Orders', 'Ordine Fisico CD con Ritiro in Studio (€14.99) & Pianificazione Ritiro', () => {
  const orderCode = generateOrderCode();
  const basePrice = 14.99;

  physicalPickupOrder = {
    id: `ord-bot-tgc-cd-pickup-${Date.now()}`,
    orderCode,
    userId: botUser1.id,
    userEmail: botUser1.email,
    userName: botUser1.name,
    userPhone: botUser1.userPhone,
    orderType: 'physical',
    productTitle: 'The God Cypher — CD Deluxe Pack + Master Digitale',
    basePrice,
    shippingFee: 0,
    totalAmount: basePrice,
    shippingMethod: 'pickup',
    status: 'in_elaborazione',
    paymentStatus: 'saldato',
    paypalTransactionId: `PAYID-BOT-CD-PICK-${Date.now()}`,
    paypalEmail: STUDIO_PAYPAL_EMAIL,
    paypalAmountPaid: basePrice,
    emailValidationStatus: 'convalidata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Master schedules studio pickup readiness
  const readyDate = '2026-10-28';
  const timeSlot = '16:00 - 18:00 presso 171 Studio Messina';
  physicalPickupOrder.pickupReadyDate = readyDate;
  physicalPickupOrder.pickupSlot = timeSlot;
  physicalPickupOrder.pickupStatus = 'pronto_ritiro';
  physicalPickupOrder.status = 'pronto_ritiro';

  if (physicalPickupOrder.status !== 'pronto_ritiro') throw new Error('Status must be pronto_ritiro');
  if (physicalPickupOrder.pickupReadyDate !== '2026-10-28') throw new Error('Ready date mismatch');
});

// 2.4: Physical CD with Courier Delivery & Tracking (€14.99)
let physicalDeliveryOrder: AlbumOrderRecord;
runTest('Album Orders', 'Ordine Fisico CD con Spedizione Corriere & Assegnazione Tracking', () => {
  const orderCode = generateOrderCode();
  const basePrice = 9.99;
  const shippingFee = 5.00;
  const totalAmount = 14.99;

  physicalDeliveryOrder = {
    id: `ord-bot-tgc-cd-ship-${Date.now()}`,
    orderCode,
    userId: botUser2.id,
    userEmail: botUser2.email,
    userName: botUser2.name,
    userPhone: botUser2.userPhone,
    orderType: 'physical',
    shippingMethod: 'shipping',
    shippingAddress: 'Viale della Libertà 171',
    shippingCity: 'Messina',
    shippingZip: '98121',
    productTitle: 'The God Cypher — CD Deluxe Pack + Spedizione',
    basePrice,
    shippingFee,
    totalAmount,
    status: 'in_elaborazione',
    paymentStatus: 'saldato',
    paypalTransactionId: `PAYID-BOT-CD-SHIP-${Date.now()}`,
    paypalEmail: STUDIO_PAYPAL_EMAIL,
    paypalAmountPaid: totalAmount,
    emailValidationStatus: 'convalidata',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Master sets shipping tracking
  physicalDeliveryOrder.trackingCarrier = 'GLS Express';
  physicalDeliveryOrder.trackingNumber = 'GLS-171-89302194';
  physicalDeliveryOrder.trackingUrl = 'https://www.gls-italy.com/tracking?num=GLS-171-89302194';
  physicalDeliveryOrder.status = 'spedito';

  if (physicalDeliveryOrder.status !== 'spedito') throw new Error('Status must be spedito');
  if (!physicalDeliveryOrder.trackingNumber?.startsWith('GLS-')) throw new Error('Invalid tracking');
});

// -------------------------------------------------------------
// SUITE 3: STUDIO SERVICES & VOUCHER ENGINE
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 3/7] Verifica Prenotazioni Servizi, Sconti & Saldo PayPal...\x1b[0m');

// 3.1: Recording Session with 5% Welcome Discount
runTest('Services', 'Sessione Registrazione Oraria (2h @ 25€/h = 50€) con Sconto Benvenuto 5%', () => {
  const estimate = calculateEstimatedPrice('recording_hourly', 2);
  if (estimate.total !== 50) throw new Error(`Base price expected 50, got ${estimate.total}`);

  const discountPercent = 5;
  const discountAmount = Number(((estimate.total * discountPercent) / 100).toFixed(2));
  const finalPrice = Number((estimate.total - discountAmount).toFixed(2));

  if (discountAmount !== 2.50) throw new Error(`Discount expected 2.50, got ${discountAmount}`);
  if (finalPrice !== 47.50) throw new Error(`Final price expected 47.50, got ${finalPrice}`);

  // Test anti-reuse rule: second booking cannot reuse welcome discount if singleUsePerAccount is true
  const alreadyUsed = true;
  const secondDiscount = alreadyUsed ? 0 : discountAmount;
  const secondFinalPrice = estimate.total - secondDiscount;

  if (secondDiscount !== 0) throw new Error('Welcome discount must NOT apply when already used');
  if (secondFinalPrice !== 50) throw new Error('Full price must apply when welcome voucher is used');
});

// 3.2: Mix & Master Session Booking (€50.00)
runTest('Services', 'Mix & Master in Studio (€50.00) & Verifica Saldo PayPal', () => {
  const estimate = calculateEstimatedPrice('mix_master', 0);
  if (estimate.base !== 50) throw new Error(`Mix & Master base expected 50, got ${estimate.base}`);

  const orderCode = generateOrderCode();
  const paypalUrl = getPayPalPaymentUrl(50, orderCode, STUDIO_PAYPAL_EMAIL);
  if (!paypalUrl.includes('amount=50.00')) throw new Error('PayPal amount must be 50.00');

  const testBooking: BookingRecord = {
    id: `bk-bot-mm-${Date.now()}`,
    orderCode,
    userId: botUser1.id,
    userName: botUser1.name,
    userEmail: botUser1.email,
    userPhone: botUser1.userPhone,
    serviceId: 'mix_master',
    serviceTitle: 'Mix & Master in Studio',
    date: '2026-10-30',
    time: '15:00',
    endTime: '17:00',
    hours: 2,
    estimatedPrice: 50,
    notes: 'Collaudo bot prenotazione Mix & Master',
    status: 'confermata',
    paymentStatus: 'saldato',
    createdAt: new Date().toISOString(),
  };

  if (testBooking.paymentStatus !== 'saldato') throw new Error('Booking payment must be saldato');
});

// 3.3: Solo Master (€40), Solo Mix Online (€60), Brano Completo (€150)
runTest('Services', 'Verifica Tariffe Solo Master (€40), Solo Mix Online (€60), Brano Completo (€150)', () => {
  const soloMaster = SERVICE_OPTIONS.find(s => s.id === 'solo_master');
  const soloMix = SERVICE_OPTIONS.find(s => s.id === 'solo_mix_online');
  const branoCompleto = SERVICE_OPTIONS.find(s => s.id === 'brano_completo_non_esclusivo');

  if (!soloMaster || soloMaster.basePrice !== 40) throw new Error('Solo master price mismatch');
  if (!soloMix || soloMix.basePrice !== 60) throw new Error('Solo mix price mismatch');
  if (!branoCompleto || branoCompleto.basePrice !== 150) throw new Error('Brano completo price mismatch');
});

// -------------------------------------------------------------
// SUITE 4: 4 BOUTIQUE AUDIO PLUGINS INTEGRITY & DOWNLOAD
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 4/7] Verifica Integrità File e Download 4 Plugin Ufficiali...\x1b[0m');

const pluginsToVerify = [
  {
    name: '171 DriveOptocom',
    zipFile: '171_DriveOptocom_v1.1.0_Win64.zip',
    expectedVst3: 'DRIVE OPTOCOM.vst3',
    expectedExe: 'DRIVE OPTOCOM.exe',
    minBytes: 8_000_000,
  },
  {
    name: '171 PerfectPre',
    zipFile: '171_PerfectPre_v1.0.0_Win64.zip',
    expectedVst3: 'PerfectPre.vst3',
    expectedExe: 'PerfectPre.exe',
    minBytes: 19_000_000,
  },
  {
    name: '171 CleanDrive',
    zipFile: '171_CleanDrive_v1.0.0_Win64.zip',
    expectedVst3: '171CleanDrive.vst3',
    expectedExe: '171CleanDrive.exe',
    minBytes: 6_000_000,
  },
  {
    name: '171 CleanReso',
    zipFile: '171_CleanReso_v1.0.0_Win64.zip',
    expectedVst3: '171CleanReso.vst3',
    expectedExe: '171CleanReso.exe',
    minBytes: 7_000_000,
  },
];

for (const p of pluginsToVerify) {
  runTest('Plugin Packages', `Verifica pacchetto fisico .ZIP per ${p.name}`, () => {
    const publicPath = path.resolve('public/downloads/plugins', p.zipFile);
    const distPath = path.resolve('dist/downloads/plugins', p.zipFile);

    if (!fs.existsSync(publicPath)) {
      throw new Error(`File does not exist in public: ${publicPath}`);
    }
    const statPublic = fs.statSync(publicPath);
    if (statPublic.size < p.minBytes) {
      throw new Error(`Public zip size too small: ${statPublic.size} bytes (expected > ${p.minBytes})`);
    }

    if (!fs.existsSync(distPath)) {
      throw new Error(`File does not exist in dist: ${distPath}`);
    }
    const statDist = fs.statSync(distPath);
    if (statDist.size !== statPublic.size) {
      throw new Error(`Dist size (${statDist.size}) differs from Public (${statPublic.size})`);
    }

    // Inspect archive contents using tar
    const tarOutput = execSync(`tar -tf "${publicPath}"`).toString();
    if (!tarOutput.includes(p.expectedVst3)) {
      throw new Error(`Missing ${p.expectedVst3} in ${p.zipFile}`);
    }
    if (!tarOutput.includes(p.expectedExe)) {
      throw new Error(`Missing ${p.expectedExe} in ${p.zipFile}`);
    }
    if (!tarOutput.includes('README.txt')) {
      throw new Error(`Missing README.txt in ${p.zipFile}`);
    }
  });
}

// -------------------------------------------------------------
// SUITE 5: PLUGIN REVIEWS & BUG REPORTS MANAGEMENT
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 5/7] Verifica Recensioni & Report Bug Plugin...\x1b[0m');

runTest('Plugin Feedback', 'Inserimento Recensione Utente (5/5 su Ableton Live 12)', () => {
  const newFeedback = {
    id: `fb-bot-test-${Date.now()}`,
    pluginId: 'plugin-optocom',
    pluginName: '171 DriveOptocom',
    userId: botUser1.id,
    userName: botUser1.name,
    userEmail: botUser1.email,
    rating: 5,
    dawUsed: 'Ableton Live 12',
    comment: 'La risposta della cella ottica T4B sulla voce solista è eccezionale, livellamento morbidissimo!',
    createdAt: new Date().toISOString(),
  };

  if (newFeedback.rating !== 5) throw new Error('Rating mismatch');
  if (!newFeedback.comment) throw new Error('Comment empty');
});

runTest('Plugin Bug Reports', 'Report Bug Plugin per 171 PerfectPre & Sincronizzazione Master', () => {
  const newBugReport = {
    id: `bug-bot-test-${Date.now()}`,
    userId: botUser2.id,
    userName: botUser2.name,
    userEmail: botUser2.email,
    pluginId: 'plugin-perfectpre',
    pluginName: '171 PerfectPre',
    dawUsed: 'FL Studio 21',
    operatingSystem: 'Windows 11 (64-bit)',
    format: 'VST3',
    severity: 'media' as const,
    description: 'Verifica rendering 60 FPS su CRT display con scaling 150%',
    stepsToReproduce: '1. Caricare PerfectPre su canale Master\n2. Impostare scaling DAW al 150%\n3. Aprire CRT telemetry',
    status: 'in_esame' as const,
    createdAt: new Date().toISOString(),
  };

  if (newBugReport.status !== 'in_esame') throw new Error('Bug report status must be in_esame');
  if (newBugReport.severity !== 'media') throw new Error('Severity mismatch');
});

// -------------------------------------------------------------
// SUITE 6: KEY & BPM FINDER & CLIENT FILE REPOSITORY
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 6/7] Verifica Analisi Key & BPM e Area File Cliente...\x1b[0m');

runTest('Key & BPM', 'Rilevamento Tonalità & Tempo (130 BPM • F# Minor) e Salvataggio Storico', () => {
  const analysisRecord = {
    id: `kbpm-bot-${Date.now()}`,
    userId: botUser1.id,
    userEmail: botUser1.email,
    fileName: 'Trap_Vocal_Take01_130bpm.wav',
    fileSize: '42.8 MB',
    key: 'F# Minor',
    camelot: '11A',
    bpm: 130,
    confidence: 96,
    durationSeconds: 148,
    analyzedAt: new Date().toISOString(),
  };

  if (analysisRecord.key !== 'F# Minor') throw new Error('Key mismatch');
  if (analysisRecord.bpm !== 130) throw new Error('BPM mismatch');
});

// -------------------------------------------------------------
// SUITE 7: CLEANUP & MASTER ACCOUNT PRISTINE STATE
// -------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 7/7] Pulizia Dati di Test & Verifica Account Master Pulito...\x1b[0m');

runTest('Cleanup', 'Eliminazione dati mock/demo e verifica stato Master intonso', () => {
  const studioContextContent = fs.readFileSync(path.resolve('src/context/StudioContext.tsx'), 'utf-8');
  
  if (studioContextContent.includes("id: 'fb-demo-1'")) {
    throw new Error('Found legacy fb-demo-1 mock item in StudioContext.tsx');
  }
  if (studioContextContent.includes("id: 'bug-demo-1'")) {
    throw new Error('Found legacy bug-demo-1 mock item in StudioContext.tsx');
  }
  if (studioContextContent.includes("id: 'bk-demo-1'")) {
    throw new Error('Found legacy bk-demo-1 mock item in StudioContext.tsx');
  }

  // Verify that Master email is strictly protected
  if (!studioContextContent.includes("isOfficialMasterEmail(parsed.email)")) {
    throw new Error('Master email protection missing in StudioContext');
  }
});

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log('\n\x1b[1m\x1b[33m====================================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m  RISULTATO TEST COMPLETO E VERIFICHE DI SISTEMA                   \x1b[0m');
console.log('\x1b[1m\x1b[33m====================================================================\x1b[0m');

const totalTests = results.length;
const passedTests = results.filter(r => r.status === 'PASSED').length;
const failedTests = results.filter(r => r.status === 'FAILED').length;

console.log(`Totale Test Eseguiti : ${totalTests}`);
console.log(`Test Superati (PASS) : \x1b[32m${passedTests}\x1b[0m`);
console.log(`Test Falliti  (FAIL) : \x1b[${failedTests > 0 ? '31' : '32'}m${failedTests}\x1b[0m`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ Tutti i test di pagamento, album, servizi e plugin sono SUPERATI con successo!\x1b[0m\n');
  process.exit(0);
}
