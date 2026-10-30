import {
  BookingRecord,
  AlbumOrderRecord,
  UserAccount,
  EmailLog,
  EmailTemplatesConfig,
  DEFAULT_EMAIL_TEMPLATES,
  STUDIO_PAYPAL_EMAIL,
  MASTER_EMAIL,
  PluginItem,
} from '../types/cms';
import { db, handleFirestoreError, OperationType, getCachedAccessToken } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { sendGmailMessage } from './gmailService';
import { getAssetUrl } from './assetPath';

/**
 * Generate a unique and clear order/booking code for 171 Studio.
 * Example: 171-ORD-849201
 */
export function generateOrderCode(bookingId?: string): string {
  if (bookingId && bookingId.startsWith('171-ORD-')) {
    return bookingId;
  }
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `171-ORD-${randomSuffix}`;
}

/**
 * Generates the direct PayPal payment URL for vkrealhakiesake@gmail.com
 * pre-filled with the exact final session amount and order code.
 */
export function getPayPalPaymentUrl(
  amount: number,
  orderCode: string,
  paypalEmail: string = STUDIO_PAYPAL_EMAIL
): string {
  const encodedEmail = encodeURIComponent(paypalEmail);
  const encodedItemName = encodeURIComponent(`171 Studio - Saldo Sessione #${orderCode}`);
  const formattedAmount = amount.toFixed(2);

  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodedEmail}&currency_code=EUR&amount=${formattedAmount}&item_name=${encodedItemName}`;
}

/**
 * Generates a PayPal Free Donation URL for 171 Plugin Innovation
 */
export function getPayPalDonationUrl(
  amount?: number,
  pluginName: string = '171 Plugin Innovation',
  paypalEmail: string = STUDIO_PAYPAL_EMAIL
): string {
  const encodedEmail = encodeURIComponent(paypalEmail);
  const encodedItemName = encodeURIComponent(
    `Donazione Libera Sviluppo Gratuito - ${pluginName} (171 Studio)`
  );
  if (amount && amount > 0) {
    return `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodedEmail}&currency_code=EUR&amount=${amount.toFixed(2)}&item_name=${encodedItemName}`;
  }
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodedEmail}&currency_code=EUR&item_name=${encodedItemName}`;
}

/**
 * Alternative direct PayPal.Me link (easy mobile checkout)
 */
export function getPayPalMeUrl(amount?: number, paypalUser: string = 'vkrealhakiesake'): string {
  if (amount && amount > 0) {
    return `https://paypal.me/${paypalUser}/${Math.round(amount)}EUR`;
  }
  return `https://paypal.me/${paypalUser}`;
}

/**
 * Generates mailto link for sending or opening the email in the default email app.
 */
export function createMailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generates a direct Gmail Web Compose URL (zero Google OAuth tokens or backend required!).
 * Opens directly in user's or master's browser with To, Subject, and pre-formatted body ready.
 */
