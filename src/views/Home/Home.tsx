import { useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../../db/auth/useAuth';
import { BtnGoogleLogin } from '../../components/BtnGoogleLogin/BtnGoogleLogin';
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
  { title: 'Invita il team', text: 'Aggiungi membri via email. Ogni progetto e privato e accessibile solo ai suoi membri.' },
  { title: 'Gestisci le task', text: 'Usa la board kanban per organizzare il lavoro. Sposta i task tra le colonne con drag & drop.' },
  { title: 'Ricevi notifiche', text: 'Configura i tuoi progetti esterni per inviare notifiche a cortexCic via API key.' },
];

const Home = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/home', { replace: true });
  }, [user, loading, navigate]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set('[data-intro-overlay]', { autoAlpha: 0, display: 'none' });
        return;
      }

      const introTimeline = gsap.timeline();

      introTimeline
        .from('[data-intro-line]', {
          yPercent: 120,
          opacity: 0,
          duration: 0.82,
          stagger: 0.12,
          ease: 'power3.out',
        })
        .from(
          '[data-intro-sub]',
          {
            y: 24,
            opacity: 0,
            duration: 0.58,
            ease: 'power2.out',
          },
          '-=0.35',
        )
        .to('[data-intro-overlay]', {
          autoAlpha: 0,
          duration: 0.68,
          delay: 0.24,
          ease: 'power2.inOut',
        })
        .from(
          '[data-hero-reveal]',
          {
            y: 34,
            opacity: 0,
            duration: 0.66,
            stagger: 0.1,
            ease: 'power2.out',
          },
          '-=0.2',
        );

      gsap.utils.toArray<HTMLElement>('[data-reveal-card]').forEach((element) => {
        gsap.from(element, {
          y: 46,
          opacity: 0,
          duration: 0.76,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 84%',
            once: true,
          },
        });
      });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.introOverlay} data-intro-overlay aria-hidden="true">
        <p className={styles.introKicker}>cortexCic</p>
        <div className={styles.introTitle}>
          <span className={styles.introLine} data-intro-line>
            Welcome to your
          </span>
          <span className={styles.introLine} data-intro-line>
            control center
          </span>
        </div>
        <p className={styles.introSub} data-intro-sub>
          Una sola dashboard per task, team e notifiche real-time.
        </p>
      </div>

      <nav className={styles.nav}>
        <div className="container">
          <div className="d-flex align-items-center justify-content-between gap-3">
            <span className={styles.brand} data-hero-reveal>
              <span className={styles.logo}>⬡</span>
              cortexCic
            </span>
            <div data-hero-reveal>
              <BtnGoogleLogin />
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className="container">
            <div className="row g-4 align-items-end">
              <div className="col-12 col-lg-7">
                <p className={styles.heroTag} data-hero-reveal>
                  Hub per le tue app
                </p>
                <h1 className={styles.heroTitle} data-hero-reveal>
                  Il centro di controllo per <span>tutti i tuoi progetti web</span>
                </h1>
                <p className={styles.heroSub} data-hero-reveal>
                  Organizza il lavoro su board kanban, invita il team e ricevi notifiche dai tuoi servizi esterni,
                  tutto da una sola interfaccia.
                </p>
                <div className={styles.heroActions} data-hero-reveal>
                  <BtnGoogleLogin />
                </div>
              </div>

              <div className="col-12 col-lg-5">
                <div className={styles.statGrid}>
                  <article className={styles.statCard} data-hero-reveal>
                    <span className={`material-symbols-outlined ${styles.statIcon}`}>space_dashboard</span>
                    <h3>Vista unica</h3>
                    <p>Ogni progetto vive nello stesso hub con accessi separati e ruoli chiari.</p>
                  </article>
                  <article className={styles.statCard} data-hero-reveal>
                    <span className={`material-symbols-outlined ${styles.statIcon}`}>swap_vert</span>
                    <h3>Flow veloce</h3>
                    <p>Sposta task in drag and drop e visualizza subito lo stato del team.</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <div className="container">
            <div className="row mb-4">
              <div className="col-12 col-md-8">
                <p className={styles.sectionLabel} data-reveal-card>
                  Funzionalita
                </p>
                <h2 className={styles.sectionTitle} data-reveal-card>
                  Tieni operativo il tuo ecosistema
                </h2>
                <p className={styles.sectionSub} data-reveal-card>
                  Da task management a notifiche real-time, cortexCic cresce insieme ai tuoi prodotti.
                </p>
              </div>
            </div>
            <div className="row g-3">
              {features.map((feature) => (
                <div key={feature.title} className="col-12 col-md-4" data-reveal-card>
                  <article className={styles.featureCard}>
                    <div className={styles.featureIcon}>
                      <span className="material-symbols-outlined">{feature.icon}</span>
                    </div>
                    <h3 className={styles.featureTitle}>{feature.title}</h3>
                    <p className={styles.featureText}>{feature.text}</p>
                    <span className={styles.featureBadge}>{feature.badge}</span>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.howItWorks}>
          <div className="container">
            <div className="row mb-4">
              <div className="col-12 col-md-8">
                <p className={styles.sectionLabel} data-reveal-card>
                  Come funziona
                </p>
                <h2 className={styles.sectionTitle} data-reveal-card>
                  Parti in pochi minuti
                </h2>
              </div>
            </div>
            <div className="row g-4">
              {steps.map((step, index) => (
                <div key={step.title} className="col-12 col-sm-6 col-md-3" data-reveal-card>
                  <article className={styles.stepCard}>
                    <div className={styles.stepNum}>{index + 1}</div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{step.text}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cta} data-reveal-card>
          <div className="container">
            <h2 className={styles.ctaTitle}>Pronto a partire?</h2>
            <p className={styles.ctaSub}>Accedi con Google e crea il tuo primo progetto in un clic.</p>
            <BtnGoogleLogin />
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="container">cortexCic - {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};

export default Home;
