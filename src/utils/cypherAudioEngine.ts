/**
 * 171 Studio - "The God Cypher" Native Audio Engine
 * Real-time Web Audio API synthesizer for the official 171 Studio album track.
 * Delivers immediate, zero-latency playback directly from the navbar Play button,
 * perfectly synchronized with the VU spectrum meter and loop repetition.
 */

class CypherAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timerId: number | null = null;
  private currentStep = 0;
  private tempo = 92; // 92 BPM - authentic hip hop boom-bap / cypher tempo
  private volume = 0.7;

  // D Minor Chord progression: Dm7 -> Gm7 -> Am7 -> Bbmaj7
  private chordFreqs = [
    [146.83, 174.61, 220.00, 261.63], // Dm7 (D3, F3, A3, C4)
    [196.00, 233.08, 293.66, 349.23], // Gm7 (G3, Bb3, D4, F4)
    [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
    [233.08, 293.66, 349.23, 440.00], // Bbmaj7 (Bb3, D4, F4, A4)
  ];

  // Bass notes corresponding to the chords
  private bassNotes = [73.42, 98.00, 110.00, 116.54]; // D2, G2, A2, Bb2

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Synthesize punchy 171 kick drum
  private playKick(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Rapid pitch drop from 140Hz down to 45Hz
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  // Synthesize crisp studio snare drum
  private playSnare(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(185, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);

    // Noise crack
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.22);
  }

  // Synthesize closed or open hi-hat
  private playHiHat(time: number, isOpen = false) {
    if (!this.ctx || !this.masterGain) return;

    const dur = isOpen ? 0.25 : 0.05;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500, time);
    filter.Q.setValueAtTime(3, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.35 : 0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + dur);
  }

  // Synthesize smooth Rhodes / Electric Piano chords
  private playChord(time: number, chordIndex: number) {
    if (!this.ctx || !this.masterGain) return;

    const freqs = this.chordFreqs[chordIndex % this.chordFreqs.length];
    const duration = (60 / this.tempo) * 3.8; // sustain across almost a full measure

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, time);
      filter.frequency.exponentialRampToValueAtTime(450, time + duration);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + duration);
    });

    // Sub-bass root note
    const bassFreq = this.bassNotes[chordIndex % this.bassNotes.length];
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();

    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, time);

    bassGain.gain.setValueAtTime(0.35, time);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    bassOsc.connect(bassGain);
    bassGain.connect(this.masterGain);

    bassOsc.start(time);
    bassOsc.stop(time + duration);
  }

  // 16-step sequencer step execution
  private tick() {
    if (!this.ctx || !this.isRunning) return;

    const now = this.ctx.currentTime;
    const step16 = this.currentStep % 16;
    const measure = Math.floor(this.currentStep / 16) % 4;

    // Trigger chord on the first step of each measure
    if (step16 === 0) {
      this.playChord(now, measure);
    }

    // Classic 171 Boom-Bap kick pattern (beats 1, 1.75, 3, 3.5)
    if (step16 === 0 || step16 === 6 || step16 === 10 || step16 === 14) {
      this.playKick(now);
    }

    // Snare hits on beats 2 and 4 (steps 4 and 12)
    if (step16 === 4 || step16 === 12) {
      this.playSnare(now);
    }

    // Steady 16th swing hi-hats with occasional open hat on off-beats
    if (step16 === 14) {
      this.playHiHat(now, true); // Open hat before the downbeat
    } else if (step16 % 2 === 0 || step16 === 7 || step16 === 15) {
      this.playHiHat(now, false);
    }

    this.currentStep++;
  }

  public start() {
    this.initContext();
    if (this.isRunning) return;

    this.isRunning = true;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }

    // Interval between 16th notes: (60 / tempo) / 4 in seconds
    const intervalMs = ((60 / this.tempo) / 4) * 1000;
    this.tick();
    this.timerId = window.setInterval(() => this.tick(), intervalMs);
  }

  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    }
  }

  public toggle(): boolean {
    if (this.isRunning) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Returns live audio spectrum amplitude array for VU meter synchronization
  public getSpectrumData(): number[] {
    if (!this.analyser || !this.isRunning) return [];

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const bars: number[] = [];
    const step = Math.floor(dataArray.length / 16);
    for (let i = 0; i < 16; i++) {
      const val = dataArray[i * step] || 0;
      bars.push(Math.round((val / 255) * 100));
    }
    return bars;
  }
}

// Global Singleton for immediate playback across all pages and views
export const cypherAudio = new CypherAudioEngine();
