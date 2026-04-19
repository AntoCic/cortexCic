import { useEffect, useState, useRef, useId, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  Reorder,
  useAnimate,
  useScroll,
  useMotionValue,
  useTransform,
  useSpring,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import styles from './MotionShowcase.module.css';

/* ─── Spring configs ──────────────────────────────────────────────────────── */

const SP = {
  bouncy: { type: 'spring', stiffness: 500, damping: 15 },
  default: { type: 'spring', stiffness: 300, damping: 24 },
  stiff: { type: 'spring', stiffness: 700, damping: 30 },
  snappy: { type: 'tween', duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
} as const;

/* ─── Shared variants ─────────────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: SP.default },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 64, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: i * 0.035, type: 'spring', stiffness: 380, damping: 18 },
  }),
};

const gridCell: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotate: -20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { delay: (i % 20) * 0.045, type: 'spring', stiffness: 400, damping: 22 },
  }),
};

const slideVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 260 : -260, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: SP.default },
  exit: (dir: number) => ({
    x: dir > 0 ? -260 : 260,
    opacity: 0,
    transition: SP.snappy,
  }),
};

const counterVariants: Variants = {
  enter: (dir: number) => ({ y: dir > 0 ? 26 : -26, opacity: 0, filter: 'blur(3px)' }),
  center: { y: 0, opacity: 1, filter: 'blur(0px)', transition: SP.default },
  exit: (dir: number) => ({ y: dir > 0 ? -24 : 24, opacity: 0, filter: 'blur(3px)', transition: SP.snappy }),
};

/* ─── Particles ───────────────────────────────────────────────────────────── */

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: Math.random() * 3.5 + 1,
  x: Math.random() * 100,
  y: Math.random() * 100,
  dur: Math.random() * 12 + 8,
  delay: Math.random() * 6,
  dx: (Math.random() - 0.5) * 40,
  dy: (Math.random() - 0.5) * 40,
}));

/* ─── TiltCard ────────────────────────────────────────────────────────────── */

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-12, 12]);
  const shineX = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const shineY = useTransform(my, [-0.5, 0.5], [0, 100]);
  const shine = useTransform([shineX, shineY], ([sx, sy]) =>
    `radial-gradient(circle at ${sx as number}% ${sy as number}%, rgba(255,255,255,0.18) 0%, transparent 55%)`
  );

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      transition={SP.stiff as object}
    >
      <motion.div className={styles.tiltShine} style={{ background: shine }} />
      {children}
    </motion.div>
  );
}

/* ─── MagneticButton ──────────────────────────────────────────────────────── */

function MagneticButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 280, damping: 18 });
  const sy = useSpring(my, { stiffness: 280, damping: 18 });

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width / 2) * 0.45);
    my.set((e.clientY - r.top - r.height / 2) * 0.45);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      className={`${styles.magneticBtn} ${className ?? ''}`}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </motion.button>
  );
}

/* ─── SpringBall ──────────────────────────────────────────────────────────── */

function SpringBall({
  label,
  config,
  color,
}: {
  label: string;
  config: object;
  color: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <div className={styles.springCard}>
      <div className={styles.springTrack}>
        <motion.div
          className={styles.springBall}
          style={{ background: color }}
          animate={{ y: active ? 80 : 0, scale: active ? 0.85 : 1 }}
          transition={config}
        />
      </div>
      <p className={styles.springLabel}>{label}</p>
      <button
        type="button"
        className={styles.springBtn}
        onPointerDown={() => setActive(true)}
        onPointerUp={() => setActive(false)}
        onPointerLeave={() => setActive(false)}
      >
        Hold
      </button>
    </div>
  );
}

/* ─── Tabs content ────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'enter', label: 'Enter', icon: 'login', text: 'Elements slide and fade in smoothly when they mount. AnimatePresence tracks mount/unmount to coordinate timing.' },
  { id: 'exit', label: 'Exit', icon: 'logout', text: 'When a component unmounts, AnimatePresence holds it in the DOM until its exit animation completes before removal.' },
  { id: 'mode', label: 'Mode', icon: 'swap_horiz', text: 'Set mode="wait" to ensure the exiting element fully leaves before the entering element starts its animation.' },
];

/* ─── Scroll cards ────────────────────────────────────────────────────────── */

const SCROLL_CARDS = [
  { icon: 'bolt', label: 'Lightning fast', color: '#f59e0b' },
  { icon: 'gesture', label: 'Gesture driven', color: '#ec4899' },
  { icon: 'auto_awesome', label: 'Spring physics', color: '#8b5cf6' },
  { icon: 'layers', label: 'Layout magic', color: '#06b6d4' },
  { icon: 'route', label: 'Path drawing', color: '#10b981' },
  { icon: 'hub', label: 'Orchestration', color: '#f97316' },
];

