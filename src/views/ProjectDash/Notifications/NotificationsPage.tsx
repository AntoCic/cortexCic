import { motion } from 'framer-motion';
import { fadeUp } from '../../../styles/motionVariants';

const NotificationsPage = () => (
  <motion.div
    variants={fadeUp}
    initial="hidden"
    animate="visible"
    style={{ padding: '4rem 0', textAlign: 'center', color: '#6c757d' }}
  >
    <span
      className="material-symbols-outlined"
      style={{ fontSize: '3rem', color: '#dee2e6', display: 'block', marginBottom: '1rem' }}
    >
      notifications
    </span>
    <div style={{ fontWeight: 700, color: '#495057', marginBottom: '0.5rem' }}>
      Notifiche — coming soon
    </div>
    <div style={{ fontSize: '0.88rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.65 }}>
      Genera una API key dalle impostazioni del progetto e usala per inviare notifiche
      (errori, warning, log, preview link) da qualsiasi app esterna.
    </div>
  </motion.div>
);

export default NotificationsPage;
