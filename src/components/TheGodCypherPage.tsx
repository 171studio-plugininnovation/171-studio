import React, { useState } from 'react';
import { 
  Play, ExternalLink, Download, ShoppingBag, 
  Truck, MapPin, Check, Radio, Music, 
  ArrowLeft, Lock, Eye, Sparkles, X, ChevronRight, Award,
  ShieldCheck, CheckCircle2, Clock, Copy
} from 'lucide-react';
import { PageId } from '../types';
import { AlbumOrderRecord } from '../types/cms';
import { useStudio } from '../context/StudioContext';
import { ALBUM_MP3_DOWNLOAD_URL, ALBUM_MASTER_DOWNLOAD_URL } from '../utils/albumDownloads';
import { getAssetUrl } from '../utils/assetPath';

interface TheGodCypherPageProps {
  onNavigate: (page: PageId) => void;
}

interface TrackData {
  roman: string;
  num: number;
  title: string;
  artists: string;
  duration: string;
  spotifyQuery: string;
  appleQuery: string;
  ytQuery: string;
  amazonQuery: string;
}

const TRACKLIST: TrackData[] = [
  { roman: 'I', num: 1, title: 'Messina Shore', artists: 'Ludò, Piotre, Igor', duration: '3:38', spotifyQuery: 'Messina Shore Ludo Piotre Igor', appleQuery: 'Messina Shore Ludo Piotre Igor', ytQuery: 'Messina Shore Ludo Piotre Igor 171 Studio', amazonQuery: 'Messina Shore 171 Studio' },
  { roman: 'II', num: 2, title: 'Sudway', artists: 'Van Iena, Flusso, Skietto', duration: '3:49', spotifyQuery: 'Sudway Van Iena Flusso Skietto', appleQuery: 'Sudway Van Iena Flusso Skietto', ytQuery: 'Sudway Van Iena Flusso Skietto 171 Studio', amazonQuery: 'Sudway 171 Studio' },
  { roman: 'III', num: 3, title: 'Gta', artists: 'Adrihaine, Beltax, Resla, Leclò', duration: '3:32', spotifyQuery: 'Gta Adrihaine Beltax Resla Leclo', appleQuery: 'Gta Adrihaine Beltax Resla Leclo', ytQuery: 'Gta Adrihaine Beltax Resla Leclo 171 Studio', amazonQuery: 'Gta 171 Studio' },
  { roman: 'IV', num: 4, title: 'A Messina', artists: 'Leclò, Flusso', duration: '3:28', spotifyQuery: 'A Messina Leclo Flusso', appleQuery: 'A Messina Leclo Flusso', ytQuery: 'A Messina Leclo Flusso 171 Studio', amazonQuery: 'A Messina 171 Studio' },
  { roman: 'V', num: 5, title: 'Rockstar', artists: 'Van Iena, Allbert, Flusso', duration: '3:30', spotifyQuery: 'Rockstar Van Iena Allbert Flusso', appleQuery: 'Rockstar Van Iena Allbert Flusso', ytQuery: 'Rockstar Van Iena Allbert Flusso 171 Studio', amazonQuery: 'Rockstar 171 Studio' },
  { roman: 'VI', num: 6, title: 'Og Dreams', artists: 'Adrihaine, Yole', duration: '3:27', spotifyQuery: 'Og Dreams Adrihaine Yole', appleQuery: 'Og Dreams Adrihaine Yole', ytQuery: 'Og Dreams Adrihaine Yole 171 Studio', amazonQuery: 'Og Dreams 171 Studio' },
  { roman: 'VII', num: 7, title: 'Colombia', artists: 'Costavich, Yole, Matovato', duration: '2:54', spotifyQuery: 'Colombia Costavich Yole Matovato', appleQuery: 'Colombia Costavich Yole Matovato', ytQuery: 'Colombia Costavich Yole Matovato 171 Studio', amazonQuery: 'Colombia 171 Studio' },
  { roman: 'VIII', num: 8, title: 'Xtreme', artists: 'Igor, Piotre', duration: '3:36', spotifyQuery: 'Xtreme Igor Piotre', appleQuery: 'Xtreme Igor Piotre', ytQuery: 'Xtreme Igor Piotre 171 Studio', amazonQuery: 'Xtreme 171 Studio' },
  { roman: 'IX', num: 9, title: 'Stretto Cypher', artists: 'Igor, Allbert, 3Warrior', duration: '3:57', spotifyQuery: 'Stretto Cypher Igor Allbert 3Warrior', appleQuery: 'Stretto Cypher Igor Allbert 3Warrior', ytQuery: 'Stretto Cypher Igor Allbert 3Warrior 171 Studio', amazonQuery: 'Stretto Cypher 171 Studio' },
  { roman: 'X', num: 10, title: 'Nos', artists: '3Warrior, Piotre, Igor, Matovato', duration: '3:39', spotifyQuery: 'Nos 3Warrior Piotre Igor Matovato', appleQuery: 'Nos 3Warrior Piotre Igor Matovato', ytQuery: 'Nos 3Warrior Piotre Igor Matovato 171 Studio', amazonQuery: 'Nos 171 Studio' },
  { roman: 'XI', num: 11, title: 'Dolce & Gabbana', artists: 'Piotre, Resla', duration: '3:14', spotifyQuery: 'Dolce Gabbana Piotre Resla', appleQuery: 'Dolce Gabbana Piotre Resla', ytQuery: 'Dolce Gabbana Piotre Resla 171 Studio', amazonQuery: 'Dolce Gabbana 171 Studio' },
  { roman: 'XII', num: 12, title: 'Up n Down', artists: 'Igor, Piotre', duration: '3:36', spotifyQuery: 'Up n Down Igor Piotre', appleQuery: 'Up n Down Igor Piotre', ytQuery: 'Up n Down Igor Piotre 171 Studio', amazonQuery: 'Up n Down 171 Studio' },
  { roman: 'XIII', num: 13, title: 'Brother', artists: 'Allbert, Beltax, Ditto', duration: '3:03', spotifyQuery: 'Brother Allbert Beltax Ditto', appleQuery: 'Brother Allbert Beltax Ditto', ytQuery: 'Brother Allbert Beltax Ditto 171 Studio', amazonQuery: 'Brother 171 Studio' },
  { roman: 'XIV', num: 14, title: 'Vecchie Maniere', artists: 'Adrihaine, Piotre', duration: '3:10', spotifyQuery: 'Vecchie Maniere Adrihaine Piotre', appleQuery: 'Vecchie Maniere Adrihaine Piotre', ytQuery: 'Vecchie Maniere Adrihaine Piotre 171 Studio', amazonQuery: 'Vecchie Maniere 171 Studio' },
];

interface FamigliaCard {
  id: number;
  roman: string;
  imageNum: number;
  title: string;
  subtitle: string;
}

