import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEstimatedPrice, HOURLY_STUDIO_RATE, SERVICE_OPTIONS } from './pricing';

test('Hourly studio rate is 25 euros', () => {
  assert.equal(HOURLY_STUDIO_RATE, 25);
  const rec1h = calculateEstimatedPrice('recording_hourly', 1);
  assert.equal(rec1h.total, 25);

  const rec4h = calculateEstimatedPrice('recording_hourly', 4);
  assert.equal(rec4h.total, 100);
});

test('Messina special packages calculate correctly', () => {
  // Pack 4h Messina: 90 euros base
  const pack4h = calculateEstimatedPrice('pack_4h_messina', 4);
  assert.equal(pack4h.total, 90);

  // Pack 4h with 1 extra hour: 90 + 25 = 115
  const pack4hExtra = calculateEstimatedPrice('pack_4h_messina', 5);
  assert.equal(pack4hExtra.total, 115);

  // Day-Slot 8h Messina: 170 euros base
  const daySlot8h = calculateEstimatedPrice('pack_8h_day_messina', 8);
  assert.equal(daySlot8h.total, 170);

  // Pack Weekend 16h: 320 euros base
  const pack16h = calculateEstimatedPrice('pack_weekend_16h', 16);
  assert.equal(pack16h.total, 320);
});

test('Mix & Master is 50 euros plus studio hours at 25 euro/hour', () => {
  const mm1h = calculateEstimatedPrice('mix_master', 1);
  assert.equal(mm1h.base, 50);
  assert.equal(mm1h.extraHoursCost, 25);
  assert.equal(mm1h.total, 75);

  const mm2h = calculateEstimatedPrice('mix_master', 2);
  assert.equal(mm2h.base, 50);
  assert.equal(mm2h.extraHoursCost, 50);
  assert.equal(mm2h.total, 100);
});

test('Solo Master is 40 euros and Solo Mix Online is 60 euros', () => {
  assert.equal(calculateEstimatedPrice('solo_master').total, 40);
  assert.equal(calculateEstimatedPrice('solo_mix_online').total, 60);
});

test('Brano Completo packages include 3h of rec (150e non-esclusivo, 200e esclusivo)', () => {
  const nonExclusive = calculateEstimatedPrice('brano_completo_non_esclusivo', 3);
  assert.equal(nonExclusive.total, 150);

  const nonExclusiveExtraHour = calculateEstimatedPrice('brano_completo_non_esclusivo', 4);
  assert.equal(nonExclusiveExtraHour.total, 175); // 150 + 1h extra at 25

  const exclusive = calculateEstimatedPrice('brano_completo_esclusivo', 3);
  assert.equal(exclusive.total, 200);

  const exclusiveExtraHour = calculateEstimatedPrice('brano_completo_esclusivo', 5);
  assert.equal(exclusiveExtraHour.total, 250); // 200 + 2h extra at 50
});

test('Produzione pricing is 50 euros without exclusivity and 150 euros with total exclusivity', () => {
  assert.equal(calculateEstimatedPrice('produzione_non_esclusiva').total, 50);
  assert.equal(calculateEstimatedPrice('produzione_esclusiva').total, 150);
});

test('All 11 service options exist in catalog', () => {
  assert.equal(SERVICE_OPTIONS.length, 11);
});
