import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  detectKeyFromChromagram, 
  estimateBpmFromPeaks, 
  calculateTapTempo, 
  pearsonCorrelation 
} from './audioAnalysis.js';

describe('audioAnalysis - DSP Key and BPM Utilities', () => {
  it('detects C Major from a C Major triad chromagram', () => {
    // C Major = C (0), E (4), G (7)
    const chromagram = [1.0, 0.1, 0.2, 0.1, 0.85, 0.2, 0.1, 0.9, 0.1, 0.2, 0.1, 0.15];
    const key = detectKeyFromChromagram(chromagram);
    assert.strictEqual(key.root, 'C');
    assert.strictEqual(key.mode, 'major');
    assert.strictEqual(key.camelot, '8B');
    assert.strictEqual(key.nameIt, 'Do Maggiore');
    assert.strictEqual(key.relativeKey, 'La Minore');
    assert.ok(key.confidence >= 50);
  });

  it('detects A Minor from an A Minor triad chromagram', () => {
    // A Minor = A (9), C (0), E (4)
    const chromagram = [0.85, 0.1, 0.15, 0.1, 0.8, 0.1, 0.1, 0.2, 0.1, 1.0, 0.1, 0.15];
    const key = detectKeyFromChromagram(chromagram);
    assert.strictEqual(key.root, 'A');
    assert.strictEqual(key.mode, 'minor');
    assert.strictEqual(key.camelot, '8A');
    assert.strictEqual(key.nameIt, 'La Minore');
    assert.strictEqual(key.relativeKey, 'Do Maggiore');
    assert.ok(key.confidence >= 50);
  });

  it('estimates BPM accurately from regular peak pulses (120 BPM)', () => {
    // 120 BPM = 0.5s interval
    const peaks: number[] = [];
    for (let t = 0; t <= 10; t += 0.5) {
      peaks.push(t);
    }
    const bpmRes = estimateBpmFromPeaks(peaks);
    assert.strictEqual(bpmRes.bpm, 120);
    assert.strictEqual(bpmRes.halfBpm, 60);
    assert.strictEqual(bpmRes.doubleBpm, 240);
    assert.ok(bpmRes.confidence > 50);
  });

  it('estimates BPM accurately from 140 BPM peaks (approx 0.428s interval)', () => {
    const interval = 60 / 140; // ~0.42857s
    const peaks: number[] = [];
    for (let i = 0; i < 25; i++) {
      peaks.push(i * interval);
    }
    const bpmRes = estimateBpmFromPeaks(peaks);
    assert.strictEqual(bpmRes.bpm, 140);
  });

  it('calculates tap tempo accurately', () => {
    // Tapping every 500ms = 120 BPM
    const taps = [1000, 1500, 2000, 2500, 3000];
    const calculated = calculateTapTempo(taps);
    assert.strictEqual(calculated, 120);
  });

  it('calculates Pearson correlation coefficient properly', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const r = pearsonCorrelation(x, y);
    assert.ok(Math.abs(r - 1.0) < 0.001);
  });
});
