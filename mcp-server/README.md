# cortex-mcp-server

Local MCP server exposing 4 tools backed by cortexCic's Cloud Functions, scoped to a single project via its `apiKey`.

## Setup

```bash
npm install
npm run build
```

## Configuration

Two env vars, no `.env` file is read automatically — pass them through your MCP client's config (see below), or export them in your shell when running `npm start` directly:

- `CORTEX_API_KEY` — the target project's apiKey (Settings page in cortexCic).
- `CORTEX_FUNCTIONS_BASE_URL` — e.g. `https://europe-west1-cortex-cic.cloudfunctions.net` for production, or `http://localhost:5001/cortex-cic/europe-west1` for the local emulator.

## Tools

- `get_recent_logs({ type?, limit? })`
- `create_task({ title, description?, status? })`
- `list_tasks({ status? })`
- `update_task_status({ taskId, status })`

## Registering with Claude Code

Add to `.mcp.json` (project-level) or your client's MCP config:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/absolute/path/to/cortexCic/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_KEY": "your-project-api-key",
        "CORTEX_FUNCTIONS_BASE_URL": "https://europe-west1-cortex-cic.cloudfunctions.net"
      }
    }
  }
}
```
