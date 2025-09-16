import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { match, P } from "ts-pattern";
import { z } from "zod/v3";
import { apiClient } from "@/utils/api";
import type { LogEntry } from "@/utils/types";

const stepLogsContext = (stepId: number, logs: string) =>
  JSON.stringify({
    stepId,
    logs,
  });

export const registerGetStepLogsTool = (server: McpServer) =>
  server.registerTool(
    "get_step_logs",
    {
      title: "Get Step Logs",
      description:
        "Get logs for a specific pipeline step. Useful for debugging individual step failures or examining step output.",
      inputSchema: {
        repoId: z.number().int().positive().describe("The repository ID"),
        number: z.number().int().positive().describe("The pipeline number"),
        stepId: z
          .number()
          .int()
          .positive()
          .describe("The step ID (can be found in pipeline details)"),
      },
    },
    async ({ repoId, number, stepId }) => {
      const result = await apiClient.get<LogEntry[]>(
        `/repos/${repoId}/logs/${number}/${stepId}`
      );

      const parseLog = (log: LogEntry): string =>
        match(log.data)
          .with(P.nullish, () => "")
          .otherwise((data) => Buffer.from(data, "base64").toString("utf-8"));

      const text = result
        .map((val) =>
          match(val)
            .with(P.nullish, () =>
              stepLogsContext(
                stepId,
                "No logs available for this step -- use get_pipeline to verify step existence or status"
              )
            )
            .with(P.array(), (logs) =>
              stepLogsContext(stepId, logs.map(parseLog).join("\n"))
            )
            .exhaustive()
        )
        .mapErr((err) =>
          err.toContext(
            `logs for step ${stepId} in pipeline ${number} of repository ${repoId}`
          )
        );

      return {
        content: [{ type: "text", text: text.val }],
        isError: result.err,
      };
    }
  );
