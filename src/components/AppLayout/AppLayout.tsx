import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../db/auth/useAuth';
import { useLogout } from '../../db/auth/useLogout';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const { user, userProfile } = useAuth();
  const logout = useLogout();

  const initials = userProfile
    ? `${userProfile.firstName[0] ?? ''}${userProfile.lastName[0] ?? ''}`.toUpperCase()
    : (user?.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?');

  return (
    <div className={styles.root}>
      <nav className={`navbar ${styles.nav}`}>
        <div className="container-fluid">
          <Link to="/home" className={`navbar-brand ${styles.brand}`}>
            <img src="/img/logo.png" alt="cortexCic" className={styles.logo} />
            <span className={styles.brandName}>cortexCic</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            <Link to="/notes" className={styles.navLink} title="Note">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>note_stack</span>
              <span className={styles.navLinkLabel}>Note</span>
            </Link>
            <Link to="/profile" className={styles.avatarLink} title="Profilo">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
              ) : (
                <span className={styles.avatarInitials}>{initials}</span>
              )}
            </Link>
            <button
              className={`btn btn-ghost btn-sm ${styles.logoutBtn}`}
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
