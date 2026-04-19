import { motion, useReducedMotion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../../../db/tasks/Task';
import styles from '../Tasks.module.css';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskCard = ({ task, onEdit, onDelete }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!shouldReduceMotion}
      whileHover={!shouldReduceMotion ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${styles.taskCard}${isDragging ? ` ${styles.dragging}` : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={styles.taskTitle}>{task.title}</div>
      {task.description && <div className={styles.taskDesc}>{task.description}</div>}
      <div className={styles.taskActions}>
        <button
          className={styles.taskActionBtn}
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          title="Modifica"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
        </button>
        <button
          className={styles.taskActionBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          title="Elimina"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
