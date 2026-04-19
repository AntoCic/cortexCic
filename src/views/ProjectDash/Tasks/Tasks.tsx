import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '../../../store';
import { setTasks, moveTask } from '../../../db/tasks/tasksSlice';
import { subscribeProjectTasks, createTask, updateTask, deleteTask } from '../../../db/tasks/taskRepo';
import { useAuth } from '../../../db/auth/useAuth';
import { TaskStatus, TASK_STATUS_LABELS } from '../../../enums/TaskStatus';
import type { TaskStatusValue } from '../../../enums/TaskStatus';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import type { Task } from '../../../db/tasks/Task';
import KanbanColumn from './cmp/KanbanColumn';
import TaskCard from './cmp/TaskCard';
import TaskModal from './cmp/TaskModal';
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
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: tasks, loading } = useAppSelector((s) => s.tasks);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!projectId) return;
    const unsub = subscribeProjectTasks(projectId, (t) => dispatch(setTasks(t)));
    return unsub;
  }, [projectId, dispatch]);

  const tasksForStatus = (status: TaskStatusValue) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);

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
    updateTask(projectId, draggedTask.id, { status: newStatus, order: newOrder }).catch(() => {
      toast.error('Errore nel salvataggio della task');
    });
  };

  const handleSaveTask = async (data: { title: string; description: string; status: TaskStatusValue }) => {
    if (!projectId || !user) return;
    if (editingTask) {
      await updateTask(projectId, editingTask.id, data);
    } else {
      const colTasks = tasksForStatus(data.status);
      const order = colTasks.length > 0 ? (colTasks[colTasks.length - 1].order + 1) : 1000;
      await createTask(projectId, {
        ...data,
        projectId,
        order,
        createdByUid: user.uid,
      });
    }
    setEditingTask(null);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleDelete = async (taskId: string) => {
    if (!projectId) return;
    try {
      await deleteTask(projectId, taskId);
    } catch {
      toast.error('Errore nell\'eliminazione della task');
    }
  };

  const openCreate = () => {
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
          <Btn color="primary" onClick={openCreate}>
            <span className="material-symbols-outlined me-2" style={{ fontSize: 18, verticalAlign: 'text-bottom' }}>add</span>
            Nuova task
          </Btn>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className={styles.board}>
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col}
                status={col}
                label={TASK_STATUS_LABELS[col]}
                tasks={tasksForStatus(col)}
                onEdit={handleEdit}
                onDelete={handleDelete}
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
      />
    </div>
  );
};

export default Tasks;
