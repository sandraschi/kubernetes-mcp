# kubernetes-mcp — Agent Guide

## Overview
FastMCP 3.4.4+ server for Kubernetes cluster orchestration and Minikube automation.

## Entry Points
- `uv run python -m kubernetes_mcp` → Starts server (Stdio + background FastAPI companion thread).

## Standards
- FastMCP 3.4.4+ tool structure.
- Config loaded dynamically from default `~/.kube/config`.
- Dual transport: stdio (Claude Desktop) + HTTP (`MCP_TRANSPORT=http`).
- Web companion UI port: `11184` (Frontend dev) and `11183` (FastAPI backend). [Changed 2026-08-27: previously 10810/10811, which collided with notion-mcp's registered ports.]

## Key Files
- `README.md` — User documentation
- `INSTALL.md` — Prerequisites and installation instructions
- `src/kubernetes_mcp/client.py` — wrapper for python kubernetes API and minikube subprocess CLI
- `src/kubernetes_mcp/server.py` — MCP tools registrations
