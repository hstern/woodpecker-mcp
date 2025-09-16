import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const registerReviewPipelineErrorPrompt = (server: McpServer) =>
  server.registerPrompt(
    "review-pipeline-error",
    {
      title: "Review Woodpecker CI Pipeline Error",
      description: `Review the logs from the Woodpecker CI pipeline and provide a detailed analysis of the potential causes and solutions.
Retrieve pipeline details, steps, and logs to analyze the cause of a failure.
If required information is not provided, use the git command or any available tool to get more context about the current commit, the repository, or the author of the commit.
Based on pipeline + step data + logs, explain clearly:
  - Which step failed
  - The likely root cause (syntax, dependency, config, infra, etc.)
  - Suggested fix or next action
Return your answer as a concise incident report with **Failure Summary**, **Root Cause Analysis**, and **Suggested Fix** sections.
          `,
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Review the Woodpecker CI pipeline error related with the current commit and provide a detailed analysis of the potential causes and solutions.",
          },
        },
      ],
    })
  );
