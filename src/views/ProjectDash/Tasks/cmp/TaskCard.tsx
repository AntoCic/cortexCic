import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Timestamp } from 'firebase/firestore';
import AttachmentPanel from '../../../../components/AttachmentPanel/AttachmentPanel';
import { TaskCategory, TASK_CATEGORY_ICONS, TASK_CATEGORY_LABELS } from '../../../../enums/TaskCategory';
import type { Task } from '../../../../db/tasks/Task';
import type { ProjectMember } from '../../../../db/projects/Project';
import { TaskStatus } from '../../../../enums/TaskStatus';
import { TaskUrgency, TASK_URGENCY_COLORS, TASK_URGENCY_ICONS, TASK_URGENCY_LABELS } from '../../../../enums/TaskUrgency';
import styles from '../Tasks.module.css';

type DueDateState = 'normal' | 'warning' | 'overdue';

const DUE_DATE_COLORS: Record<DueDateState, string> = {
  normal: 'var(--text-muted)',
  warning: 'var(--urgency-high)',
  overdue: 'var(--danger)',
};

function getDueDateState(dueDate: Timestamp, status: Task['status']): DueDateState {
  const hoursUntilDue = (dueDate.toDate().getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilDue < 0) return status === TaskStatus.Done ? 'normal' : 'overdue';
  if (hoursUntilDue <= 48) return 'warning';
  return 'normal';
}

function formatDueDate(dueDate: Timestamp): string {
  return dueDate.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  members?: Record<string, ProjectMember>;
}

function getInitials(email: string): string {
  const local = email.split('@')[0] || email;
  return local.slice(0, 2).toUpperCase();
}

const TaskCard = ({ task, onEdit, onDelete, members = {} }: Props) => {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const taskCategory = task.category ?? TaskCategory.Feature;
  const taskUrgency = task.urgency ?? TaskUrgency.Medium;
  const assignee = task.assigneeUid ? members[task.assigneeUid] : undefined;

  const handleCopyDescription = () => {
    if (!task.description.trim()) return;

    navigator.clipboard.writeText(task.description).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout={!shouldReduceMotion}
      whileHover={!shouldReduceMotion ? { y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`${styles.taskCard}${isDragging ? ` ${styles.dragging}` : ''}`}
      onClick={() => onEdit(task)}
    >
      <div className={styles.taskCardTop}>
        <div className={styles.taskMeta}>
          <span className={styles.taskBadge} title={TASK_CATEGORY_LABELS[taskCategory]}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {TASK_CATEGORY_ICONS[taskCategory]}
            </span>
            <span className={styles.taskBadgeLabel}>{TASK_CATEGORY_LABELS[taskCategory]}</span>
          </span>
          {taskUrgency && (
            <span
              className={styles.taskBadge}
              title={TASK_URGENCY_LABELS[taskUrgency]}
              style={{
                color: TASK_URGENCY_COLORS[taskUrgency],
                background: `${TASK_URGENCY_COLORS[taskUrgency]}14`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {TASK_URGENCY_ICONS[taskUrgency]}
              </span>
              <span className={styles.taskBadgeLabel}>{TASK_URGENCY_LABELS[taskUrgency]}</span>
            </span>
          )}
          {task.dueDate && (
            <span
              className={styles.taskBadge}
              title={formatDueDate(task.dueDate)}
              style={{
                color: DUE_DATE_COLORS[getDueDateState(task.dueDate, task.status)],
                background: `color-mix(in srgb, ${DUE_DATE_COLORS[getDueDateState(task.dueDate, task.status)]} 12%, transparent)`,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event</span>
              <span className={styles.taskBadgeLabel}>{formatDueDate(task.dueDate)}</span>
            </span>
          )}
        </div>

        <div className={styles.taskCardTopRight}>
          {assignee && (
            <span className={styles.assigneeAvatar} title={assignee.email}>
              {getInitials(assignee.email)}
            </span>
          )}
          <button
            type="button"
            className={styles.taskDragHandle}
            onClick={(event) => event.stopPropagation()}
            title="Trascina task"
            {...attributes}
            {...listeners}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>drag_indicator</span>
            Sposta
          </button>
        </div>
      </div>
      <div className={styles.taskTitle}>{task.title}</div>
      {task.description && <div className={styles.taskDesc}>{task.description}</div>}
      {!!task.attachments?.length && (
        <div className={styles.taskAttachments}>
          <AttachmentPanel attachments={task.attachments} compact hideHeader />
        </div>
      )}
      <div className={styles.taskActions}>
        <button
          className={styles.taskActionBtn}
          onClick={(e) => { e.stopPropagation(); handleCopyDescription(); }}
          title="Copia descrizione"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
        <button
          className={styles.taskActionBtn}
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          title="Modifica"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
        </button>
        <button
          className={styles.taskActionBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(task); }}
          title="Elimina"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
        </button>
      </div>
    </motion.div>
  );
};

export default TaskCard;