/* ─── Layout items ────────────────────────────────────────────────────────── */

const LAYOUT_ITEMS = [
  { id: 'a', label: 'Shared layout', icon: 'compare_arrows' },
  { id: 'b', label: 'Fluid resize', icon: 'open_in_full' },
  { id: 'c', label: 'FLIP technique', icon: 'flip' },
];

const ALERTS = [
  { id: 'net', icon: 'wifi_tethering', title: 'Network spike', text: 'Latency oltre 320ms per 3 minuti.' },
  { id: 'err', icon: 'error', title: 'Runtime error', text: '5 exception su /project/:id/tasks.' },
  { id: 'dep', icon: 'deployed_code', title: 'Deploy ready', text: 'Build green, pronto al roll-out.' },
];

const REORDER_ITEMS = [
  { id: 'task-1', title: 'Landing animation polish', icon: 'movie', eta: 'ETA 1d', tone: '#39d7ff' },
  { id: 'task-2', title: 'Onboarding micro-interactions', icon: 'emoji_people', eta: 'ETA 2d', tone: '#2ae7b9' },
  { id: 'task-3', title: 'Dashboard loading skeletons', icon: 'view_in_ar', eta: 'ETA 1d', tone: '#f6b73e' },
  { id: 'task-4', title: 'Notifications transition system', icon: 'notifications_active', eta: 'ETA 3d', tone: '#ff7a8f' },
];

const HORIZONTAL_PANELS = [
  {
    id: 'h-1',
    icon: 'motion_photos_on',
    title: 'Hero Products',
    text: 'Sezione orizzontale ampia con focus prodotto e visual storytelling.',
    chips: ['pinned', 'scroll-x', 'touch-ready'],
  },
  {
    id: 'h-2',
    icon: 'view_carousel',
    title: 'Narrative Sections',
    text: 'Ogni pannello entra in sequenza mentre lo scroll verticale pilota il movimento orizzontale.',
    chips: ['parallax feel', 'clean flow', 'immersive'],
  },
  {
    id: 'h-3',
    icon: 'speed',
    title: 'Performance',
    text: 'Niente librerie extra: solo Framer Motion + CSS sticky per una resa fluida.',
    chips: ['framer only', 'no gsap', 'low overhead'],
  },
  {
    id: 'h-4',
    icon: 'ads_click',
    title: 'CTA Focus',
    text: 'L’ultimo pannello chiude la narrazione e guida verso l’azione con messaggio forte.',
    chips: ['conversion', 'story end', 'showcase'],
  },
];

const STICKY_STEPS = [
  {
    id: 'hook',
    icon: 'movie_filter',
    title: 'Hero hook',
    text: 'Il messaggio iniziale entra forte, con headline, visual e micro-copy sincronizzati.',
    tone: '#39d7ff',
  },
  {
    id: 'proof',
    icon: 'verified',
    title: 'Credibility block',
    text: 'Subito dopo il gancio, mostri prove sociali e vantaggi chiave con reveal progressivi.',
    tone: '#2ae7b9',
  },
  {
    id: 'catalog',
    icon: 'shop_2',
    title: 'Catalog spotlight',
    text: 'Le card prodotto scorrono e si animano mantenendo sempre il contesto del brand a sinistra.',
    tone: '#f6b73e',
  },
  {
    id: 'cta',
    icon: 'campaign',
    title: 'Strong CTA',
    text: 'Nel momento finale, call-to-action e urgenza vengono enfatizzate con transizioni pulite.',
    tone: '#ff7a8f',
  },
];

/* ─── Mosaic colors ───────────────────────────────────────────────────────── */

const MOSAIC = [
  '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#ec4899', '#f472b6', '#fb7185', '#fda4af',
  '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc',
  '#10b981', '#34d399', '#6ee7b7', '#a7f3d0',
  '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a',
];

/* ─── SVG path ────────────────────────────────────────────────────────────── */

const CIRCUIT_PATH =
  'M20,100 L60,100 L60,40 L140,40 L140,80 L200,80 L200,120 L260,120 L260,60 L320,60 L320,140 L200,140 L200,170 L140,170 L140,120 L60,120 L60,160 L20,160 Z';

