import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { buildTools } from './tools.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new McpServer({ name: 'cortex-mcp-server', version: '0.1.0' });

  for (const tool of buildTools(config)) {
    // registerTool's generic signature can't be inferred across a heterogeneous
    // array of tool definitions; each handler's args type is already enforced
    // by its own inputSchema at the call site in tools.ts.
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      tool.handler as never,
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('cortex-mcp-server failed to start:', err);
  process.exit(1);
});
