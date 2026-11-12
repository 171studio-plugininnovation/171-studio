/**
 * 171 Studio Messina — Microphone Sound Matcher Engine (Web Audio API)
 * Simula fedelmente le caratteristiche timbriche, risposta in frequenza
 * ed inviluppo armonico dei 4 microfoni in dotazione allo studio:
 * - RØDE NT1-A Signature (Aperto, moderno, zero-noise, top-end scintillante)
 * - Warm Audio WA-47jr (Calore vintage valvolare/FET, medi densi, basse rotonde)
 * - Lewitt LCT 440 PURE (Precisione chirurgica austriaca, velocità transiente, trasparenza)
 * - Shure SM7B Dynamic (Punch radiofonico compatto, corpo ravvicinato, medi definiti)
 */

let sharedAudioCtx: AudioContext | null = null;
let currentActiveStopFn: (() => void) | null = null;

export function stopCurrentMicPreview(): void {
  if (currentActiveStopFn) {
    try {
      currentActiveStopFn();
    } catch {
      // Ignora errori di chiusura audio
    }
    currentActiveStopFn = null;
  }
}

export function playMicrophoneAcousticPreview(
  micId: string,
  onEnded?: () => void
): () => void {
  // Ferma qualsiasi anteprima già in riproduzione
  stopCurrentMicPreview();

  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) {
      if (onEnded) onEnded();
      return () => {};
    }

    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }

    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;
    const duration = 3.6; // Durata 3.6 secondi

    // Master Gain del preview
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.38, now + 0.08);
    masterGain.gain.setValueAtTime(0.38, now + duration - 0.4);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Generatore Timbrico Polifonico Vocale (Formanti Fondamentali F0, F1, F2)
    // Simula una nota vocale calda (C3 = 130.81 Hz con formanti 'A' vocale aperta)
    const baseFreq = 130.81;
    const oscRoot = ctx.createOscillator();
    oscRoot.type = 'sawtooth';
    oscRoot.frequency.setValueAtTime(baseFreq, now);

    // Secondo oscillatore a ottava superiore con leggero detune corale
    const oscOctave = ctx.createOscillator();
    oscOctave.type = 'triangle';
    oscOctave.frequency.setValueAtTime(baseFreq * 2.004, now);

    // Formante F1 Vocale (800 Hz)
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.setValueAtTime(780, now);
    formant1.Q.setValueAtTime(3.5, now);

    // Formante F2 Vocale (1250 Hz)
    const formant2 = ctx.createBiquadFilter();
    formant2.type = 'bandpass';
    formant2.frequency.setValueAtTime(1280, now);
    formant2.Q.setValueAtTime(4.0, now);

    // Catena di Modellazione Acustica del Microfono Selezionato
    const micLowFilter = ctx.createBiquadFilter();
    const micMidFilter = ctx.createBiquadFilter();
    const micHighFilter = ctx.createBiquadFilter();
    const micWaveshaper = ctx.createWaveShaper();

    // Curva di saturazione analogica dolce (Warm vs Lewitt vs Rode vs Shure)
    function makeDistortionCurve(amount: number) {
      const k = amount;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    if (micId === 'warm-wa47jr') {
      // WARM AUDIO WA-47jr: Timbro vintage a FET, medi rotondi, armoniche pari e roll-off morbido sulle sibilanti
      micLowFilter.type = 'lowshelf';
      micLowFilter.frequency.setValueAtTime(240, now);
      micLowFilter.gain.setValueAtTime(3.2, now); // Corpo e calore sui 240 Hz

      micMidFilter.type = 'peaking';
      micMidFilter.frequency.setValueAtTime(1200, now);
      micMidFilter.Q.setValueAtTime(1.2, now);
      micMidFilter.gain.setValueAtTime(1.8, now); // Medi caldi e setosi

      micHighFilter.type = 'highshelf';
      micHighFilter.frequency.setValueAtTime(8000, now);
      micHighFilter.gain.setValueAtTime(-1.8, now); // Roll-off morbido anti-asprezza

      micWaveshaper.curve = makeDistortionCurve(18); // Saturazione analogica densa
    } else if (micId === 'lewitt-440') {
      // LEWITT LCT 440 PURE: Precisione austriaca a 3 micron, risposta ai transienti fulminea, estrema apertura
      micLowFilter.type = 'highpass';
      micLowFilter.frequency.setValueAtTime(45, now);

      micMidFilter.type = 'peaking';
      micMidFilter.frequency.setValueAtTime(4200, now);
      micMidFilter.Q.setValueAtTime(1.4, now);
      micMidFilter.gain.setValueAtTime(2.8, now); // Articolazione e dizione chirurgica

      micHighFilter.type = 'highshelf';
      micHighFilter.frequency.setValueAtTime(11000, now);
      micHighFilter.gain.setValueAtTime(3.5, now); // Aria pura e cristallina

      micWaveshaper.curve = makeDistortionCurve(2); // Trasparenza assoluta, distorsione quasi zero
    } else if (micId === 'shure-sm7b') {
      // SHURE SM7B: Microfono dinamico, capsula ravvicinata, punch compatto, medi spinti per rap aggressivo
      micLowFilter.type = 'peaking';
      micLowFilter.frequency.setValueAtTime(140, now);
      micLowFilter.Q.setValueAtTime(1.8, now);
      micLowFilter.gain.setValueAtTime(4.2, now); // Effetto prossimità massiccio

      micMidFilter.type = 'peaking';
      micMidFilter.frequency.setValueAtTime(2800, now);
      micMidFilter.Q.setValueAtTime(1.6, now);
      micMidFilter.gain.setValueAtTime(3.8, now); // Presenza tagliente e punch vocale

      micHighFilter.type = 'lowpass';
      micHighFilter.frequency.setValueAtTime(12500, now); // Chiude le frequenze ultra-alte tipiche dei dinamici

      micWaveshaper.curve = makeDistortionCurve(12); // Compressione naturale tipica della bobina dinamica
    } else {
      // RØDE NT1-A Signature (Default): Risposta ultra-pulita, rumore proprio minimo al mondo, top-end aperto
      micLowFilter.type = 'lowshelf';
      micLowFilter.frequency.setValueAtTime(180, now);
      micLowFilter.gain.setValueAtTime(0.5, now);

      micMidFilter.type = 'peaking';
      micMidFilter.frequency.setValueAtTime(3200, now);
      micMidFilter.Q.setValueAtTime(1.0, now);
      micMidFilter.gain.setValueAtTime(1.2, now);

      micHighFilter.type = 'highshelf';
      micHighFilter.frequency.setValueAtTime(12000, now);
      micHighFilter.gain.setValueAtTime(2.6, now); // Brillantezza moderna radio-ready

      micWaveshaper.curve = makeDistortionCurve(4);
    }

    // Cablaggio Audio Graph
    oscRoot.connect(formant1);
    oscOctave.connect(formant2);

    formant1.connect(micLowFilter);
    formant2.connect(micLowFilter);

    micLowFilter.connect(micMidFilter);
    micMidFilter.connect(micHighFilter);
    micHighFilter.connect(micWaveshaper);
    micWaveshaper.connect(masterGain);

    // Avvio oscillatori
    oscRoot.start(now);
    oscOctave.start(now);

    oscRoot.stop(now + duration);
    oscOctave.stop(now + duration);

    let isStopped = false;
    const stopFn = () => {
      if (isStopped) return;
      isStopped = true;
      try {
        const stopTime = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(stopTime);
        masterGain.gain.setValueAtTime(masterGain.gain.value, stopTime);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.05);
        setTimeout(() => {
          try {
            oscRoot.stop();
            oscOctave.stop();
            oscRoot.disconnect();
            oscOctave.disconnect();
          } catch {
            // Ignora
          }
        }, 60);
      } catch {
        // Ignora
      }
      if (onEnded) onEnded();
    };

    currentActiveStopFn = stopFn;

    // Timer per chiusura automatica
    setTimeout(() => {
      if (currentActiveStopFn === stopFn) {
        currentActiveStopFn = null;
        if (onEnded) onEnded();
      }
    }, duration * 1000);

    return stopFn;
  } catch (err) {
    console.error('Errore riproduzione preview microfono:', err);
    if (onEnded) onEnded();
    return () => {};
  }
}
