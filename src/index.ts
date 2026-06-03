import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { version } from "../package.json" with { type: "json" };
import { env } from "./env";
import { registerPrompts } from "./prompts";
import { registerTools } from "./tools";
import { requestContext } from "./utils/api";
import { parseListenAddr } from "./utils/listen-addr";

const MCP_PATH = "/mcp";
const BEARER_REGEX = /^Bearer\s+(.+)$/i;

const JSONRPC_SERVER_ERROR = -32_000;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_INTERNAL_ERROR = 500;

const createMcpServer = () => {
  const server = new McpServer(
    { name: "woodpecker-mcp", version },
    { capabilities: { prompts: { listChanged: true } } }
  );

  registerTools(server);
  registerPrompts(server);

  return server;
};

const bearerToken = (header: string | undefined): string | undefined => {
  const matched = header ? BEARER_REGEX.exec(header) : null;
  return matched?.[1]?.trim() || undefined;
};

const sendJsonRpcError = (
  res: ServerResponse,
  status: number,
  message: string,
  headers: Record<string, string> = {}
): void => {
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: JSONRPC_SERVER_ERROR, message },
      id: null,
    })
  );
};

const handleMcpRequest = async (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => {
  // Stateless transport: no server-initiated SSE stream or sessions, so GET
  // and DELETE don't apply — only POST carries a JSON-RPC message.
  if (req.method !== "POST") {
    sendJsonRpcError(res, HTTP_METHOD_NOT_ALLOWED, "Method not allowed.", {
      Allow: "POST",
    });
    return;
  }

  // The bearer IS the caller's own Woodpecker token, forwarded per request.
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    sendJsonRpcError(
      res,
      HTTP_UNAUTHORIZED,
      "Unauthorized: missing Authorization: Bearer token.",
      { "WWW-Authenticate": "Bearer" }
    );
    return;
  }

  // Stateless: a fresh server + transport per request.
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await requestContext.run({ token }, () => transport.handleRequest(req, res));
};

const startHttp = (addr: string): void => {
  const { host, port } = parseListenAddr(addr);

  const httpServer = createHttpServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname !== MCP_PATH) {
      sendJsonRpcError(res, HTTP_NOT_FOUND, "Not found.");
      return;
    }

    handleMcpRequest(req, res).catch(() => {
      if (!res.headersSent) {
        sendJsonRpcError(res, HTTP_INTERNAL_ERROR, "Internal server error.");
      }
    });
  });

  httpServer.listen(port, host, () => {
    process.stderr.write(
      `woodpecker-mcp listening on ${host ?? "0.0.0.0"}:${port}${MCP_PATH}\n`
    );
  });
};

const startStdio = async (): Promise<void> => {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

if (env.LISTEN_ADDR) {
  startHttp(env.LISTEN_ADDR);
} else {
  await startStdio();
}