const WAVE_PATH =
  'M0,80 C40,20 80,140 120,80 C160,20 200,140 240,80 C280,20 320,140 360,80 C400,20 440,140 480,80';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main component                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MotionShowcase = () => {
  const reduced = useReducedMotion();
  const reducedMotion = Boolean(reduced);
  const uid = useId();
  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.2 });
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.78]);
  const [introVisible, setIntroVisible] = useState(true);

  /* AnimatePresence tabs */
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(1);

  function goTab(i: number) {
    setDirection(i > activeTab ? 1 : -1);
    setActiveTab(i);
  }

  /* Layout expansion */
  const [expanded, setExpanded] = useState<string | null>(null);

  /* Stagger replay */
  const [staggerKey, setStaggerKey] = useState(0);

  /* Drag snap */
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  /* Parallax */
  const parallaxRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const layer1x = useSpring(useTransform(mouseX, [-1, 1], [-18, 18]), { stiffness: 80, damping: 20 });
  const layer1y = useSpring(useTransform(mouseY, [-1, 1], [-18, 18]), { stiffness: 80, damping: 20 });
  const layer2x = useSpring(useTransform(mouseX, [-1, 1], [-36, 36]), { stiffness: 60, damping: 18 });
  const layer2y = useSpring(useTransform(mouseY, [-1, 1], [-36, 36]), { stiffness: 60, damping: 18 });
  const layer3x = useSpring(useTransform(mouseX, [-1, 1], [-54, 54]), { stiffness: 40, damping: 16 });
  const layer3y = useSpring(useTransform(mouseY, [-1, 1], [-54, 54]), { stiffness: 40, damping: 16 });

  function onParallaxMove(e: React.MouseEvent) {
    if (!parallaxRef.current) return;
    const r = parallaxRef.current.getBoundingClientRect();
    mouseX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    mouseY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }
  function onParallaxLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  /* SVG draw toggle */
  const [drawn, setDrawn] = useState(false);

  /* Swipe-to-dismiss */
  const [alerts, setAlerts] = useState(ALERTS);

  /* Imperative sequence */
  const [sequenceScope, animateSequence] = useAnimate();
  const [sequenceRunning, setSequenceRunning] = useState(false);

  /* Flip counter */
  const [counterValue, setCounterValue] = useState(68);
  const [counterDirection, setCounterDirection] = useState(1);

  function shiftCounter(delta: number) {
    setCounterDirection(delta >= 0 ? 1 : -1);
    setCounterValue((prev) => Math.max(0, Math.min(100, prev + delta)));
  }

  function randomCounter() {
    setCounterValue((prev) => {
      const next = Math.floor(Math.random() * 101);
      setCounterDirection(next >= prev ? 1 : -1);
      return next;
    });
  }

  /* Reorder list */
  const [reorderItems, setReorderItems] = useState(REORDER_ITEMS);

  /* Framer horizontal pinned section */
  const horizontalRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: horizontalProgress } = useScroll({
    target: horizontalRef,
    offset: ['start start', 'end end'],
  });
  const horizontalX = useTransform(
    horizontalProgress,
    [0, 1],
    ['0%', `-${(HORIZONTAL_PANELS.length - 1) * 100}%`]
  );
  const horizontalXSpring = useSpring(horizontalX, { stiffness: 120, damping: 26, mass: 0.26 });
  const horizontalProgressSpring = useSpring(horizontalProgress, { stiffness: 180, damping: 30, mass: 0.22 });
  const [activeHorizontal, setActiveHorizontal] = useState(0);

  useEffect(() => {
    const lastIndex = HORIZONTAL_PANELS.length - 1;
    const unsub = horizontalProgress.on('change', (value) => {
      const next = Math.max(0, Math.min(lastIndex, Math.round(value * lastIndex)));
      setActiveHorizontal(next);
    });
    return () => {
      unsub();
    };
  }, [horizontalProgress]);

  const horizontalStyle = {
    ['--panel-count' as string]: HORIZONTAL_PANELS.length,
  } as CSSProperties;

  async function runSequence() {
    if (sequenceRunning || reducedMotion) return;
    setSequenceRunning(true);
    await animateSequence('.sequenceSpark', { scale: [1, 1.24, 1], rotate: [0, 14, -10, 0] }, { duration: 0.55 });
    await animateSequence(
      '.sequenceMeta',
      { opacity: [0.65, 1, 0.85], y: [0, -6, 0] },
      { duration: 0.5, ease: 'easeInOut' }
    );
    await animateSequence(
      '.sequenceCard',
      { boxShadow: ['0 10px 24px rgba(0,0,0,0.25)', '0 22px 52px rgba(57,215,255,0.35)', '0 10px 24px rgba(0,0,0,0.25)'] },
      { duration: 0.8, ease: 'easeInOut' }
    );
    setSequenceRunning(false);
  }

  const heroTitle = 'Framer Motion';

  return (
    <div className={styles.root}>
      <AnimatePresence>
        {!reducedMotion && introVisible && (
          <motion.div
            className={styles.pageIntro}
            initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            animate={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
            transition={{ duration: 1.25, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setIntroVisible(false)}
            onClick={() => setIntroVisible(false)}
          >
            <motion.div
              className={styles.pageIntroCard}
              initial={{ y: 22, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={styles.pageIntroDot} aria-hidden="true" />
              <strong>Motion Showcase</strong>
              <p>Entering experience · tap per skip</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.scrollProgress}
        style={{ scaleX: progressX }}
        aria-hidden="true"
      />

      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.backLink} aria-label="Torna alla home non autenticata">
          <span className="material-symbols-outlined">arrow_back</span>
          Home
        </Link>
        <span className={styles.navBrand}>
          <span className={styles.navDot} /> Motion Showcase
        </span>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          §1 HERO — letter-by-letter + floating particles
      ══════════════════════════════════════════════════════════════════ */}
      <section className={styles.hero}>
        {/* Particles */}
        {!reduced && PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className={styles.particle}
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              x: [0, p.dx, 0],
              y: [0, p.dy, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Gradient orbs */}
        <motion.div
          className={`${styles.orb} ${styles.orb1}`}
          animate={reduced ? {} : { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={`${styles.orb} ${styles.orb2}`}
          animate={reduced ? {} : { scale: [1.2, 1, 1.2], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className={styles.heroContent}
          style={reduced ? undefined : { scale: heroScale, opacity: heroOpacity }}
        >
          <motion.div
            className={styles.heroBadge}
            initial={reduced ? {} : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, ...SP.bouncy }}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Interactive Showcase
          </motion.div>

          {/* Animated title */}
          <h1 className={styles.heroTitle} aria-label={heroTitle}>
            {heroTitle.split('').map((char, i) => (
              <motion.span
                key={`${uid}-${i}`}
                className={char === ' ' ? styles.letterSpace : styles.letter}
                variants={letterVariants}
                custom={i}
                initial={reduced ? 'visible' : 'hidden'}
                animate="visible"
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className={styles.heroSub}
            initial={reduced ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, ...SP.default }}
          >
            10 sezioni interattive. Ogni feature di Framer Motion, messa in scena.
            <br />
            Scrolla, trascina, hovera, clicca.
          </motion.p>

          <motion.div
            className={styles.heroPills}
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {['Springs', 'Gestures', 'Scroll', 'Presence', 'Layout', 'SVG', 'Keyframes', 'Parallax'].map((t, i) => (
              <motion.span
                key={t}
                className={styles.pill}
                initial={reduced ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.06, ...SP.default }}
              >
                {t}
              </motion.span>
            ))}
            {reduced && <span className={styles.pill}>Reduced Motion ON</span>}
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          §2 SPRINGS — three spring personalities
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Spring Physics</span>
          <h2 className={styles.sectionTitle}>Tre personalità diverse</h2>
          <p className={styles.sectionSub}>
            Tieni premuto <strong>Hold</strong> per spostare la pallina. Senti la differenza fisica di ogni spring.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.springsRow}>
          <SpringBall label="Bouncy — stiffness 500, damping 15" config={SP.bouncy} color="linear-gradient(135deg,#ec4899,#f97316)" />
          <SpringBall label="Default — stiffness 300, damping 24" config={SP.default} color="linear-gradient(135deg,#7c3aed,#06b6d4)" />
          <SpringBall label="Stiff — stiffness 700, damping 30" config={SP.stiff} color="linear-gradient(135deg,#10b981,#22d3ee)" />
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §3 GESTURES — drag, tilt, magnetic
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Gestures</span>
          <h2 className={styles.sectionTitle}>Drag. Hover. Tilt. Tap.</h2>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.gesturesGrid}>
          {/* Drag */}
          <div className={styles.gestureCard}>
            <p className={styles.gestureCardLabel}>Drag con constraints</p>
            <div className={styles.dragZone} ref={dragConstraintsRef}>
              <motion.div
                className={styles.dragBall}
                drag
                dragConstraints={dragConstraintsRef}
                dragElastic={0.25}
                whileDrag={{ scale: 1.2, boxShadow: '0 0 32px rgba(124,58,237,0.7)' }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="material-symbols-outlined">drag_pan</span>
              </motion.div>
            </div>
          </div>

          {/* 3D Tilt */}
          <TiltCard className={styles.gestureCard}>
            <p className={styles.gestureCardLabel}>3D Tilt card</p>
            <div className={styles.tiltContent}>
              <div className={styles.tiltIcon}>
                <span className="material-symbols-outlined">view_in_ar</span>
              </div>
              <p>Muovi il mouse sopra questa card per sentire la prospettiva 3D e l'effetto shine.</p>
            </div>
          </TiltCard>

          {/* Magnetic + tap */}
          <div className={styles.gestureCard}>
            <p className={styles.gestureCardLabel}>Magnetic button</p>
            <div className={styles.magneticZone}>
              <MagneticButton className="">
                <span className="material-symbols-outlined">explore</span>
                Avvicinati
              </MagneticButton>
            </div>
            <p className={styles.gestureTip}>Il bottone segue il cursore nel raggio di influenza</p>
          </div>
        </motion.div>

        {/* Hover/tap row */}
        <motion.div variants={fadeUp} className={styles.hoverRow}>
          {[
            { label: 'whileHover scale', style: 'scaleCard', props: { whileHover: { scale: 1.08 }, whileTap: { scale: 0.96 } } },
            { label: 'whileHover rotate', style: 'rotateCard', props: { whileHover: { rotate: 6 }, whileTap: { rotate: -3 } } },
            { label: 'whileHover glow', style: 'glowCard', props: { whileHover: { boxShadow: '0 0 40px rgba(124,58,237,0.6)' } } },
            { label: 'whileHover lift', style: 'liftCard', props: { whileHover: { y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' } } },
          ].map(({ label, style, props }) => (
            <motion.div key={label} className={`${styles.hoverCard} ${styles[style as keyof typeof styles]}`} transition={SP.stiff as object} {...props}>
              <span>{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §4 SCROLL REVEAL — whileInView stagger
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Scroll Reveal</span>
          <h2 className={styles.sectionTitle}>whileInView — animato al scroll</h2>
          <p className={styles.sectionSub}>Ogni card aspetta che entri nel viewport prima di animarsi.</p>
        </motion.div>

        <div className={styles.scrollGrid}>
          {SCROLL_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              className={styles.scrollCard}
              initial={reduced ? {} : { opacity: 0, y: 48, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.1, ...SP.default }}
              whileHover={{ y: -6, transition: SP.stiff as object }}
            >
              <span className={styles.scrollCardIcon} style={{ color: card.color }}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </span>
              <span>{card.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §5 IMPERATIVE + SWIPE — useAnimate and drag dismiss
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Imperative + Swipe</span>
          <h2 className={styles.sectionTitle}>Sequenze controllate e dismiss gesture</h2>
          <p className={styles.sectionSub}>
            Qui combiniamo <code>useAnimate</code> per una sequenza manuale e swipe cards con threshold.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.advancedGrid}>
          <div className={styles.sequenceHost} ref={sequenceScope}>
            <div className={`${styles.sequenceCard} sequenceCard`}>
              <div className={`${styles.sequenceSpark} sequenceSpark`}>
                <span className="material-symbols-outlined">electric_bolt</span>
              </div>
              <h3>Imperative sequence</h3>
              <p className={`${styles.sequenceMeta} sequenceMeta`}>
                Triggera una coreografia in 3 step: spark, meta e glow finale.
              </p>
              <button
                type="button"
                className={styles.sequenceRunBtn}
                onClick={() => void runSequence()}
                disabled={sequenceRunning || reducedMotion}
              >
                {reduced ? 'Disabled in reduced motion' : sequenceRunning ? 'Running…' : 'Run sequence'}
              </button>
            </div>
          </div>

          <div className={styles.swipeCol}>
            <AnimatePresence>
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className={styles.swipeItem}
                  layout
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  whileDrag={{ scale: 1.02, boxShadow: '0 16px 38px rgba(0,0,0,0.4)' }}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 120) {
                      setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 220, transition: { duration: 0.2 } }}
                  transition={SP.default as object}
                >
                  <span className={styles.swipeIcon}>
                    <span className="material-symbols-outlined">{alert.icon}</span>
                  </span>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              className={styles.swipeReset}
              onClick={() => setAlerts(ALERTS)}
              disabled={alerts.length === ALERTS.length}
            >
              Reset cards
            </button>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §6 ANIMATE PRESENCE — exit animations
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ AnimatePresence</span>
          <h2 className={styles.sectionTitle}>Exit animations orchestrate</h2>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.tabsWrapper}>
          <div className={styles.tabsNav} role="tablist" aria-label="Demo AnimatePresence">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                aria-controls={`tab-panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`${styles.tabBtn} ${i === activeTab ? styles.tabActive : ''}`}
                onClick={() => goTab(i)}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
                {i === activeTab && (
                  <motion.div className={styles.tabUnderline} layoutId="tabUnderline" />
                )}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                role="tabpanel"
                id={`tab-panel-${TABS[activeTab].id}`}
                aria-labelledby={`tab-${TABS[activeTab].id}`}
                className={styles.tabPane}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.6 }}>
                  {TABS[activeTab].icon}
                </span>
                <h3>{TABS[activeTab].label}</h3>
                <p>{TABS[activeTab].text}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §7 LAYOUT ANIMATION — expandable cards
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Layout Animation</span>
          <h2 className={styles.sectionTitle}>FLIP — First Last Invert Play</h2>
          <p className={styles.sectionSub}>Clicca su un item per espanderlo. layout prop calcola automaticamente la transizione.</p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.layoutList}>
          {LAYOUT_ITEMS.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              layoutId={`card-${item.id}`}
              className={`${styles.layoutCard} ${expanded === item.id ? styles.layoutCardExpanded : ''}`}
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              aria-expanded={expanded === item.id}
              transition={SP.default as object}
            >
              <motion.div className={styles.layoutCardHeader} layout="position">
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
                <motion.span
                  className="material-symbols-outlined"
                  animate={{ rotate: expanded === item.id ? 180 : 0 }}
                  transition={SP.default as object}
                  style={{ marginLeft: 'auto', opacity: 0.5 }}
                >
                  expand_more
                </motion.span>
              </motion.div>
              <AnimatePresence>
                {expanded === item.id && (
                  <motion.div
                    className={styles.layoutCardBody}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SP.default as object}
                  >
                    <p>
                      Framer Motion usa la tecnica FLIP per animare le transizioni di layout in modo
                      performante — calcola le posizioni iniziale e finale, poi le interpola con spring physics
                      senza mai bloccare il main thread.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §8 SVG PATH DRAWING
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ SVG Path Drawing</span>
          <h2 className={styles.sectionTitle}>pathLength — disegna ogni forma</h2>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.svgWrapper}>
          <button
            type="button"
            className={styles.svgToggleBtn}
            aria-pressed={drawn}
            onClick={() => setDrawn((d) => !d)}
          >
            <span className="material-symbols-outlined">{drawn ? 'refresh' : 'draw'}</span>
            {drawn ? 'Reset' : 'Draw'}
          </button>

          <svg viewBox="0 0 500 200" className={styles.svgCanvas}>
            <motion.path
              d={CIRCUIT_PATH}
              fill="none"
              stroke="url(#circuitGrad)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
            <motion.path
              d={WAVE_PATH}
              fill="none"
              stroke="url(#waveGrad)"
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: drawn ? 1 : 0, opacity: drawn ? 0.7 : 0 }}
              transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.4 }}
            />
            {/* Dots along the circuit */}
            {[[60, 40], [140, 40], [200, 80], [260, 120], [320, 60], [200, 170], [140, 170], [60, 120]].map(([cx, cy], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={5}
                fill="#7c3aed"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: drawn ? 1 : 0, opacity: drawn ? 1 : 0 }}
                transition={{ delay: drawn ? 1.5 + i * 0.08 : 0, type: 'spring', stiffness: 500, damping: 20 }}
              />
            ))}
            <defs>
              <linearGradient id="circuitGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §9 KEYFRAMES — orbital system + pulse
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Keyframes & Loops</span>
          <h2 className={styles.sectionTitle}>Animate con keyframes infiniti</h2>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.keyframesGrid}>
          {/* Orbital system */}
          <div className={styles.orbitalSystem}>
            <motion.div
              className={styles.orbitalCore}
              animate={reduced ? {} : { scale: [1, 1.15, 1], boxShadow: ['0 0 20px #7c3aed88', '0 0 50px #7c3aedcc', '0 0 20px #7c3aed88'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {[
              { radius: 60, dur: 3, color: '#ec4899', size: 12 },
              { radius: 90, dur: 5, color: '#06b6d4', size: 10 },
              { radius: 120, dur: 8, color: '#f59e0b', size: 8 },
            ].map((orbit, i) => (
              <motion.div
                key={i}
                className={styles.orbitRing}
                style={{ width: orbit.radius * 2, height: orbit.radius * 2 }}
                animate={reduced ? {} : { rotate: 360 }}
                transition={{ duration: orbit.dur, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className={styles.orbitPlanet}
                  style={{ background: orbit.color, width: orbit.size, height: orbit.size }}
                />
              </motion.div>
            ))}
          </div>

          {/* Keyframe color morph */}
          <div className={styles.keyframeCol}>
            <motion.div
              className={styles.colorMorph}
              animate={reduced ? {} : {
                background: [
                  'linear-gradient(135deg, #7c3aed, #ec4899)',
                  'linear-gradient(135deg, #06b6d4, #10b981)',
                  'linear-gradient(135deg, #f59e0b, #f97316)',
                  'linear-gradient(135deg, #7c3aed, #ec4899)',
                ],
                borderRadius: ['12px', '50%', '12px', '50%', '12px'],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
            </motion.div>
            <p>Color morph + border-radius keyframes</p>
          </div>

          {/* Pulse rings */}
          <div className={styles.pulseWrapper}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={styles.pulseRing}
                animate={reduced ? {} : { scale: [1, 2.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.65, ease: 'easeOut' }}
              />
            ))}
            <div className={styles.pulseCore}>
              <span className="material-symbols-outlined">sensors</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §10 PARALLAX — mouse tracking depth
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Parallax</span>
          <h2 className={styles.sectionTitle}>Depth layers seguono il cursore</h2>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className={styles.parallaxStage}
          ref={parallaxRef}
          onMouseMove={onParallaxMove}
          onMouseLeave={onParallaxLeave}
        >
          {/* Layer 0 — static bg text */}
          <div className={styles.parallaxBg}>PARALLAX</div>

          {/* Layer 1 — slow */}
          <motion.div className={`${styles.parallaxLayer} ${styles.parallaxL1}`} style={{ x: layer1x, y: layer1y }}>
            <span className="material-symbols-outlined">public</span>
          </motion.div>

          {/* Layer 2 — medium */}
          <motion.div className={`${styles.parallaxLayer} ${styles.parallaxL2}`} style={{ x: layer2x, y: layer2y }}>
            <span className="material-symbols-outlined">satellite_alt</span>
          </motion.div>

          {/* Layer 3 — fast */}
          <motion.div className={`${styles.parallaxLayer} ${styles.parallaxL3}`} style={{ x: layer3x, y: layer3y }}>
            <span className="material-symbols-outlined">rocket_launch</span>
          </motion.div>

          <p className={styles.parallaxHint}>Sposta il cursore</p>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §11 STAGGER MOSAIC — replay grid
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Stagger Grid</span>
          <h2 className={styles.sectionTitle}>20 celle. Una stagger, tutte diverse.</h2>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.mosaicWrapper}>
          <AnimatePresence mode="wait">
            <motion.div key={staggerKey} className={styles.mosaicGrid}>
              {MOSAIC.map((color, i) => (
                <motion.div
                  key={`${staggerKey}-${i}`}
                  className={styles.mosaicCell}
                  style={{ background: color }}
                  variants={gridCell}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.3, transition: { duration: 0.1 } }}
                  whileHover={{ scale: 1.08, zIndex: 2, boxShadow: `0 0 30px ${color}88` }}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          <motion.button
            type="button"
            className={styles.replayBtn}
            onClick={() => setStaggerKey((k) => k + 1)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="material-symbols-outlined">replay</span>
            Replay
          </motion.button>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §12 FLIP COUNTER — AnimatePresence numeric transitions
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Numeric Motion</span>
          <h2 className={styles.sectionTitle}>Counter con digit flip</h2>
          <p className={styles.sectionSub}>
            Un numero che cambia con transizioni direzionali: perfetto per KPI e dashboard live.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.counterGrid}>
          <div className={styles.counterCard}>
            <span className={styles.counterLabel}>Team Velocity</span>
            <div className={styles.counterDisplay}>
              <AnimatePresence mode="popLayout" custom={counterDirection} initial={false}>
                <motion.span
                  key={counterValue}
                  className={styles.counterValue}
                  custom={counterDirection}
                  variants={counterVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {counterValue}
                </motion.span>
              </AnimatePresence>
              <span className={styles.counterUnit}>pts</span>
            </div>

            <div className={styles.counterMeter}>
              <motion.div
                className={styles.counterMeterFill}
                animate={{ width: `${counterValue}%` }}
                transition={SP.default as object}
              />
            </div>

            <div className={styles.counterActions}>
              <button type="button" className={styles.counterBtn} onClick={() => shiftCounter(-8)}>
                -8
              </button>
              <button type="button" className={styles.counterBtn} onClick={() => shiftCounter(8)}>
                +8
              </button>
              <button type="button" className={styles.counterBtn} onClick={randomCounter}>
                Random
              </button>
            </div>
          </div>

          <motion.div
            className={styles.counterMetaCard}
            whileHover={{ y: -4, boxShadow: '0 16px 36px rgba(0,0,0,0.35)' }}
            transition={SP.default as object}
          >
            <span className="material-symbols-outlined">monitoring</span>
            <h3>Live metric storytelling</h3>
            <p>
              Combina il flip numerico con piccoli delta e sparkline per trasformare una metrica piatta
              in un feedback leggibile e memorabile.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §13 REORDER — drag-to-prioritize list
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Reorder</span>
          <h2 className={styles.sectionTitle}>Drag to prioritize</h2>
          <p className={styles.sectionSub}>
            Trascina le card per cambiare ordine: utile per backlog, roadmap e ranking interattivi.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.reorderShell}>
          <Reorder.Group axis="y" values={reorderItems} onReorder={setReorderItems} className={styles.reorderList}>
            {reorderItems.map((item, index) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className={styles.reorderItem}
                whileDrag={{ scale: 1.02, boxShadow: '0 20px 36px rgba(0,0,0,0.42)' }}
                transition={SP.default as object}
              >
                <span className={styles.reorderRank}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.reorderTone} style={{ background: item.tone }} />
                <div className={styles.reorderBody}>
                  <strong>{item.title}</strong>
                  <span>{item.eta}</span>
                </div>
                <span className="material-symbols-outlined">{item.icon}</span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <p className={styles.reorderHint}>
            Tip: su mobile il drag verticale resta naturale grazie al touch handling nativo.
          </p>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §14 HORIZONTAL SCROLL — snap track with progress
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={`${styles.section} ${styles.sectionAlt}`}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Framer Horizontal</span>
          <h2 className={styles.sectionTitle}>Pinned horizontal section (GSAP-like)</h2>
          <p className={styles.sectionSub}>
            Scrolli verticalmente e una sezione intera scorre in orizzontale in modo progressivo, usando solo Framer Motion.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.horizontalStory} ref={horizontalRef} style={horizontalStyle}>
          <div className={styles.horizontalSticky}>
            <div className={styles.horizontalHud}>
              <span>Scroll Progress</span>
              <div className={styles.horizontalProgressTrack}>
                <motion.div className={styles.horizontalProgressFill} style={{ scaleX: horizontalProgressSpring }} />
              </div>
              <span className={styles.horizontalCounter}>
                {String(activeHorizontal + 1).padStart(2, '0')} / {String(HORIZONTAL_PANELS.length).padStart(2, '0')}
              </span>
            </div>

            <motion.div
              className={styles.horizontalTrack}
              style={{ x: reducedMotion ? '0%' : horizontalXSpring }}
              role="region"
              aria-label="Horizontal pinned narrative"
            >
              {HORIZONTAL_PANELS.map((panel) => (
                <article key={panel.id} className={styles.horizontalPanel}>
                  <span className={styles.horizontalPanelIcon}>
                    <span className="material-symbols-outlined">{panel.icon}</span>
                  </span>
                  <h3>{panel.title}</h3>
                  <p>{panel.text}</p>
                  <div className={styles.horizontalPanelChips}>
                    {panel.chips.map((chip) => (
                      <span key={chip}>{chip}</span>
                    ))}
                  </div>
                </article>
              ))}
            </motion.div>

            <div className={styles.horizontalDots} role="tablist" aria-label="Horizontal progress dots">
              {HORIZONTAL_PANELS.map((panel, i) => (
                <span
                  key={panel.id}
                  role="tab"
                  aria-selected={i === activeHorizontal}
                  className={`${styles.horizontalDot} ${i === activeHorizontal ? styles.horizontalDotActive : ''}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §14b HORIZONTAL CARDS — free scroll demo
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Horizontal Cards</span>
          <h2 className={styles.sectionTitle}>Swipe-friendly rail</h2>
          <p className={styles.sectionSub}>Una rail libera per mobile: ottima per prodotti, recensioni e promo.</p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.freeRail}>
          {HORIZONTAL_PANELS.map((panel) => (
            <article key={`free-${panel.id}`} className={styles.freeRailCard}>
              <span className={styles.freeRailIcon}>
                <span className="material-symbols-outlined">{panel.icon}</span>
              </span>
              <h4>{panel.title}</h4>
              <p>{panel.text}</p>
            </article>
          ))}
        </motion.div>
      </motion.section>

      {/* ══════════════════════════════════════════════════════════════════
          §15 STICKY SIDE — fixed panel + scrolling narrative
      ══════════════════════════════════════════════════════════════════ */}
      <motion.section
        className={styles.section}
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div variants={fadeUp} className={styles.sectionHeader}>
          <span className={styles.sectionLabel}>§ Sticky Side</span>
          <h2 className={styles.sectionTitle}>Lato fisso, contenuto che scorre</h2>
          <p className={styles.sectionSub}>
            Qui il pannello a sinistra resta bloccato, mentre a destra scorrono i blocchi della narrazione.
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className={styles.stickySplit}>
          <aside className={styles.stickyRailWrap}>
            <div className={styles.stickyRail}>
              <span className={styles.stickyRailLabel}>Sticky Context</span>
              <h3>Esperienza guidata per il cliente</h3>
              <p>
                Questa struttura funziona benissimo nei siti vetrina: il messaggio chiave resta sempre visibile,
                mentre il contenuto racconta step-by-step il valore del brand.
              </p>
              <ul className={styles.stickyRailList}>
                {STICKY_STEPS.map((step, i) => (
                  <li key={step.id}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {step.title}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className={styles.stickyFlow}>
            {STICKY_STEPS.map((step, i) => (
              <motion.article
                key={step.id}
                className={styles.stickyStep}
                initial={reduced ? {} : { opacity: 0, y: 34 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.08, ...SP.default }}
                whileHover={{ y: -5, transition: SP.default as object }}
              >
                <span className={styles.stickyStepIcon} style={{ color: step.tone }}>
                  <span className="material-symbols-outlined">{step.icon}</span>
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <Link to="/" className={styles.footerLink}>
          <span className="material-symbols-outlined">arrow_back</span>
          Torna alla Home
        </Link>
        <span className={styles.footerBrand}>cortexCic — Motion Showcase</span>
      </footer>
    </div>
  );
};

export default MotionShowcase;
