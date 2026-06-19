import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../../../../db/tasks/Task';
import type { TaskStatusValue } from '../../../../enums/TaskStatus';
import { fadeUp } from '../../../../styles/motionVariants';
import TaskCard from './TaskCard';
import styles from '../Tasks.module.css';

const DOT_COLORS: Record<TaskStatusValue, string> = {
  todo: '#adb5bd',
  inprogress: '#6c63ff',
  done: '#20c997',
  block: '#dc3545',
};

interface Props {
  status: TaskStatusValue;
  label: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  hiddenCount?: number;
  onLoadMore?: () => void;
}

const KanbanColumn = ({ status, label, tasks, onEdit, onDelete, hiddenCount = 0, onLoadMore }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnTitle}>
          <span className={styles.columnDot} style={{ background: DOT_COLORS[status] }} />
          {label}
        </span>
        <div className={styles.columnHeaderActions}>
          {hiddenCount > 0 && onLoadMore && (
            <button type="button" className={styles.columnLoadMoreBtn} onClick={onLoadMore}>
              +{hiddenCount}
            </button>
          )}
          <span className={styles.columnCount}>{tasks.length + hiddenCount}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`${styles.columnDrop}${isOver ? ` ${styles.over}` : ''}`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              shouldReduceMotion ? (
                <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
              ) : (
                <motion.div
                  key={t.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <TaskCard task={t} onEdit={onEdit} onDelete={onDelete} />
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
