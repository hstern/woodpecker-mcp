import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReviewPipelineErrorPrompt } from "./review-pipeline-error.js";

export const registerPrompts = (server: McpServer) => {
  registerReviewPipelineErrorPrompt(server);
};
