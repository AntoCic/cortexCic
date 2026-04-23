import { useState } from 'react';
import type { Notification, NotificationType } from '../../../../db/notifications/Notification';
import styles from './NotificationMessage.module.css';

const TYPE_ICON: Record<NotificationType, string> = {
  info: 'info',
  error: 'error',
  warning: 'warning',
  deploy: 'rocket_launch',
};

const TYPE_LABEL: Record<NotificationType, string> = {
  info: 'Info',
  error: 'Errore',
  warning: 'Warning',
  deploy: 'Deploy',
};

function formatTime(ts: { toDate(): Date } | null | undefined): string {
  if (!ts) return '';
  const d = ts.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ora';
  if (diffMin < 60) return `${diffMin}m fa`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

interface Props {
  notif: Notification;
  uid: string;
  onPin: () => void;
}

const NotificationMessage = ({ notif, uid, onPin }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const isRead = notif.readByUids.includes(uid);
  const isPinned = notif.pinnedByUids.includes(uid);
  const hasPayload = notif.payload && Object.keys(notif.payload).length > 0;
  const payloadUrl = typeof notif.payload?.url === 'string' ? notif.payload.url : null;

  return (
    <div className={`${styles.bubble} ${styles[notif.type]} ${!isRead ? styles.unread : ''}`}>
      <div className={styles.header}>
        <div className={styles.left}>
          <img src="/img/logo.png" alt="" className={styles.senderLogo} />
          <span className={`material-symbols-outlined ${styles.typeIcon}`}>
            {TYPE_ICON[notif.type]}
          </span>
          <span className={`${styles.typeBadge} ${styles[`badge_${notif.type}`]}`}>
            {TYPE_LABEL[notif.type]}
          </span>
          {!isRead && <span className={styles.unreadDot} title="Non letta" />}
          {isPinned && (
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#6d28d9' }}>push_pin</span>
          )}
        </div>
        <div className={styles.right}>
          <span className={styles.time}>{formatTime(notif.createdAt)}</span>
          <button
            className={`${styles.iconBtn} ${isPinned ? styles.iconBtnActive : ''}`}
            onClick={onPin}
            title={isPinned ? 'Togli pin' : 'Fissa notifica'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>push_pin</span>
          </button>
        </div>
      </div>

      <div className={styles.message}>{notif.message}</div>

      {payloadUrl && (
        <a
          href={payloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.payloadLink}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
          {payloadUrl}
        </a>
      )}

      {hasPayload && (
        <div className={styles.payloadSection}>
          <button
            className={styles.payloadToggle}
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
            {expanded ? 'Nascondi payload' : 'Mostra payload'}
          </button>
          {expanded && (
            <pre className={styles.payload}>
              {JSON.stringify(notif.payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationMessage;
