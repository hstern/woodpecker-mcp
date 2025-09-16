import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerLogsTools } from "./logs";
import { registerPipelinesTools } from "./pipelines";
import { registerRepositoriesTools } from "./repositories";

export const registerTools = (server: McpServer) => {
  registerLogsTools(server);
  registerPipelinesTools(server);
  registerRepositoriesTools(server);
};
