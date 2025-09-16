import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "@/utils/api.js";
import type { Repo } from "@/utils/types.js";

const REPO_NAME_REGEX = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

const repositoryContext = (name: string, repo: Repo) =>
  JSON.stringify({
    name,
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

const isRepo = (name: string): boolean => REPO_NAME_REGEX.test(name);

export const registerSearchRepositoryTool = (server: McpServer) =>
  server.registerTool(
    "search_repository",
    {
      title: "Search Repository",
      description: `Find a repository by its full name (owner/repo format). Returns repository details including ID, URLs, and configuration.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.`,
      inputSchema: {
        name: z
          .string()
          .regex(REPO_NAME_REGEX, "Must be in 'owner/repo' format")
          .describe("Repository full name (e.g., 'microsoft/vscode')"),
      },
    },
    async ({ name }) => {
      if (!isRepo(name)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Invalid repository name format: ${name}. Expected format: owner/repo`,
              }),
            },
          ],
          isError: true,
        };
      }

      const result = await apiClient.get<Repo>(
        `/repos/lookup/${encodeURIComponent(name)}`
      );

      const text = result
        .map((val) => repositoryContext(name, val))
        .mapErr((err) => err.toContext(`repository lookup for ${name}`));

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
