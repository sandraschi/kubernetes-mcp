# Configuration Guide

The `kubernetes-mcp` server can be customized using environment variables or settings inside `claude_desktop_config.json`.

## Environment Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `WEB_PORT` | `10811` | FastAPI backend and static asset server port. | `10811` |
| `WEB_HOST` | `127.0.0.1` | Binding address for local FastAPI uvicorn daemon. | `127.0.0.1` |
| `MCP_TRANSPORT` | `stdio` | MCP protocol transport style (`stdio` or `http`). | `stdio` |

## Injecting Configurations

Inside your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kubernetes-mcp": {
      "command": "uv",
      "args": ["--directory", "d:/Dev/repos/kubernetes-mcp", "run", "python", "-m", "kubernetes_mcp"],
      "env": {
        "WEB_PORT": "10811",
        "WEB_HOST": "127.0.0.1",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```
