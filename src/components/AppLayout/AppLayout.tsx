import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../db/auth/useAuth';
import { useLogout } from '../../db/auth/useLogout';
import { useAppSelector } from '../../store';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const { user, userProfile } = useAuth();
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const currentProject = useAppSelector((s) => s.projects.currentProject);

  const initials = userProfile
    ? `${userProfile.firstName[0] ?? ''}${userProfile.lastName[0] ?? ''}`.toUpperCase()
    : (user?.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?');

  const onNotes = location.pathname.startsWith('/notes');

  // AppLayout stays mounted across route changes, so this ref remembers where to
  // go "back" to even after navigating within /notes (e.g. opening a note).
  const backRef = useRef<{ to: string; label: string }>({ to: '/home', label: 'Progetti' });

  useEffect(() => {
    if (onNotes) return;
    backRef.current = {
      to: location.pathname,
      label: location.pathname.startsWith('/project/')
        ? (currentProject?.name ?? 'Progetto')
        : 'Progetti',
    };
  }, [onNotes, location.pathname, currentProject]);

  const backTo = backRef.current.to;
  const backLabel = backRef.current.label;

  return (
    <div className={styles.root}>
      <nav className={`navbar ${styles.nav}`}>
        <div className="container-fluid">
          <Link to="/home" className={`navbar-brand ${styles.brand}`}>
            <img src="/img/logo.png" alt="cortexCic" className={styles.logo} />
            <span className={styles.brandName}>cortexCic</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {onNotes ? (
              <button
                type="button"
                className={styles.navLink}
                onClick={() => navigate(backTo)}
                title={`Torna a ${backLabel}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
                <span className={styles.navLinkLabel}>{backLabel}</span>
              </button>
            ) : (
              <Link
                to="/notes"
                className={styles.navLink}
                title="Note"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>note_stack</span>
                <span className={styles.navLinkLabel}>Note</span>
              </Link>
            )}
            <Link to="/profile" className={styles.avatarLink} title="Profilo">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </Link>
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={logout}
              title="Logout"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
