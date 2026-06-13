export const TaskUrgency = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical',
} as const;

export type TaskUrgencyValue = (typeof TaskUrgency)[keyof typeof TaskUrgency];

export const TASK_URGENCY_LABELS: Record<TaskUrgencyValue, string> = {
  low: 'Bassa',
  medium: 'Normale',
  high: 'Alta',
  critical: 'Critica',
};

export const TASK_URGENCY_ICONS: Record<TaskUrgencyValue, string> = {
  low: 'routine',
  medium: 'radio_button_checked',
  high: 'priority_high',
  critical: 'local_fire_department',
};

export const TASK_URGENCY_COLORS: Record<TaskUrgencyValue, string> = {
  low: '#2b8a3e',
  medium: '#f08c00',
  high: '#e8590c',
  critical: '#c92a2a',
};

export function getValue(key: string): TaskUrgencyValue | undefined {
  return Object.values(TaskUrgency).find((value) => value === key) as TaskUrgencyValue | undefined;
}

export function isTaskUrgency(value: unknown): value is TaskUrgencyValue {
  return typeof value === 'string' && Object.values(TaskUrgency).includes(value as TaskUrgencyValue);
}
