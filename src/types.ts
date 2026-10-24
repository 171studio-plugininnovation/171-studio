export type PageId = 'home' | 'the-god-cypher' | 'chi-siamo' | 'prenota-sessione' | 'plugin-innovation' | 'strumenti-online' | 'il-mio-account';

export interface PageDefinition {
  id: PageId;
  title: string;
  navLabel: string;
  subtitle: string;
  description: string;
  badge: string;
}

export const PAGES: Record<PageId, PageDefinition> = {
  home: {
    id: 'home',
    title: '171 STUDIO',
    navLabel: 'Home',
    subtitle: 'Studio di Registrazione',
    description: 'Eccellenza audio, registrazione professionale e innovazione sonora.',
    badge: 'STUDIO MASTERING & RECORDING',
  },
  'the-god-cypher': {
    id: 'the-god-cypher',
    title: 'The God Cypher',
    navLabel: 'The God Cypher',
    subtitle: 'L\'Album Ufficiale di 171 Studio',
    description: 'Il disco ufficiale prodotto da 171 Studio Messina. 14 tracce, tutti i link streaming, CD Deluxe Pack e download digitale.',
    badge: 'OFFICIAL ALBUM 171',
  },
  'chi-siamo': {
    id: 'chi-siamo',
    title: 'Chi Siamo',
    navLabel: 'Chi Siamo',
    subtitle: 'La Nostra Storia & Visione Sonora',
    description: 'Spazio dedicato alla presentazione del team, dell\'acustica e della filosofia di 171 Studio.',
    badge: 'IL TEAM & LO SPAZIO',
  },
  'prenota-sessione': {
    id: 'prenota-sessione',
    title: 'Prenota Sessione',
    navLabel: 'Prenota Sessione',
    subtitle: 'Registrazione, Mix & Mastering',
    description: 'Modulo e calendario per la prenotazione delle sessioni in studio.',
    badge: 'BOOKING & CALENDARIO',
  },
  'plugin-innovation': {
    id: 'plugin-innovation',
    title: '171 Plugin Innovation',
    navLabel: '171 Plugin Innovation',
    subtitle: 'I Nostri Plugin Audio di Nuova Generazione',
    description: 'Strumenti DSP e plugin innovativi sviluppati da 171 Studio per produttori e sound designer.',
    badge: 'AUDIO DSP & TOOLS',
  },
  'strumenti-online': {
    id: 'strumenti-online',
    title: 'Strumenti Online',
    navLabel: 'Strumenti Online',
    subtitle: 'BPM & Key Finder Professionale',
    description: 'Analizzatore audio di precisione per file MP3 e WAV: calcolo BPM, tonalità musicale, notazione Camelot e waveform interattiva.',
    badge: 'DSP & AUDIO UTILITIES',
  },
  'il-mio-account': {
    id: 'il-mio-account',
    title: 'Il Mio Account',
    navLabel: 'Il Mio Account',
    subtitle: 'Area Riservata Artista & Storico Sessioni',
    description: 'Gestisci le tue prenotazioni (cancellazione fino a 24h prima), consulta lo storico sessioni, i tuoi file audio, i plugin scaricati e le analisi Key & BPM Finder.',
    badge: 'PORTALE CLIENTI 171 STUDIO',
  },
};
