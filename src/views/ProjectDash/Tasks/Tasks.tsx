import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteField } from 'firebase/firestore';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../store';
import { deleteStoredAttachments, uploadAttachments } from '../../../db/attachments/attachmentStorage';
import type { Attachment } from '../../../db/attachments/Attachment';
import { setTasks, moveTask } from '../../../db/tasks/tasksSlice';
import { subscribeProjectTasks, createTask, updateTask, deleteTask } from '../../../db/tasks/taskRepo';
import { useAuth } from '../../../db/auth/useAuth';
import { TaskCategory } from '../../../enums/TaskCategory';
import { TaskStatus, TASK_STATUS_LABELS } from '../../../enums/TaskStatus';
import type { TaskStatusValue } from '../../../enums/TaskStatus';
import { TaskUrgency } from '../../../enums/TaskUrgency';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import type { Task } from '../../../db/tasks/Task';
import { formatTaskTitle } from '../../../db/tasks/taskTitle';
import { timestampToDateInputValue, dateInputToTimestamp } from '../../../db/tasks/taskDueDate';
import KanbanColumn from './cmp/KanbanColumn';
import TaskCard from './cmp/TaskCard';
import TaskModal, { type TaskModalValue } from './cmp/TaskModal';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import styles from './Tasks.module.css';

const COLUMNS: TaskStatusValue[] = [TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done, TaskStatus.Block];

function computeOrder(tasksInCol: Task[], overIndex: number): number {
  if (tasksInCol.length === 0) return 1000;
  if (overIndex === 0) return (tasksInCol[0]?.order ?? 1000) - 1;
  if (overIndex >= tasksInCol.length) return (tasksInCol[tasksInCol.length - 1]?.order ?? 1000) + 1;
  const prev = tasksInCol[overIndex - 1]?.order ?? 0;
  const next = tasksInCol[overIndex]?.order ?? prev + 2;
  return (prev + next) / 2;
}

