import React from 'react';
import { getAssetUrl } from '../utils/assetPath';

interface BackgroundLayerProps {
  currentPage: string;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({ currentPage }) => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Primary Background Image uploaded by user */}
      <img
        src={getAssetUrl('/assets/aistudio/Gemini_Generated_Image_778pje778pje778p_3e4279d5.jpeg')}
        alt="171 Studio Background"
        className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        style={{
          filter: currentPage === 'home' 
            ? 'brightness(0.85) contrast(1.05)' 
            : 'brightness(0.6) contrast(1.1) blur(1px)',
        }}
      />

      {/* Atmospheric Overlays for studio aesthetic & contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/80" />
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/85" />
      
      {/* Central vignette to blend out ghost background emblem and emphasize foreground 171 logo */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: 'radial-gradient(circle at 50% 32%, rgba(10, 10, 10, 0.88) 0%, rgba(10, 10, 10, 0.7) 35%, transparent 70%)'
        }}
      />
      
      {/* Subtle warm golden ambient glow reflecting the 171 emblem */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-25 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(180, 83, 9, 0.15) 50%, transparent 70%)',
        }}
      />
    </div>
  );
};
