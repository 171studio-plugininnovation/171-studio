import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface HardwareTiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt in degrees (default 8)
  glareColor?: 'gold' | 'amber' | 'emerald' | 'cyan' | 'ruby';
  showCornerRivets?: boolean; // boutique hardware chassis rivets in corners
  showSerigraphRim?: boolean; // brushed metallic rim
  isSelected?: boolean;
  isInteractive?: boolean;
}

export const HardwareTiltCard: React.FC<HardwareTiltCardProps> = ({
  children,
  className = '',
  maxTilt = 8,
  glareColor = 'gold',
  showCornerRivets = true,
  showSerigraphRim = true,
  isSelected = false,
  isInteractive = true,
  style,
  ...restProps
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  // Check for prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Update position from coordinates
  const updateCoords = useCallback(
    (clientX: number, clientY: number, factor: number = 1) => {
      if (!isInteractive || prefersReducedMotion || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const posX = clientX - rect.left;
      const posY = clientY - rect.top;

      const normX = Math.max(0, Math.min(1, posX / rect.width));
      const normY = Math.max(0, Math.min(1, posY / rect.height));

      // rotX tilts along horizontal axis (up/down), rotY along vertical axis (left/right)
      const rotX = (0.5 - normY) * maxTilt * 2 * factor;
      const rotY = (normX - 0.5) * maxTilt * 2 * factor;

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setTilt({ x: rotX, y: rotY });
        setGlare({
          x: normX * 100,
          y: normY * 100,
          opacity: 0.85,
        });
      });
    },
    [isInteractive, prefersReducedMotion, maxTilt]
  );

  // Mouse Handlers
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateCoords(e.clientX, e.clientY);
    },
    [updateCoords]
  );

  const handleMouseEnter = useCallback(() => {
    if (!isInteractive) return;
    setIsHovered(true);
  }, [isInteractive]);

  const handleMouseLeave = useCallback(() => {
    if (!isInteractive) return;
    setIsHovered(false);
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      setTilt({ x: 0, y: 0 });
      setGlare((prev) => ({ ...prev, opacity: 0 }));
    });
  }, [isInteractive]);

  // Touch Handlers for Mobile responsiveness
  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        setIsHovered(true);
        updateCoords(e.touches[0].clientX, e.touches[0].clientY, 0.7);
      }
    },
    [updateCoords]
  );

  const handleTouchEnd = useCallback(() => {
    handleMouseLeave();
  }, [handleMouseLeave]);

  // Mobile Device Orientation (Gyroscope) support
  useEffect(() => {
    if (!isInteractive || prefersReducedMotion) return;

    let isMounted = true;
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!isMounted || !cardRef.current || isHovered) return;

      // Only calculate if visible on screen
      const rect = cardRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      const beta = event.beta ?? 0; // [-180, 180] front-to-back tilt
      const gamma = event.gamma ?? 0; // [-90, 90] left-to-right tilt

      // Clamp around natural viewing angle (holding phone at ~45 deg)
      const targetBeta = Math.max(-25, Math.min(25, beta - 45));
      const targetGamma = Math.max(-25, Math.min(25, gamma));

      const rotX = -(targetBeta / 25) * (maxTilt * 0.75);
      const rotY = (targetGamma / 25) * (maxTilt * 0.75);

      const normX = ((targetGamma / 25) + 1) / 2;
      const normY = ((targetBeta / 25) + 1) / 2;

      setTilt({ x: rotX, y: rotY });
      setGlare({
        x: normX * 100,
        y: normY * 100,
        opacity: 0.5,
      });
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [isInteractive, prefersReducedMotion, isHovered, maxTilt]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Specular Glare Gradients
  const glareGradients: Record<string, string> = {
    gold: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(251, 191, 36, 0.22) 0%, rgba(245, 158, 11, 0.08) 35%, rgba(254, 240, 138, 0.02) 65%, transparent 80%)`,
    amber: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.09) 35%, transparent 75%)`,
    emerald: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.08) 35%, transparent 75%)`,
    cyan: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(6, 182, 212, 0.22) 0%, rgba(14, 116, 144, 0.08) 35%, transparent 75%)`,
    ruby: `radial-gradient(circle 350px at ${glare.x}% ${glare.y}%, rgba(244, 63, 94, 0.22) 0%, rgba(190, 18, 60, 0.08) 35%, transparent 75%)`,
  };

  const transformStyle = prefersReducedMotion
    ? undefined
    : `perspective(1000px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(${isHovered ? '6px' : '0px'})`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? 'transform 0.1s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s ease'
          : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease',
        transformStyle: 'preserve-3d',
        ...style,
      }}
      className={`relative group/tilt isolation-auto ${
        showSerigraphRim ? 'border border-neutral-800/90 hover:border-amber-500/50' : ''
      } ${
        isSelected
          ? 'shadow-2xl shadow-amber-500/20 ring-1 ring-amber-400'
          : isHovered
          ? 'shadow-2xl shadow-black/80'
          : 'shadow-xl'
      } ${className}`}
      {...restProps}
    >
      {/* Serigraphic Brushed Metal Rim Highlight */}
      {showSerigraphRim && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `linear-gradient(${135 + tilt.y * 2}deg, rgba(251, 191, 36, ${
              isHovered ? 0.35 : 0.08
            }) 0%, transparent 40%, rgba(255, 255, 255, ${
              isHovered ? 0.08 : 0.02
            }) 60%, rgba(217, 119, 6, ${isHovered ? 0.25 : 0.04}) 100%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Dynamic Specular Glare (Light Reflection following mouse / gyro) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
        style={{
          background: glareGradients[glareColor] || glareGradients.gold,
          opacity: glare.opacity,
          mixBlendMode: 'screen',
        }}
      />

      {/* Corner Hardware Chassis Rivets / Screws */}
      {showCornerRivets && (
        <>
          {/* Top-Left Rivet */}
          <div
            className="pointer-events-none absolute top-3 left-3 w-2 h-2 rounded-full border border-neutral-700/80 bg-neutral-900/90 shadow-inner flex items-center justify-center opacity-30 group-hover/tilt:opacity-85 transition-opacity z-10"
            title="Studio Hardware Rivet"
          >
            <div className="w-1 h-0.5 bg-neutral-500/80 rounded-full" />
          </div>

          {/* Top-Right Rivet */}
          <div
            className="pointer-events-none absolute top-3 right-3 w-2 h-2 rounded-full border border-neutral-700/80 bg-neutral-900/90 shadow-inner flex items-center justify-center opacity-30 group-hover/tilt:opacity-85 transition-opacity z-10"
            title="Studio Hardware Rivet"
          >
            <div className="w-1 h-0.5 bg-neutral-500/80 rounded-full" />
          </div>

          {/* Bottom-Left Rivet */}
          <div
            className="pointer-events-none absolute bottom-3 left-3 w-2 h-2 rounded-full border border-neutral-700/80 bg-neutral-900/90 shadow-inner flex items-center justify-center opacity-30 group-hover/tilt:opacity-85 transition-opacity z-10"
            title="Studio Hardware Rivet"
          >
            <div className="w-1 h-0.5 bg-neutral-500/80 rounded-full" />
          </div>

          {/* Bottom-Right Rivet */}
          <div
            className="pointer-events-none absolute bottom-3 right-3 w-2 h-2 rounded-full border border-neutral-700/80 bg-neutral-900/90 shadow-inner flex items-center justify-center opacity-30 group-hover/tilt:opacity-85 transition-opacity z-10"
            title="Studio Hardware Rivet"
          >
            <div className="w-1 h-0.5 bg-neutral-500/80 rounded-full" />
          </div>
        </>
      )}

      {/* Card Body Content */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
