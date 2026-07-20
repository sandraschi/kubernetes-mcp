# Installing kubernetes-mcp

## Prerequisites

Ensure you have installed the following requirements:

| Tool | Purpose | Install command (Windows) |
|------|---------|-----------------|
| Claude Desktop | Required host | [download](https://claude.ai/download) |
| Git | Clone repo | `winget install Git.Git` |
| Python + uv | Run backend server | `winget install astral-sh.uv` |
| Bun | Run frontend dashboard | [Install instructions](https://bun.sh) |
| Kubernetes cluster | Cluster to manage | e.g. Docker Desktop, Rancher, or Minikube |

> Windows: All command-line tools can be installed via **winget**.  
> macOS: Use `brew install` equivalents.  
> Linux: Use your distro package manager.

---

## Option A — Manual Configuration (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/sandraschi/kubernetes-mcp
   cd kubernetes-mcp
   ```

2. Add the server to your Claude Desktop config file:
   - **Windows Configuration Path**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS Configuration Path**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following JSON snippet under the `"mcpServers"` object:

```json
{
  "mcpServers": {
    "kubernetes-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "d:/Dev/repos/kubernetes-mcp",
        "run",
        "python",
        "-m",
        "kubernetes_mcp"
      ],
      "env": {
        "WEB_PORT": "10811",
        "WEB_HOST": "127.0.0.1",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

> **Note**: Replace `"d:/Dev/repos/kubernetes-mcp"` with the absolute path where you cloned the repository. Always use forward slashes (`/`) even on Windows paths inside the config JSON.

3. Restart Claude Desktop.

---

## Option B — Developer Mode

To run the full stack locally with hot reloading (React dashboard frontend + Python backend):

1. **Start the Launcher**:
   ```powershell
   ./start.ps1
   ```
   This will install all virtual environment dependencies (`uv`) and Node modules (`bun`), clean up ports `10810`/`10811`, and spin up both servers.
2. The dashboard will automatically open in your default browser at `http://localhost:10810`.

---

## Verify Installation

Once Claude Desktop restarts, type the following prompt into the chat window:
> "Check Kubernetes cluster health status"

You should receive a summary showing:
- Active Context name (e.g., `minikube`)
- Cluster API server endpoint connectivity state (Online / Offline)
- User credentials details
