import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className="container">
          <a href="/" className={styles.brand}>
            <span className={styles.logo}>⬡</span>
            cortexCic
          </a>
        </div>
      </nav>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.content}>
            <p className={styles.kicker}>Estensione Chrome</p>
            <h1 className={styles.title}>Privacy Policy</h1>
            <p className={styles.meta}>Ultimo aggiornamento: 28 aprile 2025</p>

            <section className={styles.section}>
              <h2>1. Informazioni raccolte</h2>
              <p>
                L'estensione Chrome <strong>cortexCic</strong> raccoglie le seguenti informazioni:
              </p>
              <ul>
                <li>
                  <strong>Dati di autenticazione:</strong> nome, indirizzo email e foto profilo forniti da Google al momento del login tramite Google OAuth.
                </li>
                <li>
                  <strong>Note create dall'utente:</strong> testo, tipologia e, se scelto dall'utente, l'URL della pagina web attiva al momento della creazione.
                </li>
              </ul>
              <p>L'estensione non raccoglie dati di navigazione, cronologia, cookie o informazioni su pagine non esplicitamente condivise dall'utente.</p>
            </section>

            <section className={styles.section}>
              <h2>2. Come vengono usati i dati</h2>
              <p>I dati raccolti vengono utilizzati esclusivamente per:</p>
              <ul>
                <li>Autenticare l'utente e associare le note al suo account.</li>
                <li>Salvare e recuperare le note create tramite l'estensione.</li>
                <li>Visualizzare le note nella dashboard cortexCic.</li>
              </ul>
              <p>I dati non vengono venduti, condivisi o utilizzati per profilazione pubblicitaria.</p>
            </section>

            <section className={styles.section}>
              <h2>3. Dove vengono conservati i dati</h2>
              <p>
                I dati sono conservati su <strong>Firebase Firestore</strong> (Google Cloud), gestito da Anthropic e soggetto alla{' '}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy di Firebase
                </a>
                . L'autenticazione avviene tramite <strong>Firebase Authentication</strong> con provider Google.
              </p>
              <p>I dati sono archiviati in data center Google situati nell'Unione Europea o negli Stati Uniti, in conformità con i Termini di Servizio di Google Cloud.</p>
            </section>

            <section className={styles.section}>
              <h2>4. Accesso ai dati</h2>
              <p>
                Ogni utente può accedere esclusivamente alle proprie note. Non è previsto accesso da parte di terzi senza esplicita richiesta dell'utente o obbligo di legge.
              </p>
            </section>

            <section className={styles.section}>
              <h2>5. Permessi Chrome richiesti</h2>
              <p>L'estensione richiede i seguenti permessi:</p>
              <ul>
                <li><strong>tabs:</strong> per leggere l'URL della scheda attiva quando l'utente lo allega manualmente a una nota.</li>
                <li><strong>identity:</strong> per l'autenticazione Google OAuth.</li>
                <li><strong>storage:</strong> per la persistenza locale della sessione.</li>
                <li><strong>sidePanel:</strong> per aprire l'estensione nel pannello laterale del browser.</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>6. Cancellazione dei dati</h2>
              <p>
                Per richiedere la cancellazione del proprio account e di tutti i dati associati, contattaci all'indirizzo:{' '}
                <a href="mailto:anto.cic.127@gmail.com">anto.cic.127@gmail.com</a>.
              </p>
            </section>

            <section className={styles.section}>
              <h2>7. Modifiche alla privacy policy</h2>
              <p>
                Eventuali aggiornamenti a questa policy saranno pubblicati su questa pagina. L'uso continuato dell'estensione dopo la pubblicazione delle modifiche costituisce accettazione della policy aggiornata.
              </p>
            </section>

            <section className={styles.section}>
              <h2>8. Contatti</h2>
              <p>
                Per qualsiasi domanda relativa alla privacy, scrivi a:{' '}
                <a href="mailto:anto.cic.127@gmail.com">anto.cic.127@gmail.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">cortexCic - {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