// 16 images from n. 18 to 33 (1400x1400 high-res official cards in exact user order)
const FAMIGLIA_MEMBERS: FamigliaCard[] = [
  { id: 1, roman: 'I', imageNum: 18, title: 'Resla', subtitle: 'Gta • Dolce & Gabbana' },
  { id: 2, roman: 'II', imageNum: 19, title: 'Piotre', subtitle: 'Messina Shore • Dolce & Gabbana • Up n Down • Vecchie Maniere • Xtreme • Nos' },
  { id: 3, roman: 'III', imageNum: 20, title: 'Adrihaine', subtitle: 'Gta • Og Dream • Vecchie Maniere' },
  { id: 4, roman: 'IV', imageNum: 21, title: 'Albert', subtitle: 'Rockstar • Stretto Cypher • Brother' },
  { id: 5, roman: 'V', imageNum: 22, title: 'Beltax', subtitle: 'Gta • Brother' },
  { id: 6, roman: 'VI', imageNum: 23, title: 'Ditt', subtitle: 'Brother' },
  { id: 7, roman: 'VII', imageNum: 24, title: 'Igor Rozanov', subtitle: 'Messina Shore • Xtreme • Nos • Up n Down • Stretto Cypher' },
  { id: 8, roman: 'VIII', imageNum: 25, title: '3 Warriors', subtitle: 'Stretto Cypher • Nos' },
  { id: 9, roman: 'IX', imageNum: 26, title: 'Matovato', subtitle: 'Colombia • Nos' },
  { id: 10, roman: 'X', imageNum: 27, title: 'Yole', subtitle: 'Og Dream • Colombia' },
  { id: 11, roman: 'XI', imageNum: 28, title: 'Costavich', subtitle: 'Colombia' },
  { id: 12, roman: 'XII', imageNum: 29, title: 'Van Iena', subtitle: 'Sudway • Rockstar' },
  { id: 13, roman: 'XIII', imageNum: 30, title: 'Flusso', subtitle: 'Sudway • A Messina • Rockstar' },
  { id: 14, roman: 'XIV', imageNum: 31, title: 'Lelò', subtitle: 'Gta • A Messina' },
  { id: 15, roman: 'XV', imageNum: 32, title: 'Skietto', subtitle: 'Sudway' },
  { id: 16, roman: 'XVI', imageNum: 33, title: 'Ludò', subtitle: 'Messina Shore' },
];

