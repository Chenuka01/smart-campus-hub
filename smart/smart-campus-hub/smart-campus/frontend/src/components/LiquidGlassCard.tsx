import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import './LiquidGlassCard.css';

interface LiquidGlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function LiquidGlassCard({ children, className = '' }: LiquidGlassCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`liquid-glass-card ${className}`}
    >
      <div className="card-content">
        {children}
      </div>
      <div className="reflection"></div>
    </motion.div>
  );
}