export function getGmailWebComposeUrl(to: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Sends real email via generic Webhook (e.g. Formspree, Make.com, Zapier, Pipedream, Cloudflare Worker).
 * No Google OAuth or complex setup needed!
 */
export async function sendEmailViaWebhook(
  webhookUrl: string,
  payload: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const targetEmail = payload.to || payload.recipientEmail || payload.email || payload.recipient || '';
    const subject = payload.subject || '';
    const textBody = payload.text || payload.textBody || payload.body || '';
    const htmlBody = payload.html || payload.htmlBody || '';

    // Multi-platform normalized payload (Make.com Gmail, Zapier, Webhooks, Pipedream)
    const normalizedPayload = {
      ...payload,
      to: targetEmail,
      recipientEmail: targetEmail,
      email: targetEmail,
      recipient: targetEmail,
      subject,
      body: textBody || htmlBody,
      text: textBody,
      textBody: textBody,
      html: htmlBody,
      htmlBody: htmlBody,
      content: htmlBody || textBody,
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
    });
    if (res.ok) {
      return { success: true };
    }
    const errText = await res.text();
    return { success: false, error: `Webhook error (${res.status}): ${errText}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore di connessione webhook' };
  }
}

/**
 * Sends real email via EmailJS REST API directly from the browser (Zero backend & Zero Google OAuth).
 */
export async function sendEmailViaEmailJS(
  serviceId: string,
  templateId: string,
  publicKey: string,
  templateParams: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: templateParams,
      }),
    });
    if (res.ok) {
      return { success: true };
    }
    const errText = await res.text();
    return { success: false, error: `EmailJS error (${res.status}): ${errText}` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore di connessione EmailJS' };
  }
}

/**
 * Loads current email automation settings from localStorage
 */
export function getEmailAutomationConfig(): {
  emailWebhookUrl?: string;
  emailjsServiceId?: string;
  emailjsTemplateIdReceipt?: string;
  emailjsTemplateIdConfirmation?: string;
  emailjsPublicKey?: string;
} {
  try {
    const saved = localStorage.getItem('171_site_content');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        emailWebhookUrl: parsed.emailWebhookUrl || 'https://hook.eu1.make.com/a03ihbpq25iwo69o1slek8vmn9cjgec8',
        emailjsServiceId: parsed.emailjsServiceId,
        emailjsTemplateIdReceipt: parsed.emailjsTemplateIdReceipt,
        emailjsTemplateIdConfirmation: parsed.emailjsTemplateIdConfirmation,
        emailjsPublicKey: parsed.emailjsPublicKey,
      };
    }
  } catch {}
  return {
    emailWebhookUrl: 'https://hook.eu1.make.com/a03ihbpq25iwo69o1slek8vmn9cjgec8',
  };
}

/**
 * Loads current custom email templates from localStorage or falls back to defaults
 */
export function getActiveEmailTemplates(custom?: Partial<EmailTemplatesConfig>): EmailTemplatesConfig {
  try {
    const saved = localStorage.getItem('171_site_content');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.emailTemplates) {
        return {
          ...DEFAULT_EMAIL_TEMPLATES,
          ...parsed.emailTemplates,
          ...(custom || {}),
        };
      }
    }
  } catch {}
  return {
    ...DEFAULT_EMAIL_TEMPLATES,
    ...(custom || {}),
  };
}

/**
 * Replaces template variables like {nome}, {codice_ordine}, {servizio}, {data}, {ora}, {importo}
 */
export function interpolateEmailTemplate(
  templateText: string,
  booking: BookingRecord,
  orderCode: string
): string {
  const userName = booking.userName?.trim() || 'Artista';
  return templateText
    .replace(/\{nome\}/gi, userName)
    .replace(/\{user\}/gi, userName)
    .replace(/\{username\}/gi, userName)
    .replace(/\{codice_ordine\}/gi, orderCode)
    .replace(/\{servizio\}/gi, booking.serviceTitle || 'Sessione in Studio')
    .replace(/\{data\}/gi, booking.date || '')
    .replace(/\{ora\}/gi, booking.time || '')
    .replace(/\{importo\}/gi, `${booking.estimatedPrice} €`)
    .replace(/\{email\}/gi, booking.userEmail || '')
    .replace(/\{telefono\}/gi, booking.userPhone || '')
    .replace(
      /\{sconto\}/gi,
      booking.discountCode
        ? `Codice ${booking.discountCode} (-${booking.discountAmount || 0}€)`
        : 'Nessuno'
    );
}

/**
 * Generates a real valid .ZIP binary Blob containing the plugin installer files and triggers browser download,
 * or downloads the exact .ZIP archive uploaded by the Master in the CMS.
 */
export function triggerPluginZipFileDownload(plugin: PluginItem, platform: 'win' | 'mac' = 'win'): void {
  // Prohibit downloads strictly for plugins currently locked or marked IN ARRIVO before unlockDate
  const isLocked = plugin.unlockDate
    ? new Date(plugin.unlockDate).getTime() > Date.now()
    : plugin.status === 'IN ARRIVO';
  if (isLocked) {
    return;
  }

  if (platform === 'mac') {
    const cleanFileName =
      plugin.macZipFileName ||
      `${plugin.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(plugin.version || 'v1.0').replace(/[^a-zA-Z0-9._-]/g, '')}_Mac.zip`;

    if (plugin.macDownloadUrl && !plugin.macDownloadUrl.startsWith('#')) {
      const link = document.createElement('a');
      link.href = getAssetUrl(plugin.macDownloadUrl);
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
  }

  const cleanFileName =
    plugin.zipFileName ||
    `${plugin.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${(plugin.version || 'v1.0').replace(/[^a-zA-Z0-9._-]/g, '')}_Win64.zip`;
  // 1. If the plugin has a direct download URL pointing to a packaged file (e.g. /downloads/plugins/...), download it directly
  if (plugin.downloadUrl && !plugin.downloadUrl.startsWith('#')) {
    const link = document.createElement('a');
    link.href = getAssetUrl(plugin.downloadUrl);
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. If the Master uploaded a custom .zip DataURL, download it directly
  if (plugin.zipDataUrl && plugin.zipDataUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = plugin.zipDataUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Otherwise construct a valid standard PKZIP archive containing the README & VST3/AU info
  const readmeContent = `================================================================
171 PLUGIN INNOVATION — PACCHETTO UFFICIALE INSTALLAZIONE (.ZIP)
================================================================
Plugin: ${plugin.name}
Versione: ${plugin.version || '1.0.0'}
Categoria DSP: ${plugin.badge}
Stato Release: ${plugin.status}
Formati Inclusi: VST3 / AU / AAX (macOS Universal & Windows 64-bit)

DESCRIZIONE TECNICA:
${plugin.description}

ISTRUZIONI DI INSTALLAZIONE:
1. Estrai questa cartella .ZIP sul tuo computer.
2. Su Windows: copia il file .vst3 in C:\\Program Files\\Common Files\\VST3\\
3. Su macOS: copia il file .vst3 in /Library/Audio/Plug-Ins/VST3/ e .component in /Library/Audio/Plug-Ins/Components/
4. Riavvia la tua DAW (Ableton Live, FL Studio, Logic Pro, Pro Tools, Cubase, Reaper).

PROGETTO GRATUITO 171 STUDIO MESSINA:
I nostri plugin sono e rimarranno sempre gratuiti per tutti i produttori e artisti.
Lascia un feedback sul sito per aiutarci a migliorarli continuamente!
Sostienici con una donazione libera PayPal: ${getPayPalMeUrl()}
Contatti Studio: ${MASTER_EMAIL}
================================================================\r\n`;

  const zipBlob = createMinimalZipBlob(`README_${plugin.name.replace(/\s+/g, '_')}.txt`, readmeContent);
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFileName.endsWith('.zip') ? cleanFileName : `${cleanFileName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Creates a valid uncompressed PKZIP binary Blob containing a single file
 */
function createMinimalZipBlob(fileName: string, fileContent: string): Blob {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(fileName);
  const dataBytes = encoder.encode(fileContent);
  const crc = crc32(dataBytes);

  const localHeader = new Uint8Array(30 + nameBytes.length);
  const localView = new DataView(localHeader.buffer);
  localView.setUint32(0, 0x04034b50, true); // Local file header signature
  localView.setUint16(4, 20, true); // Version needed
  localView.setUint16(6, 0, true); // Flags
  localView.setUint16(8, 0, true); // Compression (0 = store)
  localView.setUint16(10, 0, true); // Mod time
  localView.setUint16(12, 0, true); // Mod date
  localView.setUint32(14, crc, true); // CRC-32
  localView.setUint32(18, dataBytes.length, true); // Compressed size
  localView.setUint32(22, dataBytes.length, true); // Uncompressed size
  localView.setUint16(26, nameBytes.length, true); // Filename length
  localView.setUint16(28, 0, true); // Extra field length
  localHeader.set(nameBytes, 30);

  const centralHeader = new Uint8Array(46 + nameBytes.length);
  const centralView = new DataView(centralHeader.buffer);
  centralView.setUint32(0, 0x02014b50, true); // Central directory signature
  centralView.setUint16(4, 20, true);
  centralView.setUint16(6, 20, true);
  centralView.setUint16(8, 0, true);
  centralView.setUint16(10, 0, true);
  centralView.setUint16(12, 0, true);
  centralView.setUint16(14, 0, true);
  centralView.setUint32(16, crc, true);
  centralView.setUint32(20, dataBytes.length, true);
  centralView.setUint32(24, dataBytes.length, true);
  centralView.setUint16(28, nameBytes.length, true);
  centralView.setUint16(30, 0, true);
  centralView.setUint16(32, 0, true);
  centralView.setUint16(34, 0, true);
  centralView.setUint16(36, 0, true);
  centralView.setUint32(38, 0, true);
  centralView.setUint32(42, 0, true); // Offset of local header
  centralHeader.set(nameBytes, 46);

  const centralOffset = localHeader.length + dataBytes.length;
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true); // End of central directory signature
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, 1, true);
  endView.setUint16(10, 1, true);
  endView.setUint32(12, centralHeader.length, true);
  endView.setUint32(16, centralOffset, true);
  endView.setUint16(20, 0, true);

  return new Blob([localHeader, dataBytes, centralHeader, endRecord], {
    type: 'application/zip',
  });
}

function crc32(bytes: Uint8Array): number {
  let c = -1;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ -1) >>> 0;
}

/**
 * Generates HTML template for Booking Received email (Email 1).
 */
export function buildBookingReceivedEmailHtml(
  booking: BookingRecord,
  orderCode: string,
  paypalEmail: string,
  customTemplates?: Partial<EmailTemplatesConfig>
): string {
  const tpl = getActiveEmailTemplates(customTemplates);
  const heading = interpolateEmailTemplate(tpl.receiptHeading, booking, orderCode);
  const intro = interpolateEmailTemplate(tpl.receiptIntro, booking, orderCode);
  const nextStep = interpolateEmailTemplate(tpl.receiptNextStep, booking, orderCode);
  const signature = interpolateEmailTemplate(tpl.receiptSignature, booking, orderCode);

  const discountRowHtml = booking.discountCode
    ? `<tr>
         <td style="padding: 6px 0; color: #a3a3a3;">Voucher / Sconto Applicato:</td>
         <td style="padding: 6px 0; font-weight: 700; color: #f59e0b;">${booking.discountCode} (-${booking.discountAmount || 0} € su ${booking.originalPrice || booking.estimatedPrice} €)</td>
       </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Richiesta Prenotazione Ricevuta - 171 Studio</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #d97706; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #262626; padding-bottom: 20px; margin-bottom: 24px; text-align: center;">
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #f59e0b; text-transform: uppercase;">171 STUDIO MESSINA</span>
      <h1 style="margin: 8px 0 4px; font-size: 24px; font-weight: 900; color: #ffffff;">${heading}</h1>
      <p style="margin: 0; font-size: 14px; color: #f59e0b;">${intro}</p>
    </div>

    <!-- Intro -->
    <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
      Gentile <strong>${booking.userName}</strong>,<br><br>
      ${intro}
    </p>

    <!-- Details Box -->
    <div style="background-color: #1c1917; border: 1px solid #44403c; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 14px; font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase;">Riepilogo Richiesta Sessione</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e5e5e5;">
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3; width: 40%;">Codice Ordine:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #f59e0b; font-family: monospace;">#${orderCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Servizio Richiesto:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${booking.serviceTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Data Sessione:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${booking.date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Orario Richiesto:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">dalle ore ${booking.time} alle ${booking.endTime || 'fine sessione'} (${booking.hours}h)</td>
        </tr>
        ${discountRowHtml}
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Importo Totale:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #10b981; font-size: 16px;">${booking.estimatedPrice} €</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Indirizzo Studio:</td>
          <td style="padding: 6px 0; color: #ffffff;">Messina (ME), Sicilia — Italia</td>
        </tr>
      </table>
    </div>

    <!-- Next Step Notice -->
    <div style="background-color: #292524; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin: 24px 0; font-size: 13px; line-height: 1.5; color: #d6d3d1;">
      <strong>Cosa succede ora?</strong><br>
      ${nextStep}
    </div>

    <!-- Signature -->
    <div style="border-top: 1px solid #262626; padding-top: 20px; margin-top: 30px; font-size: 13px; color: #a3a3a3;">
      <p style="margin: 0 0 4px; color: #ffffff; font-weight: 700;">${signature}</p>
      <p style="margin: 0; color: #737373;">Messina (ME), Sicilia • Email: ${MASTER_EMAIL} • PayPal: ${paypalEmail}</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates HTML template for Booking Confirmed email (Email 2).
 */
export function buildBookingConfirmedEmailHtml(
  booking: BookingRecord,
  orderCode: string,
  paypalEmail: string,
  customTemplates?: Partial<EmailTemplatesConfig>
): string {
  const tpl = getActiveEmailTemplates(customTemplates);
  const heading = interpolateEmailTemplate(tpl.confirmationHeading, booking, orderCode);
  const intro = interpolateEmailTemplate(tpl.confirmationIntro, booking, orderCode);
  const paypalCta = interpolateEmailTemplate(tpl.confirmationPayPalCta, booking, orderCode);
  const signature = interpolateEmailTemplate(tpl.confirmationSignature, booking, orderCode);

  const paypalUrl = getPayPalPaymentUrl(booking.estimatedPrice, orderCode, paypalEmail);
  const paypalMeUrl = getPayPalMeUrl(booking.estimatedPrice);

  const discountRowHtml = booking.discountCode
    ? `<tr>
         <td style="padding: 6px 0; color: #a3a3a3;">Voucher / Sconto Applicato:</td>
         <td style="padding: 6px 0; font-weight: 700; color: #f59e0b;">${booking.discountCode} (-${booking.discountAmount || 0} € su ${booking.originalPrice || booking.estimatedPrice} €)</td>
       </tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Ordine Confermato - 171 Studio Messina</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 2px solid #10b981; border-radius: 16px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #262626; padding-bottom: 20px; margin-bottom: 24px; text-align: center;">
      <span style="display: inline-block; padding: 4px 12px; background-color: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #34d399; text-transform: uppercase; margin-bottom: 10px;">
        ORDINE CONFERMATO
      </span>
      <h1 style="margin: 6px 0; font-size: 26px; font-weight: 900; color: #ffffff;">
        ${heading}
      </h1>
      <p style="margin: 0; font-size: 14px; color: #34d399;">
        La disponibilità dello studio per la tua sessione è stata verificata e confermata con successo!
      </p>
    </div>

    <!-- Intro -->
    <p style="font-size: 15px; line-height: 1.6; color: #d4d4d4;">
      Gentile <strong>${booking.userName}</strong>,<br><br>
      ${intro}
    </p>

    <!-- Details Box -->
    <div style="background-color: #1c1917; border: 1px solid #44403c; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 14px; font-size: 12px; font-weight: 700; letter-spacing: 2px; color: #fbbf24; text-transform: uppercase;">Dettagli Sessione Confermata</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e5e5e5;">
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3; width: 42%;">Codice Ordine Ufficiale:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #f59e0b; font-family: monospace;">#${orderCode}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Servizio:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${booking.serviceTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Data Confermata:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">${booking.date}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Orario Confermato:</td>
          <td style="padding: 6px 0; font-weight: 700; color: #ffffff;">dalle ore ${booking.time} alle ${booking.endTime || 'fine sessione'} (${booking.hours}h)</td>
        </tr>
        ${discountRowHtml}
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Importo da Saldare:</td>
          <td style="padding: 6px 0; font-weight: 900; color: #34d399; font-size: 18px;">${booking.estimatedPrice} €</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a3a3a3;">Studio / Indirizzo:</td>
          <td style="padding: 6px 0; color: #ffffff;">Messina (ME), Sicilia — Italia</td>
        </tr>
      </table>
    </div>

    <!-- PAYPAL PAYMENT CALL TO ACTION -->
    <div style="background-color: #172554; border: 2px solid #3b82f6; border-radius: 14px; padding: 24px; margin: 28px 0; text-align: center;">
      <h3 style="margin: 0 0 8px; font-size: 17px; font-weight: 800; color: #ffffff; text-transform: uppercase;">${paypalCta}</h3>
      <p style="margin: 0 0 18px; font-size: 13px; color: #bfdbfe; line-height: 1.5;">
        Puoi saldare comodamente l'importo stabilito di <strong>${booking.estimatedPrice} €</strong> prima di arrivare in studio con PayPal protetto:
      </p>
      
      <a href="${paypalUrl}" target="_blank" style="display: inline-block; background-color: #f59e0b; color: #000000; font-size: 15px; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); text-transform: uppercase;">
        ${paypalCta} (${booking.estimatedPrice} €)
      </a>

      <p style="margin: 14px 0 0; font-size: 12px; color: #93c5fd;">
        Link diretto PayPal: <a href="${paypalUrl}" style="color: #60a5fa; text-decoration: underline;">Clicca qui</a> • Link rapido PayPal.Me: <a href="${paypalMeUrl}" style="color: #60a5fa; text-decoration: underline;">paypal.me/vkrealhakiesake</a>
      </p>
    </div>

    <!-- Official Signature -->
    <div style="border-top: 1px solid #262626; padding-top: 24px; margin-top: 32px;">
      <p style="margin: 0 0 4px; font-size: 15px; color: #ffffff; font-weight: 800;">A presto in studio,</p>
      <p style="margin: 0 0 6px; font-size: 16px; color: #f59e0b; font-weight: 900; font-style: italic;">${signature}</p>
      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">171 Studio — Messina, Sicilia</p>
      <p style="margin: 2px 0 0; font-size: 12px; color: #737373;">Email: ${MASTER_EMAIL} • PayPal: ${paypalEmail}</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches automatic booking receipt email (Email 1) immediately when booking is registered.
 * Sends real email via Gmail API if an OAuth access token is active.
 */
export async function dispatchBookingReceivedEmail(
  booking: BookingRecord,
  paypalEmail: string = STUDIO_PAYPAL_EMAIL,
  explicitToken?: string | null,
  customTemplates?: Partial<EmailTemplatesConfig>
): Promise<EmailLog> {
  const orderCode = booking.orderCode || generateOrderCode(booking.id);
  const paypalUrl = getPayPalPaymentUrl(booking.estimatedPrice, orderCode, paypalEmail);
  const tpl = getActiveEmailTemplates(customTemplates);

  const subject = interpolateEmailTemplate(tpl.receiptSubject, booking, orderCode);
  const heading = interpolateEmailTemplate(tpl.receiptHeading, booking, orderCode);
  const intro = interpolateEmailTemplate(tpl.receiptIntro, booking, orderCode);
  const nextStep = interpolateEmailTemplate(tpl.receiptNextStep, booking, orderCode);
  const signature = interpolateEmailTemplate(tpl.receiptSignature, booking, orderCode);

  const discountLine = booking.discountCode
    ? `SCONTO / VOUCHER APPLICATO: ${booking.discountCode} (-${booking.discountAmount || 0} € su ${booking.originalPrice || booking.estimatedPrice} €)\n`
    : '';

  const textBody = `
Gentile ${booking.userName},

${heading}
${intro}

Ecco il riepilogo della tua richiesta:
--------------------------------------------------
CODICE ORDINE: #${orderCode}
SERVIZIO: ${booking.serviceTitle}
DATA RICHIESTA: ${booking.date}
ORARIO: dalle ore ${booking.time} alle ${booking.endTime || 'fine sessione'} (${booking.hours}h)
${discountLine}IMPORTO STIMATO: ${booking.estimatedPrice} €
STUDIO: 171 Studio — Messina (ME), Sicilia
--------------------------------------------------

${nextStep}

A presto in studio,
${signature}
Mittente Ufficiale: ${MASTER_EMAIL}
  `.trim();

  const htmlBody = buildBookingReceivedEmailHtml(booking, orderCode, paypalEmail, tpl);
  const gmailWebComposeUrl = getGmailWebComposeUrl(booking.userEmail, subject, textBody);
  const mailtoUrl = createMailtoLink(booking.userEmail, subject, textBody);

  const emailLog: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    bookingId: booking.id,
    orderCode,
    type: 'PRENOTAZIONE_RICEVUTA',
    senderEmail: MASTER_EMAIL,
    recipientEmail: booking.userEmail,
    recipientName: booking.userName,
    subject,
    amount: booking.estimatedPrice,
    paypalEmail,
    paypalLink: paypalUrl,
    sentAt: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'medium' }),
    status: 'inviata',
    summary: textBody,
    gmailWebComposeUrl,
    mailtoUrl,
  };

  const token = explicitToken || getCachedAccessToken();
  emailLog.oauthTokenPresent = Boolean(token);
  let sent = false;

  // 1. Try Gmail API if OAuth token is active
  if (token) {
    try {
      const sendResult = await sendGmailMessage(token, {
        to: booking.userEmail,
        from: `171 Studio Messina <${MASTER_EMAIL}>`,
        subject,
        text: textBody,
        html: htmlBody,
      });

      emailLog.httpStatusCode = sendResult.httpStatusCode;
      emailLog.errorCode = sendResult.errorCode;
      emailLog.latencyMs = sendResult.latencyMs;

      if (sendResult.success) {
        emailLog.status = 'inviata_con_gmail';
        emailLog.deliveryMethod = 'gmail_api';
        emailLog.gmailMessageId = sendResult.messageId;
        emailLog.gmailThreadId = sendResult.threadId;
        sent = true;
      }
    } catch (err) {
      emailLog.error = err instanceof Error ? err.message : String(err);
    }
  }

  // 2. If no OAuth token or Gmail API failed, check Webhook or EmailJS
  if (!sent) {
    const autoCfg = getEmailAutomationConfig();

    if (autoCfg.emailWebhookUrl) {
      try {
        const [startHour = 10, startMin = 0] = (booking.time || '10:00').split(':').map(Number);
        const endHour = Math.min(23, startHour + (booking.hours || 2));
        const startIso = `${booking.date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
        const endIso = `${booking.date}T${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;

        const whRes = await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
          eventType: 'PRENOTAZIONE_RICEVUTA',
          orderCode,
          booking,
          recipientEmail: booking.userEmail,
          recipientName: booking.userName,
          subject,
          textBody,
          htmlBody,
          paypalUrl,
          calendarEventTitle: `171 STUDIO: ${booking.serviceTitle} - ${booking.userName}`,
          calendarEventStart: startIso,
          calendarEventEnd: endIso,
          calendarLocation: '171 Studio - Messina (ME), Sicilia, Italia',
          calendarDescription: textBody,
        });
        if (whRes.success) {
          emailLog.status = 'inviata_con_webhook';
          emailLog.deliveryMethod = 'webhook';
          sent = true;
        } else {
          emailLog.error = whRes.error;
        }
      } catch (err: any) {
        emailLog.error = err?.message;
      }
    } else if (autoCfg.emailjsServiceId && autoCfg.emailjsPublicKey) {
      try {
        const tmplId = autoCfg.emailjsTemplateIdReceipt || autoCfg.emailjsTemplateIdConfirmation;
        if (tmplId) {
          const ejsRes = await sendEmailViaEmailJS(
            autoCfg.emailjsServiceId,
            tmplId,
            autoCfg.emailjsPublicKey,
            {
              to_name: booking.userName,
              to_email: booking.userEmail,
              order_code: orderCode,
              service_title: booking.serviceTitle,
              session_date: booking.date,
              session_time: booking.time,
              session_price: booking.estimatedPrice,
              paypal_link: paypalUrl,
              subject,
              message: textBody,
            }
          );
          if (ejsRes.success) {
            emailLog.status = 'inviata_con_emailjs';
            emailLog.deliveryMethod = 'emailjs';
            sent = true;
          } else {
            emailLog.error = ejsRes.error;
          }
        }
      } catch (err: any) {
        emailLog.error = err?.message;
      }
    }
  }

  // 3. Fallback – notifica al master via Gmail Web compose e salvataggio in coda
  if (!sent) {
    // Try to open Gmail web compose for master as a last resort auto-open
    emailLog.status = 'in_attesa';
    emailLog.deliveryMethod = 'gmail_web';
    emailLog.error = 'Webhook Make.com non disponibile: usa il pulsante "Invia con Gmail Web (1 Click)" o riattiva lo scenario Make.com.';
  }

  try {
    const existing = JSON.parse(localStorage.getItem('171_email_logs') || '[]');
    localStorage.setItem('171_email_logs', JSON.stringify([emailLog, ...existing]));
  } catch {}

  try {
    setDoc(doc(db, 'emails', emailLog.id), emailLog).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `emails/${emailLog.id}`);
    });
  } catch {}

  return emailLog;
}

