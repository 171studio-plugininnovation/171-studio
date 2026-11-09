import React, { useState } from 'react';
import { 
  Mic2, Radio, Volume2, Headphones, Zap, Sliders, 
  Check, Sparkles, ArrowRight, ShieldCheck, Cpu, 
  Layers, Info, ChevronRight, Activity, Disc
} from 'lucide-react';
import { PageId } from '../types';
import { HardwareTiltCard } from './HardwareTiltCard';

export type GearCategory = 'all' | 'mics' | 'interface' | 'monitors' | 'headphones' | 'power';

export interface StudioGearItem {
  id: string;
  name: string;
  brand: string;
  category: 'mics' | 'interface' | 'monitors' | 'headphones' | 'power';
  categoryLabel: string;
  badge: string;
  role: string;
  isStandardInSession?: boolean;
  isOnRequest?: boolean;
  highlightSpecs: string[];
  description: string;
  vocalProfile: string;
  bestFor: string[];
  chassisColor: 'amber' | 'emerald' | 'blue' | 'purple' | 'red';
}

export const STUDIO_GEAR_INVENTORY: StudioGearItem[] = [
  // 1. RØDE NT1-A Signature Edition (Microfono Standard)
  {
    id: 'gear-rode-nt1a',
    name: 'NT1-A Signature Edition',
    brand: 'RØDE Microphones',
    category: 'mics',
    categoryLabel: 'MICROFONO DA RIPRESA VOCALE',
    badge: 'STANDARD DI SALA • INCLUSO A 0€',
    role: 'Ripresa Vocale Lead & Doppie • Trasparenza Moderna',
    isStandardInSession: true,
    highlightSpecs: ['Capsula HF6 1" Dorata', '4.5 dBA Rumore Proprio (Record Mondiale)', 'Cardioide Puro', 'SPL Max 137 dB'],
    description: 'Il microfono ufficiale sempre pronto e calibrato sull\'asta di ripresa a 171 Studio. Con un rumore di fondo impercettibile di soli 4.5 dBA, cattura ogni micro-dettaglio, respiro e armonica vocale senza soffio o asprezza digitale.',
    vocalProfile: 'Suono moderno, aperto, nitido e radio-ready. Ideale per far galleggiare la voce sopra beat carichi di 808 e sintetizzatori.',
    bestFor: ['Voci Rap & Trap Moderne', 'Vocal Pop & R&B', 'Doppie & Backing Vocals', 'Chitarre Acustiche'],
    chassisColor: 'emerald',
  },
  // 2. Warm Audio WA-47jr (Microfono su Richiesta)
  {
    id: 'gear-warm-wa47jr',
    name: 'WA-47jr (Neumann U47 Style)',
    brand: 'Warm Audio',
    category: 'mics',
    categoryLabel: 'MICROFONO FET A GRANDE DIAFRAMMA',
    badge: 'IN DOTAZIONE • DISPONIBILE SU RICHIESTA',
    role: 'Corpo Analogico Vintage & Calore Valvolare',
    isOnRequest: true,
    highlightSpecs: ['Capsula K47 Vintage Brass', 'Circuito Discreto a FET', 'Multi-Pattern (Cardioide, Omni, 8)', 'Pad -10dB & HPF 70Hz'],
    description: 'Emulazione fedele del mitico Neumann U47 a FET. La capsula in ottone custom riproduce la corposità setosa e la rotondità armonica che hanno reso immortali le grandi registrazioni della musica soul, hip-hop e rock classica.',
    vocalProfile: 'Bassi spessi, medi caldi e vellutati, alte frequenze morbidamente levigate senza sibilanti taglienti.',
    bestFor: ['Voci Baritonali & Calde', 'Old School Hip-Hop & Boom Bap', 'R&B Soul & Pop Cantautorale', 'Voci Femminili Potenti'],
    chassisColor: 'amber',
  },
  // 3. Lewitt LCT 440 PURE (Microfono su Richiesta)
  {
    id: 'gear-lewitt-440',
    name: 'LCT 440 PURE',
    brand: 'Lewitt Audio (Vienna)',
    category: 'mics',
    categoryLabel: 'CONDENSATORE DI PRECISIONE AUSTRIACA',
    badge: 'IN DOTAZIONE • DISPONIBILE SU RICHIESTA',
    role: 'Dettaglio Transiente Chirurgico & Purezza Naturale',
    isOnRequest: true,
    highlightSpecs: ['Capsula da 1" in Mylar Oro 3 Micron', 'Gamma Dinamica 133 dB(A)', 'Zero Colorazione Parassita', 'Risposta ai Transienti Fulminea'],
    description: 'Progettato e calibrato a Vienna, il 440 PURE offre un segnale immacolato senza filtri o compressioni nascoste. È la scelta perfetta per voci cristalline con intonazione rapida e articolazione fonetica complessa.',
    vocalProfile: 'Trasparenza estrema, risposta piatta e naturale, massima fedeltà timbrica senza alcuna alterazione.',
    bestFor: ['Voci Rap Veloci & Fast Flow', 'Melodic Trap & Cloud Rap', 'Doppiaggio & Voice-Over', 'Voci Femminili Brillanti'],
    chassisColor: 'blue',
  },
  // 4. Shure SM7B (Microfono su Richiesta)
  {
    id: 'gear-shure-sm7b',
    name: 'SM7B Dynamic Vocal Mic',
    brand: 'Shure',
    category: 'mics',
    categoryLabel: 'MICROFONO DINAMICO CARDIOIDE DA STUDIO',
    badge: 'IN DOTAZIONE • DISPONIBILE SU RICHIESTA',
    role: 'Ripresa Vocale Ravvicinata & Voci Aggressive',
    isOnRequest: true,
    highlightSpecs: ['Bobina Dinamica Cardioid', 'Schermatura Anti-Ronzio Elettromagnetico', 'Filtro Bass Rolloff & Presence Boost', 'Sospensione Interna ad Aria'],
    description: 'Il microfono leggendario su cui è stato registrato Thriller di Michael Jackson e innumerevoli hit rap mondiali. Respinge i rumori della stanza e tollera pressioni sonore violente, consentendo all\'artista di cantare attaccato alla capsula con la massima energia.',
    vocalProfile: 'Suono compatto, denso, asciutto e aggressivo. Elimina completamente le risonanze ambientali e regala un punch radiofonico istantaneo.',
    bestFor: ['Rap Aggressivo & Drill', 'Voci Urlate & Rock / Hardcore', 'Podcast & Spoken Word', 'Sessioni ad Alta Pressione Sonora'],
    chassisColor: 'red',
  },
  // 5. Universal Audio Apollo Twin X
  {
    id: 'gear-apollo-twin-x',
    name: 'Apollo Twin X (Thunderbolt 3)',
    brand: 'Universal Audio',
    category: 'interface',
    categoryLabel: 'INTERFACCIA AUDIO & CONVERSIONE D\'ÉLITE',
    badge: 'CUORE DEL SISTEMA • 192 kHz',
    role: 'Conversione AD/DA 127 dB & Preamp Unison Realtime DSP',
    isStandardInSession: true,
    highlightSpecs: ['Convertitori Elite-Class 24-bit/192 kHz', 'Preamplificatori Unison a Impedenza Fisica', 'Elaborazione UAD Realtime a Latenza Zero', 'Dynamic Range 127.5 dB D/A'],
    description: 'Il centro nevralgico della catena audio di 171 Studio. I convertitori di punta Apollo Twin X catturano il segnale del microfono a 192 kHz con trasparenza assoluta, consentendo all\'artista di ascoltarsi in cuffia in tempo reale con processing analogico e zero latenza percepibile.',
    vocalProfile: 'Fedeltà master-grade, rumore di fondo inudibile e calibrazione dinamica millimetrica prima dell\'elaborazione in DAW.',
    bestFor: ['Acquisizione Vocale Master', 'Tracking Live in Cuffia a Latenza Zero', 'Clocking di Riferimento', 'DSP Real-Time UAD'],
    chassisColor: 'amber',
  },
  // 6. Palmer Monicon
  {
    id: 'gear-palmer-monicon',
    name: 'Monicon Passive Controller',
    brand: 'Palmer Audio',
    category: 'interface',
    categoryLabel: 'CONTROLLER PASSIVO PER MONITORAGGIO',
    badge: 'PERCORSO PASSIVO AL 100%',
    role: 'Attenuazione del Volume Trasparente Senza Distorsione',
    isStandardInSession: true,
    highlightSpecs: ['Circuito Totalmente Passivo (Zero Alimentazione)', 'Nessun Amplificatore Operazionale sul Percorso', 'Manopola Grande in Alluminio Fresato', 'Switch Mono & Mute Istantaneo'],
    description: 'Il Palmer Monicon garantisce che il segnale dall\'Apollo Twin X ai monitor non subisca alcuna degradazione o colorazione elettronica. Il controllo passivo preserva intatti i transienti, la microdinamica e l\'immagine stereo naturale.',
    vocalProfile: 'Totale trasparenza acustica: ciò che si ascolta dalle casse è esattamente il file audio puro.',
    bestFor: ['Controllo Volume Regia di Precisione', 'Verifica Mono Compatibilità Immediata', 'Attenuazione Trasparente', 'Zero Distorsione Armonica'],
    chassisColor: 'blue',
  },
  // 7. Kali Audio LP-6 (2nd Wave)
  {
    id: 'gear-kali-lp6',
    name: 'LP-6 (Lone Pine 2nd Wave)',
    brand: 'Kali Audio',
    category: 'monitors',
    categoryLabel: 'MONITOR NEARFIELD ATTIVI BI-AMPLIFICATI',
    badge: 'ASCOLTO DI REGIA • 3D IMAGING',
    role: 'Monitoraggio Critico di Missaggio & Bassa Frequenza',
    isStandardInSession: true,
    highlightSpecs: ['Woofer da 6.5" & Tweeter 1" Soft Dome', 'Guida d\'Onda 3D Imaging Coerente', 'Risposta in Frequenza 39 Hz – 25 kHz', 'Boundary EQ Calibrato per la Stanza'],
    description: 'I monitor nearfield principali della control room di 171 Studio. La guida d\'onda 3D offre un soundstage tridimensionale profondo dove ogni strumento, riverbero e voce è perfettamente collocato nello spazio stereo con bassi precisi fino a 39 Hz.',
    vocalProfile: 'Scena stereo tridimensionale, bassi rotondi e definiti, assenza di risonanze nella porta bass-reflex.',
    bestFor: ['Missaggio Vocale & Bilanciamento Beat', 'Controllo Basse Frequenze 808 / Sub', 'Pannaggio Spaziale & Riverberi', 'Ascolto Finale di Produzione'],
    chassisColor: 'purple',
  },
  // 8. Auratone C1A / 5C Super Sound Cube
  {
    id: 'gear-auratone-5c',
    name: 'Auratone C1A / 5C Reference',
    brand: 'Auratone Sound Cubes',
    category: 'monitors',
    categoryLabel: 'REFERENCE MONITOR MIDRANGE MONO/STEREO',
    badge: 'STANDARD MONDIALE DI RIFERIMENTO',
    role: 'Il Test Definitivo per Smartphone, Radio & Club',
    isStandardInSession: true,
    highlightSpecs: ['Driver Full-Range Singolo da 4.5"', 'Zero Crossover di Fase sul Percorso', 'Focalizzazione Midrange (200 Hz – 5 kHz)', 'Cabinet Sigillato a Sospensione Pneumatica'],
    description: 'Presenti nei più grandi studi del mondo da oltre 40 anni (da Abbey Road a Quincy Jones per Thriller). I diffusori Auratone non hanno crossover e riproducono con assoluta severità il punto più critico del mix: la voce e il bilanciamento delle frequenze medie. Se suona bene su Auratone, suonerà perfetto ovunque.',
    vocalProfile: 'Severità di traduzione assoluta: evidenzia all\'istante sibilanti, mascheramenti timbrici e voci troppo basse o alte nel mix.',
    bestFor: ['Controllo Compatibilità Smartphone & Earbuds', 'Bilanciamento Livello Voce nel Mix', 'Traduzione Mono Perfetta', 'Controllo Cruciale della Gamma Media'],
    chassisColor: 'amber',
  },
  // 9. Sennheiser HD 600
  {
    id: 'gear-sennheiser-hd600',
    name: 'HD 600 Audiophile Reference',
    brand: 'Sennheiser',
    category: 'headphones',
    categoryLabel: 'CUFFIE APERTE DI RIFERIMENTO MASTERING',
    badge: 'RIFERIMENTO CRITICO MONDIALE',
    role: 'Ascolto Critico Spaziale, Timbrico & Controllo Riverberi',
    isStandardInSession: true,
    highlightSpecs: ['Design Aperto Circumaural', 'Risposta in Frequenza 12 Hz – 40.5 kHz', 'Bobine in Alluminio ad Alta Velocità', 'Timbro Ultra-Lineare Riconosciuto da Fonici'],
    description: 'La cuffia aperta considerata universalmente lo standard d\'oro per il missaggio e il mastering critico. La sua risposta timbrica priva di colorazioni e la naturalezza della scena sonora aperta permettono di scolpire con precisione microscopica ogni riverbero, coda e taglio di equalizzazione.',
    vocalProfile: 'Timbro acusticamente puro e trasparente, bassi controllati e totale assenza di artefatti o rimbombi chiusi.',
    bestFor: ['Mastering & Controllo Dettaglio EQ', 'Regolazione Micro-Riverberi e Spazio Stereo', 'Controllo Intonazione RealTune', 'Ascolto Critico per il Produttore'],
    chassisColor: 'blue',
  },
  // 10. Audio-Technica ATH-M50x & ATH-M30x
  {
    id: 'gear-ath-headphones',
    name: 'ATH-M50x & ATH-M30x',
    brand: 'Audio-Technica',
    category: 'headphones',
    categoryLabel: 'PARCO CUFFIE CHIUSE DA RECORDING & MONITORING',
    badge: 'ZERO BLEED • TRACKING VOCALE',
    role: 'Cuffie per Artisti in Registrazione & Studio Monitoring',
    isStandardInSession: true,
    highlightSpecs: ['Driver Proprietari da 45 mm (M50x) & 40 mm (M30x)', 'Isolamento Acustico Sigillato Zero-Bleed', 'Risposta Veloce sui Transienti', 'Massimo Comfort per Sessioni Lunghe'],
    description: 'La coppia di cuffie chiuse da riferimento per lo studio. L\'ATH-M30x è dedicata all\'artista durante la registrazione vocale per garantire il massimo volume in cuffia con zero rientri sonori (bleed) nel microfono. L\'ATH-M50x è la cuffia di monitoraggio da regia per verificare la resa dei bassi e la compatibilità su sistemi moderni.',
    vocalProfile: 'Bassi solidi e incisivi, chiarezza vocale immediata e isolamento ermetico dal microfono.',
    bestFor: ['Tracking Vocale in Cuffia per l\'Artista', 'Zero Bleed di Base o Metronomo nel Microfono', 'Verifica Basso / 808 in Cuffia', 'Ascolto ad Alto Volume in Registrazione'],
    chassisColor: 'purple',
  },
  // 11. Black Lion Audio PG-1 Type F
  {
    id: 'gear-black-lion-pg1',
    name: 'PG-1 Type F Power Conditioner',
    brand: 'Black Lion Audio (Chicago)',
    category: 'power',
    categoryLabel: 'CONDIZIONAMENTO ELETTRICO & PROTEZIONE RETE',
    badge: 'AUDIO-GRADE POWER REGULATION',
    role: 'Alimentazione Elettrica Purificata PG-99 & Zero Rumore di Fondo',
    isStandardInSession: true,
    highlightSpecs: ['Filtro PG-99 ad Alto Smorzamento (-99.7% Noise)', 'Protezione da Sovratensioni di Grado Studio', 'Prese Differenziate Digitali, Analogiche & Hi-Current', 'Display Voltmetro LED di Regia'],
    description: 'La qualità del suono parte dalla corrente elettrica. Il Black Lion Audio PG-1 purifica l\'alimentazione di tutta la regia di 171 Studio filtrando ronzii, disturbi elettromagnetici e sbalzi di tensione. Il risultato è un floor di rumore abbattuto, convertitori Apollo più precisi e preamplificatori più dinamici e silenziosi.',
    vocalProfile: 'Silenzio assoluto sui silenzi: zero hum a 50 Hz, zero sibili di rete, massima dinamica sfruttabile.',
    bestFor: ['Filtraggio Rumore di Rete per Apollo Twin X', 'Protezione Assoluta dell\'Equipaggiamento', 'Alimentazione Stabile 230V di Regia', 'Eliminazione Ground Loops e Ronzii'],
    chassisColor: 'emerald',
  },
];