const Tasks = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: tasks, loading } = useAppSelector((s) => s.tasks);
  const currentProject = useAppSelector((s) => s.projects.currentProject);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [doneVisibleCount, setDoneVisibleCount] = useState(4);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeProjectTasks(projectId, (t) => dispatch(setTasks(t)));
    return unsub;
  }, [projectId, dispatch]);

  const members = useMemo(() => currentProject?.members ?? {}, [currentProject?.members]);
  const memberOptions = useMemo(
    () => Object.entries(members).sort(([, a], [, b]) => a.email.localeCompare(b.email)),
    [members],
  );

  const matchesAssigneeFilter = (task: Task) => {
    if (assigneeFilter === 'all') return true;
    if (assigneeFilter === 'mine') return task.assigneeUid === user?.uid;
    return task.assigneeUid === assigneeFilter;
  };

  const tasksForStatus = (status: TaskStatusValue) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

  const visibleTasksForStatus = (status: TaskStatusValue) =>
    tasksForStatus(status).filter(matchesAssigneeFilter);

  const allDoneTasks = visibleTasksForStatus(TaskStatus.Done);
  const hiddenDoneCount = Math.max(allDoneTasks.length - doneVisibleCount, 0);
  const visibleDoneTasks = hiddenDoneCount > 0
    ? allDoneTasks.slice(-doneVisibleCount)
    : allDoneTasks;
  const projectIdentifier = currentProject?.identifier;
  const nextTaskNumber = (currentProject?.taskSerialCounter ?? 0) + 1;

  useEffect(() => {
    if (allDoneTasks.length <= 4 && doneVisibleCount !== 4) {
      setDoneVisibleCount(4);
    }
  }, [allDoneTasks.length, doneVisibleCount]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !projectId) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const overId = String(over.id);
    const newStatus = COLUMNS.includes(overId as TaskStatusValue)
      ? (overId as TaskStatusValue)
      : tasks.find((t) => t.id === overId)?.status ?? draggedTask.status;

    const colTasks = tasksForStatus(newStatus).filter((t) => t.id !== draggedTask.id);
    const overIndex = COLUMNS.includes(overId as TaskStatusValue)
      ? colTasks.length
      : colTasks.findIndex((t) => t.id === overId);

    const newOrder = computeOrder(colTasks, overIndex === -1 ? colTasks.length : overIndex);

    dispatch(moveTask({ taskId: draggedTask.id, newStatus, newOrder }));
    updateTask(projectId, draggedTask.id, { status: newStatus, order: newOrder, updatedByUid: user?.uid }).catch(() => {
      toast.error('Errore nel salvataggio della task');
    });
  };

  const handleSaveTask = async (data: TaskModalValue): Promise<{ attachments: Attachment[] } | void> => {
    if (!projectId || !user) return;

    if (editingTask) {
      let uploadedAttachments: Attachment[] = [];

      if (data.newFiles.length) {
        try {
          uploadedAttachments = await uploadAttachments(`projects/${projectId}/tasks/${editingTask.id}`, data.newFiles);
        } catch {
          toast.error('Task salvata, ma alcuni allegati non sono stati caricati');
        }
      }

      const attachments = [...data.keptAttachments, ...uploadedAttachments];
      const dueDateChanged = data.dueDate !== timestampToDateInputValue(editingTask.dueDate);

      await updateTask(projectId, editingTask.id, {
        title: editingTask.projectIdentifier && editingTask.serialNumber
          ? formatTaskTitle(editingTask.projectIdentifier, editingTask.serialNumber, data.title)
          : data.title,
        customTitle: data.title,
        description: data.description,
        status: data.status,
        urgency: data.urgency,
        category: data.category,
        assigneeUid: data.assigneeUid ? data.assigneeUid : deleteField(),
        dueDate: data.dueDate ? dateInputToTimestamp(data.dueDate) : deleteField(),
        // Due date moved: let the reminder fire again for the new date instead of staying suppressed.
        ...(dueDateChanged ? { reminderSentAt: deleteField() } : {}),
        attachments,
        updatedByUid: user.uid,
      });

      if (data.removedAttachments.length) {
        try {
          await deleteStoredAttachments(data.removedAttachments);
        } catch {
          toast.error('Task aggiornata, ma alcuni vecchi allegati non sono stati rimossi');
        }
      }

      return { attachments };
    } else {
      if (!projectIdentifier) {
        toast.error('Aggiungi prima il seriale progetto', {
          subtitle: 'Apri Impostazioni e inserisci 2-4 lettere maiuscole prima di creare nuove task.',
        });
        navigate(`/project/${projectId}/settings`);
        return;
      }

      const colTasks = tasksForStatus(data.status);
      const order = colTasks.length > 0 ? (colTasks[colTasks.length - 1].order + 1) : 1000;
      const taskId = await createTask(projectId, {
        title: data.title,
        customTitle: data.title,
        description: data.description,
        status: data.status,
        urgency: data.urgency ?? TaskUrgency.Medium,
        category: data.category ?? TaskCategory.Feature,
        ...(data.assigneeUid ? { assigneeUid: data.assigneeUid } : {}),
        ...(data.dueDate ? { dueDate: dateInputToTimestamp(data.dueDate) } : {}),
        attachments: [],
        projectId,
        order,
        createdByUid: user.uid,
        updatedByUid: user.uid,
      });

      if (data.newFiles.length) {
        try {
          const uploadedAttachments = await uploadAttachments(`projects/${projectId}/tasks/${taskId}`, data.newFiles);
          if (uploadedAttachments.length) {
            await updateTask(projectId, taskId, { attachments: uploadedAttachments });
          }
        } catch {
          toast.error('Task creata, ma alcuni allegati non sono stati caricati');
        }
      }
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!projectId || !taskToDelete) return;

    try {
      if (taskToDelete.attachments?.length) {
        await deleteStoredAttachments(taskToDelete.attachments);
      }
      await deleteTask(projectId, taskToDelete.id);
    } catch (error) {
      toast.error('Errore nell\'eliminazione della task');
      throw error;
    }
  };

  const openCreate = () => {
    if (!projectIdentifier) {
      toast.error('Manca l’identificativo progetto', {
        subtitle: 'Apri Impostazioni, aggiungi 2-4 lettere maiuscole e poi potrai creare nuove task.',
      });
      navigate(`/project/${projectId}/settings`);
      return;
    }

    setEditingTask(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className={styles.root}>
        <div className="container">
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className="container-fluid px-4">
        <div className={styles.toolbar}>
          {!projectIdentifier && (
            <div className={styles.identifierAlert}>
              <div>
                <div className={styles.identifierAlertTitle}>Serve il seriale progetto prima di creare nuove task</div>
                <div className={styles.identifierAlertText}>
                  Vai in impostazioni e aggiungi un identificativo di 2-4 lettere maiuscole.
                </div>
              </div>
              <Btn version="outline" color="secondary" onClick={() => navigate(`/project/${projectId}/settings`)}>
                Impostazioni
              </Btn>
            </div>
          )}
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              aria-label="Filtra per assegnatario"
            >
              <option value="all">Tutti gli assegnatari</option>
              <option value="mine">I miei task</option>
              {memberOptions.map(([uid, member]) => (
                <option key={uid} value={uid}>{member.email}</option>
              ))}
            </select>
            <Btn color="primary" onClick={openCreate}>
              <span className="material-symbols-outlined me-2" style={{ fontSize: 18, verticalAlign: 'text-bottom' }}>add</span>
              Nuova task
            </Btn>
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                label={TASK_STATUS_LABELS[col]}
                tasks={col === TaskStatus.Done ? visibleDoneTasks : visibleTasksForStatus(col)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                hiddenCount={col === TaskStatus.Done ? hiddenDoneCount : 0}
                onLoadMore={col === TaskStatus.Done && hiddenDoneCount > 0
                  ? () => setDoneVisibleCount((prev) => prev + 4)
                  : undefined}
                members={members}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        show={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        initial={editingTask}
        projectIdentifier={projectIdentifier}
        nextSerialNumber={nextTaskNumber}
        showOnboardingHint={!editingTask && tasks.length < 3}
        members={members}
      />

      <ConfirmModal
        show={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Elimina task"
        confirmLabel="Elimina"
        confirmIcon="delete"
        message={(
          <>
            Vuoi eliminare <strong>{taskToDelete?.title || 'questa task'}</strong>?
            <br />
            L’azione è irreversibile.
          </>
        )}
      />
    </div>
  );
};

export default Tasks;
