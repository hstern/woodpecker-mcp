import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Repo } from "@/utils/types.js";

const repositoriesContext = (repositories: Repo[]) =>
  JSON.stringify({
    repositories: repositories.map((repo) => ({
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
    })),
    count: repositories.length,
  });

export const registerListRepositoriesTool = (server: McpServer) =>
  server.registerTool(
    "list_repositories",
    {
      title: "List Repositories",
      description: `List all repositories with optional filtering. Returns repository metadata including configuration, status, and access details.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.`,
      inputSchema: {
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
          .describe("Number of repositories per page"),
        active: z.boolean().optional().describe("Filter by active status"),
        trusted: z.boolean().optional().describe("Filter by trusted status"),
      },
    },
    async ({ page, perPage, active, trusted }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: perPage.toString(),
      });

      if (active !== undefined) {
        params.append("active", active.toString());
      }
      if (trusted !== undefined) {
        params.append("trusted", trusted.toString());
      }

      const result = await apiClient.get<Repo[]>(`/repos?${params.toString()}`);

      const text = result
        .map((val) =>
          val.length === 0 ? repositoriesContext([]) : repositoriesContext(val)
        )
        .mapErr((err) => err.toContext("repositories list"));

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
