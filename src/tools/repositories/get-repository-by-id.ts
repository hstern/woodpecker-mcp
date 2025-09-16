import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Repo } from "@/utils/types.js";

const repositoryByIdContext = (repoId: number, repo: Repo) =>
  JSON.stringify({
    repoId,
    repository: {
      id: repo.id,
      forge_remote_id: repo.forge_remote_id,
      name: repo.name,
      owner: repo.owner,
      full_name: repo.full_name,
      default_branch: repo.default_branch,
      private: repo.private,
      trusted: repo.trusted,
      active: repo.active,
      config_file: repo.config_file,
      timeout: repo.timeout,
      forge_id: repo.forge_id,
    },
  });

export const registerGetRepositoryByIdTool = (server: McpServer) =>
  server.registerTool(
    "get_repository_by_id",
    {
      title: "Get Repository by ID",
      description:
        "Get repository details by ID. Useful when you already have the repo ID from other operations and need repository context.",
      inputSchema: {
        repoId: z.number().int().positive().describe("The repository ID"),
      },
    },
    async ({ repoId }) => {
      const result = await apiClient.get<Repo>(`/repos/${repoId}`);

      const text = result
        .map((val) => repositoryByIdContext(repoId, val))
        .mapErr((err) => err.toContext(`repository with ID ${repoId}`));

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
