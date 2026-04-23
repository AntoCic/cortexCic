import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getToken } from 'firebase/messaging';
import { messaging } from '../../components/firebase/firebase';
import { VAPID_PUBLIC_KEY } from '../../firebase-config';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUserProfile } from '../../db/auth/authSlice';
import { createUserProfile } from '../../db/users/userRepo';
import { Btn } from '../../components/Btn/Btn';
import { toast } from '../../components/toast/toast';
import { fadeUp } from '../../styles/motionVariants';
import styles from './CompleteProfile.module.css';

const CompleteProfile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user)!;

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setStep(1);
  };

  const requestAndSave = async (skipPush = false) => {
    setSaving(true);
    let fcmToken: string | undefined;

    if (!skipPush) {
      setPermissionState('requesting');
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          fcmToken = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY });
          setPermissionState('granted');
        } else {
          setPermissionState('denied');
        }
      } catch {
        setPermissionState('denied');
      }
    }

    try {
      await createUserProfile(
        user.uid,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: user.email,
          photoURL: user.photoURL,
        },
        fcmToken,
      );
      const { getUserProfile } = await import('../../db/users/userRepo');
      const profile = await getUserProfile(user.uid);
      dispatch(setUserProfile(profile));
      void navigate('/home');
    } catch {
      toast.error('Errore durante il salvataggio');
      setSaving(false);
    }
  };

  return (
    <div className={styles.root}>
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step1" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className={styles.card}>
            <div className={styles.stepIndicator}>
              <span className={styles.stepDot} data-active="true" />
              <span className={styles.stepLine} />
              <span className={styles.stepDot} />
            </div>
            <div className={styles.icon}>
              <span className="material-symbols-outlined">person</span>
            </div>
            <h1 className={styles.title}>Benvenuto in cortexCic</h1>
            <p className={styles.subtitle}>Iniziamo con il tuo nome</p>
            <form onSubmit={handleStep1} className={styles.form}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Nome</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mario"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">Cognome</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Rossi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <Btn type="submit" color="primary" className="w-100">
                Avanti
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Btn>
            </form>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step2" variants={fadeUp} initial="hidden" animate="visible" exit="exit" className={styles.card}>
            <div className={styles.stepIndicator}>
              <span className={`${styles.stepDot} ${styles.stepDotDone}`} />
              <span className={`${styles.stepLine} ${styles.stepLineDone}`} />
              <span className={styles.stepDot} data-active="true" />
            </div>
            <div className={styles.icon}>
              <span className="material-symbols-outlined">notifications_active</span>
            </div>
            <h1 className={styles.title}>Notifiche push</h1>
            <p className={styles.subtitle}>
              cortexCic può avvisarti in tempo reale quando arrivano notifiche dai tuoi progetti,
              anche quando il browser è in background.
            </p>
            <ul className={styles.featureList}>
              <li>
                <span className="material-symbols-outlined">check_circle</span>
                Errori e warning dai tuoi progetti
              </li>
              <li>
                <span className="material-symbols-outlined">check_circle</span>
                Deploy completati con link diretto
              </li>
              <li>
                <span className="material-symbols-outlined">check_circle</span>
                Puoi disabilitarle in qualsiasi momento
              </li>
            </ul>

            <div className={styles.actions}>
              <Btn
                color="primary"
                className="w-100"
                loading={saving && permissionState === 'requesting'}
                onClick={() => requestAndSave(false)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications_active</span>
                Consenti notifiche
              </Btn>
              <Btn
                version="outline"
                color="secondary"
                className="w-100"
                loading={saving && permissionState === 'idle'}
                onClick={() => requestAndSave(true)}
              >
                Salta per ora
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompleteProfile;
