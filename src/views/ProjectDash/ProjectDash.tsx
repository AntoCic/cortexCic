import { useEffect } from 'react';
import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCurrentProject } from '../../db/projects/projectsSlice';
import { subscribeProject } from '../../db/projects/projectRepo';
import styles from './ProjectDash.module.css';

const tabs = [
  { to: 'tasks', label: 'Task', icon: 'task_alt' },
  { to: 'notifications', label: 'Notifiche', icon: 'notifications' },
  { to: 'settings', label: 'Impostazioni', icon: 'settings' },
];

const ProjectDash = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const currentProject = useAppSelector((s) => s.projects.currentProject);

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeProject(projectId, (p) => dispatch(setCurrentProject(p)));
    return () => {
      unsub();
      dispatch(setCurrentProject(null));
    };
  }, [projectId, dispatch]);

  if (!projectId) return null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/home">Progetti</Link>
            {' / '}
            {currentProject?.name ?? '...'}
          </div>
          <div className={styles.projectTitle}>{currentProject?.name ?? '—'}</div>
          <nav className={styles.tabs}>
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) => `${styles.tab}${isActive ? ` ${styles.active}` : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectDash;
