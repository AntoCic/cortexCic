export interface CortexFunctionResponse {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

export async function callCortexFunction(
  functionsBaseUrl: string,
  apiKey: string,
  functionName: string,
  payload: Record<string, unknown>,
): Promise<CortexFunctionResponse> {
  const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  return { ok: response.ok, status: response.status, body };
}
