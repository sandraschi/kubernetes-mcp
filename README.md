# kubernetes-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![FastMCP 3.4.4+](https://img.shields.io/badge/FastMCP-3.4.4+-orange.svg)](https://github.com/modelcontextprotocol/sdk)

FastMCP 3.4.4+ server for Kubernetes cluster orchestration and local Minikube cluster management. Includes an interactive fullstack React web companion application designed to Zinc/Blue SOTA dark-mode aesthetics.

## Preview
| Dashboard | Workloads |
|-----------|---------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Workloads](docs/screenshots/workloads.png) |
*Caption: Zinc/Blue dashboard visualizes Kubernetes namespaces, cluster node health, pods status, and streams container logs.*

## Features
- **Cluster Diagnostics**: View Node ready states, CPU/Memory capacities, and active context details.
- **Log Streaming & Troubleshooting**: Retrieve raw container logs and inspect pod event logs to debug startup failures.
- **Deployment Control**: Scale deployments, trigger rollout restarts, and apply resource YAML configurations dynamically.
- **Minikube local controls**: Start and stop Minikube local VMs, and monitor Kubelet runtime services.
- **Companion Dashboard**: Responsive frontend UI showing pods diagnostics, networking service routes, and local AI copilot autodiscovery (Ollama/LM Studio).

## Quick Install
1. Open your Claude Desktop config file: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the server block:
```json
{
  "mcpServers": {
    "kubernetes-mcp": {
      "command": "uv",
      "args": ["--directory", "d:/Dev/repos/kubernetes-mcp", "run", "python", "-m", "kubernetes_mcp"]
    }
  }
}
```
3. Restart Claude Desktop.

## Documentation

| Documentation | Purpose |
|---------------|---------|
| [Installation Guide](INSTALL.md) | All local installation options, prerequisites, and startup scripts. |
| [Configuration](docs/CONFIGURATION.md) | Custom env variables (`WEB_PORT`, `WEB_HOST`, `MCP_TRANSPORT`). |
| [Tool Reference](docs/TOOLS.md) | Parameters and functions list of all registered MCP tools. |
| [Development Setup](docs/DEVELOPMENT.md) | Local source development, formatting, linting, and testing with `just`. |
| [Troubleshooting FAQ](docs/TROUBLESHOOTING.md) | Solutions for typical cluster context connectivity errors. |
| [Kubernetes & Minikube Explainer](docs/EXPLAINER.md) | K8s vs Vanilla Docker comparison, history, bibliography, and community links. |

## Requirements
- OS: Windows 10/11 (PowerShell support), macOS, or Linux.
- Active kubeconfig credentials (`~/.kube/config`).
- Python `>=3.12` and Bun runtime.

## License
MIT License
