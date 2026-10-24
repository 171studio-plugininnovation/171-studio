import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Play, Pause, Disc, ExternalLink, ChevronDown, ChevronUp, 
  Repeat, Volume2, Sliders, Music
} from 'lucide-react';
import { useStudio } from '../context/StudioContext';

interface AudioVisualizerProps {
  interactive?: boolean;
  instanceId?: string;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: any) => void;
    SpotifyIframeApi?: any;
    __spotifyCallbacks?: Array<(IFrameAPI: any) => void>;
  }
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  interactive = true,
  instanceId = 'navbar'
}) => {
  const { siteContent, isMaster } = useStudio();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);

  const [isExpanded, setIsExpanded] = useState(false);
  const [repeatNotice, setRepeatNotice] = useState(false);
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [meterBars, setMeterBars] = useState<number[]>([12, 10, 14, 8, 11, 13, 9, 12, 10, 14, 8, 11, 13, 9, 10, 12]);

  const embedControllerRef = useRef<any>(null);
  const pendingPlayRef = useRef<boolean>(false);

  const rawSpotifyId = siteContent.spotifyPlaylistId || '2nLiKk1RIeFhbMabi9iQ34';

  // Compute standard Spotify URI (e.g. spotify:playlist:2nLiKk1RIeFhbMabi9iQ34)
  const spotifyUri = useMemo(() => {
    const clean = rawSpotifyId.trim();
    if (clean.startsWith('spotify:')) return clean;
    const match = clean.match(/open\.spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `spotify:${match[1]}:${match[2]}`;
    }
    return `spotify:playlist:${clean}`;
  }, [rawSpotifyId]);

  // Compute Spotify direct web link for opening in App
  const spotifyDirectUrl = useMemo(() => {
    const clean = rawSpotifyId.trim();
    if (clean.startsWith('http')) return clean;
    const match = clean.match(/spotify:(playlist|album|track|artist):([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/${match[1]}/${match[2]}`;
    }
    return `https://open.spotify.com/playlist/${clean}`;
  }, [rawSpotifyId]);

  // Initialize official Spotify IFrame API Controller
  useEffect(() => {
    let isMounted = true;

    const initSpotifyController = (IFrameAPI: any) => {
      const container = document.getElementById(`spotify-embed-slot-${instanceId}`);
      if (!container || !isMounted) return;

      container.innerHTML = ''; // reset previous embed if any

      const options = {
        uri: spotifyUri,
        width: '100%',
        height: 352,
      };

      try {
        IFrameAPI.createController(container, options, (EmbedController: any) => {
          if (!isMounted) return;
          embedControllerRef.current = EmbedController;
          setIsSpotifyReady(true);

          // Listen for Spotify playback events
          EmbedController.addListener('playback_update', (e: any) => {
            if (!isMounted) return;
            const isPaused = Boolean(e.data?.isPaused);
            if (!isPaused) {
              // When user hits play directly inside Spotify embed iframe
              setIsPlaying(true);
              isPlayingRef.current = true;
            } else {
              // Only flip to paused if user explicitly stopped playback
              if (!isPlayingRef.current) {
                setIsPlaying(false);
              }
            }
          });

          // If user clicked Play before Spotify was loaded, trigger it now
          if (pendingPlayRef.current) {
            try {
              EmbedController.play();
            } catch (err) {
              console.warn('Spotify play queue execution error:', err);
            }
            pendingPlayRef.current = false;
          }
        });
      } catch (err) {
        console.warn('Spotify createController warning:', err);
      }
    };

    if (window.SpotifyIframeApi) {
      initSpotifyController(window.SpotifyIframeApi);
    } else {
      window.__spotifyCallbacks = window.__spotifyCallbacks || [];
      window.__spotifyCallbacks.push((IFrameAPI: any) => {
        if (isMounted) initSpotifyController(IFrameAPI);
      });

      const prevCallback = window.onSpotifyIframeApiReady;
      window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
        if (prevCallback) {
          try { prevCallback(IFrameAPI); } catch(e) {}
        }
        window.SpotifyIframeApi = IFrameAPI;
        if (isMounted) initSpotifyController(IFrameAPI);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [spotifyUri, instanceId]);

  // Dynamic Studio VU Meter Animation: responsive to Spotify playback state
  useEffect(() => {
    let phase = 0;
    const interval = window.setInterval(() => {
      phase += 0.25;

      if (!isPlaying) {
        // Resting studio ambient pulse (6% - 14%)
        setMeterBars((prev) =>
          prev.map((_, idx) => Math.round(Math.max(6, 10 + Math.sin(phase + idx * 0.45) * 4)))
        );
        return;
      }

      // High-energy rhythmic studio transient response (20% - 100%)
      setMeterBars((prev) =>
        prev.map((_, idx) => {
          const bassBoost = idx < 6 ? Math.sin(phase * 2.2) * 35 : 0;
          const snareBoost = idx >= 6 && idx < 12 ? Math.cos(phase * 2.2) * 35 : 0;
          const trebleBoost = idx >= 12 ? Math.sin(phase * 4.4) * 25 : 0;
          const noise = (Math.random() - 0.5) * 28;
          const height = 48 + bassBoost + snareBoost + trebleBoost + noise + (idx % 4) * 6;
          return Math.round(Math.min(100, Math.max(20, height)));
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // DIRECT PLAY/STOP TOGGLE: Controls ONLY Spotify directly from the Play button, Disc icon ("tasto O"), or VU meter!
  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const nextState = !isPlayingRef.current;
    isPlayingRef.current = nextState;
    setIsPlaying(nextState);

    // Command ONLY Spotify embed controller directly (no secondary audio source)
    if (embedControllerRef.current) {
      try {
        if (nextState) {
          if (typeof embedControllerRef.current.play === 'function') {
            embedControllerRef.current.play();
          } else if (typeof embedControllerRef.current.togglePlay === 'function') {
            embedControllerRef.current.togglePlay();
          }
        } else {
          if (typeof embedControllerRef.current.pause === 'function') {
            embedControllerRef.current.pause();
          } else if (typeof embedControllerRef.current.togglePlay === 'function') {
            embedControllerRef.current.togglePlay();
          }
        }
      } catch (err) {
        console.warn('Spotify play/pause warning:', err);
      }
    } else {
      pendingPlayRef.current = nextState;
    }
  };

  const handleRepeatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRepeatNotice(true);
    setTimeout(() => setRepeatNotice(false), 3500);
  };

  return (
    <div className="relative">
      {/* COMPACT CAPSULE BAR IN NAVBAR (NEXT TO MASTER CMS) */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-950/90 border border-amber-500/35 backdrop-blur-md shadow-lg shadow-black/60 group">
        
        {/* DISC ICON & "THE GOD CYPHER" ALBUM TITLE: Clicking toggles Play & Stop! */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex items-center gap-1.5 text-xs text-amber-400 font-mono hover:text-amber-300 transition-colors cursor-pointer group/disc focus:outline-none"
          title={isPlaying ? "Clicca per mettere in Pausa (Album The God Cypher)" : "Clicca per Avviare la Riproduzione (Album The God Cypher)"}
          aria-label={isPlaying ? "Pausa The God Cypher" : "Riproduci The God Cypher"}
        >
          <div className="relative flex items-center justify-center">
            <Disc 
              className={`w-4 h-4 text-emerald-400 transition-transform ${isPlaying ? 'animate-spin' : 'group-hover/disc:rotate-45'}`} 
              style={{ animationDuration: '2.5s' }} 
            />
            {isPlaying && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute animate-ping" />
            )}
          </div>
          <span className="hidden xl:inline tracking-wider font-bold uppercase text-[11px] text-white group-hover/disc:text-amber-300">
            THE GOD CYPHER
          </span>
        </button>

        {/* DYNAMIC SPECTRUM VU METER: Clicking ALSO toggles Play & Stop! */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex items-end gap-0.5 sm:gap-1 h-5 w-18 sm:w-26 px-1 cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
          aria-label={isPlaying ? "VU Meter attivo - Clicca per Pausa" : "VU Meter a riposo - Clicca per Avviare"}
          title={isPlaying ? "VU Meter attivo — Clicca per mettere in pausa" : "VU Meter a riposo — Clicca per riprodurre"}
        >
          {meterBars.map((height, i) => {
            const isHigh = height > 80;
            const isMid = height > 48;
            return (
              <div
                key={i}
                className={`w-1 rounded-t transition-all duration-75 ease-out ${
                  !isPlaying 
                    ? 'bg-amber-500/30' 
                    : isHigh 
                      ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.95)]' 
                      : isMid 
                        ? 'bg-emerald-400' 
                        : 'bg-amber-500'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </button>

        {/* DEDICATED PLAY/STOP BUTTON: 0ms visual latency, immediately flips icon & starts animation */}
        {interactive && (
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Pausa riproduzione Spotify' : 'Riproduci direttamente album Spotify'}
            title={isPlaying ? 'Pausa' : 'Riproduci direttamente album Spotify'}
            className={`p-1.5 rounded-full transition-all duration-300 cursor-pointer shadow-md focus:outline-none ${
              isPlaying 
                ? 'bg-emerald-500 text-black shadow-emerald-500/50 hover:bg-emerald-400 scale-105 ring-2 ring-emerald-400/50' 
                : 'bg-neutral-900 text-emerald-400 hover:text-white hover:bg-neutral-800 border border-emerald-500/50 hover:scale-105'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-black" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>
        )}

        {/* Continuous Loop Badge */}
        <button
          type="button"
          onClick={handleRepeatClick}
          className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 cursor-pointer transition-all hover:bg-emerald-500/30 focus:outline-none"
          title="Riproduzione a ripetizione continua (Loop)"
        >
          <Repeat className="w-2.5 h-2.5" />
          <span>LOOP</span>
        </button>

        {/* Expand / Collapse Chevron Button for Spotify sheet */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-neutral-400 hover:text-emerald-400 transition-colors p-1 rounded-full hover:bg-neutral-900 cursor-pointer flex items-center gap-0.5 focus:outline-none"
          title={isExpanded ? 'Chiudi scheda Spotify' : 'Apri dettagli player Spotify'}
          aria-label={isExpanded ? 'Chiudi player Spotify' : 'Apri player Spotify'}
        >
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* PERSISTENT SPOTIFY EMBED CONTROLLER CONTAINER */}
      {/* Kept permanently mounted in the active DOM so closing the sheet NEVER stops the audio playback! */}
      <div 
        className={
          isExpanded
            ? "absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-3xl bg-neutral-950/98 border border-emerald-500/40 backdrop-blur-2xl p-5 shadow-2xl shadow-black z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            : "absolute right-0 top-full pointer-events-none w-0 h-0 overflow-hidden opacity-0"
        }
        aria-hidden={!isExpanded}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`} />
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              SPOTIFY • THE GOD CYPHER
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-neutral-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded hover:bg-neutral-900 cursor-pointer"
            title="Chiudi tendina (L'audio continua a suonare in background)"
          >
            Chiudi
          </button>
        </div>

        {/* Active playback status banner */}
        <div className="my-2.5 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-bold">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            {isPlaying ? 'In Riproduzione su Spotify' : 'In Pausa — Premi Play per ascoltare'}
          </span>
          <button
            type="button"
            onClick={handleTogglePlay}
            className="px-2 py-1 rounded bg-emerald-500 text-black font-bold text-[10px] uppercase hover:bg-emerald-400 transition-all cursor-pointer"
          >
            {isPlaying ? 'Pausa' : 'Play Ora'}
          </button>
        </div>

        {/* Volume & Studio Slider */}
        <div className="my-2 p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            aria-label="Volume audio"
          />
          <span className="text-[10px] font-mono text-neutral-400 w-8 text-right shrink-0">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Repeat notice alert */}
        {repeatNotice && (
          <div className="my-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-mono flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 shrink-0" />
            <span>Modalità a ripetizione continua (Loop): riproduce sempre senza interruzioni!</span>
          </div>
        )}

        {/* Track / Album Intro Card */}
        <div className="py-2.5 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-white font-heading font-black text-base flex items-center gap-1.5">
              <span>The God Cypher</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                OFFICIAL SPOTIFY
              </span>
            </h4>
            <p className="text-neutral-400 text-xs font-light mt-0.5">
              Album ufficiale di 171 Studio • Messina, Sicilia
            </p>
          </div>

          <a
            href={spotifyDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 transition-all shrink-0 cursor-pointer"
            title="Apri direttamente nell'applicazione Spotify"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Real Spotify Iframe API Embed Slot */}
        <div className="w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/80 shadow-inner my-2 min-h-[352px]">
          <div id={`spotify-embed-slot-${instanceId}`} className="w-full min-h-[352px]" />
        </div>

        {/* Background notice & External Link */}
        <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Repeat className="w-3.5 h-3.5" />
            <span>Continua a suonare in background</span>
          </span>
          <a
            href={spotifyDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>Apri su Spotify</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Master CMS Quick Link */}
        {isMaster && (
          <div className="mt-3 pt-2 border-t border-neutral-900 text-center">
            <span className="text-[10px] font-mono text-neutral-400">
              Pannello Master: puoi cambiare il link della playlist Spotify in <strong className="text-amber-400">Master CMS ➔ 5. Album "The God Cypher"</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
