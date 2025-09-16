import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetPipelineTool } from "./get-pipeline";
import { registerGetPipelineConfigTool } from "./get-pipeline-config";
import { registerListPipelinesTool } from "./list-pipelines";

export const registerPipelinesTools = (server: McpServer) => {
  registerListPipelinesTool(server);
  registerGetPipelineTool(server);
  registerGetPipelineConfigTool(server);
};
