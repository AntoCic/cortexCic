export const TaskCategory = {
  Feature: 'feature',
  Bug: 'bug',
  Spike: 'spike',
} as const;

export type TaskCategoryValue = (typeof TaskCategory)[keyof typeof TaskCategory];

export const TASK_CATEGORY_LABELS: Record<TaskCategoryValue, string> = {
  feature: 'Feature',
  bug: 'Bug',
  spike: 'Spike',
};

export const TASK_CATEGORY_ICONS: Record<TaskCategoryValue, string> = {
  feature: 'auto_awesome',
  bug: 'bug_report',
  spike: 'search_insights',
};

export function getValue(key: string): TaskCategoryValue | undefined {
  return Object.values(TaskCategory).find((value) => value === key) as TaskCategoryValue | undefined;
}

export function isTaskCategory(value: unknown): value is TaskCategoryValue {
  return typeof value === 'string' && Object.values(TaskCategory).includes(value as TaskCategoryValue);
}
