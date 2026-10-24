import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculatePeakHours, 
  calculateMonthlyTrends, 
  calculateDayOfWeekFrequency, 
  calculateServiceDistribution,
  filterBookings 
} from './bookingAnalytics';
import { BookingRecord } from '../types/cms';

const mockBookings: BookingRecord[] = [
  {
    id: 'b1',
    orderCode: '171-ORD-111111',
    userId: 'u1',
    userPhone: '+39 340 1111111',
    serviceId: 'recording_hourly',
    notes: 'Test vocal session',
    paymentStatus: 'saldato',
    userName: 'Marco Rossi',
    userEmail: 'marco@example.com',
    serviceTitle: 'Vocal Recording Studio',
    date: '2026-03-10', // Tuesday
    time: '18:00',
    hours: 2,
    estimatedPrice: 50,
    status: 'confermata',
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'b2',
    orderCode: '171-ORD-222222',
    userId: 'u2',
    userPhone: '+39 340 2222222',
    serviceId: 'recording_hourly',
    notes: 'Test vocal session 2',
    paymentStatus: 'saldato',
    userName: 'Sara Bianchi',
    userEmail: 'sara@example.com',
    serviceTitle: 'Vocal Recording Studio',
    date: '2026-03-17', // Tuesday
    time: '18:00',
    hours: 3,
    estimatedPrice: 75,
    status: 'confermata',
    createdAt: '2026-03-05T10:00:00.000Z',
  },
  {
    id: 'b3',
    orderCode: '171-ORD-333333',
    userId: 'u3',
    userPhone: '+39 340 3333333',
    serviceId: 'mix_master',
    notes: 'Test mix session',
    paymentStatus: 'in_attesa',
    userName: 'Luca Verdi',
    userEmail: 'luca@example.com',
    serviceTitle: 'Mix & Master Stereo',
    date: '2026-03-14', // Saturday
    time: '20:00',
    hours: 2,
    estimatedPrice: 100,
    status: 'in_attesa',
    createdAt: '2026-03-08T10:00:00.000Z',
  },
  {
    id: 'b4',
    orderCode: '171-ORD-444444',
    userId: 'u4',
    userPhone: '+39 340 4444444',
    serviceId: 'mastering',
    notes: 'Test master session',
    paymentStatus: 'in_attesa',
    userName: 'Anna Neri',
    userEmail: 'anna@example.com',
    serviceTitle: 'Solo Master Analogico',
    date: '2026-02-15', // Sunday
    time: '14:00',
    hours: 1,
    estimatedPrice: 40,
    status: 'annullata',
    createdAt: '2026-02-10T10:00:00.000Z',
  },
];

test('calculatePeakHours aggregates slots correctly and detects peak hour', () => {
  const peakHours = calculatePeakHours(mockBookings);
  assert.equal(peakHours.length, 7);

  const slot18 = peakHours.find(s => s.time === '18:00');
  assert.ok(slot18);
  assert.equal(slot18.sessioni, 2);
  assert.equal(slot18.oreRegistrate, 5);
  assert.equal(slot18.incasso, 125);

  const slot20 = peakHours.find(s => s.time === '20:00');
  assert.ok(slot20);
  assert.equal(slot20.sessioni, 1);
  assert.equal(slot20.oreRegistrate, 2);

  const slot10 = peakHours.find(s => s.time === '10:00');
  assert.ok(slot10);
  assert.equal(slot10.sessioni, 0);
});

test('calculateMonthlyTrends groups bookings by month', () => {
  const refDate = new Date('2026-03-20T12:00:00Z');
  const trends = calculateMonthlyTrends(mockBookings, refDate, 4);
  
  assert.ok(trends.length >= 4);

  const march2026 = trends.find(t => t.monthKey === '2026-03');
  assert.ok(march2026);
  assert.equal(march2026.totaleSessioni, 3);
  assert.equal(march2026.oreTotali, 7);
  assert.equal(march2026.confermate, 2); // b1 & b2 confermata, b3 in_attesa

  const feb2026 = trends.find(t => t.monthKey === '2026-02');
  assert.ok(feb2026);
  assert.equal(feb2026.totaleSessioni, 1);
  assert.equal(feb2026.confermate, 0);
});

test('calculateDayOfWeekFrequency maps bookings accurately to week days', () => {
  const dayStats = calculateDayOfWeekFrequency(mockBookings);
  assert.equal(dayStats.length, 7);

  const mar = dayStats.find(d => d.day === 'Mar');
  assert.ok(mar);
  assert.equal(mar.sessioni, 2); // b1 (Mar 10) & b2 (Mar 17)

  const sab = dayStats.find(d => d.day === 'Sab');
  assert.ok(sab);
  assert.equal(sab.sessioni, 1); // b3 (Mar 14)

  const dom = dayStats.find(d => d.day === 'Dom');
  assert.ok(dom);
  assert.equal(dom.sessioni, 1); // b4 (Feb 15)
});

test('calculateServiceDistribution ranks services correctly', () => {
  const dist = calculateServiceDistribution(mockBookings);
  assert.equal(dist.length, 3);
  assert.equal(dist[0].name, 'Vocal Recording Studio');
  assert.equal(dist[0].count, 2);
  assert.equal(dist[0].revenue, 125);
});

test('filterBookings filters cancelled bookings when attive_confermate is selected', () => {
  const activeOnly = filterBookings(mockBookings, 'all', 'attive_confermate');
  assert.equal(activeOnly.length, 3);
  assert.ok(activeOnly.every(b => b.status !== 'annullata'));

  const all = filterBookings(mockBookings, 'all', 'tutte');
  assert.equal(all.length, 4);
});
