import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  setLatest,
  prependOlder,
  setLoadingMore,
  resetNotifications,
} from '../../../db/notifications/notificationsSlice';
import {
  subscribeLatestNotifications,
  loadOlderNotifications,
  markNotificationsRead,
  togglePin,
} from '../../../db/notifications/notificationRepo';
import type { NotificationType } from '../../../db/notifications/Notification';
import NotificationMessage from './cmp/NotificationMessage';
import NotificationFilters from './cmp/NotificationFilters';
import styles from './NotificationsPage.module.css';

const ALL_TYPES = new Set<NotificationType>(['info', 'error', 'warning', 'deploy']);

const NotificationsPage = () => {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.projects.currentProject);
  const { items, hasMore, loadingMore } = useAppSelector((s) => s.notifications);
  const uid = useAppSelector((s) => s.auth.user?.uid ?? '');

  const [activeTypes, setActiveTypes] = useState<Set<NotificationType>>(new Set(ALL_TYPES));

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const isAtBottomRef = useRef(true);

  // --- subscribe to latest notifications ---
  useEffect(() => {
    if (!project) return;
    dispatch(resetNotifications());
    didInitialScroll.current = false;

    const unsub = subscribeLatestNotifications(project.id, (latest) => {
      dispatch(setLatest(latest));
    });

    return () => {
      unsub();
      dispatch(resetNotifications());
    };
  }, [project?.id, dispatch]);

  // --- auto-scroll to bottom on initial load + new messages ---
  useEffect(() => {
    if (!items.length) return;
    if (!didInitialScroll.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      didInitialScroll.current = true;
      return;
    }
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [items.length]);

  // --- mark visible as read ---
  useEffect(() => {
    if (!project || !uid || !items.length) return;
    const unread = items.filter((n) => !n.readByUids.includes(uid)).map((n) => n.id);
    if (unread.length) markNotificationsRead(project.id, unread, uid).catch(() => null);
  }, [items, project?.id, uid]);

  // --- scroll handler: detect bottom + trigger load-more at top ---
  const handleScroll = useCallback(async () => {
    const el = listRef.current;
    if (!el) return;

    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    if (el.scrollTop < 80 && hasMore && !loadingMore && items.length) {
      dispatch(setLoadingMore(true));
      const oldest = items[items.length - 1].createdAt;
      const prevHeight = el.scrollHeight;
      const { items: older, hasMore: more } = await loadOlderNotifications(project!.id, oldest);
      dispatch(prependOlder({ items: older, hasMore: more }));
      // restore scroll position so user doesn't jump to top
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight - prevHeight;
      });
      if (older.length && uid) {
        markNotificationsRead(project!.id, older.map((n) => n.id), uid).catch(() => null);
      }
    }
  }, [hasMore, loadingMore, items, project?.id, uid, dispatch]);

  const toggleType = (type: NotificationType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleMarkAllRead = async () => {
    if (!project || !uid) return;
    const unread = items.filter((n) => !n.readByUids.includes(uid)).map((n) => n.id);
    if (unread.length) await markNotificationsRead(project.id, unread, uid).catch(() => null);
  };

  const handleTogglePin = async (notifId: string, currentlyPinned: boolean) => {
    if (!project) return;
    await togglePin(project.id, notifId, uid, currentlyPinned).catch(() => null);
  };

  const pinned = items.filter((n) => n.pinnedByUids.includes(uid));
  const filtered = items.filter((n) => activeTypes.has(n.type));
  // items are stored newest-first in Redux; display newest at bottom → reverse
  const displayItems = [...filtered].reverse();
  const unreadCount = items.filter((n) => !n.readByUids.includes(uid)).length;

  if (!project) return null;

  return (
    <div className={styles.root}>
      <NotificationFilters
        active={activeTypes}
        unreadCount={unreadCount}
        onToggle={toggleType}
        onMarkAllRead={handleMarkAllRead}
      />

      {pinned.length > 0 && (
        <div className={styles.pinnedSection}>
          <div className={styles.pinnedLabel}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>push_pin</span>
            Fissate
          </div>
          <div className={styles.pinnedList}>
            {pinned.filter((n) => activeTypes.has(n.type)).map((n) => (
              <NotificationMessage
                key={`pin-${n.id}`}
                notif={n}
                uid={uid}
                onPin={() => handleTogglePin(n.id, n.pinnedByUids.includes(uid))}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.list} ref={listRef} onScroll={handleScroll}>
        {hasMore && (
          <div className={styles.loadMoreRow}>
            {loadingMore ? (
              <div className="spinner-border spinner-border-sm text-secondary" />
            ) : (
              <span className={styles.loadMoreHint}>Scrolla su per caricare altro</span>
            )}
          </div>
        )}

        {displayItems.length === 0 && !loadingMore && (
          <div className={styles.empty}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#dee2e6', display: 'block', marginBottom: '0.75rem' }}>
              notifications_off
            </span>
            Nessuna notifica
          </div>
        )}

        <div className={styles.messages}>
          {displayItems.map((n) => (
            <NotificationMessage
              key={n.id}
              notif={n}
              uid={uid}
              onPin={() => handleTogglePin(n.id, n.pinnedByUids.includes(uid))}
            />
          ))}
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default NotificationsPage;
