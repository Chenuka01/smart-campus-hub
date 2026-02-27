import { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  intensity?: 'subtle' | 'medium' | 'full';
  className?: string;
}

export default function AnimatedBackground({ intensity = 'medium', className = '' }: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPct = (clientX / innerWidth - 0.5) * 2;
      const yPct = (clientY / innerHeight - 0.5) * 2;
      const blobs = container.querySelectorAll<HTMLElement>('.parallax-blob');
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 0.015;
        blob.style.transform = `translate(${xPct * depth * 60}px, ${yPct * depth * 60}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const opacityMap = {
    subtle: { blob: 0.25, particle: 0.3 },
    medium: { blob: 0.35, particle: 0.45 },
    full: { blob: 0.5, particle: 0.6 },
  };
  const op = opacityMap[intensity];

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {/* Large blobs */}
      <div
        className="parallax-blob absolute rounded-full blur-[120px] transition-transform duration-700 ease-out"
        style={{
          width: '60vw', height: '60vw',
          top: '-20%', left: '-10%',
          background: `radial-gradient(circle, hsla(262, 85%, 55%, ${op.blob}) 0%, transparent 70%)`,
          animation: 'float-blob 22s ease-in-out infinite',
        }}
      />
      <div
        className="parallax-blob absolute rounded-full blur-[100px] transition-transform duration-700 ease-out"
        style={{
          width: '50vw', height: '50vw',
          top: '20%', right: '-15%',
          background: `radial-gradient(circle, hsla(220, 85%, 55%, ${op.blob}) 0%, transparent 70%)`,
          animation: 'float-blob 18s ease-in-out infinite 4s',
        }}
      />
      <div
        className="parallax-blob absolute rounded-full blur-[90px] transition-transform duration-700 ease-out"
        style={{
          width: '45vw', height: '45vw',
          bottom: '-10%', left: '20%',
          background: `radial-gradient(circle, hsla(310, 80%, 55%, ${op.blob}) 0%, transparent 70%)`,
          animation: 'float-blob 25s ease-in-out infinite 8s',
        }}
      />
      <div
        className="parallax-blob absolute rounded-full blur-[80px] transition-transform duration-700 ease-out"
        style={{
          width: '35vw', height: '35vw',
          bottom: '10%', right: '10%',
          background: `radial-gradient(circle, hsla(190, 85%, 50%, ${op.blob * 0.7}) 0%, transparent 70%)`,
          animation: 'float-blob 20s ease-in-out infinite 12s',
        }}
      />

      {/* Liquid glass floating shapes */}
      <div
        className="parallax-blob absolute rounded-[40%] border transition-transform duration-1000 ease-out"
        style={{
          width: '400px', height: '400px',
          top: '10%', right: '5%',
          background: 'rgba(139, 92, 246, 0.04)',
          borderColor: 'rgba(139, 92, 246, 0.08)',
          backdropFilter: 'blur(2px)',
          animation: 'float-slow 12s ease-in-out infinite',
        }}
      />
      <div
        className="parallax-blob absolute rounded-[35%] border transition-transform duration-1000 ease-out"
        style={{
          width: '280px', height: '280px',
          bottom: '15%', left: '8%',
          background: 'rgba(59, 130, 246, 0.04)',
          borderColor: 'rgba(59, 130, 246, 0.08)',
          backdropFilter: 'blur(2px)',
          animation: 'float-slow 15s ease-in-out infinite 5s',
        }}
      />

      {/* Small floating particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="parallax-blob absolute rounded-full transition-transform duration-1000 ease-out"
          style={{
            width: `${6 + (i % 3) * 4}px`,
            height: `${6 + (i % 3) * 4}px`,
            top: `${10 + i * 10}%`,
            left: `${(i * 13) % 90}%`,
            background: i % 3 === 0
              ? `rgba(139, 92, 246, ${op.particle})`
              : i % 3 === 1
              ? `rgba(59, 130, 246, ${op.particle})`
              : `rgba(244, 114, 182, ${op.particle})`,
            boxShadow: `0 0 ${10 + i * 3}px ${i % 3 === 0 ? 'rgba(139,92,246,0.4)' : i % 3 === 1 ? 'rgba(59,130,246,0.4)' : 'rgba(244,114,182,0.4)'}`,
            animation: `float ${5 + i * 0.7}s ease-in-out infinite ${i * 0.8}s`,
          }}
        />
      ))}

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
