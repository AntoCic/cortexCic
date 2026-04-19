import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProjects } from '../../db/projects/projectsSlice';
import { subscribeUserProjects } from '../../db/projects/projectRepo';
import { useAuth } from '../../db/auth/useAuth';
import { Btn } from '../../components/Btn/Btn';
import { staggerContainer, fadeUp } from '../../styles/motionVariants';
import ProjectCard from './cmp/ProjectCard';
import AddProjectModal from './cmp/AddProjectModal';
import styles from './HomeAuth.module.css';

const HomeAuth = () => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: projects, loading } = useAppSelector((s) => s.projects);
  const [showAdd, setShowAdd] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserProjects(user.uid, (p) => dispatch(setProjects(p)));
    return unsub;
  }, [user, dispatch]);

  const motionProps = shouldReduceMotion
    ? {}
    : { variants: staggerContainer, initial: 'hidden', animate: 'visible' };

  return (
    <div className={styles.root}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>I miei progetti</h1>
          <Btn color="primary" onClick={() => setShowAdd(true)}>
            <span className="material-symbols-outlined me-2" style={{ fontSize: 18, verticalAlign: 'text-bottom' }}>add</span>
            Nuovo progetto
          </Btn>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" {...(!shouldReduceMotion ? { variants: fadeUp, initial: 'hidden', animate: 'visible' } : {})} className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" />
            </motion.div>
          ) : projects.length === 0 ? (
            <motion.div key="empty" {...(!shouldReduceMotion ? { variants: fadeUp, initial: 'hidden', animate: 'visible' } : {})} className={styles.empty}>
              <div className={styles.emptyIcon}>
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <div className={styles.emptyTitle}>Nessun progetto ancora</div>
              <div className={styles.emptyText}>Crea il tuo primo progetto per iniziare.</div>
              <Btn color="primary" onClick={() => setShowAdd(true)}>Crea progetto</Btn>
            </motion.div>
          ) : (
            <motion.div key="grid" className={styles.grid} {...motionProps}>
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AddProjectModal show={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

export default HomeAuth;