/**
 * Dispatches automatic booking confirmation email (Email 2) once Master approves.
 * Sends real email via Gmail API signed by Igor Rozanov with PayPal payment link.
 */
export async function dispatchBookingConfirmedEmail(
  booking: BookingRecord,
  paypalEmail: string = STUDIO_PAYPAL_EMAIL,
  explicitToken?: string | null,
  customTemplates?: Partial<EmailTemplatesConfig>
): Promise<EmailLog> {
  const orderCode = booking.orderCode || generateOrderCode(booking.id);
  const paypalUrl = getPayPalPaymentUrl(booking.estimatedPrice, orderCode, paypalEmail);
  const paypalMeUrl = getPayPalMeUrl(booking.estimatedPrice);
  const tpl = getActiveEmailTemplates(customTemplates);

  const subject = interpolateEmailTemplate(tpl.confirmationSubject, booking, orderCode);
  const heading = interpolateEmailTemplate(tpl.confirmationHeading, booking, orderCode);
  const intro = interpolateEmailTemplate(tpl.confirmationIntro, booking, orderCode);
  const paypalCta = interpolateEmailTemplate(tpl.confirmationPayPalCta, booking, orderCode);
  const signature = interpolateEmailTemplate(tpl.confirmationSignature, booking, orderCode);

  const discountLine = booking.discountCode
    ? `SCONTO / VOUCHER APPLICATO: ${booking.discountCode} (-${booking.discountAmount || 0} € su ${booking.originalPrice || booking.estimatedPrice} €)\n`
    : '';

  const textBody = `
Gentile ${booking.userName},

${heading}

${intro}

--------------------------------------------------
STATO PRENOTAZIONE: ORDINE CONFERMATO
CODICE ORDINE: #${orderCode}
SERVIZIO: ${booking.serviceTitle}
DATA CONFERMATA: ${booking.date}
ORARIO CONFERMATO: dalle ore ${booking.time} alle ${booking.endTime || 'fine sessione'} (${booking.hours}h)
${discountLine}IMPORTO FINALE DA SALDARE: ${booking.estimatedPrice} €
INDIRIZZO STUDIO: Messina (ME), Sicilia — Italia
--------------------------------------------------

${paypalCta.toUpperCase()}:
Puoi saldare comodamente l'importo stabilito (${booking.estimatedPrice} €) prima di arrivare in studio cliccando sul link PayPal ufficiale qui sotto:

${paypalCta}:
${paypalUrl}

(Link rapido alternativo PayPal.Me: ${paypalMeUrl})

Per qualsiasi necessità urgente puoi contattarmi direttamente a ${MASTER_EMAIL}.

A presto in studio,

${signature}
171 Studio — Messina, Sicilia
Mittente Ufficiale: ${MASTER_EMAIL}
  `.trim();

  const htmlBody = buildBookingConfirmedEmailHtml(booking, orderCode, paypalEmail, tpl);
  const gmailWebComposeUrl = getGmailWebComposeUrl(booking.userEmail, subject, textBody);
  const mailtoUrl = createMailtoLink(booking.userEmail, subject, textBody);

  const emailLog: EmailLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    bookingId: booking.id,
    orderCode,
    type: 'PRENOTAZIONE_CONFERMATA',
    senderEmail: MASTER_EMAIL,
    recipientEmail: booking.userEmail,
    recipientName: booking.userName,
    subject,
    amount: booking.estimatedPrice,
    paypalEmail,
    paypalLink: paypalUrl,
    sentAt: new Date().toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'medium' }),
    status: 'inviata',
    summary: textBody,
    gmailWebComposeUrl,
    mailtoUrl,
  };

  const token = explicitToken || getCachedAccessToken();
  emailLog.oauthTokenPresent = Boolean(token);
  let sent = false;

  // 1. Try Gmail API if OAuth token is active
  if (token) {
    try {
      const sendResult = await sendGmailMessage(token, {
        to: booking.userEmail,
        from: `171 Studio Messina <${MASTER_EMAIL}>`,
        subject,
        text: textBody,
        html: htmlBody,
      });

      emailLog.httpStatusCode = sendResult.httpStatusCode;
      emailLog.errorCode = sendResult.errorCode;
      emailLog.latencyMs = sendResult.latencyMs;

      if (sendResult.success) {
        emailLog.status = 'inviata_con_gmail';
        emailLog.deliveryMethod = 'gmail_api';
        emailLog.gmailMessageId = sendResult.messageId;
        emailLog.gmailThreadId = sendResult.threadId;
        sent = true;
      }
    } catch (err) {
      emailLog.error = err instanceof Error ? err.message : String(err);
    }
  }

  // 2. If no OAuth token or Gmail API failed, check Webhook or EmailJS
  if (!sent) {
    const autoCfg = getEmailAutomationConfig();

    if (autoCfg.emailWebhookUrl) {
      try {
        const [startHour = 10, startMin = 0] = (booking.time || '10:00').split(':').map(Number);
        const endHour = Math.min(23, startHour + (booking.hours || 2));
        const startIso = `${booking.date}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
        const endIso = `${booking.date}T${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;

        const whRes = await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
          eventType: 'PRENOTAZIONE_CONFERMATA',
          orderCode,
          booking,
          recipientEmail: booking.userEmail,
          recipientName: booking.userName,
          subject,
          textBody,
          htmlBody,
          paypalUrl,
          calendarEventTitle: `171 STUDIO: ${booking.serviceTitle} - ${booking.userName}`,
          calendarEventStart: startIso,
          calendarEventEnd: endIso,
          calendarLocation: '171 Studio - Messina (ME), Sicilia, Italia',
          calendarDescription: textBody,
        });
        if (whRes.success) {
          emailLog.status = 'inviata_con_webhook';
          emailLog.deliveryMethod = 'webhook';
          sent = true;
        } else {
          emailLog.error = whRes.error;
        }
      } catch (err: any) {
        emailLog.error = err?.message;
      }
    } else if (autoCfg.emailjsServiceId && autoCfg.emailjsPublicKey) {
      try {
        const tmplId = autoCfg.emailjsTemplateIdConfirmation || autoCfg.emailjsTemplateIdReceipt;
        if (tmplId) {
          const ejsRes = await sendEmailViaEmailJS(
            autoCfg.emailjsServiceId,
            tmplId,
            autoCfg.emailjsPublicKey,
            {
              to_name: booking.userName,
              to_email: booking.userEmail,
              order_code: orderCode,
              service_title: booking.serviceTitle,
              session_date: booking.date,
              session_time: booking.time,
              session_price: booking.estimatedPrice,
              paypal_link: paypalUrl,
              subject,
              message: textBody,
            }
          );
          if (ejsRes.success) {
            emailLog.status = 'inviata_con_emailjs';
            emailLog.deliveryMethod = 'emailjs';
            sent = true;
          } else {
            emailLog.error = ejsRes.error;
          }
        }
      } catch (err: any) {
        emailLog.error = err?.message;
      }
    }
  }

  // 3. Fallback – notifica al master via Gmail Web compose e salvataggio in coda
  if (!sent) {
    // Try to open Gmail web compose for master as a last resort auto-open
    emailLog.status = 'in_attesa';
    emailLog.deliveryMethod = 'gmail_web';
    emailLog.error = 'Webhook Make.com non disponibile: usa il pulsante "Invia con Gmail Web (1 Click)" o riattiva lo scenario Make.com.';
  }

  try {
    const existing = JSON.parse(localStorage.getItem('171_email_logs') || '[]');
    localStorage.setItem('171_email_logs', JSON.stringify([emailLog, ...existing]));
  } catch {}

  try {
    setDoc(doc(db, 'emails', emailLog.id), emailLog).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `emails/${emailLog.id}`);
    });
  } catch {}

  return emailLog;
}

