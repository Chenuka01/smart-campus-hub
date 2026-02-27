import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg ${className}`}
    >
      {children}
    </motion.div>
  );
}
