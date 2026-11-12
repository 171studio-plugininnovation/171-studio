/**
 * 171 Studio Messina & 171PluginInnovation
 * Professional Email Quality & Anti-Disposable Shield + OTP Verification System
 * 
 * Prevents junk, burner, fake, and disposable emails from registering accounts.
 */

// Comprehensive blacklist of known temporary, burner, and disposable email providers
export const DISPOSABLE_DOMAINS = new Set<string>([
  '10minutemail.com',
  '10minutemail.net',
  '10minmail.com',
  'tempmail.com',
  'en2ch.com',
  'en2ch.net',
  'en2ch.org',
  'temp-mail.org',
  'temp-mail.io',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'grr.la',
  'mailinator.com',
  'mailinator.net',
  'mailinator2.com',
  'yopmail.com',
  'yopmail.net',
  'yopmail.fr',
  'sharklasers.com',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'dispostable.com',
  'fakemailgenerator.com',
  'fakemail.net',
  'fakeinbox.com',
  'getairmail.com',
  'mohmal.com',
  'burnermail.io',
  'crazymailing.com',
  'tempail.com',
  'dropmail.me',
  'generator.email',
  'inboxbear.com',
  'mytemp.email',
  'mytempemail.com',
  'spambox.us',
  'nada.ltd',
  'getnada.com',
  'emailondeck.com',
  'maildrop.cc',
  'inboxkitten.com',
  'disposablemail.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'chacuo.net',
  '0-mail.com',
  'mailnull.com',
  'spamgourmet.com',
  'tempinbox.com',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'devnullmail.com',
  'letthemeatspam.com',
  'mailin8r.com',
  'mailinator.org',
  'safetymail.info',
  'suremail.info',
  'tradermail.info',
  'veryrealemail.com',
  'zippymail.info',
  'burnermail.net',
  'disposable.com',
  'disposeamail.com',
  'fakemail.org',
  'filzmail.com',
  'getonemail.com',
  'incognitomail.org',
  'kasmail.com',
  'mailcatch.com',
  'mailexpire.com',
  'mailslite.com',
  'meltmail.com',
  'mytrashmail.com',
  'nobulk.com',
  'nomail.xl.cx',
  'nospam.ze.tc',
  'oneoffmail.com',
  'pookmail.com',
  'shortmail.net',
  'sofort-mail.de',
  'spamfree24.org',
  'spamavert.com',
  'spambog.com',
  'spamcannon.com',
  'spamcon.org',
  'spamex.com',
  'spamex.net',
  'spamhole.com',
  'spaml.com',
  'spamspot.com',
  'tempemail.net',
  'temporaryemail.net',
  'tempmailaddress.com',
  'throwawayemailaddress.com',
  'tmail.ws',
  'trashymail.com',
  'uggsrock.com',
  'wegwerfmail.de',
  'whyspam.me',
  'willselfdestruct.com',
  'zoemail.com',
]);

// Obvious dummy / placeholder domains
export const FAKE_DOMAINS = new Set<string>([
  'test.com',
  'test.it',
  'test.org',
  'example.com',
  'example.it',
  'example.org',
  'fake.com',
  'fake.it',
  'asdf.com',
  'asdf.it',
  'qwer.com',
  'qwer.it',
  'abc.com',
  'xyz.com',
  'domain.com',
  'sample.com',
  'temp.com',
  'prova.it',
  'prova.com',
  'email.com',
  'fakeemail.com',
  '123.com',
  'a.com',
  'b.com',
  'c.com',
]);

// Suspicious prefix patterns (e.g. asdf@, fake@, test@, 123456@)
const SUSPICIOUS_USERNAMES = new Set<string>([
  'asdf',
  'asdfgh',
  'asdfghjkl',
  'qwer',
  'qwerty',
  'fake',
  'fakemail',
  'fakeuser',
  'test',
  'testing',
  'tester',
  'abc',
  'xyz',
  '123',
  '1234',
  '12345',
  '123456',
  '123456789',
  'aaa',
  'aaaa',
  'aaaaa',
  'bbb',
  'ccc',
  'admin',
  'root',
  'user',
  'null',
  'undefined',
  'random',
  'prova',
  'nessuno',
]);

