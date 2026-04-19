import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../db/auth/useAuth';
import { BtnGoogleLogin } from '../../components/BtnGoogleLogin/BtnGoogleLogin';
import { Btn } from '../../components/Btn/Btn';
import { fadeUp, staggerContainer } from '../../styles/motionVariants';
import styles from './Home.module.css';

const features = [
  {
    icon: 'task_alt',
    title: 'Task Board',
    text: 'Kanban board con colonne Todo, In Progress, Done e Blocked. Crea, modifica e sposta i task con drag & drop.',
    badge: 'Disponibile',
  },
  {
    icon: 'notifications_active',
    title: 'Notifiche Push',
    text: 'Ogni progetto genera una API key. I tuoi progetti esterni la usano per inviare notifiche di errore, warning, log o preview link direttamente qui.',
    badge: 'Coming soon',
  },
  {
    icon: 'code',
    title: 'Integrazione GitHub',
    text: 'Collega un repository GitHub al progetto per ricevere aggiornamenti su commit, PR e deployment direttamente nella dashboard.',
    badge: 'Coming soon',
  },
];

const steps = [
  { title: 'Crea un progetto', text: 'Aggiungi un nuovo progetto con nome e descrizione. Ottieni una API key unica.' },
  { title: 'Invita il team', text: 'Aggiungi membri via email. Ogni progetto è privato e accessibile solo ai suoi membri.' },
  { title: 'Gestisci le task', text: 'Usa il kanban board per organizzare il lavoro. Sposta i task tra le colonne con drag & drop.' },
  { title: 'Ricevi notifiche', text: 'Configura i tuoi progetti esterni per inviare notifiche a cortexCic via API key.' },
];

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true });
  }, [user, loading, navigate]);

  const sectionProps = (key: string) =>
    shouldReduceMotion
      ? { key }
      : { key, variants: staggerContainer, initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true } };

  return (
    <div className={styles.root}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between">
            <span className={styles.brand}>
              <span className={styles.logo}>⬡</span>
              cortexCic
            </span>
            <div className={styles.navActions}>
              <Btn
                to="/motion-showcase"
                color="dark"
                version="outline"
                className={styles.motionEntryBtn}
                aria-label="Apri la pagina demo di Framer Motion"
              >
                Motion Lab
              </Btn>
              <Btn
                to="/gsap-showcase"
                color="success"
                version="outline"
                className={styles.gsapEntryBtn}
                aria-label="Apri la pagina demo di GSAP"
              >
                GSAP Lab
              </Btn>
              <BtnGoogleLogin />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        className={styles.hero}
        {...(shouldReduceMotion ? {} : { variants: staggerContainer, initial: 'hidden', animate: 'visible' })}
      >
        <div className="container">
          <motion.div {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.heroTag}>Hub per le tue app</motion.div>
          <motion.h1 {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.heroTitle}>
            Il centro di controllo<br />
            per <span>tutti i tuoi progetti</span>
          </motion.h1>
          <motion.p {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.heroSub}>
            cortexCic è il cortex delle tue applicazioni web: gestisci task, ricevi notifiche push
            dai tuoi progetti e tieni tutto sotto controllo da un unico posto.
          </motion.p>
          <motion.div {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.heroActions}>
            <Btn
              to="/motion-showcase"
              color="dark"
              version="outline"
              className={styles.motionEntryBtn}
              aria-label="Vai alla pagina Motion Lab"
            >
              Esplora Motion Lab
            </Btn>
            <Btn
              to="/gsap-showcase"
              color="success"
              version="outline"
              className={styles.gsapEntryBtn}
              aria-label="Vai alla pagina GSAP Lab"
            >
              Esplora GSAP Lab
            </Btn>
            <BtnGoogleLogin />
          </motion.div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section className={styles.features} {...sectionProps('features')}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12 col-md-6">
              <motion.p {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.sectionLabel}>Funzionalità</motion.p>
              <motion.h2 {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.sectionTitle}>Tutto quello che ti serve</motion.h2>
              <motion.p {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.sectionSub}>
                Da task management a notifiche real-time, cortexCic cresce insieme alle tue app.
              </motion.p>
            </div>
          </div>
          <div className="row g-3">
            {features.map((f) => (
              <motion.div key={f.title} {...(shouldReduceMotion ? {} : { variants: fadeUp })} className="col-12 col-md-4">
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </div>
                  <div className={styles.featureTitle}>{f.title}</div>
                  <div className={styles.featureText}>{f.text}</div>
                  <span className={styles.featureBadge}>{f.badge}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section className={styles.howItWorks} {...sectionProps('how')}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12 col-md-6">
              <motion.p {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.sectionLabel}>Come funziona</motion.p>
              <motion.h2 {...(shouldReduceMotion ? {} : { variants: fadeUp })} className={styles.sectionTitle}>Inizia in pochi minuti</motion.h2>
            </div>
          </div>
          <div className="row g-4">
            {steps.map((s, i) => (
              <motion.div key={s.title} {...(shouldReduceMotion ? {} : { variants: fadeUp })} className="col-12 col-sm-6 col-md-3">
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepTitle}>{s.title}</div>
                <div className={styles.stepText}>{s.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className={styles.cta}
        {...(shouldReduceMotion ? {} : { variants: fadeUp, initial: 'hidden', whileInView: 'visible', viewport: { once: true } })}
      >
        <div className="container">
          <h2 className={styles.ctaTitle}>Pronto a iniziare?</h2>
          <p className={styles.ctaSub}>Accedi con Google e crea il tuo primo progetto in un clic.</p>
          <BtnGoogleLogin />
        </div>
      </motion.section>

      <footer className={styles.footer}>
        <div className="container">cortexCic — {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};

export default Home;
