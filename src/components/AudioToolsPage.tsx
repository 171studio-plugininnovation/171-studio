import React, { useState, useRef, useEffect } from 'react';
import { 
  Music, Activity, Play, Pause, RotateCcw, Upload, Volume2, 
  Sparkles, Check, Copy, Download, ArrowRight, Disc, Sliders, 
  HelpCircle, Zap, Radio, Clock, AlertCircle, Lock, UserCheck, History
} from 'lucide-react';
import { PageId } from '../types';
import { 
  KeyResult, BpmResult, AudioAnalysisResult, 
  detectKeyFromChromagram, estimateBpmFromPeaks, calculateTapTempo,
  PITCH_CLASSES, PITCH_NAMES_IT
} from '../utils/audioAnalysis';
import { useStudio } from '../context/StudioContext';

interface AudioToolsPageProps {
  onNavigate: (page: PageId) => void;
}

export const AudioToolsPage: React.FC<AudioToolsPageProps> = ({ onNavigate }) => {
  const { currentUser, openAuthModal, recordKeyBpmAnalysis, keyBpmHistory } = useStudio();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysisResult | null>(null);

  const userKeyBpmRecords = keyBpmHistory.filter(
    (item) =>
      currentUser &&
      (item.userId === currentUser.id ||
        item.userEmail.toLowerCase() === currentUser.email.toLowerCase())
  );
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedAutoTuneNotice, setCopiedAutoTuneNotice] = useState(false);

  // Manual Tap Tempo state
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [tapBpm, setTapBpm] = useState<number | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);

  // Audio Context & nodes refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);

  // Get or initialize AudioContext
  const getAudioContext = (): AudioContext => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Handle file selection and parsing
  const processAudioBuffer = async (buffer: AudioBuffer, name: string, sizeStr: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress(15);
    setFileName(name);
    setFileSize(sizeStr);
    setDuration(buffer.duration);
    audioBufferRef.current = buffer;
    pauseOffsetRef.current = 0;
    setCurrentTime(0);

    // Run DSP extraction in background chunks
    setTimeout(async () => {
      try {
        setAnalysisProgress(35);
        const sampleRate = buffer.sampleRate;
        const channelData = buffer.getChannelData(0); // Left or Mono channel
        const totalSamples = channelData.length;

        // 1. BPM Detection: Spectral Flux Transient Onset Extraction
        // Compute energy envelope in 256-sample windows with first-order difference
        const windowSize = 256;
        const numWindows = Math.floor(totalSamples / windowSize);
        const envelope: Float32Array = new Float32Array(numWindows);

        for (let i = 0; i < numWindows; i++) {
          let sum = 0;
          const start = i * windowSize;
          for (let j = 0; j < windowSize; j += 2) {
            const val = channelData[start + j];
            sum += val * val;
          }
          envelope[i] = Math.sqrt((sum * 2) / windowSize);
        }

        setAnalysisProgress(55);

        // Compute Half-Wave Rectified Flux: onsets = max(0, env[i] - env[i - 1])
        const flux: Float32Array = new Float32Array(numWindows);
        let fluxSum = 0;
        for (let i = 1; i < numWindows; i++) {
          const diff = envelope[i] - envelope[i - 1];
          if (diff > 0) {
            flux[i] = diff;
            fluxSum += diff;
          }
        }

        const avgFlux = fluxSum / Math.max(1, numWindows);
        const threshold = avgFlux * 1.35;

        const peakTimes: number[] = [];
        const minDistanceWindows = Math.floor((0.24 * sampleRate) / windowSize); // max ~250 BPM
        let lastPeakIdx = -minDistanceWindows;

        for (let i = 2; i < numWindows - 2; i++) {
          if (flux[i] > threshold && flux[i] > flux[i - 1] && flux[i] > flux[i + 1]) {
            if (i - lastPeakIdx >= minDistanceWindows) {
              peakTimes.push((i * windowSize) / sampleRate);
              lastPeakIdx = i;
            }
          }
        }

        const bpmResult = estimateBpmFromPeaks(peakTimes, buffer.duration);

        setAnalysisProgress(75);

        // 2. High-Precision Musical Key Detection: 12-Tone Chromagram Calculation
        // Uses Hann-windowed slices across 6 octaves (A1 ~55Hz to A6 ~1760Hz)
        // with Bass/Tonic weighting for 808s and chord roots
        const chromaBins = new Array(12).fill(0);
        const a4 = 440; // Standard concert pitch
        const numSlices = Math.min(160, Math.max(40, Math.floor(buffer.duration * 6)));
        const sliceLength = 4096;
        const step = Math.floor((totalSamples - sliceLength) / Math.max(1, numSlices));

        // Precompute Hann window to eliminate spectral leakage
        const hann = new Float32Array(sliceLength);
        for (let n = 0; n < sliceLength; n++) {
          hann[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (sliceLength - 1)));
        }

        // Octave weights: emphasize bass/chord roots (octaves 1, 2, 3)
        const octaveWeights = [1.35, 1.35, 1.2, 1.0, 0.85, 0.7];

        for (let s = 0; s < numSlices; s++) {
          const offset = Math.max(0, s * step);
          if (offset + sliceLength > totalSamples) break;

          const sliceChroma = new Float32Array(12);

          for (let semitone = 0; semitone < 12; semitone++) {
            for (let octIdx = 0; octIdx < 6; octIdx++) {
              const octave = octIdx + 1; // octaves 1 through 6
              const midiNote = 12 * (octave + 1) + semitone;
              const freq = a4 * Math.pow(2, (midiNote - 69) / 12);
              const k = Math.round((sliceLength * freq) / sampleRate);

              if (k >= sliceLength / 2) continue;

              // Windowed Discrete Fourier transform sample at frequency bin k
              let real = 0;
              let imag = 0;
              const angle = (2 * Math.PI * k) / sliceLength;

              for (let n = 0; n < sliceLength; n += 4) {
                const sample = channelData[offset + n] * hann[n];
                real += sample * Math.cos(angle * n);
                imag -= sample * Math.sin(angle * n);
              }

              const mag = Math.sqrt(real * real + imag * imag) * octaveWeights[octIdx];
              sliceChroma[semitone] += mag;
            }
          }

          // Normalize each slice before accumulating into overall chroma
          let sliceMax = 0;
          for (let i = 0; i < 12; i++) {
            if (sliceChroma[i] > sliceMax) sliceMax = sliceChroma[i];
          }
          if (sliceMax > 0.0001) {
            for (let i = 0; i < 12; i++) {
              chromaBins[i] += sliceChroma[i] / sliceMax;
            }
          }
        }

        setAnalysisProgress(92);

        const keyResult = detectKeyFromChromagram(chromaBins);

        const result: AudioAnalysisResult = {
          bpmResult,
          keyResult,
          durationSeconds: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels,
          fileFormat: name.split('.').pop()?.toUpperCase() || 'WAV/MP3',
        };

        setAnalysisResult(result);
        setIsAnalyzing(false);
        setAnalysisProgress(100);
        drawWaveform(buffer);

        // Save analysis in user account history ("Il Mio Account")
        recordKeyBpmAnalysis({
          fileName: name,
          fileSize: sizeStr,
          bpm: bpmResult.bpm,
          musicalKey: keyResult.nameEn,
          musicalKeyIt: keyResult.nameIt,
          camelot: keyResult.camelot,
          confidence: keyResult.confidence,
        });
      } catch (err) {
        console.error('Audio processing error:', err);
        setIsAnalyzing(false);
      }
    }, 50);
  };

  const handleFileUpload = async (file: File) => {
    if (!currentUser) {
      openAuthModal('Devi essere registrato per utilizzare il Key & BPM Finder e salvare lo storico delle tue analisi su Il Mio Account.');
      return;
    }
    try {
      const ctx = getAudioContext();
      stopPlayback();
      setAudioFile(file);
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      processAudioBuffer(decoded, file.name, sizeMb);
    } catch (err) {
      console.error('Decode failed:', err);
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      e.target.value = '';
      openAuthModal('Devi essere registrato per utilizzare il Key & BPM Finder di 171 Studio.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Synthetic Demo Audio Generators
  const loadDemoTrack = (demoType: 'trap' | 'house' | 'lofi') => {
    if (!currentUser) {
      openAuthModal('Registrati o accedi al tuo account per utilizzare il Key & BPM Finder e salvare il conteggio utilizzi.');
      return;
    }
    const ctx = getAudioContext();
    stopPlayback();
    setIsAnalyzing(true);
    setAnalysisProgress(20);

    const sampleRate = ctx.sampleRate;
    const durationSec = 16; // 16 seconds loop
    const buffer = ctx.createBuffer(2, sampleRate * durationSec, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    let targetBpm = 140;
    let trackName = 'Trap Beat 808 - 140 BPM (Do Minore)';
    let rootFreq = 130.81; // C3

    if (demoType === 'house') {
      targetBpm = 126;
      trackName = 'House Groove Club - 126 BPM (La Minore)';
      rootFreq = 220.0; // A3
    } else if (demoType === 'lofi') {
      targetBpm = 85;
      trackName = 'Lo-Fi Chill Melody - 85 BPM (Fa Maggiore)';
      rootFreq = 174.61; // F3
    }

    const beatInterval = 60 / targetBpm;
    const totalSamples = buffer.length;

    // Synthesize kick transients at exact tempo intervals
    for (let t = 0; t < durationSec; t += beatInterval) {
      const kickStart = Math.floor(t * sampleRate);
      const kickLen = Math.floor(0.18 * sampleRate);
      for (let i = 0; i < kickLen && kickStart + i < totalSamples; i++) {
        const progress = i / kickLen;
        const freq = 120 * Math.exp(-progress * 18) + 45;
        const amp = (1 - progress) * 0.7;
        const wave = Math.sin(2 * Math.PI * freq * (i / sampleRate)) * amp;
        left[kickStart + i] += wave;
        right[kickStart + i] += wave;
      }
    }

    // Synthesize harmonic chords matching the key
    const chordFrequencies = demoType === 'lofi'
      ? [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 1.875] // Major 7th
      : [rootFreq, rootFreq * 1.189, rootFreq * 1.498, rootFreq * 1.78]; // Minor 7th

    for (let i = 0; i < totalSamples; i++) {
      const timeSec = i / sampleRate;
      let chordSample = 0;
      for (const f of chordFrequencies) {
        chordSample += Math.sin(2 * Math.PI * f * timeSec) * 0.08;
        chordSample += Math.sin(2 * Math.PI * (f * 2) * timeSec) * 0.03;
      }
      left[i] += chordSample;
      right[i] += chordSample;
    }

    processAudioBuffer(buffer, trackName, 'Generato DSP 171');
  };

  // Waveform drawing
  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a0a');
    bgGrad.addColorStop(1, '#141414');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Waveform line gradient
    const waveGrad = ctx.createLinearGradient(0, 0, 0, height);
    waveGrad.addColorStop(0, '#f59e0b');
    waveGrad.addColorStop(0.5, '#fbbf24');
    waveGrad.addColorStop(1, '#d97706');

    ctx.fillStyle = waveGrad;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = Math.max(0, (1 + min) * amp);
      const y2 = Math.min(height, (1 + max) * amp);
      ctx.fillRect(i, y1, 1, Math.max(1, y2 - y1));
    }
  };

  // Playback handling
  const togglePlay = () => {
    if (!audioBufferRef.current) return;
    const ctx = getAudioContext();

    if (isPlaying) {
      stopPlayback();
    } else {
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(ctx.destination);

      const offset = pauseOffsetRef.current % audioBufferRef.current.duration;
      source.start(0, offset);
      startTimeRef.current = ctx.currentTime - offset;
      sourceNodeRef.current = source;
      setIsPlaying(true);

      source.onended = () => {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
      };
    }
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current && isPlaying) {
      pauseOffsetRef.current = audioContextRef.current.currentTime - startTimeRef.current;
    }
    setIsPlaying(false);
  };

  const handleRestart = () => {
    stopPlayback();
    pauseOffsetRef.current = 0;
    setCurrentTime(0);
    setTimeout(() => togglePlay(), 50);
  };

  // Track playback time
  useEffect(() => {
    let animId: number;
    const updateProgress = () => {
      if (isPlaying && audioContextRef.current && audioBufferRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(elapsed, audioBufferRef.current.duration));
        animId = requestAnimationFrame(updateProgress);
      }
    };
    if (isPlaying) {
      animId = requestAnimationFrame(updateProgress);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Metronome Sound & Pulse
  useEffect(() => {
    if (isMetronomeActive && isPlaying && analysisResult) {
      const ctx = getAudioContext();
      const intervalMs = (60 / analysisResult.bpmResult.bpm) * 1000;

      const playClick = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      };

      metronomeIntervalRef.current = window.setInterval(playClick, intervalMs);
    } else {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    }
    return () => {
      if (metronomeIntervalRef.current) clearInterval(metronomeIntervalRef.current);
    };
  }, [isMetronomeActive, isPlaying, analysisResult]);

  // Tap tempo handler
  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now];
    setTapTimes(newTaps);
    const measuredBpm = calculateTapTempo(newTaps);
    if (measuredBpm) setTapBpm(measuredBpm);
  };

  const copyAnalysisToClipboard = () => {
    if (!analysisResult) return;
    const text = `171 STUDIO - ANALISI AUDIO
Brano: ${fileName}
BPM Rilevato: ${analysisResult.bpmResult.bpm} BPM (Half: ${analysisResult.bpmResult.halfBpm} / Double: ${analysisResult.bpmResult.doubleBpm})
Tonalità: ${analysisResult.keyResult.nameIt} (${analysisResult.keyResult.nameEn})
Notazione Camelot: ${analysisResult.keyResult.camelot}
Relativa: ${analysisResult.keyResult.relativeKey}
Affidabilità Algoritmo: ${analysisResult.keyResult.confidence}%
Durata: ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')} min
Frequenza Campionamento: ${analysisResult.sampleRate} Hz`;

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const copyAutoTuneKey = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.keyResult.nameEn);
    setCopiedAutoTuneNotice(true);
    setTimeout(() => setCopiedAutoTuneNotice(false), 2500);
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    const text = `=========================================
171 STUDIO - REPORT ANALISI BPM & KEY
=========================================
Traccia: ${fileName}
Formato: ${analysisResult.fileFormat} • ${fileSize}
Durata: ${duration.toFixed(2)}s
Sample Rate: ${analysisResult.sampleRate} Hz • Canali: ${analysisResult.channels}

BPM PRINCIPALE: ${analysisResult.bpmResult.bpm} BPM
BPM Dimezzato (Half-Time): ${analysisResult.bpmResult.halfBpm} BPM
BPM Raddoppiato (Double-Time): ${analysisResult.bpmResult.doubleBpm} BPM
Affidabilità Rilevamento BPM: ${analysisResult.bpmResult.confidence}%

TONALITÀ RILEVATA: ${analysisResult.keyResult.nameIt} (${analysisResult.keyResult.nameEn})
NOTAZIONE CAMELOT: ${analysisResult.keyResult.camelot}
TONALITÀ RELATIVA: ${analysisResult.keyResult.relativeKey}
CONFIDENCE KEY: ${analysisResult.keyResult.confidence}%

DISTRIBUZIONE PITCH CLASS (12 SEMITONI):
${PITCH_CLASSES.map((p, idx) => `${p} (${PITCH_NAMES_IT[p]}): ${(analysisResult.keyResult.chromagram[idx] * 100).toFixed(1)}%`).join('\n')}

Generato da 171 Studio DSP Tools (Messina)
Prenotazioni & Mix: https://171studio.it
=========================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `171Studio_Analysis_${fileName.replace(/\.[^/.]+$/, '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative z-10 min-h-screen pt-28 pb-20 px-4 sm:px-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>171 STUDIO • DSP AUDIO LAB ONLINE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
          BPM & Key Finder <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">Professionale</span>
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans leading-relaxed">
          Analisi acustica precisa e affidabile per beat, campioni vocali e brani completi in formato <strong className="text-white">MP3, WAV, AIFF e FLAC</strong>. Calcolo automatico di tempo, tonalità musicale e notazione Camelot per DJ e produttori.
        </p>
      </div>

      {/* Registration / Account Usage Status Bar */}
      {!currentUser ? (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-amber-950/30 border border-amber-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                ACCESSO RICHIESTO PER GLI STRUMENTI DSP
              </span>
              <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                Registrati o Accedi per utilizzare il Key & BPM Finder
              </h3>
              <p className="text-xs text-neutral-300 font-mono">
                La registrazione è immediata e gratuita: salva tutte le tue analisi di tonalità e BPM nella sezione "Il Mio Account".
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('Registrati o accedi gratuitamente per sbloccare il Key & BPM Finder e salvare lo storico nel tuo account.')}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 shrink-0 cursor-pointer"
          >
            Accedi / Registrati Ora
          </button>
        </div>
      ) : (
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-emerald-950/25 border border-emerald-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-white">
                  Account Attivo: {currentUser.name} ({currentUser.email})
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  Utilizzi Key & BPM Finder: {userKeyBpmRecords.length}
                </span>
              </div>
              <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                Ogni brano analizzato viene salvato automaticamente nel tuo storico su "Il Mio Account".
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('il-mio-account')}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <History className="w-3.5 h-3.5" />
            <span>Vedi Storico nel Mio Account ({userKeyBpmRecords.length})</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Column: Upload & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* File Upload Dropzone */}
          <div
            onClick={() => {
              if (!currentUser) {
                openAuthModal('Devi essere registrato per caricare e analizzare brani con il Key & BPM Finder.');
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!currentUser) {
                openAuthModal('Devi essere registrato per analizzare brani con il Key & BPM Finder.');
                return;
              }
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`relative p-8 rounded-3xl border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center min-h-[220px] backdrop-blur-xl cursor-pointer ${
              isDragging 
                ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
                : 'border-neutral-800 hover:border-amber-500/50 bg-neutral-900/60'
            }`}
          >
            {currentUser && (
              <input
                type="file"
                accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.m4a"
                onChange={handleFileChange}
                id="audio-upload-input"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            )}
            
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black mb-4 shadow-xl shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <h3 className="text-base sm:text-lg font-heading font-bold text-white mb-1">
              Trascina qui il tuo file MP3 o WAV
            </h3>
            <p className="text-xs text-neutral-400 font-mono mb-4">
              oppure clicca per esplorare dal tuo dispositivo (nessun limite di durata, elaborazione locale sicura)
            </p>

            <span className="px-3 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400">
              Formati supportati: MP3, WAV, AIFF, FLAC, M4A
            </span>
          </div>

          {/* Quick Demo Track Buttons */}
          <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
            <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Non hai un file a portata di mano? Prova con un campione demo DSP:</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => loadDemoTrack('trap')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-xs font-mono text-neutral-200 hover:text-white transition-all text-left flex flex-col cursor-pointer"
              >
                <span className="font-bold text-amber-400">Trap 808 Beat</span>
                <span className="text-[10px] text-neutral-400">140 BPM • Do Minore</span>
              </button>

              <button
                type="button"
                onClick={() => loadDemoTrack('house')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-xs font-mono text-neutral-200 hover:text-white transition-all text-left flex flex-col cursor-pointer"
              >
                <span className="font-bold text-emerald-400">House Club Groove</span>
                <span className="text-[10px] text-neutral-400">126 BPM • La Minore</span>
              </button>

              <button
                type="button"
                onClick={() => loadDemoTrack('lofi')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-xs font-mono text-neutral-200 hover:text-white transition-all text-left flex flex-col cursor-pointer"
              >
                <span className="font-bold text-blue-400">Lo-Fi Acoustic Chill</span>
                <span className="text-[10px] text-neutral-400">85 BPM • Fa Maggiore</span>
              </button>
            </div>
          </div>

          {/* Interactive Waveform & Player */}
          {analysisResult && (
            <div className="p-6 rounded-3xl bg-neutral-900/70 border border-neutral-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc className={`w-5 h-5 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} />
                  <div>
                    <h4 className="text-sm font-heading font-bold text-white truncate max-w-[280px] sm:max-w-md">
                      {fileName}
                    </h4>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {fileSize} • {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')} • {analysisResult.sampleRate} Hz
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                      isMetronomeActive
                        ? 'bg-amber-500 text-black font-bold border-amber-400'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                    title="Attiva/Disattiva click metronomo in sincono con il BPM rilevato"
                  >
                    <Activity className="w-3 h-3" />
                    <span>Metronomo {isMetronomeActive ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Waveform Canvas */}
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 h-28">
                <canvas 
                  ref={canvasRef} 
                  width={700} 
                  height={112} 
                  className="w-full h-full block" 
                />
                {/* Playhead Scrubber */}
                {duration > 0 && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                )}
              </div>

              {/* Player Controls Bar */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center transition-transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-10 h-10 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
                    title="Ricomincia dall'inizio"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-mono text-neutral-300">
                    <span className="text-white font-bold">
                      {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-neutral-500"> / </span>
                    <span className="text-neutral-400">
                      {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyAnalysisToClipboard}
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-xs font-mono text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedNotice ? 'Copiato!' : 'Copia Dati'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyAutoTuneKey}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copia la tonalità in notazione per Auto-Tune / Pitch Correction"
                  >
                    {copiedAutoTuneNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copiedAutoTuneNotice ? 'Copiato per Pitch!' : `Auto-Tune (${analysisResult.keyResult.nameEn})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadReport}
                    className="px-3 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-xs font-mono text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Scarica Report</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading / DSP Progress Indicator */}
          {isAnalyzing && (
            <div className="p-6 rounded-3xl bg-neutral-900/80 border border-amber-500/40 text-center space-y-3 animate-pulse">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Analisi DSP in corso (Spettrogramma, Onset & Chromagram)...</span>
              </div>
              <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-800">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-[11px] font-mono text-neutral-400">
                Estrazione dei picchi ritmici e correlazione con i profili tonali Krumhansl-Schmuckler...
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Key & BPM Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {analysisResult ? (
            <>
              {/* BPM Card */}
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-amber-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    <span>TEMPO / BPM RILEVATO</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    Affidabilità {analysisResult.bpmResult.confidence}%
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-6xl sm:text-7xl font-heading font-black text-white tracking-tight drop-shadow-md">
                    {analysisResult.bpmResult.bpm}
                  </span>
                  <span className="text-xl font-heading font-bold text-amber-400">
                    BPM
                  </span>
                </div>

                {/* Half & Double Tempo options */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-800 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block uppercase">Half-Time (÷2)</span>
                    <span className="text-lg font-bold text-white">{analysisResult.bpmResult.halfBpm} BPM</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80">
                    <span className="text-neutral-500 text-[10px] block uppercase">Double-Time (×2)</span>
                    <span className="text-lg font-bold text-white">{analysisResult.bpmResult.doubleBpm} BPM</span>
                  </div>
                </div>
              </div>

              {/* Musical Key Card */}
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-amber-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-1.5">
                    <Music className="w-4 h-4" />
                    <span>TONALITÀ MUSICALE</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    Accuratezza {analysisResult.keyResult.confidence}%
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 my-2">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-heading font-black text-white">
                      {analysisResult.keyResult.nameIt}
                    </h3>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">
                      {analysisResult.keyResult.nameEn}
                    </p>
                  </div>

                  {/* Camelot Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center text-black font-heading font-black shadow-lg shadow-amber-500/20 shrink-0">
                    <span className="text-xl leading-none">{analysisResult.keyResult.camelot}</span>
                    <span className="text-[9px] tracking-wider uppercase opacity-80 mt-0.5 font-mono">CAMELOT</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs font-mono mt-4 flex items-center justify-between">
                  <span className="text-neutral-400">Tonalità Relativa Compatibile:</span>
                  <span className="text-amber-400 font-bold">{analysisResult.keyResult.relativeKey}</span>
                </div>

                {/* 12-Tone Chromagram Visualizer */}
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <span className="text-[10px] font-mono uppercase text-neutral-400 block mb-2">
                    Profilo Armonico Pitch Class (12 Semitoni):
                  </span>
                  <div className="grid grid-cols-12 gap-1 items-end h-16 bg-neutral-950 p-2 rounded-xl border border-neutral-800/80">
                    {analysisResult.keyResult.chromagram.map((val, idx) => {
                      const isRoot = PITCH_CLASSES[idx] === analysisResult.keyResult.root;
                      return (
                        <div key={PITCH_CLASSES[idx]} className="flex flex-col items-center h-full justify-end group">
                          <div 
                            className={`w-full rounded-t transition-all ${
                              isRoot ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-neutral-700 hover:bg-neutral-500'
                            }`}
                            style={{ height: `${Math.max(10, Math.round(val * 100))}%` }}
                            title={`${PITCH_CLASSES[idx]}: ${Math.round(val * 100)}%`}
                          />
                          <span className={`text-[8px] font-mono mt-1 ${isRoot ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                            {PITCH_CLASSES[idx]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Standby Card */
            <div className="p-8 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Music className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-heading font-bold text-white">
                In Attesa di un File Audio
              </h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Carica un brano o clicca su uno dei bottoni demo a sinistra per avviare l'analisi istantanea di tempo (BPM) e tonalità armonica.
              </p>
            </div>
          )}

          {/* Manual Tap Tempo Tool */}
          <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-neutral-300 font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>TAP TEMPO MANUALE</span>
              </span>
              {tapBpm && (
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {tapBpm} BPM Rilevato
                </span>
              )}
            </div>
            
            <p className="text-[11px] text-neutral-400 font-mono">
              Clicca a tempo sul pulsante per calcolare manualmente il BPM in qualsiasi momento:
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTap}
                className="flex-1 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-850 active:scale-98 border border-neutral-700 hover:border-amber-400 text-white font-mono text-xs font-bold uppercase transition-all shadow-md cursor-pointer"
              >
                Tocca qui a tempo (TAP)
              </button>

              {tapTimes.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setTapTimes([]); setTapBpm(null); }}
                  className="px-3 py-3 rounded-xl bg-neutral-950 text-neutral-500 hover:text-white border border-neutral-800 text-xs font-mono"
                  title="Resetta tap tempo"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Studio Production Call to Action */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-amber-500/40 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
            171 STUDIO RECORDING & MIXING
          </span>
          <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
            Vuoi registrare voci o mixare questo brano in studio?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl font-sans">
            Porta il tuo progetto a 171 Studio a Messina: acustica calibrata, registrazione fianco a fianco e catena analogica di alto livello.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('prenota-sessione')}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs tracking-wider uppercase transition-all duration-300 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
        >
          <span>Prenota Sessione in Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
