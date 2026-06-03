# Woodpecker CI MCP Server

A Model Context Protocol (MCP) server that connects AI assistants to Woodpecker CI. Debug pipeline failures, analyze build logs, and troubleshoot CI/CD configurations with AI assistance.

## MCP Client Setup

Add to your MCP client configuration:

### Standalone Binary

```json
{
  "woodpecker-ci": {
    "command": "woodpecker-mcp",
    "env": {
      "WOODPECKER_TOKEN": "your-token-here",
      "WOODPECKER_URL": "https://your-woodpecker-instance.com"
    }
  }
}
```

### Docker

```json
{
  "woodpecker-ci": {
    "command": "docker",
    "args": [
      "run",
      "-i",
      "--rm",
      "-e", "WOODPECKER_TOKEN",
      "-e", "WOODPECKER_URL",
      "ghcr.io/j04n-f/woodpecker-mcp"
    ],
    "env": {
      "WOODPECKER_TOKEN": "your-token-here",
      "WOODPECKER_URL": "https://your-woodpecker-instance.com"
    }
  }
}
```

## Quick Start

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Run the server**
   ```bash
   # Development with inspector
   bun run dev
   ```

3. **Set environment variables using Inspector**
   ```bash
   WOODPECKER_URL="https://your-woodpecker-instance.com"
   WOODPECKER_TOKEN="your-personal-access-token"
   ```

4. **Start development environment**
   ```bash
   # Start Gitea + Woodpecker CI for testing
   ./scripts/setup-environment.sh

   # Access services:
   # - Gitea: http://localhost:3000 (woodpecker/woodpecker123)
   # - Woodpecker: http://localhost:8000
   ```

## Configuration

### Getting Your Woodpecker Token

1. Go to your Woodpecker CI instance
2. Click your profile icon → "CLI & API"
3. Copy the personal access token
4. Set it as `WOODPECKER_TOKEN`

### HTTP Transport (self-hosted, multi-user)

By default the server speaks MCP over **stdio**, which is right for a local
client that spawns it as a subprocess. To host it once for multiple users, set
**`LISTEN_ADDR`** and it runs as a [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http)
endpoint instead:

```bash
WOODPECKER_URL="https://your-woodpecker-instance.com" \
LISTEN_ADDR="0.0.0.0:8080" \
woodpecker-mcp
# MCP endpoint: POST http://0.0.0.0:8080/mcp
```

`LISTEN_ADDR` accepts `host:port`, `:port` (all interfaces), or a bare `port`.

When `LISTEN_ADDR` is set, **`WOODPECKER_TOKEN` is optional**: each request
authenticates with its own Woodpecker token, sent as a bearer header. The
server holds no token of its own, so one deployment serves many users, each
acting as themselves:

```
Authorization: Bearer <your-woodpecker-token>
```

Requests without a bearer token get `401`. (When `LISTEN_ADDR` is unset,
`WOODPECKER_TOKEN` is required, as before — stdio has no per-request header.)

The transport is **stateless** — every request is independent, so no session is
established and only `POST /mcp` is served (`GET`/`DELETE` return `405`). Run it
behind a reverse proxy that terminates TLS.

Minimal HTTP client config:

```json
{
  "woodpecker-ci": {
    "type": "http",
    "url": "https://your-woodpecker-mcp-host/mcp",
    "headers": { "Authorization": "Bearer your-token-here" }
  }
}
```

## API Reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_repository` | Find repository by name | `name` (e.g., "owner/repo") |
| `list_repositories` | List all repositories | Optional: `page`, `perPage`, `active`, `trusted` |
| `list_pipelines` | List repository pipelines | `repoId`, optional: `before`, `after`, pagination |
| `get_pipeline` | Get detailed pipeline info | `repoId`, `number` |
| `get_pipeline_config` | View pipeline configuration | `repoId`, `number` |
| `get_step_logs` | Get logs for debugging | `repoId`, `number`, `stepId` |

### AI Prompts

| Prompt | Description |
|--------|-------------|
| `review-pipeline-error` | Systematic analysis of pipeline failures |

## Development

### Available Commands

```bash
# Development
bun run dev          # Start with inspector
bun run build        # Build production binary

# Code Quality
bun run lint         # Check code style
bun run lint:fix     # Auto-fix issues
bun run test         # Run unit tests
```

### Local Testing Environment

The included Docker Compose setup provides:
- **Gitea**: Git forge with webhooks
- **Woodpecker CI**: Complete CI/CD environment
- **Test repository**: Sample project with pipeline configuration

Perfect for testing MCP integration without external dependencies.

## Examples

### Debug a Failed Pipeline
```
AI: Can you check why pipeline #42 failed for repository owner/project?
```

### Analyze Build Performance
```
AI: Show me the recent pipeline performance for my main repository and identify any bottlenecks.
```

### Configuration Review
```
AI: Review the pipeline configuration for repository owner/project and suggest improvements.
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards: `bun run lint`
4. Commit changes: `git commit -m 'feat: add amazing feature'`
5. Submit a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Ready to supercharge your Woodpecker CI workflows with AI assistance! 🚀🤖
