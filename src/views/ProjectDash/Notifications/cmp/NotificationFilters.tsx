import type { NotificationType } from '../../../../db/notifications/Notification';
import styles from './NotificationFilters.module.css';

const ALL_TYPES: NotificationType[] = ['info', 'error', 'warning', 'deploy'];

const TYPE_LABELS: Record<NotificationType, string> = {
  info: 'Info',
  error: 'Errore',
  warning: 'Warning',
  deploy: 'Deploy',
};

interface Props {
  active: Set<NotificationType>;
  unreadCount: number;
  onToggle: (type: NotificationType) => void;
  onMarkAllRead: () => void;
}

const NotificationFilters = ({ active, unreadCount, onToggle, onMarkAllRead }: Props) => (
  <div className={styles.bar}>
    <div className={styles.filters}>
      {ALL_TYPES.map((type) => (
        <button
          key={type}
          className={`${styles.chip} ${styles[type]} ${active.has(type) ? styles.chipActive : styles.chipInactive}`}
          onClick={() => onToggle(type)}
        >
          {TYPE_LABELS[type]}
        </button>
      ))}
    </div>
    {unreadCount > 0 && (
      <button className={styles.markRead} onClick={onMarkAllRead}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>done_all</span>
        Segna tutti come letti ({unreadCount})
      </button>
    )}
  </div>
);

export default NotificationFilters;
