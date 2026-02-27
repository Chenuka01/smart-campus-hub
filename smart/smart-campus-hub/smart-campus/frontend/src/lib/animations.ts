import type { Variants, Transition } from 'framer-motion';

// ─── Container / Stagger ───────────────────────────────────────────────────

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

// ─── Individual Items ──────────────────────────────────────────────────────

export const itemVariants: Variants = {
  hidden: { y: 24, opacity: 0, filter: 'blur(4px)' },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 18,
    },
  },
  exit: {
    y: -16,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.2 },
  },
};

// ─── Cards (3D depth) ──────────────────────────────────────────────────────

export const cardVariants: Variants = {
  hidden: { scale: 0.92, opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 140,
      damping: 18,
    },
  },
  exit: {
    scale: 0.95,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
  hover: {
    scale: 1.03,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 12,
    },
  },
};

// ─── Floating Card (3D tilt-ready) ────────────────────────────────────────

export const floatCardVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0, y: 30 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

// ─── Buttons ───────────────────────────────────────────────────────────────

export const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 17 },
  },
  tap: {
    scale: 0.97,
    y: 0,
    transition: { type: 'spring', stiffness: 600, damping: 20 },
  },
};

// ─── Cinematic Page Transitions ───────────────────────────────────────────

export const pageTransition = {
  initial: { opacity: 0, x: -24, filter: 'blur(6px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: 24, filter: 'blur(6px)' },
  transition: {
    duration: 0.35,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,
};

export const slideUpPage: Variants = {
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0, y: -20, filter: 'blur(4px)',
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// ─── Success Celebration ──────────────────────────────────────────────────

export const celebrationVariants: Variants = {
  hidden: { scale: 0, opacity: 0, rotate: -10 },
  visible: {
    scale: [0, 1.3, 0.9, 1.05, 1],
    opacity: 1,
    rotate: [0, 5, -3, 2, 0],
    transition: {
      duration: 0.6,
      times: [0, 0.3, 0.5, 0.7, 1],
      type: 'keyframes',
    },
  },
};

// ─── Error Shake ──────────────────────────────────────────────────────────

export const errorShakeVariants: Variants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

// ─── Breathing (for status indicators) ───────────────────────────────────

export const breathingVariants: Variants = {
  animate: {
    scale: [1, 1.12, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─── Scroll Reveal (stagger for lists) ───────────────────────────────────

export const scrollRevealVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      type: 'spring',
      stiffness: 120,
      damping: 18,
    },
  }),
};

// ─── Slide in from side ───────────────────────────────────────────────────

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30, filter: 'blur(4px)' },
  visible: {
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1, x: 0, filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

// ─── Fade scale ───────────────────────────────────────────────────────────

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

// ─── Stat counter (number reveal) ────────────────────────────────────────

export const statCounterVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 100, damping: 15, delay: 0.1 },
  },
};
