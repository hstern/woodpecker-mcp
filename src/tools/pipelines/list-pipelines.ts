import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Pipeline } from "@/utils/types.js";

const pipelinesContext = (repoId: number, pipelines: Pipeline[]) =>
  JSON.stringify({
    repoId,
    pipelines: pipelines.map((pipeline) => ({
      id: pipeline.id,
      number: pipeline.number,
      status: pipeline.status,
      event: pipeline.event,
      branch: pipeline.branch,
      commit: pipeline.commit,
      message: pipeline.message,
      author: pipeline.author,
      started: pipeline.started_at,
      finished: pipeline.finished_at,
      created: pipeline.created_at,
      updated: pipeline.updated_at,
    })),
    count: pipelines.length,
  });

export const registerListPipelinesTool = (server: McpServer) =>
  server.registerTool(
    "list_pipelines",
    {
      title: "List Pipelines",
      description: `List pipelines for a repository with optional filtering. Returns pipeline metadata including status, commit info, and timing.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.`,
      inputSchema: {
        repoId: z.number().int().positive().describe("Numeric repository ID"),
        page: z
          .number()
          .int()
          .positive()
          .optional()
          .default(1)
          .describe("Page number for pagination"),
        perPage: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .default(50)
          .describe("Number of pipelines per page"),
        before: z
          .string()
          .optional()
          .describe(
            "Only return pipelines before this RFC3339 date (e.g., '2023-12-01T10:00:00Z')"
          ),
        after: z
          .string()
          .optional()
          .describe(
            "Only return pipelines after this RFC3339 date (e.g., '2023-12-01T10:00:00Z')"
          ),
      },
    },
    async ({ repoId, page, perPage, before, after }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });

      if (before) {
        params.append("before", before);
      }
      if (after) {
        params.append("after", after);
      }

      const result = await apiClient.get<Pipeline[]>(
        `/repos/${repoId}/pipelines?${params.toString()}`
      );

      const text = result
        .map((val) =>
          val.length === 0
            ? pipelinesContext(repoId, [])
            : pipelinesContext(repoId, val)
        )
        .mapErr((err) => err.toContext(`pipelines for repository ${repoId}`));

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
