export interface PluginTopologyMeta {
  shortRole: string;
  topology: string;
  stageLabel: string;
  tube?: string;
  oversampling: string;
  latencyLabel: string;
  formats: string;
  signalFlow: [string, string, string, string];
}

export const PLUGIN_TOPOLOGY_MAP: Record<string, PluginTopologyMeta> = {
  'plugin-realtune': {
    shortRole: 'Pitch Correction Live & Vocal Synthesizer',
    topology: 'DUAL-HEAD WSOLA PITCH ENGINE',
    stageLabel: 'Zero Phase Disruption Core',
    tube: 'Zero Phase Disruption Core',
    oversampling: '8x Internal Processing',
    latencyLabel: '0.0 ms Live',
    formats: 'VST3 • AU • Standalone',
    signalFlow: ['PITCH TRACK (MPM+DPLL)', 'FLEX-TUNE S-CURVE', 'FORMANT & WSOLA SYNTH', 'TRUE-PEAK GUARD'],
  },
  'plugin-easyvoice': {
    shortRole: 'All-in-One Vocal Channel Strip',
    topology: 'SERIAL OPTO + FET VOCAL STRIP',
    stageLabel: '8 Analog Preamps + SSL 4000 EQ',
    tube: '12AX7 & 6BA6 Analog Valves',
    oversampling: '4x ADAA-2 Oversampling',
    latencyLabel: '0.0 ms Safe',
    formats: 'VST3 • AU • Standalone',
    signalFlow: ['PRE-OPEN EXPANDER', '8x ANALOG PREAMP', 'LA-2A OPTO ↔ 1176 FET + EQ', 'TRUE-PEAK -0.15 dBTP'],
  },
  'plugin-cleanreso': {
    shortRole: 'Soppressore Spettrale Risonanze Dinamiche',
    topology: '32-BAND PARALLEL ZDF NOTCH',
    stageLabel: 'Anti-Hollowing Neural Brain',
    tube: 'Zero Delay Biquad Matrix',
    oversampling: 'ZDF 64-bit Precision',
    latencyLabel: '4 smp PDC',
    formats: 'VST3 • AU • Standalone',
    signalFlow: ['AMDF PITCH TRACKER', '32x PARALLEL SVF', 'ANTI-HOLLOWING BRAIN', 'DELTA / SILK STAGE'],
  },
  'plugin-perfectpre': {
    shortRole: 'Preamplificatore Valvolare & Console EQ',
    topology: 'CLASS-A TUBE & NEVE 1073 EQ',
    stageLabel: '72-Ch TMT + Baxandall Air 40kHz',
    tube: 'Carnhill Transformer Saturation',
    oversampling: '4x ADAA-2 Oversampling',
    latencyLabel: '0.0 ms Safe',
    formats: 'VST3 • AU • Standalone',
    signalFlow: ['TRANSFORMER IN (4 FLAVORS)', 'TUBE / GERMANIUM STAGE', '1073 HPF + BAXANDALL AIR', 'IEC VU & OUT GAIN'],
  },
};

export const DEFAULT_TOPOLOGY_META: PluginTopologyMeta = {
  shortRole: 'Processore DSP Proprietario',
  topology: 'ANALOG MODELED DSP PROCESSOR',
  stageLabel: 'Discrete Studio Engineering',
  tube: 'Discrete Studio Engineering',
  oversampling: '64-Bit Float Precision',
  latencyLabel: '0.0 ms Safe',
  formats: 'VST3 • AU • Standalone',
  signalFlow: ['ANALOG INPUT STAGE', 'NON-LINEAR DSP CORE', 'SPECTRAL POLISHING', 'TRUE-PEAK GUARD'],
};