/**
 * Manually resends an existing email or sends a pending email via Gmail API
 */
export async function resendEmailViaGmail(
  emailLog: EmailLog,
  booking: BookingRecord,
  accessToken: string
): Promise<{
  success: boolean;
  messageId?: string;
  threadId?: string;
  httpStatusCode?: number;
  errorCode?: string;
  error?: string;
  latencyMs?: number;
}> {
  const isConfirmation = emailLog.type === 'PRENOTAZIONE_CONFERMATA';
  const html = isConfirmation
    ? buildBookingConfirmedEmailHtml(booking, emailLog.orderCode, emailLog.paypalEmail)
    : buildBookingReceivedEmailHtml(booking, emailLog.orderCode, emailLog.paypalEmail);

  const result = await sendGmailMessage(accessToken, {
    to: emailLog.recipientEmail,
    from: `171 Studio Messina <${MASTER_EMAIL}>`,
    subject: emailLog.subject,
    text: emailLog.summary,
    html,
  });

  return result;
}

/**
 * Dispatches an immediate notification to the Master Studio (171studiomessina@gmail.com)
 * whenever a new booking is registered on the website.
 */
export async function dispatchMasterNewBookingNotification(
  booking: BookingRecord,
  explicitToken?: string | null
): Promise<void> {
  const autoCfg = getEmailAutomationConfig();
  const orderCode = booking.orderCode || generateOrderCode(booking.id);
  const subject = `[171 STUDIO] NUOVA PRENOTAZIONE #${orderCode} - ${booking.userName} (${booking.serviceTitle})`;

  const textBody = `
NUOVA PRENOTAZIONE RICEVUTA SU 171 STUDIO!
=========================================
Codice Ordine: #${orderCode}
Data e Ora: ${new Date().toLocaleString('it-IT')}

DATI CLIENTE:
- Nome: ${booking.userName}
- Email: ${booking.userEmail}
- Telefono: ${booking.userPhone || 'Non specificato'}

DETTAGLI SESSIONE:
- Servizio: ${booking.serviceTitle}
- Data Richiesta: ${booking.date}
- Orario: dalle ${booking.time} alle ${booking.endTime || 'fine sessione'} (${booking.hours}h)
- Prezzo Stimato: ${booking.estimatedPrice} € ${booking.discountCode ? `(Voucher: ${booking.discountCode} -${booking.discountAmount || 0}€)` : ''}
- Note Cliente: ${booking.notes || 'Nessuna'}

STATO: In attesa approvazione Master.
Pannello Gestione: https://171studio-plugininnovation.github.io/171-studio/
=========================================
`.trim();

  const htmlBody = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0c0a09; color: #f5f5f4; padding: 24px; border-radius: 12px; border: 1px solid #292524;">
  <h2 style="color: #f59e0b; margin-top: 0;">Nuova Prenotazione Ricevuta</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
    <tr><td style="padding: 6px; color: #a8a29e; width: 35%;">Codice Ordine:</td><td style="padding: 6px; font-weight: bold; color: #f59e0b;">#${orderCode}</td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Cliente:</td><td style="padding: 6px; font-weight: bold;">${booking.userName}</td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Email:</td><td style="padding: 6px;"><a href="mailto:${booking.userEmail}" style="color: #38bdf8;">${booking.userEmail}</a></td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Telefono:</td><td style="padding: 6px;">${booking.userPhone || 'Non specificato'}</td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Servizio:</td><td style="padding: 6px; font-weight: bold;">${booking.serviceTitle}</td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Data:</td><td style="padding: 6px;">${booking.date} (${booking.time} - ${booking.endTime || ''})</td></tr>
    <tr><td style="padding: 6px; color: #a8a29e;">Importo Stimato:</td><td style="padding: 6px; font-weight: bold; color: #10b981;">${booking.estimatedPrice} €</td></tr>
    ${booking.notes ? `<tr><td style="padding: 6px; color: #a8a29e;">Note:</td><td style="padding: 6px;">${booking.notes}</td></tr>` : ''}
  </table>
  <div style="margin-top: 20px; text-align: center;">
    <a href="https://171studio-plugininnovation.github.io/171-studio/" style="background: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">Apri Pannello Master</a>
  </div>
</div>
`.trim();

  // 1. Send via Webhook to Make.com / automations
  if (autoCfg.emailWebhookUrl) {
    try {
      await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
        eventType: 'MASTER_NEW_BOOKING_NOTIFICATION',
        orderCode,
        booking,
        to: MASTER_EMAIL,
        recipientEmail: MASTER_EMAIL,
        email: MASTER_EMAIL,
        subject,
        textBody,
        htmlBody,
        body: textBody,
        html: htmlBody,
      });
    } catch {}
  }

  // 2. Send via Gmail API if OAuth token present
  const token = explicitToken || getCachedAccessToken();
  if (token) {
    try {
      await sendGmailMessage(token, {
        to: MASTER_EMAIL,
        from: `171 Studio Notifiche <${MASTER_EMAIL}>`,
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch {}
  }
}

/**
 * Dispatches an immediate notification to the Master Studio (171studiomessina@gmail.com)
 * and order confirmation to customer when an album order ("The God Cypher") is placed.
 */
export async function dispatchMasterNewAlbumOrderNotification(
  order: AlbumOrderRecord,
  explicitToken?: string | null
): Promise<void> {
  const autoCfg = getEmailAutomationConfig();
  const subject = `[171 STUDIO] NUOVO ORDINE ALBUM THE GOD CYPHER: #${order.orderCode} - ${order.userName} (€${order.totalAmount.toFixed(2)})`;

  const textBody = `
NUOVO ORDINE ALBUM "THE GOD CYPHER" RICEVUTO!
=============================================
Codice Ordine: #${order.orderCode}
Data: ${new Date().toLocaleString('it-IT')}

DATI ACQUIRENTE:
- Nome: ${order.userName}
- Email: ${order.userEmail}
- Telefono: ${order.userPhone || 'Non specificato'}
- Indirizzo Consegna: ${order.shippingAddress || 'Ritiro in Studio'}
- Città / CAP: ${order.shippingCity || ''} ${order.shippingZip || ''}
- Metodo Consegna: ${order.shippingMethod === 'pickup' ? 'Ritiro Diretto in Studio a Messina' : order.shippingMethod === 'digital_download' ? 'Download Digitale Diretto' : 'Spedizione Postale Tracciata'}

DETTAGLI ORDINE:
- Prodotto: ${order.productTitle} (${order.orderType === 'physical' ? 'Formato Fisico' : 'Formato Digitale'})
- Totale da Saldare: €${order.totalAmount.toFixed(2)}
- Destinazione Pagamento PayPal: ${STUDIO_PAYPAL_EMAIL}

Pannello Master: https://171studio-plugininnovation.github.io/171-studio/
=============================================
`.trim();

  // 1. Send notification to Master via webhook
  if (autoCfg.emailWebhookUrl) {
    try {
      await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
        eventType: 'MASTER_NEW_ALBUM_ORDER',
        orderCode: order.orderCode,
        order,
        to: MASTER_EMAIL,
        recipientEmail: MASTER_EMAIL,
        email: MASTER_EMAIL,
        subject,
        textBody,
        body: textBody,
      });
    } catch {}
  }

  // 2. Send confirmation to Customer via webhook
  const clientSubject = `171 Studio — Conferma Ordine Ricevuto #${order.orderCode} (${order.productTitle})`;
  const clientText = `
Gentile ${order.userName},

Abbiamo ricevuto il tuo ordine per "${order.productTitle}" (Codice #${order.orderCode}).
Importo totale: €${order.totalAmount.toFixed(2)}

${order.shippingMethod === 'pickup'
  ? 'Puoi ritirare la tua copia in studio a Messina dal Lunedì al Sabato 10:00 - 20:00.'
  : `La spedizione verrà effettuata all'indirizzo: ${order.shippingAddress}, ${order.shippingCity || ''}. Ti invieremo il tracking non appena affidato al corriere.`}

