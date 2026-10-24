import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  isRangeOverlapping,
  generateDynamicSlots,
  STUDIO_OPEN_TIME,
  STUDIO_CLOSE_TIME,
} from './calendarSlots';
import { BookingRecord } from '../types/cms';

test('timeToMinutes and minutesToTime conversions', () => {
  assert.equal(timeToMinutes('15:00'), 900);
  assert.equal(timeToMinutes('16:30'), 990);
  assert.equal(timeToMinutes('20:00'), 1200);

  assert.equal(minutesToTime(900), '15:00');
  assert.equal(minutesToTime(990), '16:30');
  assert.equal(minutesToTime(1200), '20:00');
});

test('isRangeOverlapping detects collisions accurately', () => {
  // 15:00 - 16:00 and 15:30 - 17:30 overlap
  assert.equal(isRangeOverlapping('15:00', '16:00', '15:30', '17:30'), true);
  // 15:00 - 16:00 and 16:00 - 18:00 do NOT overlap (touching boundary)
  assert.equal(isRangeOverlapping('15:00', '16:00', '16:00', '18:00'), false);
  // 15:00 - 17:00 contains 15:30 - 16:30
  assert.equal(isRangeOverlapping('15:00', '17:00', '15:30', '16:30'), true);
  // Separate intervals
  assert.equal(isRangeOverlapping('15:00', '16:00', '18:00', '20:00'), false);
});

test('When 1 hour is booked in afternoon (15:00-16:00), subsequent sessions dynamically adjust', () => {
  const existingBookings: BookingRecord[] = [
    {
      id: 'bk-test-1',
      orderCode: '171-ORD-TEST',
      userId: 'usr-1',
      userEmail: 'artist@test.it',
      userName: 'Test Artist',
      userPhone: '+39 333 1111111',
      serviceId: 'recording_hourly',
      serviceTitle: 'Sessione di Registrazione',
      hours: 1, // 1 hour booking
      date: '2026-10-25',
      time: '15:00', // 15:00 to 16:00
      estimatedPrice: 25,
      notes: '',
      status: 'confermata',
      paymentStatus: 'saldato',
      createdAt: '2026-10-23T00:00:00Z',
    },
  ];

  // User is looking for a 2-hour session on this date
  const slotsFor2h = generateDynamicSlots({
    date: '2026-10-25',
    durationHours: 2,
    existingBookings,
  });

  // 15:00 - 17:00 must be UNAVAILABLE because it conflicts with 15:00 - 16:00
  const slot1500 = slotsFor2h.find((s) => s.startTime === '15:00');
  assert.ok(slot1500);
  assert.equal(slot1500.isAvailable, false);
  assert.match(slot1500.conflictReason || '', /altra sessione/);

  // 15:30 - 17:30 must be UNAVAILABLE because it conflicts with 15:00 - 16:00
  const slot1530 = slotsFor2h.find((s) => s.startTime === '15:30');
  assert.ok(slot1530);
  assert.equal(slot1530.isAvailable, false);

  // 16:00 - 18:00 must be AVAILABLE! The remaining afternoon adapted automatically
  const slot1600 = slotsFor2h.find((s) => s.startTime === '16:00');
  assert.ok(slot1600);
  assert.equal(slot1600.isAvailable, true);
  assert.equal(slot1600.endTime, '18:00');

  // 18:00 - 20:00 must be AVAILABLE (evening fascia)
  const slot1800 = slotsFor2h.find((s) => s.startTime === '18:00');
  assert.ok(slot1800);
  assert.equal(slot1800.isAvailable, true);
  assert.equal(slot1800.endTime, '20:00');

  // 19:00 - 21:00 for 2h exceeds studio closing at 20:00, must be UNAVAILABLE
  const slot1900 = slotsFor2h.find((s) => s.startTime === '19:00');
  assert.ok(slot1900);
  assert.equal(slot1900.isAvailable, false);
  assert.equal(slot1900.isExceedingClosing, true);
});

test('Filtering by preferred fascia works as expected', () => {
  const afternoonSlots = generateDynamicSlots({
    date: '2026-10-26',
    durationHours: 2,
    preferredFascia: 'pomeriggio',
    existingBookings: [],
  });

  assert.ok(afternoonSlots.every((s) => s.period === 'pomeriggio'));

  const eveningSlots = generateDynamicSlots({
    date: '2026-10-26',
    durationHours: 2,
    preferredFascia: 'sera',
    existingBookings: [],
  });

  assert.ok(eveningSlots.every((s) => s.period === 'sera'));
});
