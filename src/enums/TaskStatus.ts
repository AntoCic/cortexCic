export const TaskStatus = {
  Todo: 'todo',
  InProgress: 'inprogress',
  Done: 'done',
  Block: 'block',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

export function getValue(key: string): TaskStatusValue | undefined {
  return Object.values(TaskStatus).find((v) => v === key) as TaskStatusValue | undefined;
}

export function isTaskStatus(val: unknown): val is TaskStatusValue {
  return Object.values(TaskStatus).includes(val as TaskStatusValue);
}

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
  block: 'Blocked',
};
