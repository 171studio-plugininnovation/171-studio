import React from 'react';

interface StudioWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const StudioWordmark: React.FC<StudioWordmarkProps> = ({ 
  className = '', 
  size = 'xl' 
}) => {
  const sizeClasses = {
    sm: 'h-6 sm:h-8',
    md: 'h-8 sm:h-11',
    lg: 'h-11 sm:h-16',
    xl: 'h-14 sm:h-18 md:h-22 lg:h-26',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      {/* Subtle warm ambient lighting glow matching 171 studio branding */}
      <div 
        className="absolute inset-0 bg-amber-500/15 blur-2xl rounded-full scale-110 pointer-events-none" 
        aria-hidden="true" 
      />

      <svg 
        viewBox="0 0 544 102" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-full overflow-visible drop-shadow-[0_16px_32px_rgba(0,0,0,0.95)]"
        role="img"
        aria-label="STUDIO"
      >
        <defs>
          {/* --- TITANIUM / DARK CHROME METALLIC FINISH (for S, T, U, D) --- */}
          <linearGradient id="studioTitaniumFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A4E57" />
            <stop offset="15%" stopColor="#373B44" />
            <stop offset="35%" stopColor="#23272F" />
            <stop offset="55%" stopColor="#181B20" />
            <stop offset="75%" stopColor="#252A33" />
            <stop offset="90%" stopColor="#14161A" />
            <stop offset="100%" stopColor="#0B0C0E" />
          </linearGradient>

          <linearGradient id="studioTitaniumBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.9" />
            <stop offset="30%" stopColor="#6B7280" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#374151" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0.9" />
          </linearGradient>

          {/* Brushed highlight stroke for chrome top edges */}
          <linearGradient id="studioTitaniumHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D1D5DB" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#9CA3AF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#4B5563" stopOpacity="0.2" />
          </linearGradient>

          {/* --- WARM LUXURY BRUSHED GOLD METALLIC FINISH (for I, O) --- */}
          <linearGradient id="studioGoldFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9D2" />
            <stop offset="12%" stopColor="#FDE047" />
            <stop offset="28%" stopColor="#EAB308" />
            <stop offset="48%" stopColor="#CA8A04" />
            <stop offset="68%" stopColor="#854D0E" />
            <stop offset="85%" stopColor="#422006" />
            <stop offset="100%" stopColor="#1A0D02" />
          </linearGradient>

          <linearGradient id="studioGoldBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#EAB308" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#854D0E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0.95" />
          </linearGradient>

          {/* Golden Specular Edge */}
          <linearGradient id="studioGoldHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.3" />
          </linearGradient>

          {/* Dark 3D Bottom Depth Extrusion Shadow */}
          <linearGradient id="studioExtrusion" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E2024" />
            <stop offset="50%" stopColor="#0F1012" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>

        {/* 3D Extruded Deep Bottom Drop Layer (adds substantial weight matching official 3D render) */}
        <g transform="translate(2.5, 4.5)" fill="url(#studioExtrusion)" opacity="0.95">
          {/* S */}
          <path d="M 84 32 L 84 20 L 70 6 L 24 6 L 10 20 L 10 42 L 24 52 L 68 58 L 84 68 L 84 82 L 70 96 L 24 96 L 10 82 L 10 70 L 26 70 L 26 78 L 34 82 L 60 82 L 68 76 L 68 72 L 56 66 L 22 60 L 10 50 L 10 28 L 24 18 L 60 18 L 68 24 L 68 32 Z" />
          {/* T */}
          <path d="M 100 18 L 108 6 L 176 6 L 184 18 L 184 28 L 176 32 L 152 32 L 152 90 L 144 96 L 132 96 L 126 90 L 126 32 L 106 32 L 100 28 Z" />
          {/* U */}
          <path d="M 198 6 L 222 6 L 222 68 L 228 74 L 246 74 L 252 68 L 252 6 L 276 6 L 276 74 L 264 96 L 210 96 L 198 74 Z" />
          {/* D */}
          <path fillRule="evenodd" d="M 292 6 L 350 6 L 376 32 L 376 70 L 350 96 L 292 96 Z M 316 28 L 316 74 L 342 74 L 352 64 L 352 38 L 342 28 Z" />
          {/* I */}
          <path d="M 394 16 L 404 6 L 428 6 L 438 16 L 438 24 L 430 30 L 426 30 L 426 72 L 430 72 L 438 78 L 438 86 L 428 96 L 404 96 L 394 86 L 394 78 L 402 72 L 406 72 L 406 30 L 402 30 L 394 24 Z" />
          {/* O */}
          <path fillRule="evenodd" d="M 474 6 L 514 6 L 534 26 L 534 76 L 514 96 L 474 96 L 454 76 L 454 26 Z M 482 28 L 506 28 L 514 36 L 514 66 L 506 74 L 482 74 L 474 66 L 474 36 Z" />
        </g>

        {/* --- LETTERS S, T, U, D: Dark Titanium / Black Brushed Chrome --- */}
        <g fill="url(#studioTitaniumFace)" stroke="url(#studioTitaniumBevel)" strokeWidth="1.6" strokeLinejoin="miter">
          {/* S - Clean, distinct octagonal S with sharp 45° cuts */}
          <path 
            d="M 84 32 
               L 84 20 
               L 70 6 
               L 24 6 
               L 10 20 
               L 10 42 
               L 24 52 
               L 68 58 
               L 84 68 
               L 84 82 
               L 70 96 
               L 24 96 
               L 10 82 
               L 10 70 
               L 26 70 
               L 26 78 
               L 34 82 
               L 60 82 
               L 68 76 
               L 68 72 
               L 56 66 
               L 22 60 
               L 10 50 
               L 10 28 
               L 24 18 
               L 60 18 
               L 68 24 
               L 68 32 
               Z" 
          />

          {/* T - Heavy chamfered top bar and powerful stem */}
          <path 
            d="M 100 18 
               L 108 6 
               L 176 6 
               L 184 18 
               L 184 28 
               L 176 32 
               L 152 32 
               L 152 90 
               L 144 96 
               L 132 96 
               L 126 90 
               L 126 32 
               L 106 32 
               L 100 28 
               Z" 
          />

          {/* U - Powerful vertical pillars and 45° base chamfers */}
          <path 
            d="M 198 6 
               L 222 6 
               L 222 68 
               L 228 74 
               L 246 74 
               L 252 68 
               L 252 6 
               L 276 6 
               L 276 74 
               L 264 96 
               L 210 96 
               L 198 74 
               Z" 
          />

          {/* D - Sharp spine with chamfered polygonal loop */}
          <path 
            fillRule="evenodd"
            d="M 292 6 
               L 350 6 
               L 376 32 
               L 376 70 
               L 350 96 
               L 292 96 
               Z 
               M 316 28 
               L 316 74 
               L 342 74 
               L 352 64 
               L 352 38 
               L 342 28 
               Z" 
          />
        </g>

        {/* --- LETTERS I, O: Warm Brushed Gold Metallic --- */}
        <g fill="url(#studioGoldFace)" stroke="url(#studioGoldBevel)" strokeWidth="1.6" strokeLinejoin="miter">
          {/* I - Distinctive chiseled letter I with top and bottom serifs */}
          <path 
            d="M 394 16 
               L 404 6 
               L 428 6 
               L 438 16 
               L 438 24 
               L 430 30 
               L 426 30 
               L 426 72 
               L 430 72 
               L 438 78 
               L 438 86 
               L 428 96 
               L 404 96 
               L 394 86 
               L 394 78 
               L 402 72 
               L 406 72 
               L 406 30 
               L 402 30 
               L 394 24 
               Z" 
          />

          {/* O - Bold geometric octagonal ring matching 171 geometry */}
          <path 
            fillRule="evenodd"
            d="M 474 6 
               L 514 6 
               L 534 26 
               L 534 76 
               L 514 96 
               L 474 96 
               L 454 76 
               L 454 26 
               Z 
               M 482 28 
               L 506 28 
               L 514 36 
               L 514 66 
               L 506 74 
               L 482 74 
               L 474 66 
               L 474 36 
               Z" 
          />
        </g>

        {/* Top Edge Specular Highlights */}
        <g stroke="white" strokeOpacity="0.4" strokeWidth="0.8">
          <line x1="26" y1="7" x2="68" y2="7" />
          <line x1="110" y1="7" x2="174" y2="7" />
          <line x1="200" y1="7" x2="220" y2="7" />
          <line x1="254" y1="7" x2="274" y2="7" />
          <line x1="294" y1="7" x2="348" y2="7" />
          <line x1="406" y1="7" x2="426" y2="7" stroke="url(#studioGoldHighlight)" strokeOpacity="0.8" />
          <line x1="476" y1="7" x2="512" y2="7" stroke="url(#studioGoldHighlight)" strokeOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
};
