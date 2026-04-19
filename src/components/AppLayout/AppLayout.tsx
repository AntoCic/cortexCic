import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../db/auth/useAuth';
import { useLogout } from '../../db/auth/useLogout';
import styles from './AppLayout.module.css';

const AppLayout = () => {
  const { user } = useAuth();
  const logout = useLogout();

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className={styles.root}>
      <nav className={`navbar ${styles.nav}`}>
        <div className="container-fluid">
          <Link to="/home" className={`navbar-brand ${styles.brand}`}>
            <span className={styles.logo}>⬡</span>
            <span className={styles.brandName}>cortexCic</span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.avatarInitials}>{initials}</span>
            )}
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
