import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { version } from "../package.json" with { type: "json" };
import { registerPrompts } from "./prompts";
import { registerTools } from "./tools";

const server = new McpServer(
  {
    name: "woodpecker-mcp",
    version,
  },
  {
    capabilities: {
      prompts: {
        listChanged: true,
      },
    },
  }
);

registerTools(server);
registerPrompts(server);

const transport = new StdioServerTransport();
await server.connect(transport);