export interface EmailQualityValidationResult {
  isValid: boolean;
  cleanEmail: string;
  error?: string;
  domain?: string;
}

/**
 * Validates an email address against syntax rules, disposable email services,
 * and blatant placeholder/fake user inputs.
 */
export function validateEmailQuality(rawEmail: string): EmailQualityValidationResult {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      cleanEmail: '',
      error: 'Inserisci un indirizzo email valido.',
    };
  }

  const cleanEmail = rawEmail.trim().toLowerCase();

  // Basic RFC 5322 compliant regex check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Formato email non valido. Assicurati di includere una chiocciola (@) e un dominio completo (es. nome@gmail.com).',
    };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Indirizzo email non valido.',
    };
  }

  const [username, domain] = parts;

  // Domain TLD check (must have at least 2 characters)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      cleanEmail,
      error: `Estensione di dominio non valida (.${tld || ''}). Inserisci un dominio completo come .it, .com, .net, ecc.`,
    };
  }

  // Check against disposable / burner domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      cleanEmail,
      domain,
      error: `Il dominio "${domain}" appartiene a un servizio email temporaneo o usa-e-getta. Per registrarti a 171 Studio e sbloccare i download e i voucher, utilizza una tua vera email (Gmail, Outlook, iCloud, Libero, Yahoo, ecc.).`,
    };
  }

  // Check against fake / dummy test domains
  if (FAKE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      cleanEmail,
      domain,
      error: `Il dominio di test "${domain}" non è consentito. Inserisci una casella email reale e attiva dove poter ricevere il codice di verifica.`,
    };
  }

  // Check username length & suspicious combinations
  if (username.length < 2) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Il nome utente dell\'email è troppo breve. Inserisci il tuo indirizzo email reale.',
    };
  }

  if (SUSPICIOUS_USERNAMES.has(username) && (domain.includes('test') || domain.includes('fake') || domain.includes('temp') || domain.length < 8)) {
    return {
      isValid: false,
      cleanEmail,
      error: 'Questo indirizzo email sembra essere generato casualmente o fittizio. Utilizza la tua email personale o professionale reale.',
    };
  }

  return {
    isValid: true,
    cleanEmail,
    domain,
  };
}

/**
 * Generates a secure, 6-digit numeric OTP verification code.
 * Example: "482915"
 */
