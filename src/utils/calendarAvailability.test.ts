import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WEEKLY_TIME_SLOTS, BlockedCalendarSlot } from '../types/cms';

test('DEFAULT_WEEKLY_TIME_SLOTS strictly start from 15:00 and conclude by 20:00', () => {
  assert.ok(DEFAULT_WEEKLY_TIME_SLOTS.length >= 4);
  const firstSlot = DEFAULT_WEEKLY_TIME_SLOTS[0];
  assert.equal(firstSlot.time, '15:00');
  
  // All slots must be >= 15:00 and end by 20:00
  for (const slot of DEFAULT_WEEKLY_TIME_SLOTS) {
    const hour = parseInt(slot.time.split(':')[0], 10);
    assert.ok(hour >= 15 && hour < 20, `Slot hour ${hour} is out of 15-20 range`);
  }
});

test('Master all-day blocked commitment disables the entire date', () => {
  const blockedCommitments: BlockedCalendarSlot[] = [
    {
      id: 'blk-1',
      date: '2026-10-25',
      allDay: true,
      reason: 'Impegno personale master',
      createdAt: new Date().toISOString(),
    }
  ];

  const targetDate = '2026-10-25';
  const isFullDayBlocked = blockedCommitments.some(b => b.date === targetDate && b.allDay);
  assert.equal(isFullDayBlocked, true);

  const anotherDate = '2026-10-26';
  const isAnotherBlocked = blockedCommitments.some(b => b.date === anotherDate && b.allDay);
  assert.equal(isAnotherBlocked, false);
});

test('Master partial slot commitment blocks only specified slots', () => {
  const blockedCommitments: BlockedCalendarSlot[] = [
    {
      id: 'blk-2',
      date: '2026-10-27',
      allDay: false,
      timeSlots: ['15:00', '16:00'],
      reason: 'Sessione master riservata',
      createdAt: new Date().toISOString(),
    }
  ];

  const targetDate = '2026-10-27';
  const slotBlocks = blockedCommitments.filter(b => b.date === targetDate && !b.allDay);
  const blockedTimes = new Set(slotBlocks.flatMap(b => b.timeSlots || []));

  assert.equal(blockedTimes.has('15:00'), true);
  assert.equal(blockedTimes.has('16:00'), true);
  assert.equal(blockedTimes.has('17:00'), false);
  assert.equal(blockedTimes.has('18:00'), false);
});
