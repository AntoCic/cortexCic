export const TASK_STATUSES = ['todo', 'inprogress', 'done', 'block'] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const MCP_CREATED_BY_UID = 'mcp-api';
