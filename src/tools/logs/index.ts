import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetStepLogsTool } from "./step-logs";

export const registerLogsTools = (server: McpServer) => {
  registerGetStepLogsTool(server);
};
