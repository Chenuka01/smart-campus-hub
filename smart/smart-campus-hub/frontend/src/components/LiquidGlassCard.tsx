import { ReactNode, useRef } from 'react';
import { motion } from 'framer-motion';
import './LiquidGlassCard.css';

interface LiquidGlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  depth?: 1 | 2 | 3;
  glow?: string;
}

export default function LiquidGlassCard({
  children,
  className = '',
  hover = true,
  depth = 2,
  glow,
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    card.style.setProperty('--mouse-x', `${x}%`);
    card.style.setProperty('--mouse-y', `${y}%`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '0%');
  };

  const shadowsByDepth = {
    1: '0 4px 16px rgba(0,0,0,0.3)',
    2: '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset',
    3: '0 16px 48px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.07) inset',
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`liquid-glass-card ${className}`}
      style={{
        boxShadow: glow
          ? `${shadowsByDepth[depth]}, 0 0 24px ${glow}`
          : shadowsByDepth[depth],
      }}
    >
      {/* Mouse-tracking light reflection */}
      <div className="liquid-glass-reflection" />
      {/* Shimmer border */}
      <div className="liquid-glass-shimmer" />
      {/* Content */}
      <div className="card-content relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