export const TheGodCypherPage: React.FC<TheGodCypherPageProps> = ({ onNavigate }) => {
  const { logActivity, siteContent, createAlbumOrder, confirmAlbumOrderPayPalPayment, currentUser } = useStudio();

  // Active cover view toggle: front | back | locandina
  const [activeCover, setActiveCover] = useState<'front' | 'back' | 'locandina'>('front');
  const [isCoverZoomOpen, setIsCoverZoomOpen] = useState(false);

  // Zoomed artist card in modal
  const [zoomedCard, setZoomedCard] = useState<FamigliaCard | null>(null);

  // Store & Order Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderTier, setOrderTier] = useState<'physical' | 'digital_master' | 'digital_mp3'>('physical');
  const [shippingMethod, setShippingMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>('');
  const [completedOrder, setCompletedOrder] = useState<AlbumOrderRecord | null>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);

  const [orderForm, setOrderForm] = useState({
    nome: '',
    cognome: '',
    email: currentUser?.email || '',
    telefono: '',
    indirizzo: '',
    citta: '',
    cap: '',
    note: '',
  });

  const triggerBrowserDownload = (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 1500);
    } catch (err) {
      console.error('Error triggering auto download:', err);
    }
  };

  const openOrderModal = (tier: 'physical' | 'digital_master' | 'digital_mp3') => {
    setOrderTier(tier);
    setIsOrderModalOpen(true);
    setOrderSuccess(false);
    setCompletedOrder(null);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.nome || !orderForm.email) return;

    const basePrice = orderTier === 'physical' ? 9.99 : (orderTier === 'digital_master' ? 4.99 : 2.99);
    const shippingFee = orderTier === 'physical' && shippingMethod === 'shipping' ? 5.00 : 0.00;
    const totalAmount = basePrice + shippingFee;

    const productTitle = orderTier === 'physical' 
      ? 'The God Cypher — CD Deluxe Pack' 
      : (orderTier === 'digital_master' ? 'The God Cypher — Master Pack Digitale' : 'The God Cypher — Essential MP3 Edition');

    const newOrder = createAlbumOrder({
      userId: currentUser?.id,
      userEmail: orderForm.email,
      userName: `${orderForm.nome} ${orderForm.cognome}`.trim(),
      userPhone: orderForm.telefono,
      orderType: orderTier === 'physical' ? 'physical' : 'digital',
      productTitle,
      basePrice,
      shippingFee,
      totalAmount,
      shippingMethod: orderTier === 'physical' ? shippingMethod : 'digital_download',
      shippingAddress: orderForm.indirizzo,
      shippingCity: orderForm.citta,
      shippingZip: orderForm.cap,
      notes: orderForm.note,
    });

    // Automatically confirm PayPal payment and register transaction
    const confirmed = confirmAlbumOrderPayPalPayment(newOrder.id);
    const finalOrder = confirmed || newOrder;
    setCompletedOrder(finalOrder);
    setCreatedOrderCode(newOrder.orderCode);
    setOrderSuccess(true);

    // Open PayPal checkout URL to vkrealhakiesake@gmail.com
    if (newOrder.paypalPaymentUrl) {
      try {
        window.open(newOrder.paypalPaymentUrl, '_blank');
      } catch {}
    }

    // Determine target download package (CD buyers also get the complete Master Pack!)
    const targetZipUrl = orderTier === 'digital_mp3'
      ? ALBUM_MP3_DOWNLOAD_URL
      : ALBUM_MASTER_DOWNLOAD_URL;
    const targetZipName = orderTier === 'digital_mp3'
      ? 'THE_GOD_CYPHER_MP3_EDITION.zip'
      : 'THE_GOD_CYPHER_MASTER_PACK.zip';

    // Automatically trigger browser download immediately
    setTimeout(() => {
      triggerBrowserDownload(targetZipUrl, targetZipName);
    }, 400);
  };

  const rawSpotifyId = siteContent.spotifyPlaylistId || '2nLiKk1RIeFhbMabi9iQ34';
  const spotifyDirectUrl = `https://open.spotify.com/playlist/${rawSpotifyId}`;

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#fdf6e2] font-sans selection:bg-red-600 selection:text-white pt-20 pb-28 overflow-x-hidden">
      
      {/* CINEMATIC GODFATHER TEXTURE BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(185,28,28,0.28)_0%,rgba(5,5,5,0.98)_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(20,5,5,0.85)_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP BREADCRUMB & BACK NAV */}
        <div className="flex items-center justify-between py-4 border-b border-red-950/70 mb-8 sm:mb-12">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#fdf6e2]/70 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-500 group-hover:-translate-x-1 transition-transform" />
            <span>Torna alla Home</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span className="text-[11px] font-['Cinzel_Decorative',serif] uppercase tracking-[0.2em] text-red-500 font-bold">
              171 STUDIO PRODUCTIONS • OPERA ORIGINALE
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO SECTION: THE GODFATHER STYLE MONUMENTAL PRESENTATION */}
        {/* ========================================================================= */}
        <section className="mb-20 sm:mb-28 text-center relative">
          <div className="inline-block mb-3">
            <span className="text-xs sm:text-sm font-['Cinzel_Decorative',serif] uppercase tracking-[0.35em] text-[#fdf6e2]/80 border-b border-red-700/60 pb-1 font-bold">
              Un'Offerta Che Non Si Può Rifiutare
            </span>
          </div>

          <h1 
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white drop-shadow-[0_4px_30px_rgba(220,38,38,0.75)] font-['Cinzel_Decorative',serif] my-3 leading-tight"
          >
            THE GOD CYPHER
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl font-['Playfair_Display',serif] italic text-[#fdf6e2]/90 font-medium">
            L'Album Ufficiale di 171 Studio • 14 Tracce di Puro Hip Hop • Messina, Sicilia
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono tracking-wider">
            <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 font-bold">
              16 PROTAGONISTI DELLA FAMIGLIA
            </span>
            <span className="px-3 py-1 rounded-full bg-[#fdf6e2]/10 border border-[#fdf6e2]/25 text-[#fdf6e2]">
              EDIZIONE CD DELUXE €9.99
            </span>
            <span className="px-3 py-1 rounded-full bg-red-900/60 border border-red-600/50 text-white font-bold">
              DOWNLOAD DIGITALE MASTER €4.99
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3D VINYL & SLEEVE SHOWCASE: INTERACTIVE COVER FLIP */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
            
            {/* Visual Album Box & Disc */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative group perspective-1000 max-w-md sm:max-w-lg w-full">
                
                {/* Vinyl Record that slides out */}
                <div 
                  className="absolute -right-8 sm:-right-14 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-[#111111] border-4 border-neutral-900 shadow-2xl transition-all duration-700 pointer-events-none z-0 group-hover:translate-x-12 group-hover:rotate-45"
                >
                  {/* Vinyl Grooves */}
                  <div className="absolute inset-2 rounded-full border border-neutral-800" />
                  <div className="absolute inset-5 rounded-full border border-neutral-800/80" />
                  <div className="absolute inset-9 rounded-full border border-neutral-800/60" />
                  <div className="absolute inset-14 rounded-full border border-neutral-800/50" />
                  {/* Center Label */}
                  <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-red-900 border-2 border-red-600 flex flex-col items-center justify-center text-center p-1 shadow-inner">
                    <span className="text-[8px] font-['Cinzel_Decorative',serif] font-black tracking-widest text-white">THE GOD</span>
                    <span className="text-[7px] font-mono tracking-widest text-red-200">CYPHER</span>
                    <span className="text-[6px] font-mono text-[#fdf6e2]/80 mt-1">171 STUDIO</span>
                  </div>
                </div>

                {/* Album Cover Sleeve with Shadow Box */}
                <div 
                  onClick={() => setIsCoverZoomOpen(true)}
                  className="relative z-10 w-full aspect-square rounded-2xl overflow-hidden border-2 border-red-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(220,38,38,0.35)] bg-black transition-transform duration-500 group-hover:scale-[1.02] cursor-pointer group/art"
                >
                  <img
                    src={getAssetUrl(
                      activeCover === 'front' 
                        ? '/assets/the-god-cypher/covers/cover-front.png' 
                        : activeCover === 'back' 
                          ? '/assets/the-god-cypher/covers/cover-back.jpg' 
                          : '/assets/the-god-cypher/covers/locandina.png'
                    )}
                    alt="The God Cypher Album Artwork"
                    className="w-full h-full object-cover transition-all duration-500"
                  />

                  {/* Hover Overlay with Zoom Icon */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/art:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-xs">
                    <div className="w-12 h-12 rounded-full bg-red-700/90 text-white flex items-center justify-center shadow-xl">
                      <Eye className="w-6 h-6" />
                    </div>
                    <span className="font-['Cinzel_Decorative',serif] text-xs font-bold uppercase tracking-wider text-white">
                      Clicca per Ingrandire
                    </span>
                  </div>

                  {/* Corner Badge in Godfather font */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-red-600/60 text-[10px] font-['Cinzel_Decorative',serif] uppercase tracking-widest text-red-400 font-bold">
                    {activeCover === 'front' ? '1. Copertina Fronte' : activeCover === 'back' ? '2. Retro & Tracklist (171 Studio)' : '3. Locandina Poster vol. 1'}
                  </div>
                </div>
              </div>

              {/* Cover Switcher Controls in exact order */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setActiveCover('front')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-['Cinzel_Decorative',serif] uppercase tracking-wider transition-all cursor-pointer ${
                    activeCover === 'front'
                      ? 'bg-red-700 text-white font-bold shadow-lg shadow-red-900/50 border border-red-500'
                      : 'bg-black/80 text-[#fdf6e2]/70 hover:text-white border border-neutral-800'
                  }`}
                >
                  Fronte
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCover('back')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-['Cinzel_Decorative',serif] uppercase tracking-wider transition-all cursor-pointer ${
                    activeCover === 'back'
                      ? 'bg-red-700 text-white font-bold shadow-lg shadow-red-900/50 border border-red-500'
                      : 'bg-black/80 text-[#fdf6e2]/70 hover:text-white border border-neutral-800'
                  }`}
                >
                  Retro & Tracklist
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCover('locandina')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-['Cinzel_Decorative',serif] uppercase tracking-wider transition-all cursor-pointer ${
                    activeCover === 'locandina'
                      ? 'bg-red-700 text-white font-bold shadow-lg shadow-red-900/50 border border-red-500'
                      : 'bg-black/80 text-[#fdf6e2]/70 hover:text-white border border-neutral-800'
                  }`}
                >
                  Locandina Poster
                </button>
                <button
                  type="button"
                  onClick={() => setIsCoverZoomOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-red-400 border border-neutral-800 hover:border-red-600/50 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Apri a schermo intero"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ingrandisci</span>
                </button>
              </div>
            </div>

            {/* Album Story & Quick Buy Card */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0505] border border-red-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-red-500 font-bold block mb-2">
                  DISCOGRAFIA 171 STUDIO
                </span>
                
                <h2 className="text-2xl sm:text-3xl font-['Cinzel_Decorative',serif] font-black text-white leading-tight mb-4">
                  Il Capolavoro dello Stretto
                </h2>

                <p className="text-sm sm:text-base text-[#fdf6e2]/85 font-light leading-relaxed mb-6 font-['Playfair_Display',serif]">
                  "The God Cypher" racchiude l'anima grezza e autentica di Messina: 14 tracce prodotte, registrate, mixate e masterizzate interamente presso <strong>171 Studio</strong>. 
                  Un progetto collettivo dove i migliori liricisti e rapper si sfidano in una cypher senza sconti su sonorità boom-bap, trap e west coast con attitudine cinematografica.
                </p>

                {/* Pricing summary buttons - 3 options with €4.99 in the middle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
                  <button
                    type="button"
                    onClick={() => openOrderModal('physical')}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-red-900/80 to-red-950 border border-red-600/60 hover:border-red-500 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-['Cinzel_Decorative',serif] uppercase text-red-300 font-bold truncate">CD DELUXE</span>
                      <ShoppingBag className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-xl font-serif font-black text-white">€9.99</div>
                    <div className="text-[10px] text-[#fdf6e2]/70 font-mono mt-0.5 truncate">
                      Copia Fisica + Booklet
                    </div>
                  </button>

                  {/* €4.99 IN MEZZO */}
                  <button
                    type="button"
                    onClick={() => openOrderModal('digital_master')}
                    className="p-3.5 rounded-2xl bg-[#1c0f0f] border-2 border-amber-500/80 hover:border-amber-400 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-xl shadow-amber-950/40 group relative"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-['Cinzel_Decorative',serif] uppercase text-amber-300 font-bold truncate">MASTER PACK</span>
                      <Download className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-xl font-serif font-black text-white">€4.99</div>
                    <div className="text-[10px] text-amber-200/90 font-mono mt-0.5 truncate">
                      WAV + MP3 + Grafiche
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openOrderModal('digital_mp3')}
                    className="p-3.5 rounded-2xl bg-[#140b0b] border border-[#fdf6e2]/25 hover:border-white text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-['Cinzel_Decorative',serif] uppercase text-[#fdf6e2]/70 font-bold truncate">SOLO MP3</span>
                      <Music className="w-3.5 h-3.5 text-[#fdf6e2] group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-xl font-serif font-black text-white">€2.99</div>
                    <div className="text-[10px] text-[#fdf6e2]/70 font-mono mt-0.5 truncate">
                      14 Tracce Audio MP3
                    </div>
                  </button>
                </div>

                {/* Direct quick action */}
                <div className="flex items-center gap-3">
                  <a
                    href={spotifyDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ascolta Subito su Spotify</span>
                  </a>

                  <a
                    href="#tracklist"
                    className="py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-[#fdf6e2] border border-neutral-700 text-xs font-['Cinzel_Decorative',serif] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tracklist</span>
                    <ChevronRight className="w-4 h-4 text-red-500" />
                  </a>
                </div>
              </div>

              {/* Features Pill */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/60 border border-neutral-900">
                  <div className="text-red-500 font-bold text-sm">14</div>
                  <div className="text-[#fdf6e2]/60 text-[10px] uppercase font-['Cinzel_Decorative',serif]">Tracce</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-neutral-900">
                  <div className="text-red-500 font-bold text-sm">16</div>
                  <div className="text-[#fdf6e2]/60 text-[10px] uppercase font-['Cinzel_Decorative',serif]">Famiglia</div>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-neutral-900">
                  <div className="text-red-500 font-bold text-sm">100%</div>
                  <div className="text-[#fdf6e2]/60 text-[10px] uppercase font-['Cinzel_Decorative',serif]">171 Studio</div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* STREAMING PLATFORMS HUB: ALL OFFICIAL LINKS */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-bold block mb-1">
              DISPONIBILE OVUNQUE
            </span>
            <h3 className="text-2xl sm:text-4xl font-['Cinzel_Decorative',serif] font-black text-white">
              Ascolta Su Tutte le Piattaforme
            </h3>
            <p className="text-sm font-['Playfair_Display',serif] italic text-[#fdf6e2]/70 mt-1">
              Scegli la tua app preferita per lo streaming in alta fedeltà
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* Spotify */}
            <a
              href={spotifyDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#0c130d] border border-emerald-500/40 hover:border-emerald-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                <Music className="w-5 h-5" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">Spotify</div>
              <div className="text-[10px] font-mono text-emerald-400 mt-0.5">Stream Diretto</div>
            </a>

            {/* Apple Music */}
            <a
              href="https://music.apple.com/it/search?term=The+God+Cypher+171+Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#140c0f] border border-rose-500/40 hover:border-rose-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-2 group-hover:bg-rose-500 group-hover:text-black transition-colors">
                <Radio className="w-5 h-5" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">Apple Music</div>
              <div className="text-[10px] font-mono text-rose-400 mt-0.5">Lossless Audio</div>
            </a>

            {/* YouTube Music */}
            <a
              href="https://www.youtube.com/results?search_query=The+God+Cypher+171+Studio"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#140a0a] border border-red-500/40 hover:border-red-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 mx-auto flex items-center justify-center mb-2 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">YouTube</div>
              <div className="text-[10px] font-mono text-red-400 mt-0.5">Video & Tracce</div>
            </a>

            {/* Amazon Music */}
            <a
              href="https://music.amazon.it/search/The+God+Cypher"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#0c1116] border border-cyan-500/40 hover:border-cyan-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center mb-2 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                <Music className="w-5 h-5" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">Amazon</div>
              <div className="text-[10px] font-mono text-cyan-400 mt-0.5">Ultra HD</div>
            </a>

            {/* Tidal */}
            <a
              href="https://tidal.com/search?q=The+God+Cypher"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#090e14] border border-sky-500/40 hover:border-sky-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center mb-2 group-hover:bg-sky-500 group-hover:text-black transition-colors">
                <Award className="w-5 h-5" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">Tidal</div>
              <div className="text-[10px] font-mono text-sky-400 mt-0.5">Master Quality</div>
            </a>

            {/* Deezer */}
            <a
              href="https://www.deezer.com/search/The%20God%20Cypher"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#120a16] border border-purple-500/40 hover:border-purple-400 text-center transition-all hover:scale-105 group shadow-lg"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center mb-2 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="font-['Cinzel_Decorative',serif] font-bold text-white text-xs">Deezer</div>
              <div className="text-[10px] font-mono text-purple-400 mt-0.5">HiFi Sound</div>
            </a>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* GODFATHER STYLE TRACKLIST: STREAMING LINKS FOR EVERY TRACK */}
        {/* ========================================================================= */}
        <section id="tracklist" className="mb-24 sm:mb-32">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-bold block mb-1">
              IL REGISTRO UFFICIALE DEI BRANI
            </span>
            <h3 className="text-3xl sm:text-5xl font-['Cinzel_Decorative',serif] font-black text-white">
              La Tracklist del Padrino
            </h3>
            <p className="text-sm font-['Playfair_Display',serif] italic text-[#fdf6e2]/75 max-w-xl mx-auto mt-2">
              Ascolta ogni singolo brano direttamente sulla tua piattaforma preferita
            </p>

            {/* Quick View Cover & Tracklist Artwork */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setActiveCover('back');
                  setIsCoverZoomOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 hover:text-white font-['Cinzel_Decorative',serif] text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
              >
                <Eye className="w-4 h-4 text-red-400" />
                <span>Vedi Retro con Tracklist Stampata</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCover('locandina');
                  setIsCoverZoomOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-black/80 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-['Cinzel_Decorative',serif] text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
              >
                <Eye className="w-4 h-4 text-red-400" />
                <span>Vedi Locandina Poster (16 Artisti in Ordine)</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8 rounded-3xl bg-[#090404] border-2 border-red-950/80 shadow-2xl relative">
            <div className="divide-y divide-red-950/60">
              {TRACKLIST.map((track) => (
                <div
                  key={track.num}
                  className="py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-red-950/20 px-3 rounded-2xl transition-all group"
                >
                  {/* Left: Roman numeral, Title in Godfather font, Artists */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="w-8 sm:w-10 text-center font-['Cinzel_Decorative',serif] font-bold text-sm sm:text-base text-red-500 shrink-0">
                      {track.roman}.
                    </span>

                    <div className="min-w-0">
                      <h4 className="font-['Cinzel_Decorative',serif] font-bold text-base sm:text-lg text-white group-hover:text-red-400 transition-colors truncate">
                        {track.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-['Playfair_Display',serif] italic text-[#fdf6e2]/70 truncate">
                        {track.artists}
                      </p>
                    </div>
                  </div>

                  {/* Right: Streaming Link Buttons to all major platforms */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 self-start md:self-center pl-11 md:pl-0">
                    
                    {/* Spotify */}
                    <a
                      href={`https://open.spotify.com/search/${encodeURIComponent(track.spotifyQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-[10px] font-mono uppercase font-bold transition-all flex items-center gap-1 shadow-sm"
                      title={`Ascolta "${track.title}" su Spotify`}
                    >
                      <Music className="w-3 h-3" />
                      <span>Spotify</span>
                    </a>

                    {/* Apple Music */}
                    <a
                      href={`https://music.apple.com/it/search?term=${encodeURIComponent(track.appleQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black border border-rose-500/30 text-[10px] font-mono uppercase font-bold transition-all flex items-center gap-1 shadow-sm"
                      title={`Ascolta "${track.title}" su Apple Music`}
                    >
                      <Radio className="w-3 h-3" />
                      <span>Apple</span>
                    </a>

                    {/* YouTube */}
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.ytQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-[10px] font-mono uppercase font-bold transition-all flex items-center gap-1 shadow-sm"
                      title={`Cerca "${track.title}" su YouTube`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>YouTube</span>
                    </a>

                    {/* Amazon */}
                    <a
                      href={`https://music.amazon.it/search/${encodeURIComponent(track.amazonQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black border border-cyan-500/30 text-[10px] font-mono uppercase font-bold transition-all items-center gap-1 shadow-sm"
                      title={`Ascolta "${track.title}" su Amazon Music`}
                    >
                      <span>Amazon</span>
                    </a>

                    {/* Duration */}
                    <span className="font-mono text-xs text-[#fdf6e2]/60 w-10 text-right ml-1">
                      {track.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* "LA FAMIGLIA DI THE GOD CYPHER" — IMAGES FROM N. 18 TO 33 */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-bold block mb-1">
              I SEDICI PROTAGONISTI UFFICIALI
            </span>
            <h3 className="text-3xl sm:text-5xl font-['Cinzel_Decorative',serif] font-black text-white">
              La Famiglia di The God Cypher
            </h3>
            <p className="text-sm sm:text-base font-['Playfair_Display',serif] italic text-[#fdf6e2]/75 max-w-2xl mx-auto mt-2">
              Le 16 tavole ufficiali originali (dalla n. 18 alla n. 33) dedicate a ciascun membro del collettivo
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {FAMIGLIA_MEMBERS.map((member) => (
              <div
                key={member.id}
                onClick={() => setZoomedCard(member)}
                className="group p-3 sm:p-4 rounded-3xl bg-[#0b0505] border-2 border-red-950 hover:border-red-600 transition-all hover:scale-[1.03] shadow-xl flex flex-col items-center text-center relative overflow-hidden cursor-pointer"
              >
                {/* 1400x1400 Artwork (18.jpg to 33.jpg) */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black border border-neutral-900 mb-3 shadow-inner relative group-hover:border-red-600/60 transition-colors">
                  <img
                    src={getAssetUrl(`/assets/the-god-cypher/famiglia/${member.imageNum}.jpg`)}
                    alt={member.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Subtle corner badge with Roman Numeral */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-red-600/50 text-[10px] font-['Cinzel_Decorative',serif] font-bold text-red-400">
                    {member.roman}
                  </div>

                  <div className="absolute inset-0 bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-2 rounded-full bg-black/80 text-white border border-red-500 shadow-lg">
                      <Eye className="w-4 h-4 text-red-400" />
                    </span>
                  </div>
                </div>

                <h4 className="font-['Cinzel_Decorative',serif] font-bold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors truncate w-full">
                  {member.title}
                </h4>

                <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest mt-0.5">
                  OPERA #{member.imageNum}
                </span>

                <p className="text-[11px] font-['Playfair_Display',serif] italic text-[#fdf6e2]/65 mt-1 line-clamp-1 w-full">
                  {member.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* EXCLUSIVE LOCKED BOOKLET TEASER (NON SFOGLIABILE — RISERVATO AL DOWNLOAD/CD) */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32 p-8 sm:p-12 rounded-3xl bg-[#090404] border-2 border-red-900/60 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/90 border border-red-700/60 text-red-400 text-xs font-mono uppercase tracking-widest mb-3 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>CONTENUTO ESCLUSIVO RISERVATO AI POSSESSORI</span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-['Cinzel_Decorative',serif] font-black text-white mb-3">
                Il Booklet Ufficiale di 16 Pagine
              </h3>

              <p className="text-sm sm:text-base font-['Playfair_Display',serif] italic text-[#fdf6e2]/80 leading-relaxed mb-6">
                Il libretto integrale da collezione di 16 pagine con foto d'archivio inedite, testi completi dei brani, dediche e retroscena esclusivi della registrazione è un'esclusiva protetta.
                È incluso in formato digitale ad altissima risoluzione nel pacchetto <strong>Master Pack Digitale (€4.99)</strong> e stampato su carta patinata di pregio all'interno del <strong>CD Audio Deluxe Pack (€9.99)</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openOrderModal('digital_master')}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer"
                >
                  Sblocca con Master Pack (€4.99)
                </button>
                <button
                  type="button"
                  onClick={() => openOrderModal('physical')}
                  className="px-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-red-950 cursor-pointer"
                >
                  Acquista CD Deluxe (€9.99)
                </button>
                <button
                  type="button"
                  onClick={() => openOrderModal('digital_mp3')}
                  className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 font-['Cinzel_Decorative',serif] text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Solo MP3 (€2.99)
                </button>
              </div>
            </div>

            {/* Locked Visual Teaser */}
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-56 sm:w-64 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-red-700/60 shadow-2xl bg-black">
                <img
                  src={getAssetUrl('/assets/the-god-cypher/booklet/1.jpg')}
                  alt="Booklet Copertina"
                  className="w-full h-full object-cover filter blur-[3px] scale-105"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-900/90 border border-red-500 text-white flex items-center justify-center mb-3 shadow-xl">
                    <Lock className="w-6 h-6 text-red-300" />
                  </div>
                  <span className="font-['Cinzel_Decorative',serif] font-black text-white text-xs uppercase tracking-wider">
                    BOOKLET PROTETTO
                  </span>
                  <span className="text-[10px] font-mono text-[#fdf6e2]/70 mt-1">
                    Incluso nel Download ZIP & CD Fisico
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* OFFICIAL STORE: PHYSICAL CD VS DIGITAL DOWNLOAD */}
        {/* ========================================================================= */}
        <section id="store" className="mb-24 sm:mb-32">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-red-500 font-bold block mb-1">
              STORE UFFICIALE 171
            </span>
            <h3 className="text-3xl sm:text-5xl font-['Cinzel_Decorative',serif] font-black text-white">
              Lo Store della Famiglia
            </h3>
            <p className="text-sm sm:text-base font-['Playfair_Display',serif] italic text-[#fdf6e2]/75 max-w-xl mx-auto mt-2">
              Scegli tra la prestigiosa copia fisica da collezione o il download digitale immediato ad altissima fedeltà
            </p>
          </div>

          {/* 3 TIERS: CD FISICO €9.99 | MASTER PACK €4.99 (IN MEZZO) | SOLO MP3 €2.99 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {/* OPTION 1: CD FISICO DELUXE PACK (€9.99) */}
            <div className="p-7 sm:p-8 rounded-3xl bg-[#0d0606] border-2 border-red-700/80 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-red-700 text-white font-['Cinzel_Decorative',serif] font-bold text-[10px] uppercase tracking-widest rounded-bl-2xl">
                EDIZIONE LIMITATA
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                  FORMATO FISICO
                </span>
                <h4 className="text-2xl sm:text-3xl font-['Cinzel_Decorative',serif] font-black text-white mt-1 mb-2">
                  CD Audio Deluxe Pack
                </h4>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-serif font-black text-white">€9.99</span>
                  <span className="text-xs font-mono text-[#fdf6e2]/60">IVA inclusa</span>
                </div>

                <div className="space-y-3 border-t border-red-950/80 pt-6 mb-8 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>CD Audio originale ad alta fedeltà (14 Tracce)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Booklet integrale di 16 pagine con foto e grafiche esclusive</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Locandina poster promozionale cartacea inclusa</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>Download Master Pack Digitale HD incluso all'acquisto</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 text-xs font-mono text-[#fdf6e2]/80 mt-4">
                    <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>OPZIONI DI CONSEGNA:</span>
                    </div>
                    <div>• Spedizione con corriere espresso: <strong>+€5.00</strong></div>
                    <div>• Ritiro a mano gratuito: <strong>171 Studio Messina</strong></div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOrderModal('physical')}
                className="w-full py-4 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-['Cinzel_Decorative',serif] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-red-950 cursor-pointer hover:scale-[1.02]"
              >
                Ordina Copia Fisica (€9.99)
              </button>
            </div>

            {/* OPTION 2 (IN MEZZO): DIGITAL DOWNLOAD MASTER PACK (€4.99) */}
            <div className="p-7 sm:p-8 rounded-3xl bg-[#130707] border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.22)] flex flex-col justify-between relative overflow-hidden lg:-translate-y-2 z-10">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-['Cinzel_Decorative',serif] font-black text-[10px] uppercase tracking-widest rounded-bl-2xl shadow-lg">
                BEST SELLER • PIÙ SCELTO
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                  FORMATO DIGITALE COMPLETO
                </span>
                <h4 className="text-2xl sm:text-3xl font-['Cinzel_Decorative',serif] font-black text-white mt-1 mb-2">
                  Master Pack Digitale
                </h4>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-serif font-black text-white">€4.99</span>
                  <span className="text-xs font-mono text-amber-300/80">Accesso istantaneo</span>
                </div>

                <div className="space-y-3 border-t border-amber-950/60 pt-6 mb-8 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tutte le 14 Tracce in <strong>WAV Studio Master 24-bit</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tutte le 14 Tracce in <strong>MP3 a 320 kbps</strong> con tag ID3</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Grafica: <strong>Copertine Fronte & Retro ad altissima risoluzione</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tutte le <strong>16 illustrazioni stilizzate originali</strong> della Famiglia</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Locandina Poster vol. 1</strong> in alta definizione</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/70 border border-amber-500/30 text-xs font-mono text-amber-200/90 mt-4">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-400">
                      <Download className="w-3.5 h-3.5" />
                      <span>PACCHETTO COMPLETO:</span>
                    </div>
                    <div>Archivio ZIP completo audio Master + tutte le grafiche (217 MB).</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOrderModal('digital_master')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-['Cinzel_Decorative',serif] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/25 cursor-pointer hover:scale-[1.02]"
              >
                Scarica Master Pack (€4.99)
              </button>
            </div>

            {/* OPTION 3: ESSENTIAL MP3 PACK (€2.99) */}
            <div className="p-7 sm:p-8 rounded-3xl bg-[#080505] border border-neutral-800 hover:border-neutral-700 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-neutral-800 text-neutral-300 font-['Cinzel_Decorative',serif] font-bold text-[10px] uppercase tracking-widest rounded-bl-2xl">
                SOLO FILE MP3
              </div>

              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-bold">
                  FORMATO AUDIO MP3
                </span>
                <h4 className="text-2xl sm:text-3xl font-['Cinzel_Decorative',serif] font-black text-white mt-1 mb-2">
                  Essential MP3 Pack
                </h4>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-4xl font-serif font-black text-white">€2.99</span>
                  <span className="text-xs font-mono text-[#fdf6e2]/60">Download diretto</span>
                </div>

                <div className="space-y-3 border-t border-neutral-900 pt-6 mb-8 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                    <span>Tutte le <strong>14 Tracce ufficiali</strong> dell'album in formato MP3</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                    <span>Alta fedeltà audio a <strong>320 kbps</strong> (qualità studio standard)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                    <span>Tag ID3 ufficiali con titoli e artisti corretti</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                    <span>Ideale per ascolto immediato su smartphone, cuffie e auto</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-neutral-900 text-xs font-mono text-neutral-300 mt-4">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
                      <Music className="w-3.5 h-3.5 text-red-500" />
                      <span>SOLO FILE AUDIO:</span>
                    </div>
                    <div>Download istantaneo dell'archivio ZIP con le 14 canzoni (198 MB).</div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openOrderModal('digital_mp3')}
                className="w-full py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-['Cinzel_Decorative',serif] font-black text-sm uppercase tracking-widest transition-all border border-neutral-700 cursor-pointer hover:scale-[1.02]"
              >
                Scarica Solo MP3 (€2.99)
              </button>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* STUDIO CREDITS & BOTTOM CALL TO ACTION */}
        {/* ========================================================================= */}
        <section className="text-center p-8 sm:p-12 rounded-3xl bg-black border border-red-950/60">
          <h4 className="text-xl sm:text-2xl font-['Cinzel_Decorative',serif] font-black text-white mb-2">
            Vuoi Realizzare il Tuo Prossimo Album a 171 Studio?
          </h4>
          <p className="text-sm font-['Playfair_Display',serif] italic text-[#fdf6e2]/75 max-w-xl mx-auto mb-6">
            Mettiamo a tua disposizione i nostri tecnici, i plugin DSP innovativi e le sale acustiche professionali per dare al tuo suono la massima identità.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('prenota-sessione')}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-widest shadow-lg shadow-red-950 cursor-pointer"
            >
              Prenota Sessione in Studio
            </button>
            <button
              type="button"
              onClick={() => onNavigate('chi-siamo')}
              className="px-6 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-[#fdf6e2] border border-neutral-700 font-['Cinzel_Decorative',serif] text-xs uppercase tracking-widest cursor-pointer"
            >
              Scopri lo Studio
            </button>
          </div>
        </section>

      </div>

      {/* ========================================================================= */}
      {/* ZOOM MODAL FOR COVER FRONTE / RETRO & TRACKLIST / LOCANDINA POSTER        */}
      {/* ========================================================================= */}
      {isCoverZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-red-950 mb-4">
              <div>
                <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold block">
                  THE GOD CYPHER • ARTWORK UFFICIALE
                </span>
                <h4 className="font-['Cinzel_Decorative',serif] font-bold text-lg text-white">
                  {activeCover === 'front' && 'Copertina Fronte Ufficiale'}
                  {activeCover === 'back' && 'Retro Album & Tracklist Ufficiale (171 Studio)'}
                  {activeCover === 'locandina' && 'Locandina Poster Ufficiale • 16 Artisti della Famiglia'}
                </h4>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Switcher within modal */}
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-['Cinzel_Decorative',serif]">
                  <button
                    type="button"
                    onClick={() => setActiveCover('front')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeCover === 'front' ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Fronte
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCover('back')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeCover === 'back' ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Retro
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCover('locandina')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${activeCover === 'locandina' ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Poster
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCoverZoomOpen(false)}
                  className="p-2 rounded-xl bg-neutral-900 text-white hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-red-700/80 shadow-[0_0_60px_rgba(220,38,38,0.5)] bg-black">
              <img
                src={getAssetUrl(
                  activeCover === 'front' 
                    ? '/assets/the-god-cypher/covers/cover-front.png' 
                    : activeCover === 'back' 
                      ? '/assets/the-god-cypher/covers/cover-back.jpg' 
                      : '/assets/the-god-cypher/covers/locandina.png'
                )}
                alt="The God Cypher Artwork Fullscreen"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="mt-4 font-['Playfair_Display',serif] italic text-xs text-[#fdf6e2]/80 text-center">
              {activeCover === 'front' && 'Copertina fronte originale "The God Cypher vol. 1"'}
              {activeCover === 'back' && 'Retro originale con le 14 tracce ufficiali e dicitura: Rec, Mix, Master, Produzioni 171 Studio'}
              {activeCover === 'locandina' && 'Locandina ufficiale con i 16 protagonisti della famiglia ordinati per riga: Resla, Piotre, Adrihaine, Albert, Beltax, Ditt, Igor Rozanov, 3 Warriors, Matovato, Yole, Costavich, Van Iena, Flusso, Lelò, Skietto, Ludò'}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZOOM MODAL FOR FAMIGLIA 1400x1400 ARTWORK */}
      {/* ========================================================================= */}
      {zoomedCard && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-xl w-full flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 border-b border-red-950 mb-4">
              <div>
                <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
                  LA FAMIGLIA • OPERA #{zoomedCard.imageNum}
                </span>
                <h4 className="font-['Cinzel_Decorative',serif] font-bold text-lg text-white">
                  {zoomedCard.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setZoomedCard(null)}
                className="p-2 rounded-xl bg-neutral-900 text-white hover:bg-red-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-red-700/80 shadow-[0_0_50px_rgba(220,38,38,0.4)] bg-black">
              <img
                src={getAssetUrl(`/assets/the-god-cypher/famiglia/${zoomedCard.imageNum}.jpg`)}
                alt={zoomedCard.title}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="mt-4 font-['Playfair_Display',serif] italic text-sm text-[#fdf6e2]/80 text-center">
              {zoomedCard.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKOUT / ORDER MODAL (PHYSICAL CD OR DIGITAL DOWNLOAD) */}
      {/* ========================================================================= */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl bg-[#0c0505] border-2 border-red-700/80 p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-red-950 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold block">
                  {orderTier === 'physical' 
                    ? 'ORDINE COPIA FISICA & DIGITALE' 
                    : (orderTier === 'digital_master' ? 'DOWNLOAD DIGITALE MASTER PACK' : 'DOWNLOAD DIGITALE ESSENTIAL MP3')}
                </span>
                <h3 className="text-xl sm:text-2xl font-['Cinzel_Decorative',serif] font-black text-white">
                  The God Cypher — {orderTier === 'physical' ? 'CD Deluxe Pack' : (orderTier === 'digital_master' ? 'Master Pack (€4.99)' : 'Solo MP3 (€2.99)')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {orderSuccess && completedOrder ? (
              <div className="space-y-4 py-2">
                {/* Header confirmation badge */}
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2.5 border border-emerald-500/40 shadow-lg shadow-emerald-950">
                    <Check className="w-7 h-7" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                    ✓ TRANSAZIONE PAYPAL REGISTRATA CON SUCCESSO
                  </span>
                  <h4 className="text-xl sm:text-2xl font-['Cinzel_Decorative',serif] font-black text-white mt-0.5">
                    Pagamento & Ordine Convalidati!
                  </h4>
                  <div className="text-xs text-neutral-300 font-mono mt-1">
                    Accreditato a: <strong className="text-amber-400">vkrealhakiesake@gmail.com</strong>
                  </div>
                </div>

                {/* PayPal Official Transaction Card */}
                <div className="p-4 rounded-2xl bg-black/90 border border-neutral-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                    <span className="text-neutral-400">Codice Ordine:</span>
                    <span className="text-red-400 font-bold text-sm">#{completedOrder.orderCode}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                    <span className="text-neutral-400">ID Transazione PayPal:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-bold select-all">{completedOrder.paypalTransactionId}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (completedOrder.paypalTransactionId) {
                            navigator.clipboard.writeText(completedOrder.paypalTransactionId);
                            setCopiedTxId(true);
                            setTimeout(() => setCopiedTxId(false), 2000);
                          }
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white"
                        title="Copia ID Transazione"
                      >
                        {copiedTxId ? 'Copiato!' : <Copy className="w-3 h-3 inline" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                    <span className="text-neutral-400">Importo Saldato:</span>
                    <span className="text-white font-bold text-sm">€{completedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-1.5">
                    <span className="text-neutral-400">Email Convalidata:</span>
                    <span className="text-emerald-300 font-bold">{completedOrder.userEmail} (✓ Convalidata)</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-neutral-400">Avanzamento Ordine:</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold text-[10px] uppercase">
                      {completedOrder.orderType === 'digital'
                        ? 'Completato'
                        : completedOrder.shippingMethod === 'pickup'
                        ? 'Pronto Ritiro in Sede'
                        : 'In Elaborazione Laboratorio'}
                    </span>
                  </div>
                </div>

                {/* Automatic Download Card */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Download Automatico Avviato!</span>
                  </div>
                  <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                    {orderTier === 'digital_mp3'
                      ? "Il tuo browser sta scaricando THE_GOD_CYPHER_MP3_EDITION.zip (198 MB, 14 tracce MP3 ad alta fedeltà a 320 kbps)."
                      : "Il tuo browser sta scaricando il Master Pack Completo THE_GOD_CYPHER_MASTER_PACK.zip (217 MB, 14 tracce WAV/MP3, copertine e le 16 grafiche ufficiali dei singoli)."
                    }
                  </p>
                  <div>
                    <a
                      href={orderTier === 'digital_mp3' ? ALBUM_MP3_DOWNLOAD_URL : ALBUM_MASTER_DOWNLOAD_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={orderTier === 'digital_mp3' ? "THE_GOD_CYPHER_MP3_EDITION.zip" : "THE_GOD_CYPHER_MASTER_PACK.zip"}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-['Cinzel_Decorative',serif] font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{orderTier === 'digital_mp3' ? 'Scarica Manualmente MP3 (198 MB)' : 'Scarica Manualmente Master Pack (217 MB)'}</span>
                    </a>
                  </div>
                </div>

                {/* CD Physical Order Fulfillment Card ("mandare avanti l'ordine") */}
                {completedOrder.orderType === 'physical' && (
                  <div className="p-4 rounded-2xl bg-red-950/30 border border-red-700/60 space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                      {completedOrder.shippingMethod === 'shipping' ? (
                        <>
                          <Truck className="w-4 h-4 text-red-400" />
                          <span>Pacco CD Deluxe Preso in Carico</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-amber-400" />
                          <span>CD Pronto per il Ritiro in Sede</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {completedOrder.shippingMethod === 'shipping' ? (
                        <>
                          L'ordine è stato avanzato automaticamente: il laboratorio di 171 Studio sta confezionando il CD Deluxe Jewel Box. 
                          Riceverai il numero di tracciamento Poste Italiane SDA all'indirizzo <strong className="text-white">{completedOrder.userEmail}</strong> e nella tua area cliente.
                        </>
                      ) : (
                        <>
                          Pagamento verificato e ordine avanzato con successo! Il CD Deluxe Jewel Box è pronto al bancone di 171 Studio Messina. 
                          Puoi passare a ritirarlo dal <strong className="text-amber-300">Lunedì al Sabato (10:00 - 20:00)</strong> esibendo il codice ordine <strong className="text-white">#{completedOrder.orderCode}</strong>.
                        </>
                      )}
                    </p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrderModalOpen(false);
                      onNavigate('il-mio-account');
                    }}
                    className="w-full sm:flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 font-mono text-xs font-bold uppercase transition-all cursor-pointer text-center"
                  >
                    Vedi nel Mio Account ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-mono text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                
                {/* Physical shipping option toggle */}
                {orderTier === 'physical' && (
                  <div className="p-3 rounded-2xl bg-black/60 border border-red-950 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShippingMethod('shipping')}
                      className={`flex-1 p-2.5 rounded-xl text-xs font-['Cinzel_Decorative',serif] transition-all text-left cursor-pointer ${
                        shippingMethod === 'shipping'
                          ? 'bg-red-800 text-white font-bold'
                          : 'text-[#fdf6e2]/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Spedizione (+€5)</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#fdf6e2]/80">Corriere Espresso • Tot: €14.99</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingMethod('pickup')}
                      className={`flex-1 p-2.5 rounded-xl text-xs font-['Cinzel_Decorative',serif] transition-all text-left cursor-pointer ${
                        shippingMethod === 'pickup'
                          ? 'bg-red-800 text-white font-bold'
                          : 'text-[#fdf6e2]/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Ritiro in Sede (Gratis)</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#fdf6e2]/80">171 Studio Messina • Tot: €9.99</div>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Nome *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.nome}
                      onChange={e => setOrderForm({ ...orderForm, nome: e.target.value })}
                      placeholder="Mario"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Cognome *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.cognome}
                      onChange={e => setOrderForm({ ...orderForm, cognome: e.target.value })}
                      placeholder="Rossi"
                      className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Email Convalida *</label>
                  <input
                    type="email"
                    required
                    value={orderForm.email}
                    onChange={e => setOrderForm({ ...orderForm, email: e.target.value })}
                    placeholder="mario.rossi@email.com"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Telefono</label>
                  <input
                    type="tel"
                    value={orderForm.telefono}
                    onChange={e => setOrderForm({ ...orderForm, telefono: e.target.value })}
                    placeholder="+39 340 0000000"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>

                {orderTier === 'physical' && shippingMethod === 'shipping' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Indirizzo di Spedizione *</label>
                      <input
                        type="text"
                        required
                        value={orderForm.indirizzo}
                        onChange={e => setOrderForm({ ...orderForm, indirizzo: e.target.value })}
                        placeholder="Via Garibaldi 12"
                        className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">Città</label>
                        <input
                          type="text"
                          value={orderForm.citta}
                          onChange={e => setOrderForm({ ...orderForm, citta: e.target.value })}
                          placeholder="Messina"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-[#fdf6e2]/70 mb-1">CAP</label>
                        <input
                          type="text"
                          value={orderForm.cap}
                          onChange={e => setOrderForm({ ...orderForm, cap: e.target.value })}
                          placeholder="98100"
                          className="w-full px-3 py-2 rounded-xl bg-black border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Price summary badge */}
                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-red-900/60 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase font-bold">Riepilogo Importo:</span>
                    <span className="text-[#fdf6e2]/90 text-xs">
                      {orderTier === 'physical'
                        ? (shippingMethod === 'shipping' ? 'CD Deluxe €9.99 + Spedizione €5.00' : 'CD Deluxe €9.99 (Ritiro gratuito in sede)')
                        : (orderTier === 'digital_master' ? 'Master Pack 24-bit + Grafiche' : 'Essential 14 Tracce MP3 320k')}
                    </span>
                  </div>
                  <span className="text-amber-400 font-bold text-lg font-['Cinzel_Decorative',serif]">
                    {orderTier === 'physical' 
                      ? (shippingMethod === 'shipping' ? '€14.99' : '€9.99')
                      : (orderTier === 'digital_master' ? '€4.99' : '€2.99')
                    }
                  </span>
                </div>

                {/* PayPal Checkout Button */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-[#ffc439] hover:bg-[#f4b82d] text-black font-bold text-sm tracking-wide shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-400"
                >
                  <span className="font-sans font-black italic text-base text-[#003087]">Pay</span><span className="font-sans font-black italic text-base text-[#0079C1]">Pal</span>
                  <span className="text-black font-black uppercase text-xs tracking-wider">
                    • Paga {orderTier === 'physical' ? (shippingMethod === 'shipping' ? '€14.99' : '€9.99') : (orderTier === 'digital_master' ? '€4.99' : '€2.99')} con PayPal
                  </span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-neutral-400 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Destinatario PayPal: <strong className="text-amber-400">vkrealhakiesake@gmail.com</strong> • Convalida & Download Immediati</span>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
