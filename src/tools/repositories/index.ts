import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetRepositoryByIdTool } from "./get-repository-by-id";
import { registerListRepositoriesTool } from "./list-repositories";
import { registerSearchRepositoryTool } from "./search-repository";

export const registerRepositoriesTools = (server: McpServer) => {
  registerSearchRepositoryTool(server);
  registerGetRepositoryByIdTool(server);
  registerListRepositoriesTool(server);
};
