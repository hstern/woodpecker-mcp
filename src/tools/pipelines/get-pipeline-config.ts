import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Config } from "@/utils/types.js";

const pipelineConfigContext = (
  pipelineNumber: number | string,
  configs: Config[]
) =>
  JSON.stringify({
    pipelineNumber,
    configs: configs.map((config) => ({
      name: config.name,
      hash: config.hash,
      content: Buffer.from(config.data, "base64").toString("utf-8"),
    })),
    count: configs.length,
  });

export const registerGetPipelineConfigTool = (server: McpServer) =>
  server.registerTool(
    "get_pipeline_config",
    {
      title: "Get Pipeline Config",
      description: `Get the configuration files (.woodpecker.yml) used by a specific pipeline. Essential understanding pipeline setup.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.`,
      inputSchema: {
        repoId: z.number().int().positive().describe("The repository ID"),
        number: z.number().int().positive().describe("The pipeline number"),
      },
    },
    async ({ repoId, number }) => {
      const result = await apiClient.get<Config[]>(
        `/repos/${repoId}/pipelines/${number}/config`
      );

      const text = result
        .map((val) =>
          val.length === 0
            ? pipelineConfigContext(number, [])
            : pipelineConfigContext(number, val)
        )
        .mapErr((err) =>
          err.toContext(
            `configuration for pipeline ${number} in repository ${repoId}`
          )
        );

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
