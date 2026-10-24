/**
 * 171 Studio - Audio DSP Analysis Engine
 * BPM & Musical Key Detection for MP3/WAV files
 */

export interface KeyResult {
  root: string;           // e.g. "A", "C", "F#"
  mode: 'major' | 'minor';
  nameIt: string;         // e.g. "La Minore", "Do Maggiore"
  nameEn: string;         // e.g. "A Minor", "C Major"
  camelot: string;        // e.g. "8A", "8B"
  relativeKey: string;    // e.g. "Do Maggiore" (for La Minore)
  confidence: number;     // 0 - 100%
  chromagram: number[];   // 12 semitones normalized [C, C#, D, D#, E, F, F#, G, G#, A, A#, B]
}

export interface BpmResult {
  bpm: number;
  halfBpm: number;
  doubleBpm: number;
  confidence: number;     // 0 - 100%
  peaksCount: number;
}

export interface AudioAnalysisResult {
  bpmResult: BpmResult;
  keyResult: KeyResult;
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  fileFormat: string;
}

export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const PITCH_NAMES_IT: Record<string, string> = {
  C: 'Do',
  'C#': 'Do# / Reb',
  D: 'Re',
  'D#': 'Re# / Mib',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa# / Solb',
  G: 'Sol',
  'G#': 'Sol# / Lab',
  A: 'La',
  'A#': 'La# / Sib',
  B: 'Si',
};

// Camelot Wheel Table
const CAMELOT_MAJOR: Record<string, string> = {
  B: '1B',
  'F#': '2B',
  'C#': '3B',
  'G#': '4B',
  'D#': '5B',
  'A#': '6B',
  F: '7B',
  C: '8B',
  G: '9B',
  D: '10B',
  A: '11B',
  E: '12B',
};

const CAMELOT_MINOR: Record<string, string> = {
  'G#': '1A',
  'D#': '2A',
  'A#': '3A',
  F: '4A',
  C: '5A',
  G: '6A',
  D: '7A',
  A: '8A',
  E: '9A',
  B: '10A',
  'F#': '11A',
  'C#': '12A',
};

// Krumhansl-Kessler key profiles (standard tonal pitch class weights)
const KRUMHANSL_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KRUMHANSL_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

// Temperley key profiles (robust against relative major/minor confusion)
const TEMPERLEY_MAJOR = [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0];
const TEMPERLEY_MINOR = [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0];

// Albrecht-Shanahan modern music profiles (high contrast on non-scale vs chord tones)
const ALBRECHT_MAJOR = [0.748, 0.060, 0.488, 0.082, 0.670, 0.460, 0.096, 0.715, 0.107, 0.433, 0.121, 0.432];
const ALBRECHT_MINOR = [0.712, 0.084, 0.474, 0.618, 0.049, 0.460, 0.105, 0.747, 0.404, 0.067, 0.133, 0.330];

/**
 * Computes Pearson correlation coefficient between two 12-element vectors
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || y.length !== n) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX) * Math.sqrt(denY);
  return den === 0 ? 0 : num / den;
}

/**
 * Detects musical key and Camelot notation from a 12-semitone chromagram
 * Uses a weighted multi-profile ensemble (Krumhansl + Temperley + Albrecht)
 * with tonic triad harmonic reinforcement to eliminate relative major/minor errors.
 */
export function detectKeyFromChromagram(chromagram: number[]): KeyResult {
  // Normalize chromagram so max is 1
  const maxVal = Math.max(...chromagram, 0.0001);
  const normChroma = chromagram.map((v) => v / maxVal);

  let bestScore = -Infinity;
  let secondBestScore = -Infinity;
  let bestPitchIndex = 0;
  let bestMode: 'major' | 'minor' = 'major';

  // Test all 12 Major and 12 Minor keys
  for (let pitch = 0; pitch < 12; pitch++) {
    const krumMaj = new Array(12);
    const krumMin = new Array(12);
    const tempMaj = new Array(12);
    const tempMin = new Array(12);
    const albMaj = new Array(12);
    const albMin = new Array(12);

    for (let i = 0; i < 12; i++) {
      const idx = (i + pitch) % 12;
      krumMaj[idx] = KRUMHANSL_MAJOR[i];
      krumMin[idx] = KRUMHANSL_MINOR[i];
      tempMaj[idx] = TEMPERLEY_MAJOR[i];
      tempMin[idx] = TEMPERLEY_MINOR[i];
      albMaj[idx] = ALBRECHT_MAJOR[i];
      albMin[idx] = ALBRECHT_MINOR[i];
    }

    // Pearson correlations for all 3 standard models
    const rKrumMaj = pearsonCorrelation(normChroma, krumMaj);
    const rKrumMin = pearsonCorrelation(normChroma, krumMin);
    const rTempMaj = pearsonCorrelation(normChroma, tempMaj);
    const rTempMin = pearsonCorrelation(normChroma, tempMin);
    const rAlbMaj = pearsonCorrelation(normChroma, albMaj);
    const rAlbMin = pearsonCorrelation(normChroma, albMin);

    // Direct Tonic Triad harmonic verification
    // Major triad: Root (0), Major 3rd (+4), Perfect 5th (+7)
    // Minor triad: Root (0), Minor 3rd (+3), Perfect 5th (+7)
    const tonicVal = normChroma[pitch];
    const fifthVal = normChroma[(pitch + 7) % 12];
    const majThirdVal = normChroma[(pitch + 4) % 12];
    const minThirdVal = normChroma[(pitch + 3) % 12];

    const majTriadBonus = (tonicVal * 0.4 + majThirdVal * 0.4 + fifthVal * 0.2);
    const minTriadBonus = (tonicVal * 0.4 + minThirdVal * 0.4 + fifthVal * 0.2);

    // Weighted ensemble composite score
    const rMaj = (rKrumMaj * 0.35 + rTempMaj * 0.35 + rAlbMaj * 0.30) + majTriadBonus * 0.15;
    const rMin = (rKrumMin * 0.35 + rTempMin * 0.35 + rAlbMin * 0.30) + minTriadBonus * 0.15;

    if (rMaj > bestScore) {
      secondBestScore = bestScore;
      bestScore = rMaj;
      bestPitchIndex = pitch;
      bestMode = 'major';
    } else if (rMaj > secondBestScore) {
      secondBestScore = rMaj;
    }

    if (rMin > bestScore) {
      secondBestScore = bestScore;
      bestScore = rMin;
      bestPitchIndex = pitch;
      bestMode = 'minor';
    } else if (rMin > secondBestScore) {
      secondBestScore = rMin;
    }
  }

  const root = PITCH_CLASSES[bestPitchIndex];
  const itRoot = PITCH_NAMES_IT[root] || root;
  const isMajor = bestMode === 'major';

  const nameIt = isMajor ? `${itRoot} Maggiore` : `${itRoot} Minore`;
  const nameEn = isMajor ? `${root} Major` : `${root} Minor`;
  const camelot = isMajor ? (CAMELOT_MAJOR[root] || '8B') : (CAMELOT_MINOR[root] || '8A');

  // Relative key calculation:
  // Major's relative minor is -3 semitones (or +9)
  // Minor's relative major is +3 semitones
  const relativePitchIdx = isMajor ? (bestPitchIndex + 9) % 12 : (bestPitchIndex + 3) % 12;
  const relRoot = PITCH_CLASSES[relativePitchIdx];
  const relItRoot = PITCH_NAMES_IT[relRoot] || relRoot;
  const relativeKey = isMajor ? `${relItRoot} Minore` : `${relItRoot} Maggiore`;

  // Confidence formula based on correlation strength and separation from second candidate
  const scoreDiff = Math.max(0, bestScore - secondBestScore);
  const confidence = Math.min(
    99,
    Math.max(55, Math.round(((bestScore + 1) / 2) * 65 + scoreDiff * 45))
  );

  return {
    root,
    mode: bestMode,
    nameIt,
    nameEn,
    camelot,
    relativeKey,
    confidence,
    chromagram: normChroma,
  };
}

