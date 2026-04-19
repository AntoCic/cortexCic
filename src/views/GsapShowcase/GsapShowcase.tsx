import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Btn } from '../../components/Btn/Btn';
import styles from './GsapShowcase.module.css';

const featureCards = [
  {
    icon: 'animation',
    title: 'Timelines avanzate',
    text: 'Sequenze orchestrate con timing preciso, overlap e controllo completo della scena.',
  },
  {
    icon: 'model_training',
    title: 'ScrollTrigger',
    text: 'Pinning, scrub e reveal guidati dallo scroll per esperienze narrative ad alto impatto.',
  },
  {
    icon: 'tune',
    title: 'Controllo granulare',
    text: 'Easing, stagger e property tweening su qualsiasi elemento del DOM.',
  },
];

const horizontalSlides = [
  {
    title: 'Frame 01 · Hero Narrative',
    subtitle: 'Lo scroll verticale guida il movimento orizzontale in modo fluido.',
    tags: ['Pin', 'Scrub', 'Narrative'],
  },
  {
    title: 'Frame 02 · Product Focus',
    subtitle: 'Ogni pannello prende spazio, mantiene focus e rende la storia più chiara.',
    tags: ['Showcase', 'Storytelling', 'Impact'],
  },
  {
    title: 'Frame 03 · Motion System',
    subtitle: 'La transizione tra sezioni rimane coerente grazie al timing condiviso.',
    tags: ['Sequencing', 'System', 'Precision'],
  },
  {
    title: 'Frame 04 · CTA Moment',
    subtitle: 'Dopo la fase orizzontale si rientra nello scroll normale senza stacchi brutti.',
    tags: ['Conversion', 'Flow', 'Finish'],
  },
];

const afterScrollSections = [
  {
    icon: 'view_timeline',
    title: 'Stagger intelligenti',
    text: 'Ingressi a cascata su cards e blocchi testuali con ritmo differenziato desktop/mobile.',
  },
  {
    icon: 'deployed_code',
    title: 'Transizioni di pagina',
    text: 'Puoi estendere questa base per route transitions con overlay, mask reveal e parallax.',
  },
  {
    icon: 'developer_board',
    title: 'Debug & tuning',
    text: 'Con marker e callback è semplice rifinire soglie, performance e leggibilità UX.',
  },
];

const GsapShowcase = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLElement>(null);
  const horizontalViewportRef = useRef<HTMLDivElement>(null);
  const horizontalTrackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set('[data-intro-overlay]', { autoAlpha: 0, display: 'none' });
        return;
      }

      const introTl = gsap.timeline();

      introTl
        .from('[data-intro-line]', {
          yPercent: 120,
          opacity: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: 'power3.out',
        })
        .from(
          '[data-intro-sub]',
          {
            y: 24,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4',
        )
        .to('[data-intro-overlay]', {
          autoAlpha: 0,
          duration: 0.65,
          delay: 0.25,
          ease: 'power2.inOut',
        })
        .from(
          '[data-hero-reveal]',
          {
            y: 38,
            opacity: 0,
            stagger: 0.12,
            duration: 0.65,
            ease: 'power2.out',
          },
          '-=0.2',
        );

      gsap.utils.toArray<HTMLElement>('[data-reveal-card]').forEach((element) => {
        gsap.from(element, {
          y: 44,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 85%',
            once: true,
          },
        });
      });

      const horizontalSection = horizontalSectionRef.current;
      const horizontalViewport = horizontalViewportRef.current;
      const horizontalTrack = horizontalTrackRef.current;

      if (!horizontalSection || !horizontalViewport || !horizontalTrack) return;

      const getScrollDistance = () => Math.max(0, horizontalTrack.scrollWidth - horizontalViewport.clientWidth);

      gsap.from('[data-horizontal-card]', {
        y: 30,
        opacity: 0.45,
        stagger: 0.14,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: horizontalSection,
          start: 'top 70%',
        },
      });

      gsap.to(horizontalTrack, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: horizontalSection,
          start: 'top top',
          end: () => `+=${getScrollDistance() + window.innerHeight * 0.55}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.introOverlay} data-intro-overlay aria-hidden="true">
        <p className={styles.introKicker}>GSAP Experience</p>
        <div className={styles.introTitle}>
          <span className={styles.introLine} data-intro-line>
            Motion on
          </span>
          <span className={styles.introLine} data-intro-line>
            another level
          </span>
        </div>
        <p className={styles.introSub} data-intro-sub>
          Entrata scenica, scroll verticale naturale e showcase orizzontale automatico.
        </p>
      </div>

      <header className={styles.nav}>
        <div className="container d-flex align-items-center justify-content-between gap-2">
          <Link to="/" className={styles.backLink}>
            <span className="material-symbols-outlined">arrow_back</span>
            Torna alla Home
          </Link>
          <div className={styles.navActions}>
            <Btn to="/motion-showcase" color="light" version="outline">
              Motion Lab
            </Btn>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.heroKicker} data-hero-reveal>
              GSAP playground
            </p>
            <h1 className={styles.heroTitle} data-hero-reveal>
              Scroll-driven experience con una sezione laterale pin/scrub e ritorno al flusso normale.
            </h1>
            <p className={styles.heroText} data-hero-reveal>
              Questa pagina è pensata per mostrare il potenziale reale di GSAP in modo pratico: entrata forte,
              sezioni verticali e un punto centrale dove lo scroll passa in automatico in orizzontale.
            </p>
            <div className="row g-3 mt-2">
              {featureCards.map((card) => (
                <div key={card.title} className="col-12 col-md-4" data-reveal-card>
                  <article className={styles.featureCard}>
                    <span className={`material-symbols-outlined ${styles.featureIcon}`}>{card.icon}</span>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.horizontalSection} ref={horizontalSectionRef}>
          <div className="container">
            <div className={styles.horizontalHeader}>
              <p className={styles.sectionLabel}>Horizontal auto-scroll zone</p>
              <h2>Qui lo scroll verticale controlla automaticamente il movimento laterale</h2>
            </div>
          </div>

          <div className={styles.horizontalViewport} ref={horizontalViewportRef}>
            <div className={styles.horizontalTrack} ref={horizontalTrackRef}>
              {horizontalSlides.map((slide, index) => (
                <article key={slide.title} className={styles.horizontalCard} data-horizontal-card>
                  <span className={styles.slideIndex}>0{index + 1}</span>
                  <h4>{slide.title}</h4>
                  <p>{slide.subtitle}</p>
                  <div className={styles.tags}>
                    {slide.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.afterSection}>
          <div className="container">
            <div className={styles.sectionTop}>
              <p className={styles.sectionLabel}>Back to vertical flow</p>
              <h2>Dopo la fase orizzontale, il resto torna a scrollare normalmente</h2>
            </div>
            <div className="row g-3">
              {afterScrollSections.map((item) => (
                <div key={item.title} className="col-12 col-md-4" data-reveal-card>
                  <article className={styles.afterCard}>
                    <span className={`material-symbols-outlined ${styles.afterIcon}`}>{item.icon}</span>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GsapShowcase;