Link per saldare con PayPal protetto:
${order.paypalPaymentUrl || `https://www.paypal.com/paypalme/vkrealhakiesake/${order.totalAmount.toFixed(2)}`}

Grazie per sostenere la musica indipendente di 171 Studio!
Igor Rozanov — 171 Studio Messina
Email: ${MASTER_EMAIL}
`.trim();

  if (autoCfg.emailWebhookUrl) {
    try {
      await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
        eventType: 'ALBUM_ORDER_CLIENT_CONFIRMATION',
        orderCode: order.orderCode,
        order,
        to: order.userEmail,
        recipientEmail: order.userEmail,
        email: order.userEmail,
        subject: clientSubject,
        textBody: clientText,
        body: clientText,
      });
    } catch {}
  }

  // 3. Send via Gmail API if OAuth token active
  const token = explicitToken || getCachedAccessToken();
  if (token) {
    try {
      await sendGmailMessage(token, {
        to: MASTER_EMAIL,
        from: `171 Studio Notifiche <${MASTER_EMAIL}>`,
        subject,
        text: textBody,
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#222;"><pre style="font-family:inherit;white-space:pre-wrap;">${textBody}</pre></div>`,
      });
      await sendGmailMessage(token, {
        to: order.userEmail,
        from: `171 Studio Messina <${MASTER_EMAIL}>`,
        subject: clientSubject,
        text: clientText,
        html: `<div style="font-family:sans-serif;line-height:1.6;color:#222;"><pre style="font-family:inherit;white-space:pre-wrap;">${clientText}</pre></div>`,
      });
    } catch {}
  }
}

/**
 * Dispatches an event when a new user registers on the site
 */
export async function dispatchUserRegisteredNotification(user: UserAccount): Promise<void> {
  const autoCfg = getEmailAutomationConfig();
  if (!autoCfg.emailWebhookUrl) return;
  try {
    await sendEmailViaWebhook(autoCfg.emailWebhookUrl, {
      eventType: 'USER_REGISTERED',
      to: MASTER_EMAIL,
      recipientEmail: MASTER_EMAIL,
      email: MASTER_EMAIL,
      subject: `[171 STUDIO] Nuovo Account Registrato: ${user.name} (${user.email})`,
      textBody: `Nuovo utente registrato su 171 Studio:\nNome: ${user.name}\nEmail: ${user.email}\nData: ${new Date().toLocaleString('it-IT')}\nRuolo: ${user.role || 'client'}`,
      body: `Nuovo utente registrato su 171 Studio: ${user.name} (${user.email})`,
      user,
    });
  } catch {}
}
