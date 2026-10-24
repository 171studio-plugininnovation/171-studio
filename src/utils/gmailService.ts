/**
 * Gmail API Integration Service for 171 Studio Messina.
 * Sends automated booking receipts and confirmation emails directly via Google Workspace Gmail API.
 */

export interface GmailSendPayload {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  httpStatusCode?: number;
  errorCode?: string;
  error?: string;
  latencyMs?: number;
}

/**
 * Encodes a string to RFC 4648 §5 URL-safe base64 (without padding).
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encodes the email Subject line to MIME UTF-8 format (RFC 2047)
 * to ensure Italian characters and symbols display correctly in all mail clients.
 */
export function encodeMimeSubject(subject: string): string {
  const utf8Bytes = new TextEncoder().encode(subject);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Builds an RFC 2822 compliant MIME message string.
 */
export function buildRfc2822Message({
  to,
  from = '171 Studio Messina <171studiomessina@gmail.com>',
  subject,
  text,
  html,
}: GmailSendPayload): string {
  const boundary = `====171StudioMimeBoundary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}====`;
  const encodedSubject = encodeMimeSubject(subject);

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text.trim(),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html.trim(),
    '',
    `--${boundary}--`,
  ];

  return lines.join('\r\n');
}

/**
 * Dispatches an email via the Gmail REST API using the user's OAuth access token.
 * Endpoint: POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
 */
export async function sendGmailMessage(
  accessToken: string,
  payload: GmailSendPayload
): Promise<GmailSendResult> {
  const startTime = Date.now();

  if (!accessToken) {
    return {
      success: false,
      httpStatusCode: 0,
      errorCode: 'AUTH_TOKEN_MISSING',
      error: 'Token OAuth Gmail assente in memoria. Connetti l\'account Google 171studiomessina@gmail.com.',
      latencyMs: Date.now() - startTime,
    };
  }

  if (!payload.to || !payload.to.includes('@')) {
    return {
      success: false,
      httpStatusCode: 400,
      errorCode: 'INVALID_RECIPIENT_400',
      error: `Indirizzo email destinatario non valido: ${payload.to}`,
      latencyMs: Date.now() - startTime,
    };
  }

  try {
    const rawRfc2822 = buildRfc2822Message(payload);
    const rawBase64Url = base64UrlEncode(rawRfc2822);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawBase64Url }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const googleStatus = errorJson?.error?.status || `HTTP_${response.status}`;
      const detailedMsg = errorJson?.error?.message || `Errore HTTP ${response.status} durante l'invio Gmail`;
      console.warn('Gmail API send failed:', errorJson);

      let mappedCode = `GMAIL_${response.status}_${googleStatus}`;
      if (response.status === 401) mappedCode = 'OAUTH_401_UNAUTHENTICATED';
      else if (response.status === 403) mappedCode = 'GMAIL_403_INSUFFICIENT_SCOPES';
      else if (response.status === 400) mappedCode = 'GMAIL_400_INVALID_ARGUMENT';
      else if (response.status === 429) mappedCode = 'GMAIL_429_RATE_LIMIT';

      return {
        success: false,
        httpStatusCode: response.status,
        errorCode: mappedCode,
        error: detailedMsg,
        latencyMs,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
      threadId: data.threadId,
      httpStatusCode: response.status,
      errorCode: 'OK_200',
      latencyMs,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Exception calling Gmail API:', err);
    return {
      success: false,
      httpStatusCode: 0,
      errorCode: 'NETWORK_EXCEPTION',
      error: errMsg,
      latencyMs: Date.now() - startTime,
    };
  }
}