export function generateVerificationOtp(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

export interface PendingVerificationSession {
  email: string;
  name: string;
  password?: string;
  code: string;
  createdAt: number;
  expiresAt: number; // 15 minutes TTL
  attempts: number;
  lastSentAt: number;
}

const STORAGE_KEY = '171_pending_email_verification';

/**
 * Stores a pending verification in session storage.
 */
export function storePendingVerification(session: PendingVerificationSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

/**
 * Retrieves the currently active pending verification session.
 */
export function getPendingVerification(): PendingVerificationSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as PendingVerificationSession;
    if (Date.now() > session.expiresAt) {
      clearPendingVerification();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clears any active pending verification session.
 */
export function clearPendingVerification(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Builds the official 171 Studio branded Verification Email content (HTML & Text).
 */
export function buildVerificationEmailContent(name: string, email: string, code: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `171 Studio • Codice di Verifica: ${code}`;

  const text = `
171 STUDIO MESSINA & 171PLUGININNOVATION
VERIFICA INDIRIZZO EMAIL

Ciao ${name},
Grazie per aver scelto 171 Studio!

Il tuo codice di sicurezza a 6 cifre per attivare il tuo account è:
==============================
   ${code}
==============================

Questo codice scade tra 15 minuti.
Inseriscilo nella schermata di registrazione per completare l'attivazione del tuo profilo, ricevere il tuo Codice Sconto Benvenuto del 5% e accedere ai download dei plugin DSP v2.0.0.

Se non hai richiesto tu la creazione di questo account su 171 Studio (https://171studio.it), ignora pure questa email.

171 Studio Messina
Via Placida 75, 98121 Messina, Sicilia
Email: 171studiomessina@gmail.com
Sito Web: https://171studio.it
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica Account 171 Studio</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;padding:30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width:580px;background-color:#121212;border:1px solid #d97706;border-radius:24px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.8),0 0 30px rgba(217,119,6,0.15);">
          
          <!-- Top Gold Accent Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#b45309,#f59e0b,#fbbf24,#b45309);height:5px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:32px 36px 20px 36px;text-align:center;border-bottom:1px solid #262626;">
              <div style="font-size:11px;font-family:monospace;letter-spacing:3px;color:#f59e0b;font-weight:bold;text-transform:uppercase;margin-bottom:6px;">
                171 STUDIO MESSINA • INNOVATION
              </div>
              <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:900;letter-spacing:0.5px;">
                Verifica Indirizzo Email
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="font-size:15px;color:#e5e7eb;margin:0 0 16px 0;line-height:1.6;">
                Ciao <strong style="color:#ffffff;">${name}</strong>,
              </p>
              <p style="font-size:14px;color:#9ca3af;margin:0 0 24px 0;line-height:1.6;">
                Grazie per esserti unito alla community di <strong>171 Studio</strong> e alla nostra divisione software <strong>171PluginInnovation</strong>. Per proteggere la sicurezza della piattaforma ed evitare registrazioni spam, ti chiediamo di confermare che questa casella di posta (<span style="color:#fbbf24;">${email}</span>) appartenga a te.
              </p>

              <!-- OTP Code Box -->
              <div style="background-color:#1c1917;border:2px solid #f59e0b;border-radius:18px;padding:24px;text-align:center;margin:28px 0;box-shadow:inset 0 0 20px rgba(245,158,11,0.1);">
                <div style="font-size:11px;font-family:monospace;letter-spacing:2px;color:#f59e0b;text-transform:uppercase;font-weight:bold;margin-bottom:8px;">
                  IL TUO CODICE DI SICUREZZA A 6 CIFRE
                </div>
                <div style="font-size:38px;font-family:monospace;letter-spacing:8px;font-weight:900;color:#ffffff;text-shadow:0 0 15px rgba(245,158,11,0.5);margin:6px 0;">
                  ${code}
                </div>
                <div style="font-size:12px;color:#a8a29e;font-family:monospace;margin-top:6px;">
                  VALIDO PER 15 MINUTI
                </div>
              </div>

              <!-- Advantages of Verification -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0 16px 0;background-color:#18181b;border:1px solid #27272a;border-radius:14px;padding:16px;">
                <tr>
                  <td>
                    <div style="font-size:12px;color:#f59e0b;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                      Cosa si sblocca subito dopo la verifica:
                    </div>
                    <ul style="margin:0;padding-left:18px;color:#d1d5db;font-size:13px;line-height:1.8;">
                      <li><strong>Codice Sconto Personale Benvenuto 5%</strong> applicabile su tutti i servizi di studio a Messina e sui prodotti dell'album.</li>
                      <li><strong>Download gratuiti illimitati</strong> per tutta la suite di plugin VST3 e macOS AU.</li>
                      <li>Accesso alla tua <strong>Area Riservata Cliente</strong> con storico delle analisi Key/BPM e stems.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:#71717a;margin:24px 0 0 0;line-height:1.5;">
                Se non hai avviato tu questa procedura di registrazione sul sito <a href="https://171studio.it" style="color:#d97706;text-decoration:none;">171studio.it</a>, puoi ignorare questa email in totale sicurezza: nessun account verrà attivato senza il codice.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 36px;background-color:#0d0d0d;border-top:1px solid #262626;text-align:center;">
              <p style="font-size:11px;color:#737373;margin:0 0 4px 0;font-family:monospace;">
                171 STUDIO MESSINA • REGIA ANALOGICA & SVILUPPO DSP
              </p>
              <p style="font-size:11px;color:#525252;margin:0;">
                Via Placida 75, 98121 Messina, Sicilia • <a href="https://171studio.it" style="color:#a16207;text-decoration:none;">171studio.it</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, text, html };
}
