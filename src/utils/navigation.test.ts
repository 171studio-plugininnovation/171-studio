import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageDefinition, isValidPageId, getNextPage, getAllPageList, formatStudioBadge } from './navigation';

test('getPageDefinition returns exact page definition when found', () => {
  const chiSiamo = getPageDefinition('chi-siamo');
  assert.equal(chiSiamo.id, 'chi-siamo');
  assert.equal(chiSiamo.title, 'Chi Siamo');

  const prenota = getPageDefinition('prenota-sessione');
  assert.equal(prenota.id, 'prenota-sessione');
  assert.equal(prenota.title, 'Prenota Sessione');

  const plugins = getPageDefinition('plugin-innovation');
  assert.equal(plugins.id, 'plugin-innovation');
  assert.equal(plugins.title, '171 Plugin Innovation');
});

test('getPageDefinition falls back to home on invalid input', () => {
  const fallback = getPageDefinition('unknown-random-page');
  assert.equal(fallback.id, 'home');
  assert.equal(fallback.title, '171 STUDIO');
});

test('isValidPageId validates allowed pages properly', () => {
  assert.equal(isValidPageId('home'), true);
  assert.equal(isValidPageId('chi-siamo'), true);
  assert.equal(isValidPageId('prenota-sessione'), true);
  assert.equal(isValidPageId('plugin-innovation'), true);
  assert.equal(isValidPageId('strumenti-online'), true);
  assert.equal(isValidPageId('contact'), false);
  assert.equal(isValidPageId(''), false);
});

test('getAllPageList returns all 5 main studio sections', () => {
  const list = getAllPageList();
  assert.equal(list.length, 5);
  const ids = list.map(p => p.id);
  assert.deepEqual(ids, ['home', 'chi-siamo', 'prenota-sessione', 'plugin-innovation', 'strumenti-online']);
});

test('getNextPage cycles through views cyclically', () => {
  assert.equal(getNextPage('home'), 'chi-siamo');
  assert.equal(getNextPage('chi-siamo'), 'prenota-sessione');
  assert.equal(getNextPage('prenota-sessione'), 'plugin-innovation');
  assert.equal(getNextPage('plugin-innovation'), 'strumenti-online');
  assert.equal(getNextPage('strumenti-online'), 'home');
});

test('formatStudioBadge normalizes to uppercase', () => {
  assert.equal(formatStudioBadge('studio di registrazione'), 'STUDIO DI REGISTRAZIONE');
});
