import type { Variants, Transition } from 'framer-motion';

// Spring presets — more natural than tween for UI
export const springs = {
  default: { type: 'spring', stiffness: 300, damping: 24 } satisfies Transition,
  bouncy:  { type: 'spring', stiffness: 500, damping: 15 } satisfies Transition,
  stiff:   { type: 'spring', stiffness: 700, damping: 30 } satisfies Transition,
  snappy:  { type: 'tween',  duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } satisfies Transition,
} as const;

export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: springs.default },
  exit:    { opacity: 0, y: 16, transition: springs.snappy },
};

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: springs.default },
  exit:    { opacity: 0, transition: springs.snappy },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: springs.default },
  exit:    { opacity: 0, scale: 0.95, transition: springs.snappy },
};

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

export const cardHover: Variants = {
  rest:  { scale: 1,    boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  hover: { scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', transition: springs.stiff },
};
