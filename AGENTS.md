# kubernetes-mcp — Agent Guide

## Overview
FastMCP 3.4.4+ server for Kubernetes cluster orchestration and Minikube automation.

## Entry Points
- `uv run python -m kubernetes_mcp` → Starts server (Stdio + background FastAPI companion thread).

## Standards
- FastMCP 3.4.4+ tool structure.
- Config loaded dynamically from default `~/.kube/config`.
- Dual transport: stdio (Claude Desktop) + HTTP (`MCP_TRANSPORT=http`).
- Web companion UI port: `10810` (Frontend dev) and `10811` (FastAPI backend).

## Key Files
- `README.md` — User documentation
- `INSTALL.md` — Prerequisites and installation instructions
- `src/kubernetes_mcp/client.py` — wrapper for python kubernetes API and minikube subprocess CLI
- `src/kubernetes_mcp/server.py` — MCP tools registrations
