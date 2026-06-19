import { z } from 'zod';
import { callCortexFunction, type CortexFunctionResponse } from './cortexClient.js';
import type { CortexConfig } from './config.js';

const LOG_TYPES = ['info', 'error', 'warning', 'deploy'] as const;
const TASK_STATUSES = ['todo', 'inprogress', 'done', 'block'] as const;

export interface ToolTextResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<ToolTextResult>;
}

export function toToolResult(response: CortexFunctionResponse): ToolTextResult {
  if (!response.ok) {
    const message =
      typeof response.body.error === 'string'
        ? response.body.error
        : `Request failed with status ${response.status}`;
    return { content: [{ type: 'text', text: message }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(response.body, null, 2) }] };
}

export function buildTools(config: CortexConfig): ToolDefinition[] {
  return [
    {
      name: 'get_recent_logs',
      description:
        'Recupera gli ultimi log/notifiche del progetto cortexCic configurato, opzionalmente filtrati per tipo.',
      inputSchema: {
        type: z.enum(LOG_TYPES).optional().describe('Filtra per tipo di log'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Numero massimo di log da restituire (default 20)'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpGetRecentLogs',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'create_task',
      description: 'Crea una nuova task nella kanban del progetto cortexCic configurato.',
      inputSchema: {
        title: z.string().min(1).describe('Titolo della task'),
        description: z.string().optional().describe('Descrizione della task'),
        status: z.enum(TASK_STATUSES).optional().describe('Colonna iniziale (default todo)'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpCreateTask',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'list_tasks',
      description: 'Elenca le task del progetto cortexCic configurato, opzionalmente filtrate per colonna.',
      inputSchema: {
        status: z.enum(TASK_STATUSES).optional().describe('Filtra per colonna'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpListTasks',
          args,
        );
        return toToolResult(response);
      },
    },
    {
      name: 'update_task_status',
      description: 'Sposta una task del progetto cortexCic configurato in un’altra colonna.',
      inputSchema: {
        taskId: z.string().min(1).describe('ID della task da aggiornare'),
        status: z.enum(TASK_STATUSES).describe('Nuova colonna'),
      },
      handler: async (args) => {
        const response = await callCortexFunction(
          config.functionsBaseUrl,
          config.apiKey,
          'mcpUpdateTaskStatus',
          args,
        );
        return toToolResult(response);
      },
    },
  ];
}
