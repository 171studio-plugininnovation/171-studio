export type ServiceType =
  | 'recording_hourly'
  | 'mix_master'
  | 'solo_master'
  | 'solo_mix_online'
  | 'brano_completo_non_esclusivo'
  | 'brano_completo_esclusivo'
  | 'produzione_non_esclusiva'
  | 'produzione_esclusiva';

export interface ServiceOption {
  id: ServiceType;
  title: string;
  category: 'Recording' | 'Mix & Master' | 'Pacchetti Brano' | 'Produzione';
  basePrice: number;
  priceNote: string;
  description: string;
  includesHours?: number;
  allowsExtraHours?: boolean;
}

export const HOURLY_STUDIO_RATE = 25; // 25€ all'ora

export const SERVICE_OPTIONS: ServiceOption[] = [
  {
    id: 'recording_hourly',
    title: 'Sessione di Registrazione (Tariffa Oraria)',
    category: 'Recording',
    basePrice: 25,
    priceNote: '25€ / ora',
    description: 'Registrazione vocale o strumentale in ambiente trattato con feedback diretto dall\'ingegnere del suono.',
    allowsExtraHours: true,
  },
  {
    id: 'mix_master',
    title: 'Mix & Master in Studio',
    category: 'Mix & Master',
    basePrice: 50,
    priceNote: '50€ + 25€/ora di studio',
    description: 'Missaggio professionale e mastering con processing analogico e digitale in studio assieme a te.',
    allowsExtraHours: true,
  },
  {
    id: 'solo_master',
    title: 'Solo Master',
    category: 'Mix & Master',
    basePrice: 40,
    priceNote: '40€ a brano',
    description: 'Finalizzazione professionale, bilanciamento dinamico e loudness ottimizzato per streaming e radio.',
    allowsExtraHours: false,
  },
  {
    id: 'solo_mix_online',
    title: 'Solo Mix Online',
    category: 'Mix & Master',
    basePrice: 60,
    priceNote: '60€ a brano',
    description: 'Missaggio completo in the box con stems inviati online e revisioni concordate a distanza.',
    allowsExtraHours: false,
  },
  {
    id: 'brano_completo_non_esclusivo',
    title: 'Brano Completo (Base Non Esclusiva)',
    category: 'Pacchetti Brano',
    basePrice: 150,
    priceNote: '150€ (Include 3h di REC)',
    description: 'Pacchetto all-inclusive: base musicale non esclusiva, 3 ore di registrazione in studio, Mix & Master inclusi.',
    includesHours: 3,
    allowsExtraHours: true,
  },
  {
    id: 'brano_completo_esclusivo',
    title: 'Brano Completo (Base Esclusiva)',
    category: 'Pacchetti Brano',
    basePrice: 200,
    priceNote: '200€ (Include 3h di REC)',
    description: 'Pacchetto all-inclusive top tier: base in esclusiva totale al 100%, 3 ore di REC, Mix & Master definitivi.',
    includesHours: 3,
    allowsExtraHours: true,
  },
  {
    id: 'produzione_non_esclusiva',
    title: 'Produzione Beat / Base (Diritti senza Esclusiva)',
    category: 'Produzione',
    basePrice: 50,
    priceNote: '50€',
    description: 'Creazione e licenza di produzione musicale con diritti di pubblicazione ma senza esclusiva.',
    allowsExtraHours: false,
  },
  {
    id: 'produzione_esclusiva',
    title: 'Produzione Beat / Base (Esclusiva Totale)',
    category: 'Produzione',
    basePrice: 150,
    priceNote: '150€',
    description: 'Produzione su misura creata ad hoc per l\'artista con cessione dei diritti in esclusiva assoluta.',
    allowsExtraHours: false,
  },
];

export function formatDurationLabel(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) {
    return wholeHours === 1 ? '1 ora' : `${wholeHours} ore`;
  }
  if (wholeHours === 0) {
    return `${minutes} min`;
  }
  return `${wholeHours}h ${minutes}m`;
}

export function calculateEndTime(startTime: string, durationHours: number): string {
  if (!startTime || !startTime.includes(':')) return '';
  const [hStr, mStr] = startTime.split(':');
  const startTotalMinutes = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0);
  const durationMinutes = Math.round(durationHours * 60);
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  
  const endH = Math.floor(endTotalMinutes / 60);
  const endM = endTotalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export interface DynamicPricingConfig {
  hourlyRecordingPrice?: number;
  mixMasterPrice?: number;
  soloMasterPrice?: number;
  soloMixOnlinePrice?: number;
  branoCompletoNonEsclusivoPrice?: number;
  branoCompletoEsclusivoPrice?: number;
  produzioneNonEsclusivaPrice?: number;
  produzioneEsclusivaPrice?: number;
  beatProductionPrice?: number;
}