/**
 * Detects BPM from an array of onset times or peak intervals
 */
export function estimateBpmFromPeaks(peakTimes: number[], maxDurationSeconds = 60): BpmResult {
  if (peakTimes.length < 4) {
    return {
      bpm: 120,
      halfBpm: 60,
      doubleBpm: 240,
      confidence: 50,
      peaksCount: peakTimes.length,
    };
  }

  // Calculate intervals between peaks (up to 4 intervals ahead)
  const intervals: number[] = [];
  for (let i = 0; i < peakTimes.length; i++) {
    for (let j = 1; j <= 4 && i + j < peakTimes.length; j++) {
      const dt = (peakTimes[i + j] - peakTimes[i]) / j;
      if (dt > 0.28 && dt < 1.05) { // 57 BPM to 214 BPM
        intervals.push(dt);
      }
    }
  }

  if (intervals.length === 0) {
    return {
      bpm: 120,
      halfBpm: 60,
      doubleBpm: 240,
      confidence: 50,
      peaksCount: peakTimes.length,
    };
  }

  // Create histogram with 1 BPM bins between 60 and 190
  const bpmHistogram: Record<number, number> = {};
  for (let b = 60; b <= 190; b++) {
    bpmHistogram[b] = 0;
  }

  for (const interval of intervals) {
    const rawBpm = 60 / interval;
    // Map to 60-190 range (handle half or double time)
    let normBpm = rawBpm;
    while (normBpm < 60) normBpm *= 2;
    while (normBpm > 190) normBpm /= 2;

    const rounded = Math.round(normBpm);
    if (bpmHistogram[rounded] !== undefined) {
      bpmHistogram[rounded] += 1;
      // Add Gaussian neighboring weights
      if (bpmHistogram[rounded - 1] !== undefined) bpmHistogram[rounded - 1] += 0.5;
      if (bpmHistogram[rounded + 1] !== undefined) bpmHistogram[rounded + 1] += 0.5;
    }
  }

  let bestBpm = 120;
  let maxWeight = 0;
  let totalWeight = 0;

  for (let b = 60; b <= 190; b++) {
    const w = bpmHistogram[b] || 0;
    totalWeight += w;
    if (w > maxWeight) {
      maxWeight = w;
      bestBpm = b;
    }
  }

  const confidence = Math.min(
    98,
    Math.max(50, Math.round((maxWeight / Math.max(1, totalWeight)) * 140))
  );

  return {
    bpm: bestBpm,
    halfBpm: Math.round(bestBpm / 2),
    doubleBpm: bestBpm * 2,
    confidence,
    peaksCount: peakTimes.length,
  };
}

/**
 * Calculates manual Tap Tempo from click timestamps
 */
export function calculateTapTempo(tapTimestamps: number[]): number | null {
  if (tapTimestamps.length < 2) return null;

  // Keep last 8 taps
  const recent = tapTimestamps.slice(-8);
  const diffs: number[] = [];

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    // Filter out taps slower than 2.5s (24 BPM) or faster than 0.15s (400 BPM)
    if (diff >= 150 && diff <= 2500) {
      diffs.push(diff);
    }
  }

  if (diffs.length === 0) return null;

  const avgDiffMs = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const calculatedBpm = Math.round(60000 / avgDiffMs);
  return Math.min(240, Math.max(40, calculatedBpm));
}
