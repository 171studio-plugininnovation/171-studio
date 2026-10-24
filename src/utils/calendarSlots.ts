import { BookingRecord, BlockedCalendarSlot } from '../types/cms';

export interface DynamicSlot {
  id: string;
  startTime: string; // "15:00"
  endTime: string;   // "17:00"
  label: string;     // "15:00 - 17:00"
  durationHours: number;
  period: 'pomeriggio' | 'sera';
  isAvailable: boolean;
  conflictReason?: string;
  isExceedingClosing?: boolean;
}

export const STUDIO_OPEN_TIME = '15:00';
export const STUDIO_CLOSE_TIME = '20:00';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((val) => parseInt(val, 10) || 0);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return a1 < b2 && a2 > b1;
}

export function getBookingInterval(booking: BookingRecord): { start: string; end: string } {
  const start = booking.time || '15:00';
  const hours = booking.hours || 1;
  const end = minutesToTime(timeToMinutes(start) + Math.round(hours * 60));
  return { start, end };
}

/**
 * Generates all candidate slots for a given duration between 15:00 and 20:00
 * in 30-minute intervals and automatically adapts availability based on
 * existing sessions and master commitments on that date.
 */
export function generateDynamicSlots(params: {
  date: string;
  durationHours: number;
  preferredFascia?: 'tutti' | 'pomeriggio' | 'sera';
  existingBookings: BookingRecord[];
  blockedCommitments?: BlockedCalendarSlot[];
}): DynamicSlot[] {
  const {
    date,
    durationHours,
    preferredFascia = 'tutti',
    existingBookings,
    blockedCommitments = [],
  } = params;

  const studioOpenMin = timeToMinutes(STUDIO_OPEN_TIME);   // 900 (15:00)
  const studioCloseMin = timeToMinutes(STUDIO_CLOSE_TIME); // 1200 (20:00)
  const durationMin = Math.round(Math.max(0.5, durationHours) * 60);

  // Check if Master blocked the entire day
  const allDayBlock = blockedCommitments.find((b) => b.date === date && b.allDay);

  // Active bookings for this specific date
  const dateBookings = existingBookings.filter(
    (b) => b.date === date && b.status !== 'annullata'
  );

  // Specific blocked slots for this date
  const slotBlocks = blockedCommitments.filter((b) => b.date === date && !b.allDay);

  const candidateStarts: string[] = [];
  // Candidate start times every 30 minutes from 15:00 up to 19:30
  for (let m = studioOpenMin; m < studioCloseMin; m += 30) {
    candidateStarts.push(minutesToTime(m));
  }

  const dynamicSlots: DynamicSlot[] = candidateStarts.map((startTime) => {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + durationMin;
    const endTime = minutesToTime(endMin);
    const period: 'pomeriggio' | 'sera' = startMin < timeToMinutes('18:00') ? 'pomeriggio' : 'sera';
    const label = `${startTime} - ${endTime}`;

    if (allDayBlock) {
      return {
        id: `slot-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        label,
        durationHours,
        period,
        isAvailable: false,
        conflictReason: `Impegno riservato Master: ${allDayBlock.reason || 'Giornata non disponibile'}`,
      };
    }

    // Check if session exceeds studio closing (20:00)
    if (endMin > studioCloseMin) {
      return {
        id: `slot-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        label,
        durationHours,
        period,
        isAvailable: false,
        isExceedingClosing: true,
        conflictReason: `Supera l'orario di chiusura dello studio (${STUDIO_CLOSE_TIME})`,
      };
    }

    // Check conflict with existing bookings (dynamic adaptation)
    const conflictingBooking = dateBookings.find((b) => {
      const { start: bStart, end: bEnd } = getBookingInterval(b);
      return isRangeOverlapping(startTime, endTime, bStart, bEnd);
    });

    if (conflictingBooking) {
      const { start: bStart, end: bEnd } = getBookingInterval(conflictingBooking);
      return {
        id: `slot-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        label,
        durationHours,
        period,
        isAvailable: false,
        conflictReason: `Occupato da altra sessione prenotata (${bStart} - ${bEnd})`,
      };
    }

    // Check conflict with master slot blocks
    const conflictingBlock = slotBlocks.find((b) => {
      return (b.timeSlots || []).some((slotTime) => {
        const blockStart = slotTime;
        const blockEnd = minutesToTime(timeToMinutes(slotTime) + 60);
        return isRangeOverlapping(startTime, endTime, blockStart, blockEnd);
      });
    });

    if (conflictingBlock) {
      return {
        id: `slot-${startTime.replace(':', '')}`,
        startTime,
        endTime,
        label,
        durationHours,
        period,
        isAvailable: false,
        conflictReason: `Impegno riservato Master (${conflictingBlock.reason || 'Slot bloccato'})`,
      };
    }

    return {
      id: `slot-${startTime.replace(':', '')}`,
      startTime,
      endTime,
      label,
      durationHours,
      period,
      isAvailable: true,
    };
  });

  if (preferredFascia === 'tutti') {
    return dynamicSlots;
  }
  return dynamicSlots.filter((s) => s.period === preferredFascia);
}
