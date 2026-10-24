import React from 'react';

interface StudioLogoLockupProps {
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

/**
 * StudioLogoLockup: Official 171 STUDIO Artwork
 * Uses the exact file provided by the user (Progetto senza titolo (1).png / Progetto_senza_titolo__1__f219010a.png)
 * containing both the 171 emblem and STUDIO typography unified in the original artwork.
 */
export const StudioLogoLockup: React.FC<StudioLogoLockupProps> = ({
  onClick,
  className = '',
  size = 'hero',
}) => {
  const sizeClass = {
    sm: 'w-28 sm:w-36',
    md: 'w-44 sm:w-56',
    lg: 'w-60 sm:w-72 md:w-80',
    hero: 'w-72 sm:w-88 md:w-[420px] lg:w-[460px]',
  }[size];

  return (
    <div 
      className={`relative inline-flex flex-col items-center justify-center group cursor-pointer transition-transform duration-500 hover:scale-[1.03] active:scale-[0.98] select-none ${className}`}
      onClick={onClick}
      title="171 Studio — Registrazione, Mix & Mastering"
    >
      {/* Warm Ambient Glow behind the logo */}
      <div 
        className="absolute inset-0 bg-radial from-amber-500/25 via-amber-600/10 to-transparent blur-3xl scale-125 pointer-events-none group-hover:from-amber-400/40 transition-all duration-700" 
        aria-hidden="true"
      />

      {/* Official 171 STUDIO PNG directly from Progetto senza titolo (1).png */}
      <div className={`relative ${sizeClass} flex items-center justify-center p-1`}>
        <img
          src="/assets/aistudio/Progetto_senza_titolo__1__f219010a.png"
          alt="171 Studio Logo Ufficiale"
          className="w-full h-auto object-contain transition-all duration-300"
          style={{
            filter: 'drop-shadow(0 0 1.5px #000000) drop-shadow(0 0 3px #000000) drop-shadow(0 20px 40px rgba(0,0,0,0.95))',
          }}
          loading="eager"
        />
      </div>
    </div>
  );
};
