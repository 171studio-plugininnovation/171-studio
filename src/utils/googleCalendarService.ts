import { BookingRecord, STUDIO_PAYPAL_EMAIL, MASTER_EMAIL } from '../types/cms';

/**
 * Creates a direct Google Calendar web template URL that the user or master
 * can open in one click to view or add the event to their Google Calendar.
 * If isForClient is true, formats the title and description specifically for the client's private agenda.
 */
export const getGoogleCalendarWebUrl = (booking: BookingRecord, isForClient: boolean = false): string => {
  const [startHour = 10, startMin = 0] = (booking.time || '10:00').split(':').map(Number);
  const endHour = Math.min(23, startHour + (booking.hours || 2));

  // Date format: YYYYMMDDTHHMMSSZ (or local Europe/Rome)
  const cleanDate = (booking.date || '2026-10-22').replace(/-/g, '');
  const startStr = `${cleanDate}T${String(startHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`;
  const endStr = `${cleanDate}T${String(endHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`;

  const title = encodeURIComponent(
    isForClient
      ? `Sessione Studio @ 171 Studio: ${booking.serviceTitle}`
      : `171 STUDIO: ${booking.serviceTitle} [${booking.userName}]`
  );

  const details = encodeURIComponent(
    isForClient
      ? `LA TUA SESSIONE A 171 STUDIO MESSINA\n\n` +
        `• Servizio: ${booking.serviceTitle}\n` +
        `• Codice Ordine: #${booking.orderCode}\n` +
        `• Data & Orario: ${booking.date} alle ore ${booking.time} (${booking.hours}h di studio)\n` +
        `• Importo: ${booking.estimatedPrice} €\n` +
        `• Luogo: 171 Studio - Messina (ME), Sicilia\n\n` +
        `💡 Ricordati di portare basi musicali, testi o stems su chiavetta USB o link Cloud Drive.\n` +
        `Contatti Studio: ${MASTER_EMAIL} (Igor Rozanov)`
      : `171 STUDIO - SESSIONE REGISTRAZIONE / PRODUZIONE\n\n` +
        `• Codice Ordine: #${booking.orderCode}\n` +
        `• Artista: ${booking.userName} (${booking.userEmail})\n` +
        `• Telefono: ${booking.userPhone}\n` +
        `• Servizio: ${booking.serviceTitle}\n` +
        `• Durata: ${booking.hours} ore\n` +
        `• Importo Totale: ${booking.estimatedPrice} €\n` +
        `• Destinatario PayPal: ${booking.paypalPaymentUrl ? STUDIO_PAYPAL_EMAIL : '-'}\n` +
        `• Note Artista: ${booking.notes || 'Nessuna specifica aggiuntiva'}\n` +
        `• Stato Sessione: ${booking.status.toUpperCase()}`
  );
  const location = encodeURIComponent('171 Studio - Messina (ME), Sicilia, Italia');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&ctz=Europe/Rome`;
};

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string
 * for universal calendar compatibility (Apple Calendar, iOS, macOS, Outlook, Google Calendar).
 */
export const generateBookingIcsContent = (booking: BookingRecord, isForClient: boolean = false): string => {
  const [startHour = 10, startMin = 0] = (booking.time || '10:00').split(':').map(Number);
  const endHour = Math.min(23, startHour + (booking.hours || 2));

  const cleanDate = (booking.date || '2026-10-25').replace(/-/g, '');
  const startStr = `${cleanDate}T${String(startHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`;
  const endStr = `${cleanDate}T${String(endHour).padStart(2, '0')}${String(startMin).padStart(2, '0')}00`;
  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const orderCode = booking.orderCode || booking.id.slice(-8);

  const summary = isForClient
    ? `Sessione in Studio: ${booking.serviceTitle} @ 171 Studio`
    : `171 STUDIO: ${booking.serviceTitle} - ${booking.userName}`;

  const descriptionLines = isForClient
    ? [
        `LA TUA SESSIONE A 171 STUDIO MESSINA`,
        `Codice Ordine: #${orderCode}`,
        `Servizio: ${booking.serviceTitle}`,
        `Orario: ${booking.date} alle ore ${booking.time} (${booking.hours} ore)`,
        `Quota: ${booking.estimatedPrice} EUR`,
        `Luogo: 171 Studio - Messina (ME)\\, Sicilia`,
        `Assistenza / Contatti: ${MASTER_EMAIL}`,
      ]
    : [
        `171 STUDIO MESSINA - SESSIONE REGISTRAZIONE & PRODUZIONE`,
        `Codice Ordine: #${orderCode}`,
        `Artista: ${booking.userName}`,
        `Email: ${booking.userEmail}`,
        `Telefono: ${booking.userPhone}`,
        `Servizio: ${booking.serviceTitle} (${booking.hours} ore)`,
        `Totale: ${booking.estimatedPrice} EUR`,
        `PayPal: ${STUDIO_PAYPAL_EMAIL}`,
        `Note: ${booking.notes || 'Nessuna specifica'}`,
      ];

  const description = descriptionLines.join('\\n');

  const alarmDesc2h = isForClient
    ? 'Promemoria: la tua sessione a 171 Studio inizia tra 2 ore'
    : `Sessione #${orderCode} con ${booking.userName} tra 2 ore`;

  const alarmDesc1d = isForClient
    ? 'Promemoria: domani hai la sessione a 171 Studio Messina'
    : `Sessione #${orderCode} con ${booking.userName} domani`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//171 Studio Messina//Booking System//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:session-${orderCode}@171studio.com`,
    `DTSTAMP:${nowIso}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${summary.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
    'LOCATION:171 Studio - Messina (ME)\\, Sicilia\\, Italia',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${alarmDesc2h}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${alarmDesc1d}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

/**
 * Downloads a universal .ics calendar file directly in the browser
 */
export const downloadBookingIcsFile = (booking: BookingRecord, isForClient: boolean = false): void => {
  const icsContent = generateBookingIcsContent(booking, isForClient);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = isForClient
    ? `171_Studio_La_Mia_Sessione_${booking.orderCode || 'ORD'}.ics`
    : `171_Studio_Sessione_${booking.orderCode || 'ORD'}.ics`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Calls Google Calendar REST API v3 using the client-side OAuth Bearer token.
 * Inserts the confirmed recording session directly into the user's Google Calendar.
 */
export const createGoogleCalendarEvent = async (
  booking: BookingRecord,
  accessToken: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> => {
  try {
    if (!accessToken) {
      return { success: false, error: 'Token di autorizzazione Google Calendar mancante' };
    }

    const [startHour = 10, startMin = 0] = (booking.time || '10:00').split(':').map(Number);
    const endHour = Math.min(23, startHour + (booking.hours || 2));

    const dateBase = booking.date || '2026-10-22';
    const startIso = `${dateBase}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
    const endIso = `${dateBase}T${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;

    const eventPayload = {
      summary: `171 STUDIO: ${booking.serviceTitle} - ${booking.userName}`,
      description: 
        `171 STUDIO - SESSIONE UFFICIALE REGISTRAZIONE\n` +
        `Codice Ordine: #${booking.orderCode}\n` +
        `Artista: ${booking.userName}\n` +
        `Email: ${booking.userEmail}\n` +
        `Telefono: ${booking.userPhone}\n` +
        `Servizio: ${booking.serviceTitle} (${booking.hours} ore)\n` +
        `Totale: ${booking.estimatedPrice}€\n` +
        `PayPal: ${STUDIO_PAYPAL_EMAIL}\n` +
        `Note: ${booking.notes || '-'}\n` +
        `Sincronizzato da Master Dashboard 171 Studio`,
      location: '171 Studio - Messina (ME), Sicilia, Italia',
      start: {
        dateTime: `${startIso}+02:00`,
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: `${endIso}+02:00`,
        timeZone: 'Europe/Rome',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 },
        ],
      },
      colorId: '5', // Yellow/Gold calendar label
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Google Calendar API Error:', errText);
      return { success: false, error: `Errore Google API (${res.status}): ${errText}` };
    }

    const createdEvent = await res.json();
    return {
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink || getGoogleCalendarWebUrl(booking),
    };
  } catch (err: any) {
    console.error('Google Calendar create event failure:', err);
    return { success: false, error: err?.message || 'Errore di connessione a Google Calendar' };
  }
};

/**
 * Removes or updates an event from Google Calendar when cancelled
 */
export const removeGoogleCalendarEvent = async (
  eventId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!accessToken || !eventId) return { success: false, error: 'Parametri mancanti' };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};
