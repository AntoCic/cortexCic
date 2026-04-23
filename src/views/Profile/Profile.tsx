import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getToken } from 'firebase/messaging';
import { useNavigate } from 'react-router-dom';
import { messaging } from '../../components/firebase/firebase';
import { VAPID_PUBLIC_KEY } from '../../firebase-config';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUserProfile } from '../../db/auth/authSlice';
import { updateUserProfile, addFcmToken, getUserProfile } from '../../db/users/userRepo';
import { Btn } from '../../components/Btn/Btn';
import { toast } from '../../components/toast/toast';
import { fadeUp } from '../../styles/motionVariants';
import styles from './Profile.module.css';

const Profile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user)!;
  const userProfile = useAppSelector((s) => s.auth.userProfile)!;

  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [saving, setSaving] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    setFirstName(userProfile.firstName);
    setLastName(userProfile.lastName);
  }, [userProfile.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const updated = await getUserProfile(user.uid);
      dispatch(setUserProfile(updated));
      toast.success('Profilo aggiornato');
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    setEnablingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permesso negato', { subtitle: 'Abilita le notifiche nelle impostazioni del browser' });
        return;
      }
      const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC_KEY });
      if (userProfile.fcmTokens.includes(token)) {
        toast.success('Notifiche già attive su questo dispositivo');
        return;
      }
      await addFcmToken(user.uid, token);
      const updated = await getUserProfile(user.uid);
      dispatch(setUserProfile(updated));
      toast.success('Notifiche push abilitate');
    } catch {
      toast.error('Errore nell\'abilitazione notifiche');
    } finally {
      setEnablingPush(false);
    }
  };

  const initials = `${userProfile.firstName[0] ?? ''}${userProfile.lastName[0] ?? ''}`.toUpperCase();

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className={styles.root}>
      <div className="container" style={{ maxWidth: 520 }}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <h1 className={styles.title}>Profilo</h1>
        </div>

        <div className={styles.avatarSection}>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <div className={styles.avatarInitials}>{initials}</div>
          )}
          <div className={styles.displayName}>
            {userProfile.firstName} {userProfile.lastName}
          </div>
          <div className={styles.email}>{user.email}</div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Informazioni personali</div>
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nome</label>
              <input
                type="text"
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Cognome</label>
              <input
                type="text"
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <Btn type="submit" color="primary" loading={saving}>Salva modifiche</Btn>
          </form>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Notifiche push</div>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Dispositivi registrati: <strong>{userProfile.fcmTokens.length}</strong>
          </p>
          <Btn version="outline" color="primary" loading={enablingPush} onClick={handleEnablePush}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>
              notifications_active
            </span>
            {' '}Abilita su questo dispositivo
          </Btn>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
