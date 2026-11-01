import React, { useEffect, useRef } from 'react';

interface TriangulationMeshCanvasProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'high';
  interactive?: boolean;
  audioPulsing?: boolean;
}

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

export const TriangulationMeshCanvas: React.FC<TriangulationMeshCanvasProps> = ({
  className = '',
  intensity = 'subtle',
  interactive = true,
  audioPulsing = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let points: Point[] = [];
    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };

    // Opacity and density tuned by intensity
    const alphaMultiplier = intensity === 'high' ? 1.0 : intensity === 'medium' ? 0.65 : 0.38;
    const maxDistance = 140;
    const pointSpacing = intensity === 'high' ? 85 : 110;

    const initPoints = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      points = [];

      const cols = Math.ceil(width / pointSpacing) + 2;
      const rows = Math.ceil(height / pointSpacing) + 2;

      for (let i = -1; i <= cols; i++) {
        for (let j = -1; j <= rows; j++) {
          const jitterX = (Math.random() - 0.5) * (pointSpacing * 0.7);
          const jitterY = (Math.random() - 0.5) * (pointSpacing * 0.7);
          const x = i * pointSpacing + jitterX;
          const y = j * pointSpacing + jitterY;

          points.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.5 + 1.0,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    initPoints();

    const handleResize = () => {
      initPoints();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -9999;
      mouse.targetY = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      ctx.clearRect(0, 0, width, height);

      // Audio rhythm simulation multiplier
      const pulse = audioPulsing ? 1.0 + Math.sin(time * 2.2) * 0.12 : 1.0;

      // Update point positions
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.phase += 0.018;

        // Organic harmonic drifting
        p.x = p.originX + Math.sin(p.phase) * 12 * pulse;
        p.y = p.originY + Math.cos(p.phase * 0.8) * 12 * pulse;

        // Mouse elastic repulsion/attraction
        if (mouse.x > -5000) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxMouseDist = 180;

          if (dist < maxMouseDist) {
            const force = (1 - dist / maxMouseDist) * 32;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force;
            p.y -= Math.sin(angle) * force;
          }
        }
      }

      // Draw Triangles and Connecting Edges
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        // Connect with nearby neighbors
        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const edgeAlpha = (1 - dist / maxDistance) * 0.22 * alphaMultiplier;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${edgeAlpha})`; // Warm amber/gold
            ctx.lineWidth = 0.85;
            ctx.stroke();

            // Find a 3rd vertex to form and fill subtle translucent triangles
            for (let k = j + 1; k < points.length; k++) {
              const p3 = points[k];
              const d13 = Math.hypot(p1.x - p3.x, p1.y - p3.y);
              const d23 = Math.hypot(p2.x - p3.x, p2.y - p3.y);

              if (d13 < maxDistance && d23 < maxDistance) {
                const triDist = (dist + d13 + d23) / 3;
                const triAlpha = (1 - triDist / maxDistance) * 0.045 * alphaMultiplier;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.closePath();

                // Subtle gold sheen fill
                ctx.fillStyle = (i + j + k) % 3 === 0
                  ? `rgba(217, 119, 6, ${triAlpha * 1.3})`   // Amber gold
                  : (i + j + k) % 3 === 1
                  ? `rgba(245, 158, 11, ${triAlpha})`       // Pure gold
                  : `rgba(6, 182, 212, ${triAlpha * 0.6})`; // Boutique cyan accent

                ctx.fill();
              }
            }
          }
        }

        // Vertex Dot with micro glow
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${0.45 * alphaMultiplier})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    // Pause rendering when tab is hidden to conserve 100% GPU/CPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intensity, interactive, audioPulsing]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none select-none transition-opacity duration-1000 ${className}`}
      aria-hidden="true"
    />
  );
};
