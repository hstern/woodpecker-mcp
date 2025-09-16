import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Pipeline } from "@/utils/types.js";

const pipelineContext = (pipelineNumber: number | string, pipeline: Pipeline) =>
  JSON.stringify({
    pipelineNumber,
    pipeline: {
      id: pipeline.id,
      number: pipeline.number,
      status: pipeline.status,
      event: pipeline.event,
      branch: pipeline.branch,
      commit: pipeline.commit,
      message: pipeline.message,
      author: pipeline.author,
      email: pipeline.author_email,
      started: pipeline.started_at,
      finished: pipeline.finished_at,
      created: pipeline.created_at,
      updated: pipeline.updated_at,
      workflows: pipeline.workflows?.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        state: workflow.state,
        error: workflow.error,
        started: workflow.start_time,
        finished: workflow.end_time,
        children: workflow.children?.map((step) => ({
          id: step.id,
          name: step.name,
          state: step.state,
          error: step.error,
          exitCode: step.exit_code,
          started: step.start_time,
          finished: step.end_time,
        })),
      })),
    },
  });

export const registerGetPipelineTool = (server: McpServer) =>
  server.registerTool(
    "get_pipeline",
    {
      title: "Get Pipeline",
      description: `Get detailed information about a specific pipeline, including workflows, steps, and error details.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.`,
      inputSchema: {
        repoId: z.number().int().positive().describe("The repository ID"),
        number: z.number().int().positive().describe("The pipeline number"),
      },
    },
    async ({ repoId, number }) => {
      const result = await apiClient.get<Pipeline>(
        `/repos/${repoId}/pipelines/${number}`
      );

      const text = result
        .map((val) => pipelineContext(number, val))
        .mapErr((err) =>
          err.toContext(`pipeline ${number} in repository ${repoId}`)
        );

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
