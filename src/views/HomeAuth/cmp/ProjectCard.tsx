import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Project } from '../../../db/projects/Project';
import { fadeUp } from '../../../styles/motionVariants';
import styles from '../HomeAuth.module.css';

interface Props {
  project: Project;
}

const ProjectCard = ({ project }: Props) => {
  const navigate = useNavigate();
  const memberCount = Object.keys(project.members).length;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={() => navigate(`/project/${project.id}/tasks`)}
      className={styles.projectCard}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>
          <span className="material-symbols-outlined">folder</span>
        </span>
        <span className={styles.cardArrow}>
          <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </div>
      <div className={styles.cardName}>{project.name}</div>
      {project.description && (
        <div className={styles.cardDesc}>{project.description}</div>
      )}
      <div className={styles.cardMeta}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>group</span>
        {memberCount} {memberCount === 1 ? 'membro' : 'membri'}
      </div>
    </motion.div>
  );
};

export default ProjectCard;
