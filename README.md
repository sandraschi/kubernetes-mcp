# Kubernetes MCP Server & Companion WebApp

A Model Context Protocol (MCP) server for Kubernetes cluster orchestration and local Minikube cluster management. Includes an interactive fullstack React web companion application designed to SOTA dark-mode aesthetics.

## Features
- **Cluster Diagnostics**: Inspect Nodes, Pod statuses, and Events.
- **Log Streaming & Troubleshooting**: Retrieve raw container logs and describe Pod specifications (crucial for debugging `CrashLoopBackOff` or `Pending` statuses).
- **Deployment Control**: Scale deployments, trigger rolling rollout restarts, and apply resource YAML specifications directly from your chat context.
- **Minikube Local Controls**: Verify status, start, stop, tunnel ingress routing, and mount local directories into the cluster.
- **Companion Dashboard**: Web panel displaying Kubernetes KPIs, workload browser, live event loggers, and local AI copilot autodiscovery (Ollama/LM Studio).

## Setup & Running

### Requirements
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- [Bun](https://bun.sh) (JS package manager and runtime)
- Active `kubectl` context configured (e.g. Minikube, Docker Desktop, or remote server kubeconfig)

### Quick Start
1. Double-click `start.bat` or run:
   ```powershell
   ./start.ps1
   ```
2. The launcher automatically syncs backend and frontend dependencies, spins up the background FastAPI server on port `10811`, and starts the React frontend dev server on port `10810`.
3. Open `http://localhost:10810` in your web browser.

## MCP Tools Reference
- `k8s_node_list` / `k8s_cluster_health`
- `k8s_pod_list` / `k8s_pod_logs` / `k8s_pod_describe`
- `k8s_deployment_scale` / `k8s_rollout_restart`
- `k8s_apply_yaml` / `k8s_service_list` / `k8s_ingress_list`
- `minikube_status` / `minikube_control` / `minikube_tunnel`
