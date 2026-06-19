export interface CortexConfig {
  apiKey: string;
  functionsBaseUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): CortexConfig {
  const apiKey = env.CORTEX_API_KEY;
  const functionsBaseUrl = env.CORTEX_FUNCTIONS_BASE_URL;

  if (!apiKey) {
    throw new Error('CORTEX_API_KEY environment variable is required');
  }
  if (!functionsBaseUrl) {
    throw new Error('CORTEX_FUNCTIONS_BASE_URL environment variable is required');
  }

  return { apiKey, functionsBaseUrl: functionsBaseUrl.replace(/\/$/, '') };
}