export function getDynamicServiceOptions(pricing?: DynamicPricingConfig): ServiceOption[] {
  const hourlyRate = pricing?.hourlyRecordingPrice ?? 25;
  const mixMasterBase = pricing?.mixMasterPrice ?? 50;
  const soloMaster = pricing?.soloMasterPrice ?? 40;
  const soloMixOnline = pricing?.soloMixOnlinePrice ?? 60;
  const branoNonEsclusivo = pricing?.branoCompletoNonEsclusivoPrice ?? 150;
  const branoEsclusivo = pricing?.branoCompletoEsclusivoPrice ?? 200;
  const prodNonEsclusiva = pricing?.produzioneNonEsclusivaPrice ?? 50;
  const prodEsclusiva = pricing?.produzioneEsclusivaPrice ?? pricing?.beatProductionPrice ?? 150;

  return SERVICE_OPTIONS.map((opt) => {
    switch (opt.id) {
      case 'recording_hourly':
        return {
          ...opt,
          basePrice: hourlyRate,
          priceNote: `${hourlyRate}€ / ora`,
        };
      case 'mix_master':
        return {
          ...opt,
          basePrice: mixMasterBase,
          priceNote: `${mixMasterBase}€ + ${hourlyRate}€/ora di studio`,
        };
      case 'solo_master':
        return {
          ...opt,
          basePrice: soloMaster,
          priceNote: `${soloMaster}€ a brano`,
        };
      case 'solo_mix_online':
        return {
          ...opt,
          basePrice: soloMixOnline,
          priceNote: `${soloMixOnline}€ a brano`,
        };
      case 'brano_completo_non_esclusivo':
        return {
          ...opt,
          basePrice: branoNonEsclusivo,
          priceNote: `${branoNonEsclusivo}€ (Include 3h di REC)`,
        };
      case 'brano_completo_esclusivo':
        return {
          ...opt,
          basePrice: branoEsclusivo,
          priceNote: `${branoEsclusivo}€ (Include 3h di REC)`,
        };
      case 'produzione_non_esclusiva':
        return {
          ...opt,
          basePrice: prodNonEsclusiva,
          priceNote: `${prodNonEsclusiva}€`,
        };
      case 'produzione_esclusiva':
        return {
          ...opt,
          basePrice: prodEsclusiva,
          priceNote: `${prodEsclusiva}€`,
        };
      default:
        return opt;
    }
  });
}

export function calculateEstimatedPrice(
  serviceId: ServiceType,
  hours: number = 1,
  pricing?: DynamicPricingConfig
): { base: number; extraHoursCost: number; total: number; explanation: string } {
  const dynamicOptions = getDynamicServiceOptions(pricing);
  const service = dynamicOptions.find((s) => s.id === serviceId) || dynamicOptions[0];
  const hourlyRate = pricing?.hourlyRecordingPrice ?? HOURLY_STUDIO_RATE;
  const safeHours = Math.max(1, hours);

  switch (service.id) {
    case 'recording_hourly': {
      const total = Number((safeHours * hourlyRate).toFixed(2));
      return {
        base: total,
        extraHoursCost: 0,
        total,
        explanation: `${formatDurationLabel(safeHours)} di registrazione × ${hourlyRate}€/h`,
      };
    }
    case 'mix_master': {
      const extraHoursCost = Number((safeHours * hourlyRate).toFixed(2));
      const total = service.basePrice + extraHoursCost;
      return {
        base: service.basePrice,
        extraHoursCost,
        total,
        explanation: `${service.basePrice}€ base Mix&Master + ${formatDurationLabel(safeHours)} di studio (${extraHoursCost}€)`,
      };
    }
    case 'brano_completo_non_esclusivo': {
      const included = 3;
      const additionalHours = Math.max(0, safeHours - included);
      const extraHoursCost = Number((additionalHours * hourlyRate).toFixed(2));
      const total = service.basePrice + extraHoursCost;
      return {
        base: service.basePrice,
        extraHoursCost,
        total,
        explanation:
          additionalHours > 0
            ? `${service.basePrice}€ (include 3h REC) + ${formatDurationLabel(additionalHours)} extra (${extraHoursCost}€)`
            : `${service.basePrice}€ fisso (3h di registrazione incluse nel pacchetto)`,
      };
    }
    case 'brano_completo_esclusivo': {
      const included = 3;
      const additionalHours = Math.max(0, safeHours - included);
      const extraHoursCost = Number((additionalHours * hourlyRate).toFixed(2));
      const total = service.basePrice + extraHoursCost;
      return {
        base: service.basePrice,
        extraHoursCost,
        total,
        explanation:
          additionalHours > 0
            ? `${service.basePrice}€ (include 3h REC) + ${formatDurationLabel(additionalHours)} extra (${extraHoursCost}€)`
            : `${service.basePrice}€ fisso con base esclusiva (3h di registrazione incluse)`,
      };
    }
    case 'solo_master':
      return {
        base: service.basePrice,
        extraHoursCost: 0,
        total: service.basePrice,
        explanation: `${service.basePrice}€ prezzo fisso a traccia`,
      };
    case 'solo_mix_online':
      return {
        base: service.basePrice,
        extraHoursCost: 0,
        total: service.basePrice,
        explanation: `${service.basePrice}€ prezzo fisso missaggio online`,
      };
    case 'produzione_non_esclusiva':
      return {
        base: service.basePrice,
        extraHoursCost: 0,
        total: service.basePrice,
        explanation: `${service.basePrice}€ con diritti ma senza esclusiva`,
      };
    case 'produzione_esclusiva':
      return {
        base: service.basePrice,
        extraHoursCost: 0,
        total: service.basePrice,
        explanation: `${service.basePrice}€ in esclusiva totale con diritti esclusivi`,
      };
    default:
      return {
        base: hourlyRate,
        extraHoursCost: 0,
        total: hourlyRate,
        explanation: 'Tariffa base studio',
      };
  }
}
