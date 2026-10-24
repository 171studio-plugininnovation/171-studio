import { BookingRecord } from '../types/cms';

export interface PeakHourSlot {
  time: string;
  slotLabel: string;
  sessioni: number;
  oreRegistrate: number;
  incasso: number;
}

export interface MonthlyTrendItem {
  monthKey: string;
  monthLabel: string;
  totaleSessioni: number;
  oreTotali: number;
  incassoTotale: number;
  confermate: number;
}

export interface DayOfWeekItem {
  day: string;
  fullName: string;
  sessioni: number;
  ore: number;
}

export interface ServiceDistributionItem {
  name: string;
  count: number;
  value: number;
  revenue: number;
}

export const TIME_SLOT_DEFS: { key: string; label: string }[] = [
  { key: '10:00', label: '10:00 - 12:00' },
  { key: '12:00', label: '12:00 - 14:00' },
  { key: '14:00', label: '14:00 - 16:00' },
  { key: '16:00', label: '16:00 - 18:00' },
  { key: '18:00', label: '18:00 - 20:00' },
  { key: '20:00', label: '20:00 - 22:00' },
  { key: '21:30', label: '21:30 - 23:30' },
];

export const MONTH_NAMES_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

/**
 * Filter bookings based on status and time range
 */
export function filterBookings(
  bookings: BookingRecord[],
  timeRange: '30d' | '90d' | 'all',
  statusFilter: 'tutte' | 'attive_confermate',
  referenceDate: Date = new Date()
): BookingRecord[] {
  return bookings.filter(b => {
    if (statusFilter === 'attive_confermate' && b.status === 'annullata') {
      return false;
    }
    if (timeRange === 'all') return true;

    const bookingDate = new Date(b.date || b.createdAt);
    const diffDays = (referenceDate.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24);

    if (timeRange === '30d') return diffDays <= 30 && diffDays >= -1;
    if (timeRange === '90d') return diffDays <= 90 && diffDays >= -1;
    return true;
  });
}

/**
 * Calculates peak recording hours from booking time slots
 */
export function calculatePeakHours(bookings: BookingRecord[]): PeakHourSlot[] {
  const slotCounts: Record<string, { label: string; count: number; totalHours: number; revenue: number }> = {};
  
  TIME_SLOT_DEFS.forEach(s => {
    slotCounts[s.key] = { label: s.label, count: 0, totalHours: 0, revenue: 0 };
  });

  bookings.forEach(b => {
    const timeKey = b.time ? b.time.substring(0, 5) : '14:00';
    const slot = slotCounts[timeKey] || slotCounts['14:00'];
    if (slot) {
      slot.count += 1;
      slot.totalHours += b.hours || 2;
      slot.revenue += b.estimatedPrice || 0;
    }
  });

  return Object.entries(slotCounts).map(([time, data]) => ({
    time,
    slotLabel: data.label,
    sessioni: data.count,
    oreRegistrate: data.totalHours,
    incasso: data.revenue,
  }));
}

/**
 * Calculates month-by-month session frequency and hours
 */
export function calculateMonthlyTrends(
  bookings: BookingRecord[],
  referenceDate: Date = new Date(),
  monthsBack: number = 6
): MonthlyTrendItem[] {
  const monthsMap: Record<string, MonthlyTrendItem> = {};
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES_IT[d.getMonth()]} ${d.getFullYear()}`;
    monthsMap[key] = {
      monthKey: key,
      monthLabel: label,
      totaleSessioni: 0,
      oreTotali: 0,
      incassoTotale: 0,
      confermate: 0,
    };
  }

  bookings.forEach(b => {
    const rawDate = b.date || b.createdAt;
    if (!rawDate) return;
    const key = rawDate.substring(0, 7); // YYYY-MM
    if (!monthsMap[key]) {
      const parts = key.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      monthsMap[key] = {
        monthKey: key,
        monthLabel: `${MONTH_NAMES_IT[monthIndex] || parts[1]} ${parts[0]}`,
        totaleSessioni: 0,
        oreTotali: 0,
        incassoTotale: 0,
        confermate: 0,
      };
    }
    monthsMap[key].totaleSessioni += 1;
    monthsMap[key].oreTotali += (b.hours || 2);
    monthsMap[key].incassoTotale += (b.estimatedPrice || 0);
    if (b.status === 'confermata' || b.status === 'completata') {
      monthsMap[key].confermate += 1;
    }
  });

  return Object.values(monthsMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/**
 * Calculates session frequency by day of the week
 */
export function calculateDayOfWeekFrequency(bookings: BookingRecord[]): DayOfWeekItem[] {
  const daysCount: DayOfWeekItem[] = [
    { day: 'Lun', fullName: 'Lunedì', sessioni: 0, ore: 0 },
    { day: 'Mar', fullName: 'Martedì', sessioni: 0, ore: 0 },
    { day: 'Mer', fullName: 'Mercoledì', sessioni: 0, ore: 0 },
    { day: 'Gio', fullName: 'Giovedì', sessioni: 0, ore: 0 },
    { day: 'Ven', fullName: 'Venerdì', sessioni: 0, ore: 0 },
    { day: 'Sab', fullName: 'Sabato', sessioni: 0, ore: 0 },
    { day: 'Dom', fullName: 'Domenica', sessioni: 0, ore: 0 },
  ];

  bookings.forEach(b => {
    if (!b.date) return;
    const dateObj = new Date(b.date);
    if (isNaN(dateObj.getTime())) return;
    // getDay: 0 is Sun, 1 is Mon
    const dayIdx = (dateObj.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    if (daysCount[dayIdx]) {
      daysCount[dayIdx].sessioni += 1;
      daysCount[dayIdx].ore += (b.hours || 2);
    }
  });

  return daysCount;
}

/**
 * Calculates distribution of services booked
 */
export function calculateServiceDistribution(bookings: BookingRecord[]): ServiceDistributionItem[] {
  const serviceMap: Record<string, ServiceDistributionItem> = {};

  bookings.forEach(b => {
    const title = b.serviceTitle || 'Sessione Studio';
    if (!serviceMap[title]) {
      serviceMap[title] = { name: title, count: 0, value: 0, revenue: 0 };
    }
    serviceMap[title].count += 1;
    serviceMap[title].value += 1;
    serviceMap[title].revenue += (b.estimatedPrice || 0);
  });

  return Object.values(serviceMap).sort((a, b) => b.count - a.count);
}