interface GearLockerSectionProps {
  onNavigate: (page: PageId) => void;
  className?: string;
}

export const GearLockerSection: React.FC<GearLockerSectionProps> = ({ onNavigate, className = '' }) => {
  const [activeCategory, setActiveCategory] = useState<GearCategory>('all');
  const [expandedGearId, setExpandedGearId] = useState<string | null>(null);

  const filteredGear = activeCategory === 'all'
    ? STUDIO_GEAR_INVENTORY
    : STUDIO_GEAR_INVENTORY.filter(item => item.category === activeCategory);

  const categories: { id: GearCategory; label: string; count: number }[] = [
    { id: 'all', label: 'TUTTO IL SETUP', count: STUDIO_GEAR_INVENTORY.length },
    { id: 'mics', label: 'MICROFONI VOCALI', count: STUDIO_GEAR_INVENTORY.filter(g => g.category === 'mics').length },
    { id: 'interface', label: 'CONVERSIONE & PREAMP', count: STUDIO_GEAR_INVENTORY.filter(g => g.category === 'interface').length },
    { id: 'monitors', label: 'CASSE DI RIFERIMENTO', count: STUDIO_GEAR_INVENTORY.filter(g => g.category === 'monitors').length },
    { id: 'headphones', label: 'PARCO CUFFIE', count: STUDIO_GEAR_INVENTORY.filter(g => g.category === 'headphones').length },
    { id: 'power', label: 'ENERGIA & FILTRAGGIO', count: STUDIO_GEAR_INVENTORY.filter(g => g.category === 'power').length },
  ];

  return (
    <section 
      id="gear-locker"
      className={`w-full space-y-6 sm:space-y-8 ${className}`}
      aria-label="The 171 Gear Locker - Parco Macchine e Strumentazione di Studio"
    >
      {/* Header Banner: Abbey Road & Electric Lady Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10.5px] font-mono tracking-widest uppercase font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>THE 171 GEAR LOCKER • TECHNICAL RIDER</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 font-bold">
              100% HARDWARE REALE IN STUDIO A MESSINA
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight">
            Il Nostro Setup in Studio: <span className="text-amber-400">Tutto Ciò che Abbiamo</span>
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            Nessuna macchina virtuale fantasma: <strong>il setup hardware dello studio è sempre uguale per ogni sessione</strong>. Lavorerai sulla catena fissa con conversione <strong>Universal Audio Apollo Twin X a 192 kHz</strong>, controller passivo <strong>Palmer Monicon</strong>, doppio ascolto <strong>Kali Audio LP-6</strong> & cubi <strong>Auratone C1A</strong>, cuffie professionali Sennheiser/Audio-Technica e filtraggio di rete <strong>Black Lion Audio PG-1 Type F</strong>. <strong>Non cambia nulla del setup: solo i microfoni vocali cambiano su richiesta</strong>, e potrai indicare il tuo microfono ideale direttamente nel modulo di prenotazione sessione.
          </p>
        </div>

        {/* CTA to Booking */}
        <div className="shrink-0 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('prenota-sessione')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <span>Prenota la Tua Sessione</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Metropolis & Abbey Road Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-mono">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-900/80 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-black/30 text-black font-bold' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gear Grid (3D Hardware Tilt Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredGear.map((item) => {
          const isExpanded = expandedGearId === item.id;

          const colorClasses = {
            amber: {
              border: 'border-amber-500/40 hover:border-amber-500/80',
              badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
              led: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.9)]',
            },
            emerald: {
              border: 'border-emerald-500/40 hover:border-emerald-500/80',
              badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
              led: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
            },
            blue: {
              border: 'border-blue-500/40 hover:border-blue-500/80',
              badge: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
              led: 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]',
            },
            purple: {
              border: 'border-purple-500/40 hover:border-purple-500/80',
              badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
              led: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]',
            },
            red: {
              border: 'border-red-500/40 hover:border-red-500/80',
              badge: 'bg-red-500/15 text-red-300 border-red-500/40',
              led: 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.9)]',
            },
          }[item.chassisColor];

          return (
            <div
              key={item.id}
              className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-neutral-900/90 via-neutral-950/95 to-black border ${colorClasses.border} shadow-xl backdrop-blur-xl flex flex-col justify-between transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Chassis Hex Bolt Accents */}
              <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-950 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-0.5 bg-neutral-950 rotate-45" />
              </div>
              <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-neutral-800 border border-neutral-950 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-0.5 bg-neutral-950 -rotate-45" />
              </div>

              {/* Card Header */}
              <div className="space-y-3 pt-2">
                {/* Top Badges & LED Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorClasses.led} animate-pulse`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 font-bold">
                      {item.brand}
                    </span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${colorClasses.badge}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Hardware Name & Role */}
                <div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white group-hover:text-amber-400 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                    {item.role}
                  </p>
                </div>

                {/* Key Technical Specs Pills */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono text-neutral-300">
                  {item.highlightSpecs.map((spec, sIdx) => (
                    <div 
                      key={sIdx}
                      className="px-2 py-1 rounded-lg bg-black/60 border border-neutral-800/80 truncate flex items-center gap-1.5"
                      title={spec}
                    >
                      <span className="text-amber-400 font-bold shrink-0">•</span>
                      <span className="truncate">{spec}</span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-300 font-light leading-relaxed pt-1">
                  {item.description}
                </p>
              </div>

              {/* Expandable Section: Vocal Profile & Best For */}
              <div className="pt-4 border-t border-neutral-800/80 mt-4 space-y-3">
                {isExpanded && (
                  <div className="space-y-3 text-xs animate-in fade-in duration-200">
                    {/* Vocal Profile Box */}
                    <div className="p-3 rounded-2xl bg-black/80 border border-neutral-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Carattere Sonoro & Resa Vocale:</span>
                      </span>
                      <p className="text-[11px] text-neutral-200 leading-snug">
                        {item.vocalProfile}
                      </p>
                    </div>

                    {/* Best For Tags */}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block mb-1.5">
                        Consigliato In Studio Per:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.bestFor.map((bf, bfIdx) => (
                          <span 
                            key={bfIdx}
                            className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700/60 text-neutral-300"
                          >
                            ✔ {bf}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedGearId(isExpanded ? null : item.id)}
                    className="text-[11px] font-mono text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer py-1"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isExpanded ? 'Chiudi Scheda' : 'Scheda Tecnica'}</span>
                  </button>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/60 border border-neutral-800 text-neutral-300">
                    {item.category === 'mics' 
                      ? (item.isStandardInSession ? 'Standard di Sala' : 'In Dotazione') 
                      : 'Setup Fisso di Sala'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Studio Hardware Permanent Setup Banner */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-black border border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-heading font-black text-white">
              Setup Fisso di Sala • Massima Affidabilità & Continuità
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
            A 171 Studio il setup di acquisizione e ascolto è <strong>sempre identico per ogni artista</strong>: Apollo Twin X a 192 kHz, controller Palmer Monicon, casse Kali Audio LP-6, cubi Auratone C1A, cuffie Sennheiser/Audio-Technica e controllo elettrico Black Lion PG-1. <strong>Il setup non cambia: potrai selezionare il tipo di microfono vocale direttamente nel modulo di prenotazione sessione</strong> in base al tuo genere musicale.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('prenota-sessione')}
          className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <span>Prenota la Tua Sessione</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
